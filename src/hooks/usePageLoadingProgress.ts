// ABOUTME: Hook for automatically tracking page content loading progress using TanStack Query states

import { useEffect } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useProgress } from '@/contexts/ProgressContext';

/**
 * Hook that automatically shows/hides the progress bar based on 
 * active TanStack Query requests for the current page
 */
export const usePageLoadingProgress = () => {
  const { showProgress, hideProgress, setProgress } = useProgress();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  
  const isLoading = isFetching > 0 || isMutating > 0;
  
  useEffect(() => {
    if (isLoading) {
      // Show indeterminate progress for data loading
      showProgress({ duration: 3000 });
    } else {
      // Hide progress when all queries complete
      hideProgress();
    }
  }, [isLoading, showProgress, hideProgress]);

  // Calculate progress based on number of active requests
  useEffect(() => {
    if (isLoading) {
      const totalRequests = isFetching + isMutating;
      const baseProgress = Math.min(30 + (totalRequests * 15), 85);
      setProgress(baseProgress);
    }
  }, [isFetching, isMutating, isLoading, setProgress]);

  return {
    isLoading,
    activeRequests: isFetching + isMutating,
  };
};