// k6-whatsapp-broadcast.js — single-trigger broadcast to 5000 past attendees, then poll status.
// This is not a flood — it's a long-running job. We assert it completes under 5 minutes.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const BROADCAST_ID = __ENV.BROADCAST_ID || 'bcast_test_5000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const MAX_WAIT_MS = parseInt(__ENV.MAX_WAIT_MS || '300000', 10); // 5 min default
const POLL_INTERVAL_S = parseInt(__ENV.POLL_INTERVAL_S || '5', 10);

const sendErrors = new Counter('broadcast_send_errors');
const pollErrors = new Counter('broadcast_poll_errors');
const completionTime = new Trend('broadcast_completion_ms', true);
const messagesSent = new Counter('messages_sent_total');

export const options = {
  // Single VU, single iteration — this is a triggered job test, not a flood.
  vus: 1,
  iterations: 1,
  // hard cap: 5 min job + headroom for trigger + polling
  maxDuration: '6m',
  thresholds: {
    broadcast_send_errors: ['count==0'],
    broadcast_poll_errors: ['count<3'],
    broadcast_completion_ms: ['p(95)<300000'], // completes under 5 minutes
  },
};

export function setup() {
  console.log(`[broadcast] BASE_URL=${BASE_URL} BROADCAST_ID=${BROADCAST_ID} AUTH=${AUTH_TOKEN ? 'set' : 'MISSING'}`);
  if (!AUTH_TOKEN) {
    console.warn('[broadcast] WARNING: AUTH_TOKEN not set — broadcast endpoint is auth-gated.');
  }
  return { broadcastId: BROADCAST_ID, authToken: AUTH_TOKEN };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    ...(data.authToken ? { Authorization: `Bearer ${data.authToken}` } : {}),
  };

  // 1. Trigger the broadcast
  const startedAt = Date.now();
  const trigger = http.post(
    `${BASE_URL}/api/broadcasts/${data.broadcastId}/send`,
    JSON.stringify({}),
    { headers, tags: { name: 'broadcast_send' }, timeout: '30s' }
  );

  const triggered = check(trigger, {
    'broadcast trigger 2xx/202': (r) => r.status >= 200 && r.status < 300,
    'no 5xx on trigger': (r) => r.status < 500,
  });

  if (!triggered) {
    sendErrors.add(1);
    console.error(`[broadcast] trigger failed status=${trigger.status} body=${(trigger.body || '').slice(0, 300)}`);
    return;
  }
  console.log(`[broadcast] triggered status=${trigger.status}`);

  // 2. Poll status until done or timeout
  const deadline = startedAt + MAX_WAIT_MS;
  let done = false;
  let lastStatus = null;
  let lastSent = 0;

  while (Date.now() < deadline) {
    sleep(POLL_INTERVAL_S);
    const poll = http.get(
      `${BASE_URL}/api/broadcasts/${data.broadcastId}/send`,
      { headers, tags: { name: 'broadcast_poll' } }
    );

    if (poll.status >= 500) {
      pollErrors.add(1);
      console.error(`[broadcast] poll 5xx status=${poll.status}`);
      continue;
    }

    try {
      const body = JSON.parse(poll.body || '{}');
      lastStatus = body.status || body.state || 'unknown';
      lastSent = body.sent_count || body.delivered || body.progress || lastSent;
      console.log(`[broadcast] poll status=${lastStatus} sent=${lastSent}`);
      if (lastStatus === 'completed' || lastStatus === 'done' || lastStatus === 'finished') {
        done = true;
        break;
      }
      if (lastStatus === 'failed' || lastStatus === 'error') {
        pollErrors.add(1);
        console.error(`[broadcast] job failed: ${poll.body}`);
        break;
      }
    } catch (e) {
      pollErrors.add(1);
      console.error(`[broadcast] poll body parse error: ${e.message}`);
    }
  }

  const elapsed = Date.now() - startedAt;
  completionTime.add(elapsed);
  messagesSent.add(lastSent);

  check(null, {
    'broadcast completed within deadline': () => done,
    'no failure status': () => lastStatus !== 'failed' && lastStatus !== 'error',
  });

  console.log(`[broadcast] elapsed=${elapsed}ms done=${done} final_status=${lastStatus} sent=${lastSent}`);
}

export function handleSummary(data) {
  const summary = {
    send_errors: data.metrics.broadcast_send_errors?.values?.count || 0,
    poll_errors: data.metrics.broadcast_poll_errors?.values?.count || 0,
    completion_ms_p95: data.metrics.broadcast_completion_ms?.values?.['p(95)'] || 0,
    completion_ms_avg: data.metrics.broadcast_completion_ms?.values?.avg || 0,
    messages_sent_total: data.metrics.messages_sent_total?.values?.count || 0,
    http_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
  };
  return {
    stdout: '\n=== WHATSAPP BROADCAST SUMMARY ===\n' +
      JSON.stringify(summary, null, 2) + '\n\n' +
      textSummary(data, { indent: ' ', enableColors: true }) + '\n',
    'stress/results/broadcast-summary.json': JSON.stringify(summary, null, 2),
  };
}
