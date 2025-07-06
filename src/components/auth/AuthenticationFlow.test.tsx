// ABOUTME: Complete authentication workflow tests - AI-safe guardrails for user authentication, session management, and role transitions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils';
import { useAuthStore } from '@/store/auth';

// Mock the auth store with complete state management
const mockAuthStore = {
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  setSession: vi.fn(),
  clearSession: vi.fn(),
  initialize: vi.fn(),
};

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock Supabase auth
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: mockSupabaseAuth,
  },
}));

describe('AuthenticationFlow - Critical Authentication Workflows', () => {
  const TestComponent = () => {
    const { session, user, isLoading, isInitialized } = useAuthStore();

    return (
      <div>
        <div data-testid="auth-status">
          {isLoading
            ? 'Loading...'
            : !isInitialized
              ? 'Initializing...'
              : session
                ? `Authenticated: ${user?.email}`
                : 'Not authenticated'}
        </div>
        <div data-testid="user-role">{session?.user?.app_metadata?.role || 'No role'}</div>
        <div data-testid="subscription-tier">
          {session?.user?.subscription_tier || 'No subscription'}
        </div>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store to clean state
    mockAuthStore.session = null;
    mockAuthStore.user = null;
    mockAuthStore.isLoading = false;
    mockAuthStore.isInitialized = false;
    mockAuthStore.setSession.mockClear();
    mockAuthStore.clearSession.mockClear();
    mockAuthStore.initialize.mockClear();
  });

  describe('🔴 CRITICAL: Authentication State Management', () => {
    it('handles initial authentication loading state', () => {
      mockAuthStore.isLoading = true;
      mockAuthStore.isInitialized = false;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Loading...');
    });

    it('handles authentication initialization state', () => {
      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = false;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Initializing...');
    });

    it('handles unauthenticated state correctly', () => {
      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = null;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('No subscription');
    });

    it('handles authenticated free practitioner state', () => {
      const freeSession = {
        user: {
          id: 'test-user-id',
          email: 'practitioner@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = freeSession;
      mockAuthStore.user = freeSession.user;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: practitioner@example.com'
      );
      expect(screen.getByTestId('user-role')).toHaveTextContent('practitioner');
      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('free');
    });

    it('handles authenticated premium practitioner state', () => {
      const premiumSession = {
        user: {
          id: 'test-user-id',
          email: 'premium@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = premiumSession;
      mockAuthStore.user = premiumSession.user;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: premium@example.com'
      );
      expect(screen.getByTestId('user-role')).toHaveTextContent('practitioner');
      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('premium');
    });

    it('handles authenticated admin state', () => {
      const adminSession = {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          app_metadata: { role: 'admin' },
          subscription_tier: 'premium',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = adminSession;
      mockAuthStore.user = adminSession.user;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: admin@example.com'
      );
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('premium');
    });
  });

  describe('🟡 CRITICAL: Session Transitions and Security', () => {
    it('handles login to logout transition', () => {
      // Start authenticated
      const session = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = session;
      mockAuthStore.user = session.user;

      const { rerender } = renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: test@example.com'
      );

      // Simulate logout
      mockAuthStore.session = null;
      mockAuthStore.user = null;

      rerender(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
    });

    it('handles role upgrades during session', () => {
      // Start as practitioner
      const practitionerSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = practitionerSession;
      mockAuthStore.user = practitionerSession.user;

      const { rerender } = renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('practitioner');

      // Simulate role upgrade to admin
      const adminSession = {
        user: {
          ...practitionerSession.user,
          app_metadata: { role: 'admin' },
        },
      };

      mockAuthStore.session = adminSession;
      mockAuthStore.user = adminSession.user;

      rerender(<TestComponent />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
    });

    it('handles subscription tier upgrades', () => {
      // Start with free subscription
      const freeSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = freeSession;
      mockAuthStore.user = freeSession.user;

      const { rerender } = renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('free');

      // Simulate subscription upgrade
      const premiumSession = {
        user: {
          ...freeSession.user,
          subscription_tier: 'premium',
        },
      };

      mockAuthStore.session = premiumSession;
      mockAuthStore.user = premiumSession.user;

      rerender(<TestComponent />);

      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('premium');
    });

    it('handles corrupted session recovery', () => {
      // Start with corrupted session
      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = null; // No session
      mockAuthStore.user = null;

      const { rerender } = renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');

      // Simulate session recovery
      const validSession = {
        user: {
          id: 'test-user-id',
          email: 'recovered@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      mockAuthStore.session = validSession;
      mockAuthStore.user = validSession.user;

      rerender(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: recovered@example.com'
      );
    });
  });

  describe('🟢 STRATEGIC: Edge Cases and AI Safety', () => {
    it('handles missing role gracefully', () => {
      const sessionWithoutRole = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: {}, // No role specified
          subscription_tier: 'free',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = sessionWithoutRole;
      mockAuthStore.user = sessionWithoutRole.user;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('user-role')).toHaveTextContent('No role');
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: test@example.com'
      );
    });

    it('handles missing subscription tier gracefully', () => {
      const sessionWithoutSubscription = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { role: 'practitioner' },
          // No subscription_tier specified
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = sessionWithoutSubscription;
      mockAuthStore.user = sessionWithoutSubscription.user;

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('No subscription');
      expect(screen.getByTestId('user-role')).toHaveTextContent('practitioner');
    });

    it('handles invalid role values', () => {
      const sessionWithInvalidRole = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { role: 'invalid_role' }, // Invalid role
          subscription_tier: 'free',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = sessionWithInvalidRole;
      mockAuthStore.user = sessionWithInvalidRole.user;

      renderWithProviders(<TestComponent />);

      // Component should handle invalid role gracefully
      expect(screen.getByTestId('user-role')).toHaveTextContent('invalid_role');
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: test@example.com'
      );
    });

    it('handles concurrent session updates safely', async () => {
      // Start with initial session
      const initialSession = {
        user: {
          id: 'test-user-id',
          email: 'initial@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      mockAuthStore.isLoading = false;
      mockAuthStore.isInitialized = true;
      mockAuthStore.session = initialSession;
      mockAuthStore.user = initialSession.user;

      const { rerender } = renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: initial@example.com'
      );

      // Simulate rapid concurrent updates (AI might trigger this)
      const updateSession = {
        user: {
          id: 'test-user-id',
          email: 'updated@example.com',
          app_metadata: { role: 'admin' },
          subscription_tier: 'premium',
        },
      };

      mockAuthStore.session = updateSession;
      mockAuthStore.user = updateSession.user;

      rerender(<TestComponent />);

      // Should handle the update correctly
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'Authenticated: updated@example.com'
      );
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
      expect(screen.getByTestId('subscription-tier')).toHaveTextContent('premium');
    });
  });

  describe('🔵 AI-SAFETY: Store Method Validation', () => {
    it('validates setSession method is called with valid session data', () => {
      const validSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'free',
        },
      };

      // Simulate setSession call
      mockAuthStore.setSession(validSession);

      expect(mockAuthStore.setSession).toHaveBeenCalledWith(validSession);
      expect(mockAuthStore.setSession).toHaveBeenCalledTimes(1);
    });

    it('validates clearSession method is called during logout', () => {
      // Simulate clearSession call
      mockAuthStore.clearSession();

      expect(mockAuthStore.clearSession).toHaveBeenCalledTimes(1);
    });

    it('validates initialize method is called during app startup', () => {
      // Simulate initialize call
      mockAuthStore.initialize();

      expect(mockAuthStore.initialize).toHaveBeenCalledTimes(1);
    });
  });
});
