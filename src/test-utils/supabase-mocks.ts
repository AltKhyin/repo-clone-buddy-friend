// ABOUTME: Comprehensive Supabase client mocking for testing with realistic behavior simulation

import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { createMockUserProfile, createMockReview, createMockCommunityPost } from './test-data-factories';

/**
 * Mock Supabase query builder chain
 */
export class MockQueryBuilder {
  private mockData: unknown = null;
  private mockError: Error | null = null;
  private shouldFail = false;

  select(columns = '*') {
    return this;
  }

  from(table: string) {
    return this;
  }

  eq(column: string, value: unknown) {
    return this;
  }

  neq(column: string, value: unknown) {
    return this;
  }

  gt(column: string, value: unknown) {
    return this;
  }

  lt(column: string, value: unknown) {
    return this;
  }

  gte(column: string, value: unknown) {
    return this;
  }

  lte(column: string, value: unknown) {
    return this;
  }

  like(column: string, pattern: string) {
    return this;
  }

  in(column: string, values: unknown[]) {
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    return this;
  }

  limit(count: number) {
    return this;
  }

  range(from: number, to: number) {
    return this;
  }

  single() {
    return this;
  }

  maybeSingle() {
    return this;
  }

  insert(data: Record<string, unknown>) {
    return this;
  }

  update(data: Record<string, unknown>) {
    return this;
  }

  delete() {
    return this;
  }

  // Set mock data for this query
  mockResolvedValue(data: unknown) {
    this.mockData = data;
    this.shouldFail = false;
    return this;
  }

  // Set mock error for this query
  mockRejectedValue(error: Error) {
    this.mockError = error;
    this.shouldFail = true;
    return this;
  }

  // Execute the mock query
  async then(resolve: (value: unknown) => unknown, reject?: (error: Error) => unknown) {
    if (this.shouldFail) {
      const result = { data: null, error: this.mockError };
      return reject ? reject(result) : result;
    }
    
    const result = { data: this.mockData, error: null };
    return resolve(result);
  }
}

/**
 * Create mock Supabase auth client
 */
export const createMockAuth = () => {
  return {
    getSession: vi.fn().mockResolvedValue({
      data: { 
        session: {
          access_token: 'mock-token',
          user: { id: 'mock-user-id', email: 'test@example.com' }
        } 
      },
      error: null,
    }),

    getUser: vi.fn().mockResolvedValue({
      data: { 
        user: { 
          id: 'mock-user-id', 
          email: 'test@example.com',
          user_metadata: { role: 'practitioner' }
        } 
      },
      error: null,
    }),

    signUp: vi.fn().mockImplementation((credentials) => {
      if (credentials.email === 'existing@example.com') {
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: 'User already exists' },
        });
      }
      return Promise.resolve({
        data: {
          user: { id: 'new-user-id', email: credentials.email },
          session: { access_token: 'new-token' }
        },
        error: null,
      });
    }),

    signInWithPassword: vi.fn().mockImplementation((credentials) => {
      if (credentials.email === 'invalid@example.com') {
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' },
        });
      }
      return Promise.resolve({
        data: {
          user: { id: 'user-id', email: credentials.email },
          session: { access_token: 'auth-token' }
        },
        error: null,
      });
    }),

    signInWithOAuth: vi.fn().mockResolvedValue({
      data: { url: 'https://oauth-url.com' },
      error: null,
    }),

    signOut: vi.fn().mockResolvedValue({
      error: null,
    }),

    onAuthStateChange: vi.fn().mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    }),

    resetPassword: vi.fn().mockResolvedValue({
      data: {},
      error: null,
    }),

    updateUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    }),
  };
};

/**
 * Create mock Supabase functions client
 */
export const createMockFunctions = () => {
  return {
    invoke: vi.fn().mockImplementation((functionName: string, options?: Record<string, unknown>) => {
      // Mock different responses based on function name
      switch (functionName) {
        case 'get-homepage-feed':
          return Promise.resolve({
            data: {
              layout: ['featured', 'recent', 'suggestions'],
              featured: createMockReview(),
              recent: [createMockReview(), createMockReview()],
              suggestions: [],
              userProfile: createMockUserProfile(),
              notificationCount: 0,
            },
            error: null,
          });

        case 'get-community-page-data':
          return Promise.resolve({
            data: {
              posts: [createMockCommunityPost()],
              sidebarData: { rules: ['Be respectful'] },
              pagination: { page: 0, hasMore: false, total: 1 },
            },
            error: null,
          });

        case 'create-community-post':
          return Promise.resolve({
            data: { id: 123, ...options.body },
            error: null,
          });

        case 'network-error':
          return Promise.resolve({
            data: null,
            error: { message: 'Network error' },
          });

        default:
          return Promise.resolve({
            data: { success: true },
            error: null,
          });
      }
    }),
  };
};

/**
 * Create mock Supabase database client
 */
export const createMockDatabase = () => {
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    const builder = new MockQueryBuilder();
    
    // Set default mock data based on table
    switch (table) {
      case 'Practitioners':
        builder.mockResolvedValue([createMockUserProfile()]);
        break;
      case 'Reviews':
        builder.mockResolvedValue([createMockReview()]);
        break;
      case 'CommunityPosts':
        builder.mockResolvedValue([createMockCommunityPost()]);
        break;
      default:
        builder.mockResolvedValue([]);
    }
    
    return builder;
  });

  return {
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
};

/**
 * Create complete mock Supabase client
 */
export const createMockSupabaseClient = () => {
  const mockAuth = createMockAuth();
  const mockDatabase = createMockDatabase();
  const mockFunctions = createMockFunctions();

  return {
    auth: mockAuth,
    from: mockDatabase.from,
    rpc: mockDatabase.rpc,
    functions: mockFunctions,
    
    // Storage mock
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://test-url.com' },
        }),
      }),
    },

    // Realtime mock
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue(Promise.resolve('SUBSCRIBED')),
      unsubscribe: vi.fn().mockReturnValue(Promise.resolve('UNSUBSCRIBED')),
    }),
  };
};

/**
 * Create a mock Supabase client for testing
 */
export const mockSupabaseClient = () => {
  return createMockSupabaseClient();
};

/**
 * Create mock supabase functions for testing
 */
export const mockSupabaseFunctions = () => ({
  invokeFunction: vi.fn().mockResolvedValue({ success: true }),
  invokeFunctionGet: vi.fn().mockResolvedValue({ success: true }),
  invokeFunctionPost: vi.fn().mockResolvedValue({ success: true }),
});

/**
 * Reset all Supabase mocks
 */
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();
};

/**
 * Helper to setup common Supabase mock scenarios
 */
export const setupSupabaseScenario = {
  // User is authenticated
  authenticated: (client: ReturnType<typeof createMockSupabaseClient>) => {
    client.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token', user: { id: 'user-id' } } },
      error: null,
    });
  },

  // User is not authenticated  
  unauthenticated: (client: ReturnType<typeof createMockSupabaseClient>) => {
    client.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  },

  // Network error
  networkError: (client: ReturnType<typeof createMockSupabaseClient>) => {
    client.from('').select().mockRejectedValue(new Error('Network error'));
    client.functions.invoke.mockRejectedValue(new Error('Network error'));
  },

  // Database error
  databaseError: (client: ReturnType<typeof createMockSupabaseClient>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client.from as MockedFunction<any>).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    });
  },
};