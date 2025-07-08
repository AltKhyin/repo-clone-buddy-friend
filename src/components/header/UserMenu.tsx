// ABOUTME: Three-dot user menu component with logout functionality for desktop header.

import React from 'react';
import { MoreVertical, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserMenuProps {
  className?: string;
}

export const UserMenu = ({ className }: UserMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-muted-foreground hover:text-foreground transition-colors ${className}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 z-[70]">
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
