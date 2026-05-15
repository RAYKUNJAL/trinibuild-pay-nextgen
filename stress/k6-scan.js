// k6-scan.js — Carnival Friday gate-open scan flood.
// 6 scanners × 5 concurrent reads = 30 VUs hammering /api/passes/[id]/verify.

import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
// Comma-separated list of real pass codes (or tokens) seeded in the staging DB.
const PASS_CODES_RAW = __ENV.PASS_CODES || 'TESTPASS001,TESTPASS002,TESTPASS003,TESTPASS004,TESTPASS005';
const PASS_IDS_RAW = __ENV.PASS_IDS || 'pass_test_1,pass_test_2,pass_test_3,pass_test_4,pass_test_5';
const USE_TOKEN = __ENV.USE_TOKEN === '1';

const scanValid = new Counter('scan_valid_200');
const scanAlreadyUsed = new Counter('scan_already_used');
const scanInvalid = new Counter('scan_invalid_404');
const scanLatency = new Trend('scan_latency_ms', true);
const idempotencyFailures = new Counter('idempotency_failures');
const realErrors = new Rate('scan_real_errors');

export const options = {
  stages: [
    { duration: '10s', target: 30 },  // gate just opened — instant ramp
    { duration: '120s', target: 30 }, // sustained scanning
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // Scanner latency: must feel instant. p95 under 500ms.
    'http_req_duration{name:verify}': ['p(95)<500'],
    scan_real_errors: ['rate<0.005'],
    idempotency_failures: ['count==0'],
  },
};

export function setup() {
  const codes = PASS_CODES_RAW.split(',').map((s) => s.trim()).filter(Boolean);
  const ids = PASS_IDS_RAW.split(',').map((s) => s.trim()).filter(Boolean);
  console.log(`[scan] BASE_URL=${BASE_URL} pass_count=${codes.length} use_token=${USE_TOKEN}`);
  if (codes.length === 0) {
    throw new Error('No PASS_CODES provided. Set __ENV.PASS_CODES.');
  }
  return { codes, ids };
}

export default function (data) {
  // Pick a random pass — gate scanning is unpredictable order
  const idx = Math.floor(Math.random() * data.codes.length);
  const code = data.codes[idx];
  const passId = data.ids[idx] || data.ids[0];

  const body = USE_TOKEN ? { token: code } : { code };
  const res = http.post(
    `${BASE_URL}/api/passes/${passId}/verify`,
    JSON.stringify(body),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'verify' },
      timeout: '3s',
    }
  );

  scanLatency.add(res.timings.duration);

  const ok = res.status === 200;
  const alreadyUsed = res.status === 409 || res.status === 410;
  const notFound = res.status === 404;
  const isRealError = !(ok || alreadyUsed || notFound);

  check(res, {
    'status acceptable (200/404/409/410)': () => ok || alreadyUsed || notFound,
    'no server error': (r) => r.status < 500,
    'fast response (<1s)': (r) => r.timings.duration < 1000,
  });

  if (ok) scanValid.add(1);
  if (alreadyUsed) scanAlreadyUsed.add(1);
  if (notFound) scanInvalid.add(1);
  realErrors.add(isRealError);

  // Idempotency probe: re-scan the same pass. A correctly built endpoint must
  // return either the same 200 (already validated, same outcome) OR 409 already_used.
  // A 500 or a different success indicates broken idempotency.
  if (ok && Math.random() < 0.1) {
    const repeat = http.post(
      `${BASE_URL}/api/passes/${passId}/verify`,
      JSON.stringify(body),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'verify_repeat' } }
    );
    const idempotent = repeat.status === 200 || repeat.status === 409 || repeat.status === 410;
    if (!idempotent) {
      idempotencyFailures.add(1);
      console.error(`[IDEMPOTENCY FAIL] pass=${passId} first=${res.status} repeat=${repeat.status}`);
    }
  }

  // Scan flood is bursty — scanners barely pause between patrons. No sleep.
}

export function handleSummary(data) {
  const summary = {
    total_scans: data.metrics.iterations?.values?.count || 0,
    valid_200: data.metrics.scan_valid_200?.values?.count || 0,
    already_used: data.metrics.scan_already_used?.values?.count || 0,
    invalid_404: data.metrics.scan_invalid_404?.values?.count || 0,
    real_error_rate: data.metrics.scan_real_errors?.values?.rate || 0,
    idempotency_failures: data.metrics.idempotency_failures?.values?.count || 0,
    scan_p95_ms: data.metrics.scan_latency_ms?.values?.['p(95)'] || 0,
    scan_p99_ms: data.metrics.scan_latency_ms?.values?.['p(99)'] || 0,
    scan_avg_ms: data.metrics.scan_latency_ms?.values?.avg || 0,
  };
  return {
    stdout: '\n=== SCAN FLOOD SUMMARY ===\n' +
      JSON.stringify(summary, null, 2) + '\n\n' +
      textSummary(data, { indent: ' ', enableColors: true }) + '\n',
    'stress/results/scan-summary.json': JSON.stringify(summary, null, 2),
  };
}
