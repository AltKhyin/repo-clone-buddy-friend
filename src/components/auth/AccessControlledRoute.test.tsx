// ABOUTME: Critical access control tests - strategic testing for 4-tier access control system
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils';
import { AccessControlledRoute } from './AccessControlledRoute';

// Mock the page access control hook
const mockAccessControl = {
  isLoading: false,
  hasAccess: true,
  redirectUrl: null,
};

vi.mock('../../../packages/hooks/usePageAccessControl', () => ({
  usePageAccessControl: vi.fn(() => mockAccessControl),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/protected' }),
  };
});

describe('AccessControlledRoute - Critical Access Control System', () => {
  const ProtectedContent = () => <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset access control to default state
    mockAccessControl.isLoading = false;
    mockAccessControl.hasAccess = true;
    mockAccessControl.redirectUrl = null;
  });

  it('shows loading state while checking access permissions', () => {
    mockAccessControl.isLoading = true;
    mockAccessControl.hasAccess = false;

    renderWithProviders(
      <AccessControlledRoute>
        <ProtectedContent />
      </AccessControlledRoute>
    );

    // Should show loading indicator, not protected content
    expect(screen.getByText(/verificando acesso\.\.\./i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content when access is granted', () => {
    mockAccessControl.isLoading = false;
    mockAccessControl.hasAccess = true;

    renderWithProviders(
      <AccessControlledRoute>
        <ProtectedContent />
      </AccessControlledRoute>
    );

    // Should render protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText(/verificando acesso/i)).not.toBeInTheDocument();
  });

  it('navigates to login when access is denied and no redirect URL is specified', () => {
    mockAccessControl.isLoading = false;
    mockAccessControl.hasAccess = false;
    mockAccessControl.redirectUrl = null;

    renderWithProviders(
      <AccessControlledRoute>
        <ProtectedContent />
      </AccessControlledRoute>
    );

    // Should navigate to default login page
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('navigates to custom redirect URL when access is denied', () => {
    mockAccessControl.isLoading = false;
    mockAccessControl.hasAccess = false;
    mockAccessControl.redirectUrl = '/upgrade';

    renderWithProviders(
      <AccessControlledRoute>
        <ProtectedContent />
      </AccessControlledRoute>
    );

    // Should navigate to custom redirect URL
    expect(mockNavigate).toHaveBeenCalledWith('/upgrade');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('uses custom loading component when provided', () => {
    mockAccessControl.isLoading = true;

    const CustomLoader = () => <div>Custom Loading...</div>;

    renderWithProviders(
      <AccessControlledRoute loadingComponent={<CustomLoader />}>
        <ProtectedContent />
      </AccessControlledRoute>
    );

    // Should show custom loading component
    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    expect(screen.queryByText(/verificando acesso/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('handles access control transitions properly', () => {
    // Start with loading state
    mockAccessControl.isLoading = true;
    mockAccessControl.hasAccess = false;

    const { rerender } = renderWithProviders(
      <AccessControlledRoute>
        <ProtectedContent />
      </AccessControlledRoute>
    );

    expect(screen.getByText(/verificando acesso/i)).toBeInTheDocument();

    // Transition to access granted
    mockAccessControl.isLoading = false;
    mockAccessControl.hasAccess = true;

    rerender(
      <AccessControlledRoute>
        <ProtectedContent />
      </AccessControlledRoute>
    );

    // Should now show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText(/verificando acesso/i)).not.toBeInTheDocument();
  });
});
