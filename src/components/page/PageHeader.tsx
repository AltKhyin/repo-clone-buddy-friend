// ABOUTME: Reddit-perfect page header component with exact 1088.04px width alignment and simplified structure

import React from 'react';
import { cn } from '@/lib/utils';
import { usePageSettings } from '../../../packages/hooks/usePageSettings';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, Users, BookOpen, Home, Settings, Heart, Star, Crown, 
  Shield, Award, Target, Zap, Flame, Sun, Moon, Coffee, 
  Volume2, Camera, Palette, Brush, Pen, Book, Calendar, Globe 
} from 'lucide-react';

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
  const avatarUrl = settings?.avatar_url;
  const avatarType = settings?.avatar_type || 'image';
  const avatarIcon = settings?.avatar_icon;
  const avatarIconColor = settings?.avatar_icon_color;
  const avatarBackgroundColor = settings?.avatar_background_color;

  // Helper function to render Lucide icon based on name
  const renderIcon = (iconName: string, size: number = 32) => {
    const iconMap: Record<string, any> = {
      'User': User, 'Users': Users, 'BookOpen': BookOpen, 'Home': Home,
      'Settings': Settings, 'Heart': Heart, 'Star': Star, 'Crown': Crown,
      'Shield': Shield, 'Award': Award, 'Target': Target, 'Zap': Zap,
      'Flame': Flame, 'Sun': Sun, 'Moon': Moon, 'Coffee': Coffee,
      'Music': Volume2, 'Camera': Camera, 'Palette': Palette, 'Brush': Brush,
      'Pen': Pen, 'Book': Book, 'Calendar': Calendar, 'Globe': Globe
    };
    const IconComponent = iconMap[iconName] || User;
    return <IconComponent size={size} />;
  };

  // Reddit-perfect loading state with correct dimensions
  if (isLoading) {
    return (
      <div className={cn("w-full relative overflow-hidden", className)}>
        {/* Banner skeleton - Reddit 64px height with enhanced shadow and upward overflow */}
        <Skeleton className="w-full h-16 bg-slate-100 shadow-lg -mt-6 pt-6" />
        
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
      {/* Banner Section - Fixed 64px Reddit height with enhanced shadow and upward overflow */}
      <div 
        className="h-16 bg-center bg-cover bg-slate-100 shadow-lg -mt-6 pt-6"
        style={bannerUrl ? { backgroundImage: `url('${bannerUrl}')` } : {}}
      />
      
      {/* Header Content - Uses parent container constraints */}
      <div className="relative -mt-10 px-4 pb-2">
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
                    {renderIcon(avatarIcon, 32)}
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

            {/* Enhanced Title section with custom sizing and shadow support - moved significantly lower */}
            <div className={`flex flex-col justify-end ${showAvatar ? 'pb-0' : 'pb-1'}`}>
              <h1 
                className="font-bold leading-none"
                style={{ 
                  fontFamily: fontFamily,
                  color: !titleColor && !prefixColor ? 'inherit' : undefined  // Use default foreground when no colors set
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