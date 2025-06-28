// ABOUTME: Tests for UserProfileBlock component ensuring proper user data display and loading states

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { createMockUserProfile } from '../../test-utils/test-data-factories';

// Mock the hook module using the @packages alias
vi.mock('@packages/hooks/useUserProfileQuery', () => ({
  useUserProfileQuery: vi.fn(),
}));

import { UserProfileBlock } from './UserProfileBlock';
import { useUserProfileQuery } from '@packages/hooks/useUserProfileQuery';

describe('UserProfileBlock Component', () => {
  const mockUseUserProfileQuery = vi.mocked(useUserProfileQuery);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton when data is loading', () => {
    mockUseUserProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('flex', 'items-center', 'gap-3');
  });

  it('should render user profile when data is loaded', async () => {
    const mockProfile = createMockUserProfile({
      full_name: 'Dr. João Silva',
      role: 'practitioner',
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    await waitFor(() => {
      expect(screen.getByText('Dr. João Silva')).toBeInTheDocument();
    });

    // Should show avatar
    const avatar = screen.getByTestId('user-avatar');
    expect(avatar).toBeInTheDocument();
  });

  it('should render collapsed version correctly', () => {
    const mockProfile = createMockUserProfile({
      full_name: 'Dr. João Silva',
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={true} />);

    // Should show avatar but not name in collapsed mode
    const avatar = screen.getByTestId('user-avatar');
    expect(avatar).toBeInTheDocument();
    expect(screen.queryByText('Dr. João Silva')).not.toBeInTheDocument();
  });

  it('should show user initials when avatar is not available', () => {
    const mockProfile = createMockUserProfile({
      full_name: 'João Silva Santos',
      avatar_url: null,
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    // Should show initials JSS
    expect(screen.getByText('JSS')).toBeInTheDocument();
  });

  it('should handle single name correctly for initials', () => {
    const mockProfile = createMockUserProfile({
      full_name: 'João',
      avatar_url: null,
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should show error state gracefully', () => {
    mockUseUserProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load profile'),
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    expect(screen.getByText('Error loading profile')).toBeInTheDocument();
  });

  it('should show default state when no profile data', () => {
    mockUseUserProfileQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    expect(screen.getByText('Error loading profile')).toBeInTheDocument();
  });

  it('should display role when user is not practitioner', () => {
    const mockProfile = createMockUserProfile({
      full_name: 'Dr. Editor User',
      role: 'editor',
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    expect(screen.getByText('Dr. Editor User')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();
  });

  it('should not display role for practitioner', () => {
    const mockProfile = createMockUserProfile({
      full_name: 'Dr. Regular User',
      role: 'practitioner',
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    expect(screen.getByText('Dr. Regular User')).toBeInTheDocument();
    expect(screen.queryByText('practitioner')).not.toBeInTheDocument();
  });

  it('should handle empty name gracefully', () => {
    const mockProfile = createMockUserProfile({
      full_name: '',
      avatar_url: null,
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    expect(screen.getByText('Unnamed User')).toBeInTheDocument();
    expect(screen.getByText('??')).toBeInTheDocument(); // Default initials
  });

  it('should handle null name gracefully', () => {
    const mockProfile = createMockUserProfile({
      full_name: null,
      avatar_url: null,
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    expect(screen.getByText('Unnamed User')).toBeInTheDocument();
    expect(screen.getByText('??')).toBeInTheDocument();
  });

  it('should truncate very long names', () => {
    const longName = 'Dr. João Silva Santos Oliveira Pereira da Costa';
    const mockProfile = createMockUserProfile({
      full_name: longName,
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    const nameElement = screen.getByText(longName);
    expect(nameElement).toHaveClass('truncate');
  });

  it('should be responsive', () => {
    const mockProfile = createMockUserProfile();

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    const userBlock = screen.getByTestId('profile-data');
    expect(userBlock).toHaveClass('flex', 'items-center', 'gap-3');
    // Component adapts responsively through isCollapsed prop
    expect(userBlock).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    const mockProfile = createMockUserProfile({
      full_name: 'Dr. João Silva',
    });

    mockUseUserProfileQuery.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    // Avatar should have proper structure
    const avatar = screen.getByTestId('user-avatar');
    expect(avatar).toBeInTheDocument();

    // Check for user name display
    const userName = screen.getByTestId('user-name');
    expect(userName).toHaveTextContent('Dr. João Silva');
  });

  it('should show skeleton with proper dimensions', () => {
    mockUseUserProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={false} />);

    const loadingSkeleton = screen.getByTestId('loading-skeleton');
    expect(loadingSkeleton).toBeInTheDocument();
    expect(loadingSkeleton).toHaveClass('flex', 'items-center', 'gap-3');
  });

  it('should show collapsed skeleton correctly', () => {
    mockUseUserProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderWithProviders(<UserProfileBlock isCollapsed={true} />);

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toBeInTheDocument();

    // Should not show name skeleton in collapsed mode
    const nameSkeletons = screen.queryAllByTestId('loading-skeleton');
    expect(nameSkeletons).toHaveLength(1); // Only avatar skeleton
  });
});
