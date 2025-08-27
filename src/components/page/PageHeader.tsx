// ABOUTME: Reddit-style page header component with banner, avatar, and title for main pages

import React from 'react';
import { cn } from '@/lib/utils';
import { usePageSettings, getResponsiveBannerUrl, getDefaultPageSettings } from '../../../packages/hooks/usePageSettings';
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
  const defaultSettings = getDefaultPageSettings(pageId);

  // Use settings data or fallback to defaults
  const title = settings?.title || defaultSettings.title || pageId;
  const description = settings?.description || defaultSettings.description || '';
  const avatarUrl = settings?.avatar_url;
  const themeColor = settings?.theme_color || defaultSettings.theme_color || '#0F172A';

  // Get responsive banner URLs following Reddit's pattern
  const smallBanner = getResponsiveBannerUrl(settings, 'small');
  const mediumBanner = getResponsiveBannerUrl(settings, 'medium');
  const largeBanner = getResponsiveBannerUrl(settings, 'large');
  const xlargeBanner = getResponsiveBannerUrl(settings, 'xlarge');

  // CSS variables for responsive banners (Reddit-style)
  const bannerStyle = {
    '--small-banner': smallBanner ? `url('${smallBanner}')` : 'none',
    '--medium-banner': mediumBanner ? `url('${mediumBanner}')` : 'none',  
    '--large-banner': largeBanner ? `url('${largeBanner}')` : 'none',
    '--x-large-banner': xlargeBanner ? `url('${xlargeBanner}')` : 'none',
  } as React.CSSProperties;

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className={cn("masthead w-full relative", className)}>
        <div className="@container">
          {/* Banner skeleton */}
          <Skeleton className="relative h-24 xs:h-32 s:h-40 s:@7xl:h-48 xs:rounded-2 xs:mt-xs bg-secondary-background" />
          
          {/* Header content skeleton */}
          <section className="flex relative items-center xs:items-end justify-between px-4 xs:-top-9 xs:-mb-9 mt-2 mb-1 xs:mt-0">
            <div className="flex flex-1 items-end justify-between flex-col xs:flex-row">
              <div className="flex items-end justify-start xs:justify-center gap-2 w-full xs:w-auto">
                <Skeleton className="xs:w-22 xs:h-22 w-10 h-10 rounded-full shrink-0" />
                <div className="flex flex-col space-y-1">
                  <Skeleton className="h-6 xs:h-8 w-32 xs:w-48" />
                  <Skeleton className="h-3 xs:h-4 w-24 xs:w-32" />
                </div>
              </div>
              {children && (
                <div className="flex w-full xs:w-auto mt-2 xs:mt-0 items-center">
                  <Skeleton className="h-10 w-24" />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("masthead w-full relative", className)}>
      <div className="@container">
        {/* Banner section with responsive background images (Reddit-style) */}
        <div 
          className={cn(
            "relative bg-center bg-cover bg-no-repeat h-24 bg-secondary-background",
            "xs:h-32 s:h-40 s:@7xl:h-48",
            smallBanner && "bg-[image:var(--small-banner)]",
            mediumBanner && "xs:bg-[image:var(--medium-banner)]", 
            largeBanner && "s:bg-[image:var(--large-banner)]",
            xlargeBanner && "s:@7xl:bg-[image:var(--x-large-banner)]",
            "xs:rounded-2 xs:mt-xs"
          )}
          style={bannerStyle}
        >
          {/* Gradient overlay for better text readability */}
          {(smallBanner || mediumBanner || largeBanner || xlargeBanner) && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 xs:rounded-2" />
          )}
        </div>
        
        {/* Header content section */}
        <section 
          className="flex relative items-center xs:items-end justify-between px-4 xs:-top-9 xs:-mb-9 mt-2 mb-1 xs:mt-0" 
          aria-label="Page header"
        >
          <div className="flex flex-1 items-end justify-between flex-col xs:flex-row">
            {/* Avatar and title section */}
            <div className="flex items-end justify-start xs:justify-center gap-2 w-full xs:w-auto">
              {/* Avatar with responsive sizes */}
              <div className="xs:w-22 xs:h-22 w-10 h-10 text-48 shrink-0">
                {/* Mobile avatar (40px) */}
                <span className="inline-flex items-center justify-center w-10 h-10 xs:hidden">
                  <span className="inline-block rounded-full relative overflow-hidden w-full h-full">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={`${title} icon`} 
                        className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
                        width="40"
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        className="w-full h-full rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: themeColor }}
                      >
                        {title?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </span>
                </span>
                
                {/* Desktop avatar (88px) */}
                <span className="inline-flex items-center justify-center w-22 h-22 hidden xs:inline-flex">
                  <span className="inline-block rounded-full relative overflow-hidden w-full h-full">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={`${title} icon`} 
                        className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                        width="88"
                        loading="lazy"
                      />
                    ) : (
                      <div 
                        className="w-full h-full rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl"
                        style={{ backgroundColor: themeColor }}
                      >
                        {title?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </span>
                </span>
              </div>

              {/* Title and description */}
              <div className="flex flex-col">
                <h1 className="flex items-center font-bold text-lg xs:text-2xl mb-0 text-neutral-content-strong text-foreground">
                  {title}
                </h1>
                {description && (
                  <p className="text-xs xs:text-sm text-muted-foreground mt-1 xs:mt-0">
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Actions section (right side) */}
            {children && (
              <div className="flex w-full xs:w-auto mt-2 xs:mt-0 items-center">
                {children}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PageHeader;