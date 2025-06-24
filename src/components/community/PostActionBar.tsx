
// ABOUTME: Action bar component for community posts with reply count, save, and share buttons.

import React from 'react';
import { MessageCircle, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '@/types';
import { useSavePostMutation } from '../../../packages/hooks/useSavePostMutation';

interface PostActionBarProps {
  post: CommunityPost;
}

export const PostActionBar = ({ post }: PostActionBarProps) => {
  const savePostMutation = useSavePostMutation();

  const handleComment = () => {
    toast.info('Sistema de comentários em breve!');
  };

  const handleSave = async () => {
    try {
      await savePostMutation.mutateAsync({
        post_id: post.id,
        is_saved: !post.is_saved
      });
      
      toast.success(
        post.is_saved ? 'Post removido dos salvos' : 'Post salvo com sucesso'
      );
    } catch (error) {
      toast.error('Erro ao salvar post. Tente novamente.');
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/comunidade/${post.id}`;
    
    try {
      await navigator.share({
        title: post.title || 'Post da Comunidade EVIDENS',
        text: post.content ? post.content.substring(0, 200) + '...' : '',
        url: postUrl
      });
    } catch (error) {
      // Fallback to copying URL to clipboard
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Link copiado para a área de transferência');
      } catch (clipboardError) {
        toast.error('Erro ao compartilhar post');
      }
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleComment}
          className="text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          <span className="text-xs">
            {post.reply_count > 0 ? `${post.reply_count} respostas` : 'Responder'}
          </span>
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={savePostMutation.isPending}
          className={cn(
            "text-muted-foreground hover:text-foreground h-8 w-8 p-0",
            post.is_saved && "text-primary hover:text-primary"
          )}
        >
          {post.is_saved ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
