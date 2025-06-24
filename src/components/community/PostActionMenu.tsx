
// ABOUTME: Dropdown menu for post actions like save, share, moderate, etc.

import React from 'react';
import { MoreHorizontal, Bookmark, Share2, Flag, Pin, Lock, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import type { CommunityPost } from '../../types/community';

interface PostActionMenuProps {
  post: CommunityPost;
  onSave?: (postId: number) => void;
  onShare?: (postId: number) => void;
  onReport?: (postId: number) => void;
  onPin?: (postId: number) => void;
  onLock?: (postId: number) => void;
  onHide?: (postId: number) => void;
}

export const PostActionMenu = ({
  post,
  onSave,
  onShare,
  onReport,
  onPin,
  onLock,
  onHide
}: PostActionMenuProps) => {
  const handleSave = () => {
    onSave?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post.id);
  };

  const handleReport = () => {
    onReport?.(post.id);
  };

  const handlePin = () => {
    onPin?.(post.id);
  };

  const handleLock = () => {
    onLock?.(post.id);
  };

  const handleHide = () => {
    onHide?.(post.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu de ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleSave}>
          <Bookmark className="mr-2 h-4 w-4" />
          {post.is_saved ? 'Remover dos salvos' : 'Salvar post'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleReport}>
          <Flag className="mr-2 h-4 w-4" />
          Reportar
        </DropdownMenuItem>
        
        {/* Moderation actions - only show if user can moderate */}
        {post.user_can_moderate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePin}>
              <Pin className="mr-2 h-4 w-4" />
              {post.is_pinned ? 'Desafixar' : 'Fixar'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLock}>
              <Lock className="mr-2 h-4 w-4" />
              {post.is_locked ? 'Desbloquear' : 'Bloquear'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHide}>
              {post.is_locked ? (
                <Eye className="mr-2 h-4 w-4" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              Ocultar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
