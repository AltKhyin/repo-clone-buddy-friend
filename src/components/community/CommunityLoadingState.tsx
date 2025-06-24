
// ABOUTME: Standardized loading state components for community module with progressive indicators and skeleton states.

import React from 'react';
import { Loader2, MessageCircle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

interface CommunityLoadingStateProps {
  variant?: 'page' | 'post' | 'sidebar' | 'minimal';
  description?: string;
  showAnimation?: boolean;
}

export const CommunityLoadingState = ({
  variant = 'page',
  description = 'Carregando...',
  showAnimation = true
}: CommunityLoadingStateProps) => {
  
  // Minimal loading state for inline use
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className={`w-5 h-5 animate-spin mr-2 ${showAnimation ? '' : 'opacity-50'}`} />
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    );
  }

  // Post detail loading state
  if (variant === 'post') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sidebar loading state
  if (variant === 'sidebar') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Full page loading state (default)
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Main content skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Vote buttons skeleton */}
                  <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-6 w-6" />
                  </div>
                  
                  {/* Content skeleton */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <div className="space-y-2 mb-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Animated loading indicator */}
        {showAnimation && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <MessageCircle className="w-5 h-5 text-primary animate-pulse" />
                <Users className="w-5 h-5 text-primary animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-sm text-muted-foreground">{description}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityLoadingState;
