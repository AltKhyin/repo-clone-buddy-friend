// ABOUTME: TDD tests for admin-create-custom-payment Edge Function ensuring admin payment creation works securely

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client and environment
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

const mockPagarMeResponse = {
  id: 'char_test_123',
  code: 'CHAR_123',
  amount: 5000,
  currency: 'BRL',
  status: 'pending',
  payment_method: 'pix',
  qr_code: 'sample_qr_code',
  qr_code_url: 'https://example.com/qr',
  expires_at: '2024-01-01T12:00:00Z',
};

// Mock fetch for Pagar.me API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
const mockEnv = {
  PAGARME_SECRET_KEY: 'sk_test_123',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
};

// Mock request object
const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
  return {
    method: 'POST',
    headers: {
      get: (name: string) => headers[name] || null,
    },
    json: () => Promise.resolve(body),
  } as unknown as Request;
};

// Mock admin user
const mockAdminUser = {
  id: 'admin-123',
  app_metadata: { role: 'admin' },
  email: 'admin@example.com',
};

// Mock target user data
const mockTargetUser = {
  id: 'user-456',
  full_name: 'Dr. João Silva',
  email: 'joao@example.com',
  subscription_tier: 'free',
  subscription_end_date: null,
};

describe('admin-create-custom-payment Edge Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset fetch mock
    mockFetch.mockReset();
    
    // Setup default successful responses
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      user: mockAdminUser,
      error: null,
    });
    
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: mockTargetUser,
      error: null,
    });
    
    mockSupabaseClient.from().update().eq.mockResolvedValue({
      error: null,
    });
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPagarMeResponse),
    });
  });

  describe('🔴 TDD: Authentication & Authorization', () => {
    it('should reject requests without Authorization header', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({});
      const response = await handler(request);
      
      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid JWT token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        user: null,
        error: { message: 'Invalid JWT' },
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({}, {
        'Authorization': 'Bearer invalid_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests from non-admin users', async () => {
      const nonAdminUser = {
        ...mockAdminUser,
        app_metadata: { role: 'practitioner' },
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        user: nonAdminUser,
        error: null,
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
      }, {
        'Authorization': 'Bearer valid_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.error.code).toBe('ADMIN_REQUIRED');
    });

    it('should accept requests from admin users', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('🔴 TDD: Request Validation', () => {
    it('should validate required fields', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        // Missing required fields
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate amount is positive', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: -100, // Invalid negative amount
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.message).toContain('Amount must be positive');
    });

    it('should validate subscription days range', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 5000, // Too many days
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.message).toContain('Subscription days must be between 1 and 3650');
    });

    it('should validate payment method', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'invalid_method', // Invalid payment method
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.message).toContain('Payment method must be pix or credit_card');
    });
  });

  describe('🔴 TDD: Target User Validation', () => {
    it('should validate target user exists', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found', code: 'PGRST116' },
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'nonexistent-user',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('USER_NOT_FOUND');
    });

    it('should handle database errors when fetching user', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('🔴 TDD: Pagar.me Integration', () => {
    it('should create PIX payment successfully', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test PIX payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('char_test_123');
      expect(result.data.qr_code).toBe('sample_qr_code');
      expect(result.data.payment_method).toBe('pix');
    });

    it('should create credit card payment successfully', async () => {
      const creditCardResponse = {
        ...mockPagarMeResponse,
        payment_method: 'credit_card',
        authorization_code: 'AUTH_123456',
        qr_code: undefined,
        qr_code_url: undefined,
        expires_at: undefined,
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(creditCardResponse),
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test credit card payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'credit_card',
        cardData: {
          number: '4111111111111111',
          holderName: 'DR JOAO SILVA',
          expirationMonth: '12',
          expirationYear: '2025',
          cvv: '123',
        },
        billingAddress: {
          line_1: 'Rua Teste, 123',
          zip_code: '01234567',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR',
        },
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.authorization_code).toBe('AUTH_123456');
      expect(result.data.payment_method).toBe('credit_card');
    });

    it('should handle Pagar.me API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          errors: [{ message: 'Invalid card number' }],
        }),
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('PAYMENT_ERROR');
      expect(result.error.message).toContain('Invalid card number');
    });

    it('should handle Pagar.me network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error.code).toBe('NETWORK_ERROR');
    });
  });

  describe('🔴 TDD: Subscription Updates', () => {
    it('should update user subscription after successful payment', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        adminNotes: 'Admin granted 30 days',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      
      // Verify subscription update was called
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'premium',
          subscription_created_by: 'admin',
          admin_subscription_notes: 'Admin granted 30 days',
          subscription_days_granted: expect.any(Number),
        })
      );
    });

    it('should handle subscription update errors', async () => {
      mockSupabaseClient.from().update().eq.mockResolvedValue({
        error: { message: 'Failed to update subscription' },
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Test payment',
        subscriptionDaysToGrant: 30,
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Custom Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error.code).toBe('SUBSCRIPTION_UPDATE_ERROR');
    });

    it('should extend existing subscription correctly', async () => {
      const userWithExistingSubscription = {
        ...mockTargetUser,
        subscription_tier: 'premium',
        subscription_end_date: '2024-02-01T00:00:00Z', // Existing subscription
        subscription_days_granted: 30,
      };
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: userWithExistingSubscription,
        error: null,
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        description: 'Subscription extension',
        subscriptionDaysToGrant: 30, // Add 30 more days
        paymentMethod: 'pix',
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Extension Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      
      // Should extend from existing end date, not from current date
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_days_granted: 60, // 30 + 30
        })
      );
    });
  });

  describe('🔴 TDD: Error Handling', () => {
    it('should handle CORS preflight requests', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = {
        method: 'OPTIONS',
      } as unknown as Request;
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return proper error format for all errors', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({});
      const response = await handler(request);
      
      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Simulate unexpected error
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({}, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error.code).toBe('INTERNAL_ERROR');
    });
  });
});