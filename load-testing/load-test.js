import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL;
if (!baseUrl) {
  throw new Error('BASE_URL not found in ENV');
}

// Вывод всех переменных среды для диагностики
console.log('');
console.log('🔧 Environment Variables Configuration:');
console.log('=====================================');
console.log(`BASE_URL: ${__ENV.BASE_URL || 'NOT SET'}`);
console.log(`VUS (Virtual Users): ${__ENV.VUS || '10 (default)'}`);
console.log(`TEST_DURATION: ${__ENV.TEST_DURATION || '5m (default)'}`);
console.log(`RAMP_UP_TIME: ${__ENV.RAMP_UP_TIME || '2m (default)'}`);
console.log(`RAMP_DOWN_TIME: ${__ENV.RAMP_DOWN_TIME || '2m (default)'}`);
console.log('=====================================');
console.log('');

const testCredentials = {
  customer: {
    email: 'test.customer@example.com',
    password: 'password123'
  },
  employee: {
    email: 'test.employee@example.com',
    password: 'password123'
  }
};

const testData = {
  storeId: 1,
  categoryId: 1,
  cityId: 'lviv',
  coordinates: {
    latitude: 49.8397,
    longitude: 24.0297,
    radius: 5000
  }
};

// Load test options with thresholds
export const options = {
  stages: [
    { duration: __ENV.RAMP_UP_TIME || '2m', target: parseInt(__ENV.VUS) || 10 },
    { duration: __ENV.TEST_DURATION || '5m', target: parseInt(__ENV.VUS) || 10 },
    { duration: __ENV.RAMP_DOWN_TIME || '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% запросов быстрее 1s
    http_req_failed: ['rate<0.05'],    // Менее 5% ошибок
    http_reqs: ['rate>1'],             // Минимум 1 запрос в секунду
  }
};

// Authentication tokens
let customerToken = '';
let employeeToken = '';

export function setup() {
  console.log('🚀 Starting load test setup...');

  // Authenticate customer
  const customerAuth = http.post(`${baseUrl}/auth/customer/login`,
    JSON.stringify(testCredentials.customer),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (customerAuth.status === 200) {
    customerToken = JSON.parse(customerAuth.body).accessToken;
    console.log('✅ Customer authenticated successfully');
  } else {
    console.log('⚠️ Customer authentication failed');
  }

  // Authenticate employee
  const employeeAuth = http.post(`${baseUrl}/auth/employee/login`,
    JSON.stringify(testCredentials.employee),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (employeeAuth.status === 200) {
    employeeToken = JSON.parse(employeeAuth.body).accessToken;
    console.log('✅ Employee authenticated successfully');
  } else {
    console.log('⚠️ Employee authentication failed');
  }

  return { customerToken, employeeToken };
}

export default function(data) {
  const { customerToken, employeeToken } = data;

  // Simple sequential testing of main endpoints
  testBoxesByStore();
  sleep(0.5);

  testNearbyBoxes();
  sleep(0.5);

  testBoxesByCity();
  sleep(0.5);

  // Authenticated endpoints (if tokens available)
  if (customerToken) {
    testCustomerOrders(customerToken);
    sleep(0.5);
  }

  if (employeeToken) {
    testStoreOrders(employeeToken);
    sleep(0.5);
  }

  sleep(1); // Wait between iterations
}

function testBoxesByStore() {
  const response = http.get(`${baseUrl}/boxes/stores/${testData.storeId}`);

  check(response, {
    'Boxes by store - status 200': (r) => r.status === 200,
    'Boxes by store - has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch {
        return false;
      }
    },
    'Boxes by store - response time < 1s': (r) => r.timings.duration < 1000,
  });
}

function testNearbyBoxes() {
  const { latitude, longitude, radius } = testData.coordinates;
  const url = `${baseUrl}/boxes/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;

  const response = http.get(url);

  check(response, {
    'Nearby boxes - status 200': (r) => r.status === 200,
    'Nearby boxes - has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.pagination !== undefined;
      } catch {
        return false;
      }
    },
    'Nearby boxes - response time < 1s': (r) => r.timings.duration < 1000,
  });
}

function testBoxesByCity() {
  const response = http.get(`${baseUrl}/boxes/cities/${testData.cityId}`);

  check(response, {
    'Boxes by city - status 200': (r) => r.status === 200,
    'Boxes by city - valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch {
        return false;
      }
    },
    'Boxes by city - response time < 1s': (r) => r.timings.duration < 1000,
  });
}

function testCustomerOrders(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const response = http.get(`${baseUrl}/api/v1/orders`, { headers });

  check(response, {
    'Customer orders - status 200': (r) => r.status === 200,
    'Customer orders - authenticated': (r) => r.status !== 401,
    'Customer orders - response time < 1s': (r) => r.timings.duration < 1000,
  });
}

function testStoreOrders(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const response = http.get(`${baseUrl}/api/v1/orders/employee/store`, { headers });

  check(response, {
    'Store orders - status 200': (r) => r.status === 200,
    'Store orders - authenticated': (r) => r.status !== 401,
    'Store orders - response time < 1s': (r) => r.timings.duration < 1000,
  });
}

export function teardown(data) {
  console.log('🏁 Load test completed');
}
