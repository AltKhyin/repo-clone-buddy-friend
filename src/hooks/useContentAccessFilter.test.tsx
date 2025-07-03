// ABOUTME: Tests for useContentAccessFilter hook ensuring proper content filtering based on user access level

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentAccessFilter } from './useContentAccessFilter';
import { createTestQueryClient } from '../test-utils/test-query-client';

// Mock dependencies
vi.mock('../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../lib/accessControl', () => ({
  getUserAccessLevel: vi.fn(),
  hasAccessLevel: vi.fn(),
  ACCESS_LEVELS: {
    public: 0,
    free: 1,
    premium: 2,
    editor_admin: 3,
  },
}));

describe('useContentAccessFilter', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockContent = [
    { id: 1, title: 'Public Content', access_level: 'public', content: 'Everyone can see this' },
    { id: 2, title: 'Free Content', access_level: 'free', content: 'Free users can see this' },
    { id: 3, title: 'Premium Content', access_level: 'premium', content: 'Premium users only' },
    { id: 4, title: 'Admin Content', access_level: 'editor_admin', content: 'Admin content' },
    { id: 5, title: 'Public Post', access_level: 'public', content: 'Another public item' },
  ];

  describe('content filtering', () => {
    it('should filter content based on public user access level', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(() => useContentAccessFilter(mockContent), { wrapper });

      expect(result.current.filteredContent).toHaveLength(2);
      expect(result.current.filteredContent[0].title).toBe('Public Content');
      expect(result.current.filteredContent[1].title).toBe('Public Post');
      expect(result.current.userAccessLevel).toBe('public');
      expect(result.current.totalFiltered).toBe(3); // 3 items filtered out
    });

    it('should filter content based on free user access level', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(() => useContentAccessFilter(mockContent), { wrapper });

      expect(result.current.filteredContent).toHaveLength(3);
      expect(result.current.filteredContent.map(c => c.title)).toEqual([
        'Public Content',
        'Free Content',
        'Public Post',
      ]);
      expect(result.current.totalFiltered).toBe(2); // 2 items filtered out
    });

    it('should filter content based on premium user access level', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

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
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(() => useContentAccessFilter(mockContent), { wrapper });

      expect(result.current.filteredContent).toHaveLength(4);
      expect(result.current.filteredContent.map(c => c.title)).toEqual([
        'Public Content',
        'Free Content',
        'Premium Content',
        'Public Post',
      ]);
      expect(result.current.totalFiltered).toBe(1); // 1 item filtered out
    });

    it('should show all content for admin/editor users', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'admin' } },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('editor_admin');
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(() => useContentAccessFilter(mockContent), { wrapper });

      expect(result.current.filteredContent).toHaveLength(5);
      expect(result.current.totalFiltered).toBe(0); // No items filtered out
    });
  });

  describe('custom filtering options', () => {
    it('should respect custom access level field name', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

      const customContent = [
        { id: 1, title: 'Test', required_access: 'premium', content: 'Test content' },
        { id: 2, title: 'Test 2', required_access: 'free', content: 'Test content 2' },
      ];

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(
        () => useContentAccessFilter(customContent, { accessLevelField: 'required_access' }),
        { wrapper }
      );

      expect(result.current.filteredContent).toHaveLength(1);
      expect(result.current.filteredContent[0].title).toBe('Test 2');
    });

    it('should return empty array when content is null or undefined', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');

      const { result } = renderHook(() => useContentAccessFilter(null), { wrapper });

      expect(result.current.filteredContent).toEqual([]);
      expect(result.current.totalFiltered).toBe(0);
    });

    it('should handle content without access level gracefully', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

      const contentWithoutAccessLevel = [
        { id: 1, title: 'No Access Level', content: 'Test' },
        { id: 2, title: 'With Access Level', access_level: 'free', content: 'Test 2' },
      ];

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('public');
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(
        () => useContentAccessFilter(contentWithoutAccessLevel, { defaultAccessLevel: 'public' }),
        { wrapper }
      );

      expect(result.current.filteredContent).toHaveLength(1);
      expect(result.current.filteredContent[0].title).toBe('No Access Level');
    });
  });

  describe('statistics and metadata', () => {
    it('should provide statistics about filtered content', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

      vi.mocked(mockUseAuthStore.useAuthStore).mockReturnValue({
        user: { id: 'user123', app_metadata: { role: 'practitioner' }, subscription_tier: 'free' },
        session: { access_token: 'token123' },
        isLoading: false,
        setSession: vi.fn(),
        initialize: vi.fn(),
      });

      vi.mocked(mockAccessControl.getUserAccessLevel).mockReturnValue('free');
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(() => useContentAccessFilter(mockContent), { wrapper });

      expect(result.current.statistics).toEqual({
        total: 5,
        accessible: 3,
        filtered: 2,
        byAccessLevel: {
          public: 2,
          free: 1,
          premium: 1,
          editor_admin: 1,
        },
      });
    });

    it('should indicate if user can access premium content', async () => {
      const mockUseAuthStore = await import('../store/auth');
      const mockAccessControl = await import('../lib/accessControl');

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
      vi.mocked(mockAccessControl.hasAccessLevel).mockImplementation((userLevel, requiredLevel) => {
        const levels = { public: 0, free: 1, premium: 2, editor_admin: 3 };
        return (
          levels[userLevel as keyof typeof levels] >= levels[requiredLevel as keyof typeof levels]
        );
      });

      const { result } = renderHook(() => useContentAccessFilter(mockContent), { wrapper });

      expect(result.current.canAccessPremium).toBe(true);
      expect(result.current.canAccessEditorAdmin).toBe(false);
    });
  });
});
