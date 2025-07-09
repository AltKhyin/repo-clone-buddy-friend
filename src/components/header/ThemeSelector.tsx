// ABOUTME: Reusable theme selector component with icon-only design extracted from ProfileMenu.

import React from 'react';
import { Moon, Sun, Circle } from 'lucide-react';
import { useTheme } from '@/components/theme/CustomThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ThemeSelectorProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export const ThemeSelector = ({ variant = 'icon', className }: ThemeSelectorProps) => {
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'black');

    const getThemeDisplayName = (theme: string) => {
      switch (theme) {
        case 'light':
          return 'claro';
        case 'dark':
          return 'escuro';
        case 'black':
          return 'Black';
        default:
          return theme;
      }
    };

    toast({
      title: 'Tema alterado',
      description: `Tema alterado para ${getThemeDisplayName(newTheme)}.`,
    });
  };

  // Get current theme icon
  const getCurrentThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'black':
        return <Moon className="h-4 w-4 fill-current" />;
      default:
        return <Moon className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-muted-foreground hover:text-foreground transition-colors ${className}`}
        >
          {getCurrentThemeIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 z-[70]">
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('black')}>
          <Circle className="mr-2 h-4 w-4 fill-current" />
          <span>Black</span>
          {theme === 'black' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
