// ABOUTME: Hook for automatic silent app updates - no user intervention required

import { useEffect, useRef } from 'react';

export const useAppVersion = () => {
  const hasUpdatedRef = useRef(false);
  const isCheckingRef = useRef(false);
  
  useEffect(() => {
    // Only run once per session
    if (hasUpdatedRef.current) return;
    
    const performSilentUpdate = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      
      try {
        // Listen for service worker updates - this is the most reliable signal
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            // Check if there's a waiting service worker (new version available)
            if (registration.waiting) {
              
              // Skip the waiting and activate immediately
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              
              // Listen for the controller change (new SW activated)
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                hasUpdatedRef.current = true;
                // Silent reload - user won't notice
                window.location.reload();
              });
            }
            
            // Also listen for new updates coming in
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          }
        }
      } catch (error) {
        console.warn('Silent update check failed:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };
    
    // Check immediately on mount
    performSilentUpdate();
    
    // Set up periodic checks every 5 minutes (less frequent, more efficient)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !hasUpdatedRef.current) {
        performSilentUpdate();
      }
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  // Return minimal interface - no UI needed
  return null;
};