// ABOUTME: TDD tests for SecureAdminWrapper ensuring proper security validation, authentication checks, and authorized access control

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SecureAdminWrapper, withAdminSecurity, useAdminPermission } from '../SecureAdminWrapper';
import { useAdminAuth, logSecurityEvent } from '../../../../utils/adminSecurity';

// Mock dependencies
vi.mock('../../../../utils/adminSecurity', () => ({
  useAdminAuth: vi.fn(),
  isAdminUser: vi.fn(),
  logSecurityEvent: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('🔴 TDD: SecureAdminWrapper Security Validation', () => {
  const mockUser = {
    id: '123',
    email: 'admin@test.com',
    app_metadata: {
      role: 'admin',
      permissions: ['manage_categories', 'manage_announcements'],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 TDD: Authentication States', () => {
    it('should show loading state during security check', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin" data-testid="admin-wrapper">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      expect(screen.getByText('Validando permissões...')).toBeInTheDocument();
    });

    it('should show access denied for unauthenticated users', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Você precisa estar logado para acessar esta área.')
      ).toBeInTheDocument();
      expect(screen.getByText('Fazer Login')).toBeInTheDocument();
      expect(screen.getByText('Voltar ao Início')).toBeInTheDocument();
    });

    it('should show access denied for authenticated non-admin users', async () => {
      const nonAdminUser = { ...mockUser, app_metadata: { role: 'practitioner' } };

      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: false,
        user: nonAdminUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      expect(screen.getByText('Permissões de administrador são necessárias.')).toBeInTheDocument();
      expect(screen.queryByText('Fazer Login')).not.toBeInTheDocument();
      expect(screen.getByText('Voltar ao Início')).toBeInTheDocument();
    });

    it('should show access denied for insufficient permissions', async () => {
      const limitedUser = {
        ...mockUser,
        app_metadata: { role: 'admin', permissions: ['view_analytics'] },
      };

      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: limitedUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper
            title="Test Admin"
            requiredPermissions={['manage_categories', 'manage_announcements']}
          >
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Você não possui as permissões específicas necessárias para esta função.')
      ).toBeInTheDocument();
    });

    it('should render protected content for authorized admin users', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Admin')).toBeInTheDocument();
      expect(screen.getByText('Seguro')).toBeInTheDocument();
    });

    it('should render protected content with sufficient permissions', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin" requiredPermissions={['manage_categories']}>
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('🔴 TDD: Security Status Display', () => {
    it('should show security status when enabled', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin" showSecurityStatus={true}>
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Acesso administrativo ativo')).toBeInTheDocument();
      });

      expect(screen.getByText('Usuário: admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('Função: admin')).toBeInTheDocument();
    });

    it('should not show security status when disabled', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin" showSecurityStatus={false}>
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(screen.queryByText('Acesso administrativo ativo')).not.toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Page Header and Footer', () => {
    it('should render page header with title and description', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin Page" description="This is a test admin page">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Admin Page')).toBeInTheDocument();
      });

      expect(screen.getByText('This is a test admin page')).toBeInTheDocument();
    });

    it('should render security footer', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Área protegida por controle de acesso administrativo')
        ).toBeInTheDocument();
      });
    });
  });

  describe('🔴 TDD: Security Logging', () => {
    it('should log security events on access attempts', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin" requiredPermissions={['manage_categories']}>
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(logSecurityEvent).toHaveBeenCalledWith(
          'Admin access attempt',
          expect.objectContaining({
            component: 'Test Admin',
            requiredPermissions: ['manage_categories'],
            userAuthenticated: true,
            userAdmin: true,
            userAgent: expect.any(String),
            timestamp: expect.any(String),
          })
        );
      });
    });

    it('should log access granted events', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(logSecurityEvent).toHaveBeenCalledWith(
          'Admin access granted',
          expect.objectContaining({
            component: 'Test Admin',
            userId: '123',
            userEmail: 'admin@test.com',
          })
        );
      });
    });

    it('should log access denied events', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      });

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(logSecurityEvent).toHaveBeenCalledWith(
          'Admin access denied - not authenticated',
          expect.objectContaining({
            component: 'Test Admin',
            redirectTo: '/login',
          })
        );
      });
    });
  });

  describe('🔴 TDD: Higher-Order Component', () => {
    it('should work as HOC with withAdminSecurity', async () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      const SecuredComponent = withAdminSecurity(TestComponent, {
        title: 'HOC Test',
        description: 'HOC Test Description',
        requiredPermissions: ['manage_categories'],
      });

      render(
        <TestWrapper>
          <SecuredComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('HOC Test')).toBeInTheDocument();
      });

      expect(screen.getByText('HOC Test Description')).toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Permission Hook', () => {
    it('should validate permissions with useAdminPermission hook', () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      let hookResult: any;
      const TestHookComponent = () => {
        hookResult = useAdminPermission(['manage_categories']);
        return null;
      };

      render(<TestHookComponent />);

      expect(hookResult.hasPermission).toBe(true);
      expect(hookResult.isAuthenticated).toBe(true);
      expect(hookResult.isAdmin).toBe(true);
      expect(hookResult.user).toEqual(mockUser);
    });

    it('should deny permission for insufficient permissions', () => {
      const limitedUser = {
        ...mockUser,
        app_metadata: { role: 'admin', permissions: ['view_analytics'] },
      };

      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: limitedUser,
      });

      let hookResult: any;
      const TestHookComponent = () => {
        hookResult = useAdminPermission(['manage_categories']);
        return null;
      };

      render(<TestHookComponent />);

      expect(hookResult.hasPermission).toBe(false);
    });

    it('should allow access when no specific permissions required', () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAuthenticated: true,
        isAdmin: true,
        user: mockUser,
      });

      let hookResult: any;
      const TestHookComponent = () => {
        hookResult = useAdminPermission([]);
        return null;
      };

      render(<TestHookComponent />);

      expect(hookResult.hasPermission).toBe(true);
    });
  });

  describe('🔴 TDD: Error Handling', () => {
    it('should handle errors during security check gracefully', async () => {
      // Mock an error in useAdminAuth
      vi.mocked(useAdminAuth).mockImplementation(() => {
        throw new Error('Security check failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <SecureAdminWrapper title="Test Admin">
            <TestComponent />
          </SecureAdminWrapper>
        </TestWrapper>
      );

      // Should gracefully handle the error and show access denied
      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
