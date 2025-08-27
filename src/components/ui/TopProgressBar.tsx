// ABOUTME: Reddit-style thin progress bar component using accent color tokens with smooth animations

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TopProgressBarProps {
  isVisible: boolean;
  progress?: number; // 0-100, auto-animates if not provided
  duration?: number; // ms for auto-animation, default 2000ms
  className?: string;
}

export const TopProgressBar: React.FC<TopProgressBarProps> = ({
  isVisible,
  progress,
  duration = 2000,
  className
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setAnimatedProgress(0);
      setIsComplete(false);
      return;
    }

    if (progress !== undefined) {
      // Manual progress control
      setAnimatedProgress(progress);
      if (progress >= 100) {
        setTimeout(() => setIsComplete(true), 200);
      }
    } else {
      // Auto-animation for indeterminate progress
      setAnimatedProgress(0);
      
      // Simulate realistic loading progress
      const steps = [
        { percent: 20, delay: 100 },
        { percent: 45, delay: 300 },
        { percent: 70, delay: 600 },
        { percent: 90, delay: 900 },
        { percent: 100, delay: duration },
      ];
      
      steps.forEach(({ percent, delay }) => {
        setTimeout(() => {
          setAnimatedProgress(percent);
          if (percent === 100) {
            setTimeout(() => setIsComplete(true), 200);
          }
        }, delay);
      });
    }
  }, [isVisible, progress, duration]);

  // Auto-hide after completion
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        setIsComplete(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  if (!isVisible && !isComplete) return null;

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 h-[3px] z-[9999] bg-transparent pointer-events-none",
        // Mobile-specific fixes
        "supports-[height:100dvh]:h-[3px]", // Dynamic viewport height support
        className
      )}
      style={{
        // Mobile Safari fix - ensure it's always at the very top
        position: 'fixed',
        top: '0px',
        left: '0px',
        right: '0px',
        zIndex: 9999,
        height: '3px',
        WebkitTransform: 'translateZ(0)', // Hardware acceleration for mobile
        transform: 'translateZ(0)',
      }}
    >
      <div
        className="h-full bg-accent transition-all duration-300 ease-out"
        style={{
          width: `${animatedProgress}%`,
          opacity: isComplete ? 0 : 1,
          transform: isComplete ? 'scaleX(0)' : 'scaleX(1)',
          transformOrigin: 'left center',
          WebkitTransform: isComplete ? 'scaleX(0) translateZ(0)' : 'scaleX(1) translateZ(0)',
          // Ensure proper rendering on mobile
          willChange: 'width, opacity, transform',
        }}
      />
      
      {/* Subtle glow effect */}
      <div
        className="h-full bg-accent/20 transition-all duration-300 ease-out"
        style={{
          width: `${animatedProgress}%`,
          opacity: isVisible && !isComplete ? 0.4 : 0,
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  );
};