// ABOUTME: Fixed glass header component that appears on all pages with backdrop blur effect and theme-aware transparency.

import React from 'react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/header/NotificationBell';
import { ThemeSelector } from '@/components/header/ThemeSelector';
import { UserMenu } from '@/components/header/UserMenu';
import { MobileUserMenu } from '@/components/header/MobileUserMenu';
import { SearchBar } from '@/components/header/SearchBar';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FixedHeaderProps {
  className?: string;
  children?: React.ReactNode;
  isCollapsed: boolean;
  isMobile: boolean;
}

const FixedHeader = ({ className, children, isCollapsed, isMobile }: FixedHeaderProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <header
      className={cn(
        // Fixed positioning and dimensions - higher z-index for proper layering
        'fixed top-0 left-0 right-0 z-[60] h-16',

        // Glass effect with pure blur, no background opacity
        'backdrop-blur-md',

        // Smooth transitions for theme changes
        'transition-all duration-200',

        // Ensure content is properly centered and padded
        'flex items-center',

        // Relative positioning for absolute logo placement
        'relative',

        className
      )}
      style={{
        // Ensure fixed positioning is not overridden
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: '4rem',
      }}
    >
      {/* Logo positioned to match sidebar location */}
      {!isMobile && (
        <h1
          className={cn(
            // Absolute positioning to match sidebar centering - CENTER the text around calculated points
            'absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2',
            'font-serif font-medium tracking-tight text-3xl text-foreground',
            'transition-all duration-300',
            'z-10',
            // Position calculations: center text around sidebar center points
            isCollapsed ? 'left-10' : 'left-[120px]' // Center text at 40px and 120px respectively
          )}
        >
          {isCollapsed ? 'R.' : 'Reviews.'}
        </h1>
      )}

      {/* Mobile logo - always show full logo, centered */}
      {isMobile && (
        <h1 className="absolute left-4 top-1/2 transform -translate-y-1/2 font-serif font-medium tracking-tight text-3xl text-foreground">
          Reviews.
        </h1>
      )}

      {/* Header Content Container - Simple layout */}
      <div className="h-full w-full">
        {/* Desktop Header Layout */}
        <div className="hidden md:flex h-full w-full relative">
          {/* Search Bar - Positioned in main content area */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 z-20"
            style={{
              left: `${isCollapsed ? 80 + 16 : 240 + 16}px`, // sidebar width + padding
            }}
          >
            <SearchBar />
          </div>

          {/* Icons - All the way to right edge of screen */}
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <ThemeSelector />
                <UserMenu />
              </div>
            ) : (
              <Button
                onClick={handleLoginClick}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Entrar/Cadastrar
                <LogIn className="h-3 w-3 ml-1.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header Layout - Icons right aligned */}
        <div className="md:hidden h-full flex items-center justify-end px-4">
          {isLoggedIn ? (
            <div className="flex items-center space-x-3">
              <NotificationBell />
              <MobileUserMenu />
            </div>
          ) : (
            <Button
              onClick={handleLoginClick}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar/Cadastrar
              <LogIn className="h-3 w-3 ml-1.5" />
            </Button>
          )}
        </div>

        {/* Legacy children container for any future content */}
        <div className="hidden">{children}</div>
      </div>
    </header>
  );
};

export default FixedHeader;
