// ABOUTME: Mobile avatar menu component combining theme selector and logout functionality.

import React from 'react';
import { LogOut, Moon, Sun, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/theme/CustomThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { useUserProfileQuery } from '@packages/hooks/useUserProfileQuery';

interface MobileUserMenuProps {
  className?: string;
}

export const MobileUserMenu = ({ className }: MobileUserMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const { user } = useAuthStore();
  const { data: userProfile } = useUserProfileQuery();

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

  const handleLogout = async () => {
    try {
      // Clean up any existing auth state
      localStorage.clear();
      sessionStorage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });

      // Show success message
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });

      // Navigate to login page
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Erro no logout',
        description: 'Houve um problema ao desconectar. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full p-0 ${className}`}>
          <Avatar className="h-7 w-7">
            <AvatarImage src={userProfile?.avatar_url || ''} alt="Avatar do usuário" />
            <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 z-[70]">
        {/* Theme Selection */}
        <DropdownMenuItem onClick={() => handleThemeChange('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Tema Claro</span>
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Tema Escuro</span>
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange('black')}>
          <Circle className="mr-2 h-4 w-4 fill-current" />
          <span>Tema Black</span>
          {theme === 'black' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
