import http from 'k6/http'
import { check, sleep, group } from 'k6'

// Configuration & Ramping stages
export const options = {
  stages: [
    { duration: '20s', target: 20 },  // Ramp-up to 20 virtual users
    { duration: '40s', target: 20 },  // Steady load at 20 users
    { duration: '20s', target: 50 },  // Ramp-up to 50 virtual users
    { duration: '40s', target: 50 },  // Peak traffic at 50 users
    { duration: '20s', target: 100 }, // Stress test at 100 users
    { duration: '20s', target: 0 },   // Graceful ramp-down
  ],
  thresholds: {
    // 95% of requests must complete under 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate must stay below 1%
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // ─── 1. Flow: Homepage Landing ─────────────────────────
  group('1. Homepage Load', () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { name: 'Homepage' },
    })
    check(res, {
      'Homepage status is 200': (r) => r.status === 200,
    })
    sleep(1.5)
  })

  // ─── 2. Flow: Browse Catalog & Filter ──────────────────
  group('2. Catalog Product Listing', () => {
    const res = http.get(`${BASE_URL}/api/products?category=whey-protein`, {
      tags: { name: 'ProductCatalog' },
    })
    check(res, {
      'Catalog status is 200': (r) => r.status === 200,
      'Catalog has products array': (r) => r.body && r.body.includes('data'),
    })
    sleep(1.5)
  })

  // ─── 3. Flow: View Specific Product Details ───────────
  group('3. Product Details View', () => {
    const res = http.get(`${BASE_URL}/api/products/nitro-tein-whey-isolate`, {
      tags: { name: 'ProductDetails' },
    })
    check(res, {
      'Product details status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    })
    sleep(2)
  })

  // ─── 4. Flow: Category & Navigation Taxonomy ──────────
  group('4. Categories Navigation', () => {
    const res = http.get(`${BASE_URL}/api/categories`, {
      tags: { name: 'Categories' },
    })
    check(res, {
      'Categories status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    })
    sleep(1)
  })
}
