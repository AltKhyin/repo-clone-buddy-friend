// ABOUTME: Reddit-perfect page header component with exact 1088.04px width alignment and simplified structure

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePageSettings } from '../../../packages/hooks/usePageSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';
import { getIconComponent } from '@/config/icon-library';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  // Smart overflow detection
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(1);

  // Enhanced data access with title system enhancements
  const title = settings?.title || pageId.charAt(0).toUpperCase() + pageId.slice(1);
  const titlePrefix = settings?.title_prefix;
  const titleColor = settings?.title_color;
  const prefixColor = settings?.prefix_color;
  const fontFamily = settings?.font_family || 'Inter';
  const titleSize = settings?.title_size || 'text-4xl';
  const prefixSize = settings?.prefix_size || 'text-4xl';
  const titleSizeCustom = settings?.title_size_custom;
  const prefixSizeCustom = settings?.prefix_size_custom;
  const showAvatar = settings?.show_avatar !== false; // Default to true
  const titleShadow = settings?.title_shadow || false;
  const prefixShadow = settings?.prefix_shadow || false;
  const bannerUrl = settings?.banner_url;
  const bannerBackgroundColor = settings?.banner_background_color;
  const avatarUrl = settings?.avatar_url;
  const avatarType = settings?.avatar_type || 'image';
  const avatarIcon = settings?.avatar_icon;
  const avatarIconColor = settings?.avatar_icon_color;
  const avatarBackgroundColor = settings?.avatar_background_color;
  const avatarIconSize = settings?.avatar_icon_size || 37;

  // Smart overflow detection effect
  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !titleRef.current || isLoading) return;
      
      const container = containerRef.current;
      const titleElement = titleRef.current;
      
      // Reset scale to measure natural size
      setScaleFactor(1);
      
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const containerWidth = container.offsetWidth;
        const containerPadding = 32; // px-4 = 16px each side
        const avatarWidth = showAvatar ? 96 + 16 : 0; // 96px avatar + 16px gap
        const actionWidth = children ? 100 : 0; // Approximate width for actions
        const availableWidth = containerWidth - containerPadding - avatarWidth - actionWidth;
        
        const titleWidth = titleElement.scrollWidth;
        
        if (titleWidth > availableWidth) {
          const newScaleFactor = Math.max(0.6, availableWidth / titleWidth); // Min scale 60%
          setScaleFactor(newScaleFactor);
        }
      }, 0);
    };

    checkOverflow();
    
    // Re-check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [isLoading, title, titlePrefix, showAvatar, children, titleSize, prefixSize, titleSizeCustom, prefixSizeCustom]);

  // Enhanced helper function using centralized icon library with comprehensive healthcare icons
  const renderIcon = (iconName: string, size: number = 37) => {
    const IconComponent = getIconComponent(iconName.toLowerCase());
    return <IconComponent size={size} />;
  };

  // Reddit-perfect loading state with correct dimensions
  if (isLoading) {
    return (
      <div className={cn("w-full relative overflow-hidden", className)}>
        {/* Banner skeleton - Reddit 64px height with enhanced shadow and upward overflow */}
        <Skeleton className="w-full h-16 bg-slate-100 shadow-lg -mt-22 pt-22" />
        
        {/* Content skeleton uses parent container constraints */}
        <div className="relative -mt-10 px-4 pb-2">
          <div className="flex items-end gap-4">
            {/* Enhanced 96px avatar skeleton (20% larger) with enhanced shadow - conditionally shown */}
            {showAvatar && (
              <Skeleton className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg" />
            )}
            
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
      {/* Banner Section - 96px height (69% taller than original 64px) with rounded bottom corners and top overflow */}
      <div 
        className="h-24 bg-center bg-cover bg-slate-100 shadow-lg -mt-22 pt-22 rounded-b-lg"
        style={{
          backgroundImage: bannerUrl ? `url('${bannerUrl}')` : undefined,
          backgroundColor: bannerBackgroundColor || undefined
        }}
      />
      
      {/* Header Content - Uses parent container constraints */}
      <div className="relative -mt-10 px-4 pb-2" ref={containerRef}>
        <div className="flex items-end justify-between">
          {/* Left section: Avatar + Title */}
          <div className="flex items-end gap-4">
            {/* Enhanced 96px avatar (20% larger than 80px) with enhanced shadow - conditionally shown */}
            {showAvatar && (
              <div className="relative">
                {avatarType === 'icon' && avatarIcon ? (
                  // Icon avatar type
                  <div 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                    style={{
                      backgroundColor: avatarBackgroundColor || 'hsl(var(--muted))',
                      color: avatarIconColor || 'hsl(var(--muted-foreground))'
                    }}
                  >
                    {renderIcon(avatarIcon, avatarIconSize)}
                  </div>
                ) : avatarType === 'image' && avatarUrl ? (
                  // Image avatar type
                  <img 
                    src={avatarUrl} 
                    alt={`${title} avatar`}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                    loading="lazy"
                  />
                ) : (
                  // Default text avatar (fallback)
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center font-bold text-3xl bg-slate-200 text-slate-600">
                    {title?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Title section with smart overflow detection - preserves original sizing */}
            <div className="flex flex-col justify-end pb-2">
              <h1 
                ref={titleRef}
                className="font-bold leading-none"
                style={{ 
                  fontFamily: fontFamily,
                  color: !titleColor && !prefixColor ? 'inherit' : undefined,
                  transform: scaleFactor < 1 ? `scale(${scaleFactor})` : undefined,
                  transformOrigin: 'left bottom',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                {titlePrefix && (
                  <span 
                    className={prefixSizeCustom ? '' : prefixSize}
                    style={{ 
                      color: prefixColor || 'inherit',
                      fontSize: prefixSizeCustom ? `${prefixSizeCustom}px` : undefined,
                      textShadow: prefixShadow ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
                    }}
                  >
                    {titlePrefix}
                  </span>
                )}
                <span 
                  className={titleSizeCustom ? '' : titleSize}
                  style={{ 
                    color: titleColor || 'inherit',
                    fontSize: titleSizeCustom ? `${titleSizeCustom}px` : undefined,
                    textShadow: titleShadow ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
                  }}
                >
                  {title}
                </span>
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