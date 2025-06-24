
// ABOUTME: Reddit-style detailed post card with unified header structure and consistent styling.

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, Lock, ChevronUp, ChevronDown, Bookmark, BookmarkCheck, Share2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '@/types';
import { PostActionMenu } from './PostActionMenu';
import { useCastCommunityVoteMutation } from '../../../packages/hooks/useCastCommunityVoteMutation';
import { useSavePostMutation } from '../../../packages/hooks/useSavePostMutation';
import { useAuthStore } from '../../store/auth';

interface PostDetailCardProps {
  post: CommunityPost;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Discussão Geral',
  review_discussion: 'Review',
  question: 'Pergunta',
  announcement: 'Anúncio'
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'default',
  review_discussion: 'secondary',
  question: 'outline',
  announcement: 'destructive'
};

export const PostDetailCard = ({ post }: PostDetailCardProps) => {
  const { user } = useAuthStore();
  const castVoteMutation = useCastCommunityVoteMutation();
  const savePostMutation = useSavePostMutation();
  
  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
  const categoryColor = CATEGORY_COLORS[post.category] || 'default';

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Você precisa estar logado para votar');
      return;
    }

    const newVoteType = post.user_vote === voteType ? null : voteType;

    try {
      await castVoteMutation.mutateAsync({
        postId: post.id,
        voteType: newVoteType
      });
    } catch (error) {
      toast.error('Erro ao votar. Tente novamente.');
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar');
      return;
    }

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
    try {
      await navigator.share({
        title: post.title || 'Post da Comunidade EVIDENS',
        text: post.content ? post.content.substring(0, 200) + '...' : '',
        url: window.location.href
      });
    } catch (error) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência');
      } catch (clipboardError) {
        toast.error('Erro ao compartilhar post');
      }
    }
  };

  return (
    <div className={cn(
      "reddit-post-item mb-6",
      post.is_pinned && "ring-2 ring-primary/20 bg-primary/5"
    )}>
      <div className="p-6">
        {/* UNIFIED HEADER: Avatar + Author + Time + Badges (matching PostCard) */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback>
                {post.author?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="reddit-post-author text-base font-semibold">
                  {post.author?.full_name || 'Usuário Anônimo'}
                </span>
                
                <span className="text-muted-foreground text-sm">•</span>
                
                <span className="reddit-post-timestamp text-sm">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>

                {/* Status indicators */}
                {post.is_pinned && (
                  <>
                    <span className="text-muted-foreground text-sm">•</span>
                    <div className="flex items-center gap-1 text-primary">
                      <Pin className="w-4 h-4" />
                      <span className="text-sm font-medium">Fixado</span>
                    </div>
                  </>
                )}
                
                {post.is_locked && (
                  <>
                    <span className="text-muted-foreground text-sm">•</span>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Bloqueado</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Custom flair */}
            {post.flair_text && (
              <Badge 
                variant="secondary" 
                className="text-sm"
                style={{ 
                  backgroundColor: post.flair_color ? `${post.flair_color}20` : undefined,
                  borderColor: post.flair_color || undefined,
                  color: post.flair_color || undefined
                }}
              >
                {post.flair_text}
              </Badge>
            )}
            
            {/* Category badge */}
            <Badge variant={categoryColor as any} className="flex-shrink-0">
              {categoryLabel}
            </Badge>

            {/* Post Action Menu */}
            <PostActionMenu post={post} />
          </div>
        </div>

        {/* Title - Always Present */}
        <h1 className="reddit-post-title text-2xl mb-4">
          {post.title || 'Post sem título'}
        </h1>

        {/* Full content - Text first, then media */}
        {post.content && (
          <div 
            className="prose dark:prose-invert prose-lg max-w-none text-foreground mb-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        {/* Media content - Always displayed if exists */}
        {post.image_url && (
          <div className="mb-6">
            <img 
              src={post.image_url} 
              alt="Post image" 
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}

        {post.video_url && (
          <div className="mb-6">
            <video 
              src={post.video_url} 
              controls 
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}

        {post.poll_data && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border">
            <div className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
              📊 {post.poll_data.question || 'Enquete'}
            </div>
            {post.poll_data.options && post.poll_data.options.length > 0 && (
              <div className="space-y-2">
                {post.poll_data.options.map((option: any, index: number) => (
                  <div key={index} className="p-3 bg-white dark:bg-blue-900/20 rounded border">
                    <div className="font-medium">{option.text || `Opção ${index + 1}`}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.votes || 0} votos
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Row - Mobile-Optimized Touch Targets (matching PostCard) */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-1 text-muted-foreground">
          {/* Vote Section */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "reddit-action-button",
                post.user_vote === 'up' && "text-green-600 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-900/30"
              )}
              onClick={() => handleVote('up')}
              disabled={castVoteMutation.isPending}
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              {post.upvotes}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "reddit-action-button",
                post.user_vote === 'down' && "text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30"
              )}
              onClick={() => handleVote('down')}
              disabled={castVoteMutation.isPending}
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              {post.downvotes}
            </Button>
          </div>

          {/* Comments */}
          <Button
            variant="ghost"
            size="sm"
            className="reddit-action-button"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {post.reply_count > 0 ? `${post.reply_count} respostas` : 'Nenhuma resposta'}
          </Button>

          {/* Save */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "reddit-action-button",
              post.is_saved && "text-primary"
            )}
            onClick={handleSave}
            disabled={savePostMutation.isPending}
          >
            {post.is_saved ? (
              <BookmarkCheck className="w-4 h-4 mr-1" />
            ) : (
              <Bookmark className="w-4 h-4 mr-1" />
            )}
            {post.is_saved ? 'Salvo' : 'Salvar'}
          </Button>
          
          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            className="reddit-action-button"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-1" />
            Compartilhar
          </Button>
        </div>
      </div>
    </div>
  );
};
