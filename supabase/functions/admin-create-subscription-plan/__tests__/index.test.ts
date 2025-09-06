// ABOUTME: TDD tests for admin-create-subscription-plan Edge Function ensuring admin subscription plan creation works securely

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

const mockPagarMeSubscriptionResponse = {
  id: 'sub_test_123',
  code: 'SUB_123',
  amount: 5000,
  currency: 'BRL',
  status: 'active',
  payment_method: 'credit_card',
  plan: {
    id: 'plan_test_456',
    name: 'Custom Admin Plan',
    amount: 5000,
    billing_type: 'postpaid',
    billing_cycle: 'monthly',
    interval_count: 1,
  },
  current_cycle: {
    start_at: '2024-01-01T00:00:00Z',
    end_at: '2024-02-01T00:00:00Z',
  },
  next_billing_at: '2024-02-01T00:00:00Z',
  trial_end_date: '2024-01-08T00:00:00Z', // 7 days trial
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
  subscription_id: null,
};

describe('admin-create-subscription-plan Edge Function', () => {
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
      json: () => Promise.resolve(mockPagarMeSubscriptionResponse),
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

    it('should validate amount is positive and above minimum', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 50, // Below R$1.00 minimum (100 cents)
        planName: 'Test Plan',
        billingInterval: 'month',
        intervalCount: 1,
        paymentMethod: 'credit_card',
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
      expect(result.error.message).toContain('Amount must be at least R$ 1.00');
    });

    it('should validate billing interval', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        planName: 'Test Plan',
        billingInterval: 'invalid_interval', // Invalid interval
        intervalCount: 1,
        paymentMethod: 'credit_card',
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
      expect(result.error.message).toContain('Billing interval must be month or year');
    });

    it('should validate interval count range', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        planName: 'Test Plan',
        billingInterval: 'month',
        intervalCount: 15, // Above maximum of 12
        paymentMethod: 'credit_card',
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
      expect(result.error.message).toContain('Interval count must be between 1 and 12');
    });

    it('should validate trial days if provided', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        amount: 5000,
        planName: 'Test Plan',
        billingInterval: 'month',
        intervalCount: 1,
        trialDays: 400, // Above maximum of 365
        paymentMethod: 'credit_card',
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
      expect(result.error.message).toContain('Trial days must be between 0 and 365');
    });
  });

  describe('🔴 TDD: Subscription Plan Creation', () => {
    it('should create monthly subscription plan successfully', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Monthly Premium Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
        trialDays: 7,
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
          planName: 'Monthly Premium Plan',
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
      expect(result.data.id).toBe('sub_test_123');
      expect(result.data.status).toBe('active');
      expect(result.data.plan.billing_cycle).toBe('monthly');
      expect(result.data.trial_end_date).toBeDefined();
    });

    it('should create yearly subscription plan successfully', async () => {
      const yearlyResponse = {
        ...mockPagarMeSubscriptionResponse,
        plan: {
          ...mockPagarMeSubscriptionResponse.plan,
          billing_cycle: 'yearly',
        },
        current_cycle: {
          start_at: '2024-01-01T00:00:00Z',
          end_at: '2025-01-01T00:00:00Z', // Year-long cycle
        },
        next_billing_at: '2025-01-01T00:00:00Z',
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(yearlyResponse),
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Yearly Premium Plan',
        amount: 50000, // R$500.00 per year
        billingInterval: 'year',
        intervalCount: 1,
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
          planName: 'Yearly Premium Plan',
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
      expect(result.data.plan.billing_cycle).toBe('yearly');
    });

    it('should handle subscription plan without trial', async () => {
      const noTrialResponse = {
        ...mockPagarMeSubscriptionResponse,
        trial_end_date: null,
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(noTrialResponse),
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'No Trial Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
        // No trialDays specified
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
          planName: 'No Trial Plan',
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
      expect(result.data.trial_end_date).toBeNull();
    });
  });

  describe('🔴 TDD: Pagar.me Integration', () => {
    it('should create plan and subscription in Pagar.me', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Test Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
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
          planName: 'Test Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      await handler(request);
      
      // Verify Pagar.me API calls
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/plans'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Test Plan'),
        })
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle Pagar.me plan creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          errors: [{ message: 'Invalid plan parameters' }],
        }),
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Test Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
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
          planName: 'Test Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('PLAN_CREATION_ERROR');
      expect(result.error.message).toContain('Invalid plan parameters');
    });

    it('should handle Pagar.me subscription creation errors', async () => {
      // Plan creation succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'plan_test_456' }),
      });
      
      // Subscription creation fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          errors: [{ message: 'Invalid card data' }],
        }),
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Test Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
        paymentMethod: 'credit_card',
        cardData: {
          number: '4000000000000002', // Invalid card
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
          planName: 'Test Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.code).toBe('SUBSCRIPTION_CREATION_ERROR');
      expect(result.error.message).toContain('Invalid card data');
    });
  });

  describe('🔴 TDD: User Subscription Updates', () => {
    it('should update user subscription information after successful creation', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Test Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
        trialDays: 7,
        paymentMethod: 'credit_card',
        adminNotes: 'Admin created subscription',
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
          planName: 'Test Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      
      // Verify subscription update was called with correct data
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: 'premium',
          subscription_created_by: 'admin',
          subscription_payment_method_used: 'credit_card',
          subscription_id: 'sub_test_123',
          admin_subscription_notes: 'Admin created subscription',
          trial_end_date: '2024-01-08T00:00:00Z',
          next_billing_date: '2024-02-01T00:00:00Z',
        })
      );
    });

    it('should cancel existing subscription before creating new one', async () => {
      const userWithExistingSubscription = {
        ...mockTargetUser,
        subscription_tier: 'premium',
        subscription_id: 'sub_existing_789',
      };
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: userWithExistingSubscription,
        error: null,
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'New Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
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
          planName: 'New Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(200);
      
      // Should call cancel subscription for existing one
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions/sub_existing_789/cancel'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle subscription update database errors', async () => {
      mockSupabaseClient.from().update().eq.mockResolvedValue({
        error: { message: 'Failed to update subscription' },
      });

      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Test Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
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
          planName: 'Test Plan',
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
  });

  describe('🔴 TDD: Error Handling & Edge Cases', () => {
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

    it('should validate card data for credit card subscriptions', async () => {
      const { default: handler } = await import('../index.ts');
      
      const request = createMockRequest({
        targetUserId: 'user-456',
        planName: 'Test Plan',
        amount: 5000,
        billingInterval: 'month',
        intervalCount: 1,
        paymentMethod: 'credit_card',
        // Missing card data
        metadata: {
          customerName: 'Dr. João Silva',
          customerEmail: 'joao@example.com',
          customerDocument: '12345678901',
          customerPhone: '+5511999999999',
          planName: 'Test Plan',
          adminCreated: true,
          adminUserId: 'admin-123',
        },
      }, {
        'Authorization': 'Bearer admin_token',
      });
      
      const response = await handler(request);
      
      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error.message).toContain('Card data is required');
    });
  });
});