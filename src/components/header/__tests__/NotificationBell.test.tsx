// ABOUTME: Tests for NotificationBell component ensuring proper authentication-based visibility and functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { NotificationBell } from '../NotificationBell';
import { useAuthStore } from '@/store/auth';
import { useNotificationCount } from '../../../../packages/hooks/useNotifications';

// Mock the hooks
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../../packages/hooks/useNotifications', () => ({
  useNotificationCount: vi.fn(),
}));

vi.mock('../NotificationDropdown', () => ({
  NotificationDropdown: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="notification-dropdown">
        Notification Dropdown
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseNotificationCount = vi.mocked(useNotificationCount);

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    mockUseNotificationCount.mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    const { container } = render(<NotificationBell />, { wrapper });

    expect(container.firstChild).toBeNull();
  });

  it('should render bell icon when user is authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: { unread_count: 0, total_count: 0 },
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('should display notification badge when there are unread notifications', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: { unread_count: 5, total_count: 10 },
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByLabelText('Notifications (5 unread)')).toBeInTheDocument();
  });

  it('should display "99+" for notifications count over 99', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: { unread_count: 150, total_count: 200 },
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should not display badge when there are no unread notifications', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: { unread_count: 0, total_count: 5 },
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
  });

  it('should show loading indicator when data is loading', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: null,
      isLoading: true,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    // Should have loading indicator (small animated dot)
    const loadingIndicator = document.querySelector('.animate-pulse');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('should open dropdown when bell is clicked', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: { unread_count: 3, total_count: 5 },
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  it('should close dropdown when close button is clicked', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: { unread_count: 3, total_count: 5 },
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    // Open dropdown
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    // Close dropdown
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  it('should toggle dropdown on multiple clicks', () => {
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockUseNotificationCount.mockReturnValue({
      data: { unread_count: 1, total_count: 1 },
      isLoading: false,
    } as any);

    const wrapper = createWrapper();
    render(<NotificationBell />, { wrapper });

    const bellButton = screen.getByRole('button');

    // First click - open
    fireEvent.click(bellButton);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();

    // Second click - close
    fireEvent.click(bellButton);
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();

    // Third click - open again
    fireEvent.click(bellButton);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });
});