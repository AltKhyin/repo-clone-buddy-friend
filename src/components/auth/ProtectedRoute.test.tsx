// ABOUTME: Critical route protection tests - strategic testing for authentication and authorization boundaries
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils';
import ProtectedRoute from './ProtectedRoute';

// Mock auth store
const mockAuthStore = {
  session: null,
  isLoading: false,
};

vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }: any) => (
      <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)} />
    ),
    useLocation: () => ({ pathname: '/protected' }),
  };
});

describe('ProtectedRoute - Critical Security Boundaries', () => {
  const ProtectedContent = () => <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth store to default state
    mockAuthStore.session = null;
    mockAuthStore.isLoading = false;
  });

  it('shows loading state while authentication is being checked', () => {
    mockAuthStore.isLoading = true;

    renderWithProviders(
      <ProtectedRoute>
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Should show loading indicator, not protected content
    expect(screen.getByText(/carregando\.\.\./i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    mockAuthStore.session = null;
    mockAuthStore.isLoading = false;

    renderWithProviders(
      <ProtectedRoute>
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Should redirect to login
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows access for authenticated users with sufficient role', () => {
    mockAuthStore.session = {
      user: {
        app_metadata: {
          role: 'practitioner',
        },
      },
    };
    mockAuthStore.isLoading = false;

    renderWithProviders(
      <ProtectedRoute requiredRole="practitioner">
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Should render protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('redirects users with insufficient role to unauthorized page', () => {
    mockAuthStore.session = {
      user: {
        app_metadata: {
          role: 'practitioner',
        },
      },
    };
    mockAuthStore.isLoading = false;

    renderWithProviders(
      <ProtectedRoute requiredRole="admin">
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Should redirect to unauthorized
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/unauthorized');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('properly handles role hierarchy - admin can access moderator content', () => {
    mockAuthStore.session = {
      user: {
        app_metadata: {
          role: 'admin',
        },
      },
    };
    mockAuthStore.isLoading = false;

    renderWithProviders(
      <ProtectedRoute requiredRole="moderator">
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Admin should access moderator content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('properly handles role hierarchy - editor has moderator-level access', () => {
    mockAuthStore.session = {
      user: {
        app_metadata: {
          role: 'editor',
        },
      },
    };
    mockAuthStore.isLoading = false;

    renderWithProviders(
      <ProtectedRoute requiredRole="moderator">
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Editor should access moderator content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('defaults to practitioner role when no role is specified', () => {
    mockAuthStore.session = {
      user: {
        app_metadata: {}, // No role specified
      },
    };
    mockAuthStore.isLoading = false;

    renderWithProviders(
      <ProtectedRoute requiredRole="admin">
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Should redirect due to insufficient permissions
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/unauthorized');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
