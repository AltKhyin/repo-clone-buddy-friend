// ABOUTME: Global progress context for managing TopProgressBar state across the application

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProgressState {
  isVisible: boolean;
  progress?: number;
  duration?: number;
}

interface ProgressContextType {
  // State
  progressState: ProgressState;
  
  // Actions
  showProgress: (options?: { duration?: number; progress?: number }) => void;
  setProgress: (percent: number) => void;
  hideProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [progressState, setProgressState] = useState<ProgressState>({
    isVisible: false,
    progress: undefined,
    duration: 2000,
  });

  const showProgress = useCallback((options?: { duration?: number; progress?: number }) => {
    setProgressState({
      isVisible: true,
      progress: options?.progress,
      duration: options?.duration || 2000,
    });
  }, []);

  const setProgress = useCallback((percent: number) => {
    setProgressState(prev => {
      // Prevent backwards progression - only allow progress to increase
      const newProgress = Math.min(100, Math.max(0, percent));
      const currentProgress = prev.progress || 0;
      
      return {
        ...prev,
        progress: Math.max(currentProgress, newProgress),
      };
    });
  }, []);

  const hideProgress = useCallback(() => {
    setProgressState(prev => ({
      ...prev,
      progress: 100, // Complete the animation
    }));
    
    // Auto-hide after completion animation
    setTimeout(() => {
      setProgressState({
        isVisible: false,
        progress: undefined,
        duration: 2000,
      });
    }, 300);
  }, []);

  // Auto-cleanup: hide stuck progress after 10 seconds
  React.useEffect(() => {
    if (progressState.isVisible) {
      const cleanup = setTimeout(() => {
        hideProgress();
      }, 10000);
      
      return () => clearTimeout(cleanup);
    }
  }, [progressState.isVisible, hideProgress]);

  const contextValue = {
    progressState,
    showProgress,
    setProgress,
    hideProgress,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};