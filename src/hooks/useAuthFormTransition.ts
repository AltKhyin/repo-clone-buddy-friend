// ABOUTME: Hook for managing smooth transitions between login and registration forms

import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type AuthFormMode = 'login' | 'register';

interface AuthFormTransitionState {
  currentMode: AuthFormMode;
  isTransitioning: boolean;
  previousMode: AuthFormMode | null;
}

export const useAuthFormTransition = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine current mode from route
  const getCurrentMode = (): AuthFormMode => {
    return location.pathname === '/registrar' ? 'register' : 'login';
  };

  const [transitionState, setTransitionState] = useState<AuthFormTransitionState>({
    currentMode: getCurrentMode(),
    isTransitioning: false,
    previousMode: null,
  });

  const switchToMode = useCallback((mode: AuthFormMode, withAnimation = true) => {
    if (mode === transitionState.currentMode) return;

    if (withAnimation) {
      setTransitionState(prev => ({
        currentMode: mode,
        isTransitioning: true,
        previousMode: prev.currentMode,
      }));

      // Navigate after animation starts
      setTimeout(() => {
        navigate(mode === 'register' ? '/registrar' : '/login');
        
        // Complete transition after navigation
        setTimeout(() => {
          setTransitionState(prev => ({
            ...prev,
            isTransitioning: false,
            previousMode: null,
          }));
        }, 150);
      }, 100);
    } else {
      navigate(mode === 'register' ? '/registrar' : '/login');
      setTransitionState({
        currentMode: mode,
        isTransitioning: false,
        previousMode: null,
      });
    }
  }, [navigate, transitionState.currentMode]);

  return {
    currentMode: getCurrentMode(),
    isTransitioning: transitionState.isTransitioning,
    previousMode: transitionState.previousMode,
    switchToLogin: () => switchToMode('login'),
    switchToRegister: () => switchToMode('register'),
    switchToMode,
  };
};