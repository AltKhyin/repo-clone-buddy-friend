// ABOUTME: Hook for automatically tracking page content loading progress using TanStack Query states

import { useEffect, useRef } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useProgress } from '@/contexts/ProgressContext';

/**
 * Hook that automatically shows/hides the progress bar based on 
 * active TanStack Query requests for the current page
 */
export const usePageLoadingProgress = () => {
  const { setProgress, hideProgress } = useProgress();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const prevLoadingRef = useRef(false);
  
  const isLoading = isFetching > 0 || isMutating > 0;
  
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;
    
    if (isLoading) {
      // Content loading phase: 50% - 95%
      // Start from 50% to build on access verification (which ends at ~30%)
      const totalRequests = isFetching + isMutating;
      let contentProgress;
      
      if (totalRequests === 1) {
        contentProgress = 75; // Single query loading
      } else if (totalRequests === 2) {
        contentProgress = 85; // Multiple queries
      } else {
        contentProgress = Math.min(50 + (totalRequests * 10), 95);
      }
      
      setProgress(contentProgress);
    } else if (wasLoading && !isLoading) {
      // All content loaded - complete to 100% and hide
      setProgress(100);
      setTimeout(() => hideProgress(), 200);
    }
  }, [isLoading, isFetching, isMutating, setProgress, hideProgress]);

  return {
    isLoading,
    activeRequests: isFetching + isMutating,
  };
};