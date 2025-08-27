// ABOUTME: Reddit-perfect page header component with exact 1088.04px width alignment and simplified structure

import React from 'react';
import { cn } from '@/lib/utils';
import { usePageSettings } from '../../../packages/hooks/usePageSettings';
import { Skeleton } from '@/components/ui/skeleton';

interface PageHeaderProps {
  pageId: string;
  className?: string;
  children?: React.ReactNode; // For additional buttons/actions
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  pageId, 
  className,
  children 
}) => {
  const { data: settings, isLoading } = usePageSettings(pageId);

  // Simplified data access - no configuration layers
  const title = settings?.title || pageId.charAt(0).toUpperCase() + pageId.slice(1);
  const bannerUrl = settings?.banner_url;
  const avatarUrl = settings?.avatar_url;

  // Reddit-perfect loading state with correct dimensions
  if (isLoading) {
    return (
      <div className={cn("w-full relative overflow-hidden", className)}>
        {/* Banner skeleton - Reddit 64px height */}
        <Skeleton className="w-full h-16 bg-slate-100" />
        
        {/* Content skeleton uses parent container constraints */}
        <div className="relative -mt-10 px-4">
          <div className="flex items-end gap-4">
            {/* Reddit 80px avatar skeleton */}
            <Skeleton className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-sm" />
            
            {/* Title skeleton */}
            <div className="flex flex-col pb-2">
              <Skeleton className="h-7 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full relative overflow-hidden", className)}>
      {/* Banner Section - Fixed 64px Reddit height */}
      <div 
        className="h-16 bg-center bg-cover bg-slate-100"
        style={bannerUrl ? { backgroundImage: `url('${bannerUrl}')` } : {}}
      />
      
      {/* Header Content - Uses parent container constraints */}
      <div className="relative -mt-10 px-4">
        <div className="flex items-end justify-between">
          {/* Left section: Avatar + Title */}
          <div className="flex items-end gap-4">
            {/* Reddit 80px avatar - fixed size */}
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`${title} avatar`}
                  className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover bg-white"
                  loading="lazy"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm flex items-center justify-center font-bold text-2xl bg-slate-200 text-slate-600">
                  {title?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Title section - No description for Reddit parity */}
            <div className="flex flex-col pb-2">
              <h1 className="text-4xl font-bold text-foreground leading-tight">
                {title}
              </h1>
            </div>
          </div>
          
          {/* Right section: Actions */}
          {children && (
            <div className="flex items-center pb-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;