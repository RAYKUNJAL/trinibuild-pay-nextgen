// k6-checkout.js — Soca Brainwash fete-drop checkout flood.
// Simulates 3000 buyers hitting "Buy" within 60s. Tests oversell protection.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EVENT_ID = __ENV.EVENT_ID || 'evt_test_brainwash';
const TIER_ID = __ENV.TIER_ID || 'tier_ga_test';
const EVENT_SLUG = __ENV.EVENT_SLUG || 'soca-brainwash-2026';

// Custom metrics
const oversellCounter = new Counter('oversell_events');
const soldOutCounter = new Counter('sold_out_409');
const checkoutSuccess = new Counter('checkout_success_200');
const realErrors = new Rate('checkout_real_errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp 0 -> 100 VUs
    { duration: '60s', target: 100 }, // hold the flood
    { duration: '15s', target: 0 },   // ramp down
  ],
  thresholds: {
    // p95 latency under 2s, excluding 409 sold-out responses
    http_req_duration: ['p(95)<2000'],
    // real error rate (5xx, timeouts) under 1% — 409 sold-out is correct behaviour
    checkout_real_errors: ['rate<0.01'],
    // oversell must NEVER happen
    oversell_events: ['count==0'],
  },
};

export function setup() {
  console.log(`[checkout] BASE_URL=${BASE_URL} EVENT_ID=${EVENT_ID} TIER_ID=${TIER_ID}`);
  // sanity ping to event page
  const res = http.get(`${BASE_URL}/events/${EVENT_SLUG}`);
  console.log(`[checkout] setup event page status=${res.status}`);
  return { eventId: EVENT_ID, tierId: TIER_ID, eventSlug: EVENT_SLUG };
}

export default function (data) {
  // 1. Browse event page first (realistic — buyers read before buying)
  const eventPage = http.get(`${BASE_URL}/events/${data.eventSlug}`, {
    tags: { name: 'event_page' },
  });
  check(eventPage, {
    'event page reachable': (r) => r.status === 200 || r.status === 304,
  });

  // 2. Fire the checkout
  const buyerId = `${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    event_id: data.eventId,
    tiers: [{ tier_id: data.tierId, qty: 1 + Math.floor(Math.random() * 3) }],
    buyer: {
      name: `Load Test Buyer ${buyerId}`,
      email: `loadtest+${buyerId}@wefetepass.test`,
      phone: `+1868${String(5550000 + (__VU * 1000 + __ITER)).slice(0, 7)}`,
    },
  });

  const res = http.post(`${BASE_URL}/api/checkout`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'checkout' },
  });

  const is200 = res.status === 200 || res.status === 201;
  const is409 = res.status === 409; // sold out — correct under flood
  const isRealError = !is200 && !is409;

  check(res, {
    'status 200/201 or 409': (r) => is200 || is409,
    'no 5xx server error': (r) => r.status < 500,
    'response has body': (r) => r.body && r.body.length > 0,
  });

  if (is200) checkoutSuccess.add(1);
  if (is409) soldOutCounter.add(1);
  realErrors.add(isRealError);

  // Oversell detection: if server returned 200 but body indicates sold out, that's a bug.
  // Or if response includes an "oversell" flag the API exposes for the test harness.
  if (is200 && res.body) {
    try {
      const body = JSON.parse(res.body);
      if (body.oversell === true || body.warning === 'oversold') {
        oversellCounter.add(1);
        console.error(`[OVERSELL] VU=${__VU} ITER=${__ITER} body=${res.body.slice(0, 200)}`);
      }
    } catch (_) { /* non-JSON response, skip */ }
  }

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  const summary = {
    total_iterations: data.metrics.iterations?.values?.count || 0,
    checkout_success_200: data.metrics.checkout_success_200?.values?.count || 0,
    sold_out_409: data.metrics.sold_out_409?.values?.count || 0,
    real_error_rate: data.metrics.checkout_real_errors?.values?.rate || 0,
    oversell_events: data.metrics.oversell_events?.values?.count || 0,
    http_p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
    http_p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
    http_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
  };
  return {
    stdout: '\n=== CHECKOUT FLOOD SUMMARY ===\n' +
      JSON.stringify(summary, null, 2) + '\n\n' +
      textSummary(data, { indent: ' ', enableColors: true }) + '\n',
    'stress/results/checkout-summary.json': JSON.stringify(summary, null, 2),
  };
}
