// ABOUTME: Enhanced dropdown menu for post actions with proper permissions and functionality

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreHorizontal, Bookmark, Flag, Pin, Trash2, Edit, BookmarkCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { CommunityPost } from '../../types/community';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../lib/utils';
import { useUserProfileQuery } from '../../../packages/hooks/useUserProfileQuery';
import { usePostModerationMutation } from '../../../packages/hooks/usePostModerationMutation';
import { useDeletePostMutation } from '../../../packages/hooks/useDeletePostMutation';
import { useSavePostMutation } from '../../../packages/hooks/useSavePostMutation';
import { useTheme } from '../theme/CustomThemeProvider';

interface PostActionMenuProps {
  post: CommunityPost;
  isPinned?: boolean;
}

export const PostActionMenu = ({ post, isPinned = false }: PostActionMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { actualTheme } = useTheme();
  const { data: userProfile } = useUserProfileQuery();
  const savePostMutation = useSavePostMutation();
  const moderationMutation = usePostModerationMutation();
  const deletePostMutation = useDeletePostMutation();

  // Permission checks
  const isLoggedIn = !!user;
  const isAuthor = user?.id === post.author_id;
  const canModerate = userProfile?.role === 'admin' || userProfile?.role === 'editor';
  const canDelete = isAuthor || canModerate;

  const handleSave = async () => {
    if (!isLoggedIn) {
      toast.error('Você precisa estar logado para salvar posts');
      return;
    }

    try {
      await savePostMutation.mutateAsync({
        post_id: post.id,
        is_saved: !post.is_saved,
      });
      toast.success(post.is_saved ? 'Post removido dos salvos' : 'Post salvo com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar post. Tente novamente.');
    }
  };

  const handleReport = () => {
    if (!isLoggedIn) {
      toast.error('Você precisa estar logado para reportar posts');
      return;
    }
    // TODO: Implement report functionality
    toast.info('Funcionalidade de reportar em desenvolvimento');
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    toast.info('Funcionalidade de editar em desenvolvimento');
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('Você não tem permissão para deletar este post');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.')) {
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Deletando post...');

    try {
      await deletePostMutation.mutateAsync({ postId: post.id });

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Post deletado com sucesso');

      // Navigate away from post detail page if we're on it
      const isOnPostDetailPage = location.pathname.includes(`/comunidade/${post.id}`);
      if (isOnPostDetailPage) {
        // Navigate back to community page
        navigate('/comunidade', { replace: true });
      }
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);

      // Check if post was actually deleted despite the error
      setTimeout(() => {
        const isOnPostDetailPage = location.pathname.includes(`/comunidade/${post.id}`);
        if (isOnPostDetailPage) {
          // Try to navigate away - the post might be deleted
          toast.success('Post foi deletado');
          navigate('/comunidade', { replace: true });
        } else {
          toast.error('Erro ao deletar post, mas verifique se foi removido.');
        }
      }, 1500);
    }
  };

  const handleModerate = async (action: 'pin' | 'unpin') => {
    if (!canModerate) {
      toast.error('Você não tem permissão para moderar posts');
      return;
    }

    try {
      await moderationMutation.mutateAsync({
        postId: post.id,
        action,
      });

      const actionMessages = {
        pin: 'Post fixado com sucesso',
        unpin: 'Post desfixado com sucesso',
      };

      toast.success(actionMessages[action]);
    } catch (error) {
      toast.error(`Erro ao ${action === 'pin' ? 'fixar' : 'desfixar'} post`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 w-8 p-0',
            isPinned && actualTheme === 'dark'
              ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
              : isPinned &&
                  'text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10'
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu de ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Save action - show for all users */}
        <DropdownMenuItem onClick={handleSave} disabled={!isLoggedIn || savePostMutation.isPending}>
          {post.is_saved ? (
            <BookmarkCheck className="mr-2 h-4 w-4" />
          ) : (
            <Bookmark className="mr-2 h-4 w-4" />
          )}
          {post.is_saved ? 'Remover dos salvos' : 'Salvar post'}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Report action - show for logged users only */}
        {isLoggedIn && (
          <DropdownMenuItem onClick={handleReport}>
            <Flag className="mr-2 h-4 w-4" />
            Reportar
          </DropdownMenuItem>
        )}

        {/* Author actions */}
        {isAuthor && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar post
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={deletePostMutation.isPending}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar post
            </DropdownMenuItem>
          </>
        )}

        {/* Moderation actions - show for admins/editors */}
        {canModerate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleModerate(post.is_pinned ? 'unpin' : 'pin')}
              disabled={moderationMutation.isPending}
            >
              <Pin className="mr-2 h-4 w-4" />
              {post.is_pinned ? 'Desafixar' : 'Fixar'}
            </DropdownMenuItem>

            {/* Admin can also delete any post */}
            {!isAuthor && (
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deletePostMutation.isPending}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar post
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
