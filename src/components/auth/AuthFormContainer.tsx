// ABOUTME: Animated container for seamless transitions between login and registration forms

import React from 'react';
import { cn } from '@/lib/utils';
import { useAuthFormTransition } from '@/hooks/useAuthFormTransition';

interface AuthFormContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthFormContainer: React.FC<AuthFormContainerProps> = ({ 
  children, 
  className 
}) => {
  const { isTransitioning } = useAuthFormTransition();

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-in-out",
        isTransitioning && "opacity-80 scale-[0.98]",
        className
      )}
      style={{
        transformOrigin: 'center center',
      }}
    >
      {children}
    </div>
  );
};