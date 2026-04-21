import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  scenarios: {
    writers: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 5),
      duration: __ENV.DURATION || '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8090';
const headers = { 'Content-Type': 'application/json' };

function uniqueSuffix() {
  return `${__VU}${__ITER}${Date.now()}`;
}

export default function () {
  const suffix = uniqueSuffix();

  group('write-heavy workload', () => {
    const bookPayload = JSON.stringify({
      isbn: `ISBN-W-${suffix}`,
      title: `Performance Book ${suffix}`,
      author: 'k6',
      published_year: 2026,
      available_copies: 4,
    });

    const memberPayload = JSON.stringify({
      membership_no: `M-W-${suffix}`,
      full_name: `Load Member ${suffix}`,
      email: `member-${suffix}@example.com`,
    });

    check(http.post(`${BASE_URL}/api/books`, bookPayload, { headers }), { 'create book 201': (r) => r.status === 201 });
    check(http.post(`${BASE_URL}/api/members`, memberPayload, { headers }), { 'create member 201': (r) => r.status === 201 });
    check(http.patch(`${BASE_URL}/api/books/1/stock`, JSON.stringify({ available_copies: 9 }), { headers }), {
      'patch stock 200': (r) => r.status === 200,
    });
  });
}
