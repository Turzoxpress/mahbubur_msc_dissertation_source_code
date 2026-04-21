import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 1),
  iterations: Number(__ENV.ITERATIONS || 10),
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8090';

export default function () {
  const res = http.get(`${BASE_URL}/api/ping`);
  check(res, {
    'ping status 200': (r) => r.status === 200,
  });
  sleep(1);
}
