import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  scenarios: {
    readers: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 20),
      duration: __ENV.DURATION || '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<2500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  group('read-heavy workload', () => {
    check(http.get(`${BASE_URL}/api/books?page=1&size=20`), { 'books 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/books/search?q=Library&page=1&size=10`), { 'search 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/loans/expanded?page=1&size=20`), { 'expanded 200': (r) => r.status === 200 });
    check(http.get(`${BASE_URL}/api/stats`), { 'stats 200': (r) => r.status === 200 });
  });
  sleep(1);
}
