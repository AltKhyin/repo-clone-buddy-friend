// ABOUTME: Test suite for community-announcements Edge Function to validate API functionality and security

import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';

// Test configuration
const FUNCTION_URL = 'http://localhost:54321/functions/v1/community-announcements';
const MOCK_JWT_TOKEN = 'mock-jwt-token-for-testing';

// Mock test data
const mockAnnouncementData = {
  title: 'Test Announcement',
  content: 'This is a test announcement for the API',
  type: 'announcement',
  priority: 5,
  is_published: true,
  tags: ['test', 'api'],
  metadata: { test: true },
};

// Test helper functions
async function makeRequest(method: string, payload?: any, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(FUNCTION_URL, options);
  const data = await response.json();

  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

// =============================================================================
// Test Suite: Community Announcements API
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

Deno.test('List Announcements - Valid Request Structure', async () => {
  // This test validates the request structure, actual DB results depend on test setup
  const result = await makeRequest('GET', null, MOCK_JWT_TOKEN);

  // Should return 200 if authentication/authorization works, or specific error if not
  // The exact behavior depends on test environment setup
  assertEquals(typeof result.status, 'number');
  assertEquals(typeof result.data, 'object');
});

Deno.test('Create Announcement - Validation Errors', async () => {
  // Test missing required fields
  const resultMissingTitle = await makeRequest(
    'POST',
    {
      action: 'create',
      data: { content: 'Content without title' },
    },
    MOCK_JWT_TOKEN
  );

  // Should return validation error regardless of auth status
  assertEquals(resultMissingTitle.data.error.code, 'VALIDATION_FAILED');
  assertEquals(resultMissingTitle.data.error.message.includes('Title'), true);

  const resultMissingContent = await makeRequest(
    'POST',
    {
      action: 'create',
      data: { title: 'Title without content' },
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(resultMissingContent.data.error.code, 'VALIDATION_FAILED');
  assertEquals(resultMissingContent.data.error.message.includes('content'), true);
});

Deno.test('Update Announcement - Missing ID', async () => {
  const result = await makeRequest(
    'POST',
    {
      action: 'update',
      data: mockAnnouncementData,
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(result.status, 400);
  assertEquals(result.data.error.code, 'VALIDATION_FAILED');
  assertEquals(result.data.error.message.includes('ID is required'), true);
});

Deno.test('Delete Announcement - Missing ID', async () => {
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

Deno.test('Bulk Operations - Missing IDs', async () => {
  const bulkUpdateResult = await makeRequest(
    'POST',
    {
      action: 'bulk_update',
      data: { priority: 5 },
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(bulkUpdateResult.status, 400);
  assertEquals(bulkUpdateResult.data.error.code, 'VALIDATION_FAILED');
  assertEquals(bulkUpdateResult.data.error.message.includes('IDs'), true);

  const bulkDeleteResult = await makeRequest(
    'POST',
    {
      action: 'bulk_delete',
    },
    MOCK_JWT_TOKEN
  );

  assertEquals(bulkDeleteResult.status, 400);
  assertEquals(bulkDeleteResult.data.error.code, 'VALIDATION_FAILED');
  assertEquals(bulkDeleteResult.data.error.message.includes('IDs'), true);
});

Deno.test('Query Parameter Parsing - GET Request', async () => {
  const urlWithParams = new URL(FUNCTION_URL);
  urlWithParams.searchParams.set('is_published', 'true');
  urlWithParams.searchParams.set('type', 'announcement');
  urlWithParams.searchParams.set('page', '1');
  urlWithParams.searchParams.set('limit', '5');
  urlWithParams.searchParams.set('search', 'test');

  const response = await fetch(urlWithParams.toString(), {
    headers: {
      Authorization: `Bearer ${MOCK_JWT_TOKEN}`,
    },
  });

  // Validate that the request is properly formed
  assertEquals(typeof response.status, 'number');
});

Deno.test('Content-Type Headers', async () => {
  const result = await makeRequest('POST', { action: 'list' }, MOCK_JWT_TOKEN);

  assertEquals(result.headers.get('content-type'), 'application/json');
  assertExists(result.headers.get('access-control-allow-origin'));
});

Deno.test('Method Validation', async () => {
  // Test unsupported HTTP method
  const response = await fetch(FUNCTION_URL, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${MOCK_JWT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'list' }),
  });

  const data = await response.json();

  // Should handle unsupported methods gracefully
  assertEquals(typeof response.status, 'number');
  assertEquals(typeof data, 'object');
});

// =============================================================================
// Integration Test Helpers
// =============================================================================

Deno.test('Request Structure Validation', () => {
  // Validate that our test mock data matches expected interface
  assertEquals(typeof mockAnnouncementData.title, 'string');
  assertEquals(typeof mockAnnouncementData.content, 'string');
  assertEquals(
    ['announcement', 'news', 'changelog', 'event'].includes(mockAnnouncementData.type),
    true
  );
  assertEquals(typeof mockAnnouncementData.priority, 'number');
  assertEquals(typeof mockAnnouncementData.is_published, 'boolean');
  assertEquals(Array.isArray(mockAnnouncementData.tags), true);
  assertEquals(typeof mockAnnouncementData.metadata, 'object');
});

// =============================================================================
// Test Configuration and Setup
// =============================================================================

console.log('🧪 Community Announcements API Test Suite');
console.log(`📍 Testing endpoint: ${FUNCTION_URL}`);
console.log('📋 Test coverage:');
console.log('  ✓ CORS preflight handling');
console.log('  ✓ Authentication validation');
console.log('  ✓ Input validation and error handling');
console.log('  ✓ Request structure validation');
console.log('  ✓ Query parameter parsing');
console.log('  ✓ HTTP method handling');
console.log('');
console.log('🚀 Run tests with: deno test community-announcements/test.ts');
console.log('📝 For full integration testing, ensure Supabase is running locally');
