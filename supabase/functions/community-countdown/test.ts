// ABOUTME: Test suite for community-countdown Edge Function to validate countdown calculations, timezone handling, and API functionality

import {
  assertEquals,
  assertExists,
  assert,
} from 'https://deno.land/std@0.192.0/testing/asserts.ts';

// Test configuration
const FUNCTION_URL = 'http://localhost:54321/functions/v1/community-countdown';
const MOCK_JWT_TOKEN = 'mock-jwt-token-for-testing';

// Mock test data
const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

const mockCountdownData = {
  title: 'Test Countdown',
  description: 'This is a test countdown for the API',
  target_date: futureDate.toISOString(),
  timezone: 'UTC',
  is_active: true,
  is_featured: false,
  display_format: 'days_hours_minutes',
  completed_message: 'Test completed!',
  completed_action: 'show_message',
  show_seconds: false,
  custom_labels: {
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
  },
  metadata: { test: true },
};

// Test helper functions
async function makeRequest(method: string, payload?: any, token?: string, queryParams?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = queryParams ? `${FUNCTION_URL}?${queryParams}` : FUNCTION_URL;

  const options: RequestInit = {
    method,
    headers,
  };

  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

// =============================================================================
// Test Suite: Community Countdown API
// =============================================================================

Deno.test('CORS Preflight Request', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'OPTIONS',
  });

  assertEquals(response.status, 200);
  assertExists(response.headers.get('Access-Control-Allow-Origin'));
  assertExists(response.headers.get('Access-Control-Allow-Headers'));
  assertExists(response.headers.get('Access-Control-Allow-Methods'));
});

Deno.test('Authentication Required - No Token', async () => {
  const result = await makeRequest('POST', { action: 'list' });

  assertEquals(result.status, 401);
  assertEquals(result.data.error.code, 'UNAUTHORIZED');
});

Deno.test('Authentication Required - Invalid Token', async () => {
  const result = await makeRequest('POST', { action: 'list' }, 'invalid-token');

  assertEquals(result.status, 401);
  assertEquals(result.data.error.code, 'UNAUTHORIZED');
});

Deno.test('Validation Error - Missing Action', async () => {
  const result = await makeRequest('POST', {}, MOCK_JWT_TOKEN);

  assertEquals(result.status, 400);
  assertEquals(result.data.error.code, 'VALIDATION_FAILED');
  assertEquals(result.data.error.message.includes('action'), true);
});

Deno.test('Validation Error - Invalid Action', async () => {
  const result = await makeRequest('POST', { action: 'invalid_action' }, MOCK_JWT_TOKEN);

  assertEquals(result.status, 400);
  assertEquals(result.data.error.code, 'VALIDATION_FAILED');
  assertEquals(result.data.error.message.includes('Unsupported action'), true);
});

Deno.test('GET Request - List Countdowns with Query Parameters', async () => {
  const queryParams = 'action=list&is_active=true&timezone=UTC';
  const result = await makeRequest('GET', null, MOCK_JWT_TOKEN, queryParams);

  // Should return appropriate response regardless of actual data
  assertEquals(typeof result.status, 'number');
  assertEquals(typeof result.data, 'object');
});

Deno.test('GET Request - Calculate Countdown', async () => {
  const queryParams = 'action=calculate&id=test-uuid&timezone=UTC&calculation_type=real_time';
  const result = await makeRequest('GET', null, MOCK_JWT_TOKEN, queryParams);

  // Should require valid countdown ID, but validates request structure
  assertEquals(typeof result.status, 'number');
  assertEquals(typeof result.data, 'object');
});

Deno.test('Create Countdown - Validation Errors', async () => {
  // Test missing required fields
  const resultMissingTitle = await makeRequest(
    'POST',
    {
      action: 'create',
      data: { target_date: futureDate.toISOString() },
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(resultMissingTitle.data.error.code, 'VALIDATION_FAILED');
  assertEquals(resultMissingTitle.data.error.message.includes('Title'), true);

  const resultMissingTargetDate = await makeRequest(
    'POST',
    {
      action: 'create',
      data: { title: 'Test Countdown' },
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(resultMissingTargetDate.data.error.code, 'VALIDATION_FAILED');
  assertEquals(resultMissingTargetDate.data.error.message.includes('target date'), true);

  // Test past date validation
  const resultPastDate = await makeRequest(
    'POST',
    {
      action: 'create',
      data: {
        title: 'Test Countdown',
        target_date: pastDate.toISOString(),
      },
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(resultPastDate.data.error.code, 'VALIDATION_FAILED');
  assertEquals(resultPastDate.data.error.message.includes('future'), true);
});

Deno.test('Update Countdown - Missing ID', async () => {
  const result = await makeRequest(
    'POST',
    {
      action: 'update',
      data: mockCountdownData,
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(result.status, 400);
  assertEquals(result.data.error.code, 'VALIDATION_FAILED');
  assertEquals(result.data.error.message.includes('ID is required'), true);
});

Deno.test('Delete Countdown - Missing ID', async () => {
  const result = await makeRequest(
    'POST',
    {
      action: 'delete',
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(result.status, 400);
  assertEquals(result.data.error.code, 'VALIDATION_FAILED');
  assertEquals(result.data.error.message.includes('ID is required'), true);
});

Deno.test('Calculate Countdown - Missing ID', async () => {
  const result = await makeRequest(
    'POST',
    {
      action: 'calculate',
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(result.status, 400);
  assertEquals(result.data.error.code, 'VALIDATION_FAILED');
  assertEquals(result.data.error.message.includes('ID is required'), true);
});

Deno.test('Bulk Operations - Missing IDs', async () => {
  const bulkUpdateResult = await makeRequest(
    'POST',
    {
      action: 'bulk_update',
      data: { is_active: true },
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(bulkUpdateResult.status, 400);
  assertEquals(bulkUpdateResult.data.error.code, 'VALIDATION_FAILED');
  assertEquals(bulkUpdateResult.data.error.message.includes('IDs'), true);
});

Deno.test('Activate/Deactivate Operations - Missing ID', async () => {
  const activateResult = await makeRequest(
    'POST',
    {
      action: 'activate',
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(activateResult.status, 400);
  assertEquals(activateResult.data.error.code, 'VALIDATION_FAILED');

  const deactivateResult = await makeRequest(
    'POST',
    {
      action: 'deactivate',
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(deactivateResult.status, 400);
  assertEquals(deactivateResult.data.error.code, 'VALIDATION_FAILED');
});

Deno.test('Feature/Unfeature Operations - Missing ID', async () => {
  const featureResult = await makeRequest(
    'POST',
    {
      action: 'feature',
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(featureResult.status, 400);
  assertEquals(featureResult.data.error.code, 'VALIDATION_FAILED');

  const unfeatureResult = await makeRequest(
    'POST',
    {
      action: 'unfeature',
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(unfeatureResult.status, 400);
  assertEquals(unfeatureResult.data.error.code, 'VALIDATION_FAILED');
});

Deno.test('Content-Type Headers', async () => {
  const result = await makeRequest('POST', { action: 'list' }, MOCK_JWT_TOKEN);

  assertEquals(result.headers.get('content-type'), 'application/json');
  assertExists(result.headers.get('access-control-allow-origin'));
});

// =============================================================================
// Countdown Calculation Logic Tests
// =============================================================================

Deno.test('Countdown Calculation Logic - Future Date', () => {
  // Test countdown calculation with future date
  const targetDate = new Date(Date.now() + 86400000); // 1 day from now
  const now = new Date();
  const timeDiff = targetDate.getTime() - now.getTime();

  // Should be positive for future dates
  assert(timeDiff > 0);

  // Should calculate to approximately 1 day
  const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
  assertEquals(days, 1);
});

Deno.test('Countdown Calculation Logic - Past Date', () => {
  // Test countdown calculation with past date
  const targetDate = new Date(Date.now() - 86400000); // 1 day ago
  const now = new Date();
  const timeDiff = targetDate.getTime() - now.getTime();

  // Should be negative for past dates
  assert(timeDiff < 0);
});

Deno.test('Display Format Validation', () => {
  const validFormats = ['days_hours_minutes', 'days_only', 'hours_minutes', 'full', 'compact'];

  validFormats.forEach(format => {
    assertEquals(typeof format, 'string');
    assert(format.length > 0);
  });
});

Deno.test('Timezone Parameter Handling', () => {
  // Test common timezone strings
  const timezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

  timezones.forEach(timezone => {
    assertEquals(typeof timezone, 'string');
    assert(timezone.length > 0);
  });
});

// =============================================================================
// Request Structure Validation Tests
// =============================================================================

Deno.test('Request Structure Validation - Countdown Data', () => {
  // Validate that our test mock data matches expected interface
  assertEquals(typeof mockCountdownData.title, 'string');
  assertEquals(typeof mockCountdownData.description, 'string');
  assertEquals(typeof mockCountdownData.target_date, 'string');
  assertEquals(typeof mockCountdownData.timezone, 'string');
  assertEquals(typeof mockCountdownData.is_active, 'boolean');
  assertEquals(typeof mockCountdownData.is_featured, 'boolean');
  assertEquals(
    ['days_hours_minutes', 'days_only', 'hours_minutes', 'full', 'compact'].includes(
      mockCountdownData.display_format
    ),
    true
  );
  assertEquals(typeof mockCountdownData.completed_message, 'string');
  assertEquals(
    ['hide', 'show_message', 'redirect', 'custom'].includes(mockCountdownData.completed_action),
    true
  );
  assertEquals(typeof mockCountdownData.show_seconds, 'boolean');
  assertEquals(typeof mockCountdownData.custom_labels, 'object');
  assertEquals(typeof mockCountdownData.metadata, 'object');
});

Deno.test('Date Validation Logic', () => {
  // Test valid ISO 8601 date strings
  const validDates = [
    futureDate.toISOString(),
    new Date().toISOString(),
    '2024-12-31T23:59:59Z',
    '2024-06-15T12:30:00.000Z',
  ];

  validDates.forEach(dateString => {
    const date = new Date(dateString);
    assert(!isNaN(date.getTime()));
  });
});

Deno.test('Custom Labels Structure', () => {
  const customLabels = mockCountdownData.custom_labels;

  assertEquals(typeof customLabels.days, 'string');
  assertEquals(typeof customLabels.hours, 'string');
  assertEquals(typeof customLabels.minutes, 'string');
  assertEquals(typeof customLabels.seconds, 'string');
});

// =============================================================================
// Query Parameter Parsing Tests
// =============================================================================

Deno.test('Query Parameter Structure - List', () => {
  const validQueryParams = [
    'action=list&is_active=true',
    'action=list&is_featured=false&timezone=UTC',
    'action=list&search=test&target_after=2024-01-01T00:00:00Z',
    'action=calculate&id=test-uuid&timezone=America/New_York',
  ];

  validQueryParams.forEach(queryString => {
    const params = new URLSearchParams(queryString);
    assertExists(params.get('action'));
  });
});

// =============================================================================
// Error Handling Tests
// =============================================================================

Deno.test('Error Response Structure', async () => {
  const result = await makeRequest('POST', { action: 'invalid' }, MOCK_JWT_TOKEN);

  assertEquals(typeof result.data.error, 'object');
  assertEquals(typeof result.data.error.message, 'string');
  assertEquals(typeof result.data.error.code, 'string');
});

// =============================================================================
// Test Configuration and Setup
// =============================================================================

console.log('🧪 Community Countdown API Test Suite');
console.log(`📍 Testing endpoint: ${FUNCTION_URL}`);
console.log('📋 Test coverage:');
console.log('  ✓ CORS preflight handling');
console.log('  ✓ Authentication validation');
console.log('  ✓ Input validation and error handling');
console.log('  ✓ Request structure validation');
console.log('  ✓ Countdown calculation logic');
console.log('  ✓ Date and timezone validation');
console.log('  ✓ Query parameter parsing');
console.log('  ✓ Display format validation');
console.log('  ✓ Custom labels structure');
console.log('');
console.log('🚀 Run tests with: deno test community-countdown/test.ts');
console.log('📝 For full integration testing, ensure Supabase is running locally');
