import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  scenarios: {
    mixed: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: Number(__ENV.TARGET_VUS || 10) },
        { duration: '20s', target: Number(__ENV.TARGET_VUS || 10) },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.03'],
    http_req_duration: ['p(95)<1800', 'p(99)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const headers = { 'Content-Type': 'application/json' };

export default function () {
  const suffix = `${__VU}${__ITER}`;
  group('mixed library workload', () => {
    check(http.get(`${BASE_URL}/api/books?page=1&size=20`), { 'books 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/members?page=1&size=20`), { 'members 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/loans/active?memberId=1&page=1&size=10`), { 'active loans 200': (r) => r.status === 200 });

    const payload = JSON.stringify({
      isbn: `ISBN-M-${suffix}`,
      title: `Mixed Book ${suffix}`,
      author: 'k6',
      published_year: 2026,
      available_copies: 3,
    });
    const createRes = http.post(`${BASE_URL}/api/books`, payload, { headers });
    check(createRes, { 'mixed create book 201': (r) => r.status === 201 });
  });
  sleep(1);
}
