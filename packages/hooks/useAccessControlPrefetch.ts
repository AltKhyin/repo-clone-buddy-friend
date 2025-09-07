// ABOUTME: Hook for preloading access control data for main routes to eliminate verification delays

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth';
import { invokeFunctionGet } from '../../src/lib/supabase-functions';
import type { PageAccessControl } from './usePageAccessQuery';

/**
 * Main application routes that should have access control prefetched
 * to eliminate verification delays during navigation
 */
const MAIN_ROUTES = [
  '/', // homepage
  '/comunidade', // community
  '/acervo', // collection
  '/perfil', // profile
] as const;

/**
 * Hook to preload access control data for main routes on app initialization
 * This eliminates the "verificando acesso" delays during navigation
 */
export const useAccessControlPrefetch = () => {
  const queryClient = useQueryClient();
  const { user, session, isLoading } = useAuthStore();
  const prefetchedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    // Only prefetch once user is authenticated and data is ready
    if (isLoading || !user || !session) return;

    // Prevent multiple prefetches for the same session
    const currentSessionId = session.access_token;
    if (prefetchedSessionRef.current === currentSessionId) {
      console.log('🔄 Access control already prefetched for this session');
      return;
    }

    console.log('🚀 Starting access control prefetch for new session');
    prefetchedSessionRef.current = currentSessionId;

    // Prefetch access control data for all main routes
    MAIN_ROUTES.forEach(async (pagePath) => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['page-access', pagePath],
          queryFn: async () => {
            try {
              const result = await invokeFunctionGet<PageAccessControl>('page-access-check', {
                page_path: pagePath,
              });
              return result;
            } catch (error) {
              // Return null for non-existent pages instead of throwing
              if (error instanceof Error && error.message.includes('not found')) {
                return null;
              }
              throw error;
            }
          },
          staleTime: 10 * 60 * 1000, // 10 minutes (increased)
          gcTime: 15 * 60 * 1000, // 15 minutes (increased)
        });

        console.log(`✅ Prefetched access control for: ${pagePath}`);
      } catch (error) {
        console.warn(`⚠️ Failed to prefetch access control for ${pagePath}:`, error);
        // Don't block app startup if prefetch fails
      }
    });
  }, [queryClient, user, session, isLoading]);

  return {
    /** List of routes being prefetched */
    prefetchedRoutes: MAIN_ROUTES,
  };
};