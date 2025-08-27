
// ABOUTME: Main application component with hierarchical error boundary protection - Root tier (Tier 1)

import React from 'react';
import { AppRouter } from './router/AppRouter';
import { AppProviders } from './components/providers/AppProviders';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopProgressBar } from './components/ui/TopProgressBar';
import { useProgress } from './contexts/ProgressContext';
import { usePageLoadingProgress } from './hooks/usePageLoadingProgress';
import { useAppVersion } from './hooks/useAppVersion';
import './App.css';

// Internal component to access ProgressContext
const AppContent = () => {
  const { progressState } = useProgress();
  
  // Automatically track page content loading across all TanStack Query requests
  usePageLoadingProgress();
  
  // Automatically handle app updates silently
  useAppVersion();
  
  return (
    <>
      {/* Reddit-style progress bar at the very top */}
      <TopProgressBar 
        isVisible={progressState.isVisible}
        progress={progressState.progress}
        duration={progressState.duration}
      />
      
      {/* Tier 1: Root Error Boundary - Ultimate safety net for entire application */}
      <ErrorBoundary 
        tier="root"
        context="aplicação completa"
        showDetails={process.env.NODE_ENV === 'development'}
        showHomeButton={false}
        showBackButton={false}
      >
        <AppRouter />
      </ErrorBoundary>
    </>
  );
};

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
