// k6-discover.js — Instagram-traffic-spike discover page flood.
// Promoter shares a post, 10k visits in 5 minutes. This is read-heavy and cached.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');
const errors = new Rate('discover_errors');

const ISLANDS = ['tt', 'jm', 'bb', 'gd', 'lc'];

export const options = {
  stages: [
    { duration: '60s', target: 200 },  // ramp 0 -> 200 VUs
    { duration: '180s', target: 200 }, // hold for 3 min
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:discover}': ['p(95)<800'],
    discover_errors: ['rate<0.005'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  console.log(`[discover] BASE_URL=${BASE_URL}`);
  const res = http.get(`${BASE_URL}/discover?island=tt&page=1`);
  console.log(`[discover] setup probe status=${res.status} bytes=${res.body ? res.body.length : 0}`);
  return {};
}

export default function () {
  // 70% hit the default tt discover (the IG-shared URL).
  // 30% explore other islands/pages — realistic browse pattern.
  const r = Math.random();
  let url;
  if (r < 0.7) {
    url = `${BASE_URL}/discover?island=tt&page=1`;
  } else if (r < 0.9) {
    const island = ISLANDS[Math.floor(Math.random() * ISLANDS.length)];
    url = `${BASE_URL}/discover?island=${island}&page=1`;
  } else {
    const island = ISLANDS[Math.floor(Math.random() * ISLANDS.length)];
    const page = 1 + Math.floor(Math.random() * 5);
    url = `${BASE_URL}/discover?island=${island}&page=${page}`;
  }

  const res = http.get(url, { tags: { name: 'discover' } });

  const ok = res.status === 200 || res.status === 304;
  errors.add(!ok);

  check(res, {
    'status 200 or 304': () => ok,
    'no server error': (r) => r.status < 500,
    'body non-empty': (r) => r.body && r.body.length > 100,
  });

  // Cache header tracking — Next.js / CDN behaviour
  const cacheHeader = res.headers['X-Cache'] || res.headers['x-vercel-cache'] || res.headers['Cf-Cache-Status'] || '';
  if (/HIT/i.test(cacheHeader)) cacheHits.add(1);
  else if (/MISS/i.test(cacheHeader)) cacheMisses.add(1);

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  const summary = {
    total_requests: data.metrics.iterations?.values?.count || 0,
    error_rate: data.metrics.discover_errors?.values?.rate || 0,
    http_p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
    http_p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
    http_avg_ms: data.metrics.http_req_duration?.values?.avg || 0,
    cache_hits: data.metrics.cache_hits?.values?.count || 0,
    cache_misses: data.metrics.cache_misses?.values?.count || 0,
    http_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
  };
  return {
    stdout: '\n=== DISCOVER FLOOD SUMMARY ===\n' +
      JSON.stringify(summary, null, 2) + '\n\n' +
      textSummary(data, { indent: ' ', enableColors: true }) + '\n',
    'stress/results/discover-summary.json': JSON.stringify(summary, null, 2),
  };
}
