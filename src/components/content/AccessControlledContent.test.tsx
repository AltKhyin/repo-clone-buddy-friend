// ABOUTME: Tests for AccessControlledContent component ensuring proper content display with access control

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessControlledContent } from './AccessControlledContent';
import { createTestQueryClient } from '../../test-utils/test-query-client';

// Mock dependencies
vi.mock('../../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../lib/accessControl', () => ({
  getUserAccessLevel: vi.fn(),
  hasAccessLevel: vi.fn(),
}));

describe('AccessControlledContent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const TestContent = () => <div>Premium Content Here</div>;

  describe('content access control', () => {
    it('should render content when user has sufficient access', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: {
          id: 'user123',
          app_metadata: { role: 'practitioner' },
          subscription_tier: 'premium',
        },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('premium');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(true);

      render(
        <AccessControlledContent requiredLevel="premium">
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      expect(screen.getByText('Premium Content Here')).toBeInTheDocument();
      expect(screen.queryByText('Conteúdo Premium')).not.toBeInTheDocument();
    });

    it('should show upgrade prompt when user lacks access', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      render(
        <AccessControlledContent requiredLevel="premium">
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      expect(screen.getByText('Conteúdo Premium')).toBeInTheDocument();
      expect(screen.getByText('Upgrade para Premium')).toBeInTheDocument();
      expect(screen.queryByText('Premium Content Here')).not.toBeInTheDocument();
    });

    it('should show login prompt for anonymous users', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      render(
        <AccessControlledContent requiredLevel="free">
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      expect(screen.getByText('Conteúdo Exclusivo')).toBeInTheDocument();
      expect(screen.getByText('Fazer Login')).toBeInTheDocument();
      expect(screen.queryByText('Premium Content Here')).not.toBeInTheDocument();
    });

    it('should show custom access denied message', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      const customDeniedComponent = (
        <div>
          <h3>Custom Access Denied</h3>
          <p>You need special permissions to view this content.</p>
        </div>
      );

      render(
        <AccessControlledContent
          requiredLevel="editor_admin"
          accessDeniedComponent={customDeniedComponent}
        >
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      expect(screen.getByText('Custom Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText('You need special permissions to view this content.')
      ).toBeInTheDocument();
      expect(screen.queryByText('Premium Content Here')).not.toBeInTheDocument();
    });
  });

  describe('upgrade prompts', () => {
    it('should render premium upgrade prompt with correct styling', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      render(
        <AccessControlledContent requiredLevel="premium">
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      const upgradeButton = screen.getByText('Upgrade para Premium');
      expect(upgradeButton).toHaveClass('bg-gradient-to-r', 'from-purple-600', 'to-blue-600');

      const lockIcon = screen.getByTestId('lock-icon');
      expect(lockIcon).toBeInTheDocument();
    });

    it('should handle upgrade button click', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      const mockOnUpgrade = vi.fn();

      render(
        <AccessControlledContent requiredLevel="premium" onUpgradeClick={mockOnUpgrade}>
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      const upgradeButton = screen.getByText('Upgrade para Premium');
      fireEvent.click(upgradeButton);

      expect(mockOnUpgrade).toHaveBeenCalledWith('premium');
    });

    it('should show content preview when enabled', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      render(
        <AccessControlledContent requiredLevel="premium" showPreview={true} previewHeight="100px">
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      const previewContainer = screen.getByTestId('content-preview');
      expect(previewContainer).toBeInTheDocument();
      expect(previewContainer).toHaveStyle('height: 100px');
      expect(previewContainer).toHaveClass('overflow-hidden');
    });
  });

  describe('loading states', () => {
    it('should show loading state while auth is loading', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      render(
        <AccessControlledContent requiredLevel="premium">
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      expect(screen.getByTestId('access-loading')).toBeInTheDocument();
      expect(screen.queryByText('Premium Content Here')).not.toBeInTheDocument();
    });

    it('should use custom loading component when provided', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      const CustomLoading = () => <div>Custom loading content access...</div>;

      render(
        <AccessControlledContent requiredLevel="premium" loadingComponent={<CustomLoading />}>
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      expect(screen.getByText('Custom loading content access...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes for access denied state', async () => {
      const mockUseAuthStore = await import('../../store/auth');
      const mockAccessControl = await import('../../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockReturnValue(false);

      render(
        <AccessControlledContent requiredLevel="premium">
          <TestContent />
        </AccessControlledContent>,
        { wrapper }
      );

      const accessDeniedContainer = screen.getByRole('region', { name: /acesso negado/i });
      expect(accessDeniedContainer).toBeInTheDocument();
      expect(accessDeniedContainer).toHaveAttribute('aria-live', 'polite');
    });
  });
});
