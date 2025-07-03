// ABOUTME: Hook for filtering content based on user access level in the 4-tier system

import { useMemo } from 'react';
import { useAuthStore } from '../store/auth';
import {
  getUserAccessLevel,
  hasAccessLevel,
  ACCESS_LEVELS,
  type AccessLevel,
} from '../lib/accessControl';

interface ContentWithAccessLevel {
  [key: string]: any;
  access_level?: AccessLevel;
}

interface ContentFilterOptions {
  accessLevelField?: string;
  defaultAccessLevel?: AccessLevel;
}

interface ContentFilterStatistics {
  total: number;
  accessible: number;
  filtered: number;
  byAccessLevel: Record<AccessLevel, number>;
}

interface ContentFilterResult<T extends ContentWithAccessLevel> {
  filteredContent: T[];
  userAccessLevel: AccessLevel;
  totalFiltered: number;
  statistics: ContentFilterStatistics;
  canAccessPremium: boolean;
  canAccessEditorAdmin: boolean;
}

/**
 * Hook to filter content based on user's access level
 * @param content Array of content items with access level information
 * @param options Configuration options for filtering
 * @returns Filtered content and access information
 */
export function useContentAccessFilter<T extends ContentWithAccessLevel>(
  content: T[] | null | undefined,
  options: ContentFilterOptions = {}
): ContentFilterResult<T> {
  const { accessLevelField = 'access_level', defaultAccessLevel = 'public' } = options;

  const { user } = useAuthStore();

  return useMemo(() => {
    // Handle empty or null content
    if (!content || content.length === 0) {
      return {
        filteredContent: [],
        userAccessLevel: 'public' as AccessLevel,
        totalFiltered: 0,
        statistics: {
          total: 0,
          accessible: 0,
          filtered: 0,
          byAccessLevel: {
            public: 0,
            free: 0,
            premium: 0,
            editor_admin: 0,
          },
        },
        canAccessPremium: false,
        canAccessEditorAdmin: false,
      };
    }

    // Get user's access level
    const userAccessLevel = getUserAccessLevel(user);

    // Calculate statistics
    const statistics: ContentFilterStatistics = {
      total: content.length,
      accessible: 0,
      filtered: 0,
      byAccessLevel: {
        public: 0,
        free: 0,
        premium: 0,
        editor_admin: 0,
      },
    };

    // Filter content based on access level
    const filteredContent = content.filter(item => {
      const itemAccessLevel = item[accessLevelField] || defaultAccessLevel;

      // Count by access level
      if (itemAccessLevel in statistics.byAccessLevel) {
        statistics.byAccessLevel[itemAccessLevel as AccessLevel]++;
      }

      // Check if user has access to this content
      const canAccess = hasAccessLevel(userAccessLevel, itemAccessLevel);

      if (canAccess) {
        statistics.accessible++;
      } else {
        statistics.filtered++;
      }

      return canAccess;
    });

    // Calculate user capabilities
    const canAccessPremium = hasAccessLevel(userAccessLevel, 'premium');
    const canAccessEditorAdmin = hasAccessLevel(userAccessLevel, 'editor_admin');

    return {
      filteredContent,
      userAccessLevel,
      totalFiltered: statistics.filtered,
      statistics,
      canAccessPremium,
      canAccessEditorAdmin,
    };
  }, [content, accessLevelField, defaultAccessLevel, user]);
}
