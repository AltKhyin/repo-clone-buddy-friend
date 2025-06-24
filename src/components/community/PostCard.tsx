
// ABOUTME: Reddit-style flat post card with unified header structure and mobile-optimized touch targets.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Pin, Lock, ChevronUp, ChevronDown, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PostActionMenu } from './PostActionMenu';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '../../types/community';
import { useCastCommunityVoteMutation } from '../../../packages/hooks/useCastCommunityVoteMutation';
import { useSavePostMutation } from '../../../packages/hooks/useSavePostMutation';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';

interface PostCardProps {
  post: CommunityPost;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Geral',
  review_discussion: 'Review',
  question: 'Pergunta',
  announcement: 'Anúncio'
};

export const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const castVoteMutation = useCastCommunityVoteMutation();
  const savePostMutation = useSavePostMutation();

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a')) return;
    navigate(`/comunidade/${post.id}`);
  };

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
    const postUrl = `${window.location.origin}/comunidade/${post.id}`;
    
    try {
      await navigator.share({
        title: post.title || 'Post da Comunidade EVIDENS',
        text: post.content ? post.content.substring(0, 200) + '...' : '',
        url: postUrl
      });
    } catch (error) {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Link copiado para a área de transferência');
      } catch (clipboardError) {
        toast.error('Erro ao compartilhar post');
      }
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const getFlairColor = (color?: string) => {
    if (!color) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    
    const colorMap: Record<string, string> = {
      'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'red': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'purple': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    
    return colorMap[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <div className="reddit-post-item">
      <div className="p-4 cursor-pointer" onClick={handlePostClick}>
        {/* UNIFIED HEADER: Avatar + Author + Time + Badges (top-left alignment) */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {post.author?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="reddit-post-author text-sm font-medium">
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
                      <Pin className="w-3 h-3" />
                      <span className="text-xs font-medium">Fixado</span>
                    </div>
                  </>
                )}
                
                {post.is_locked && (
                  <>
                    <span className="text-muted-foreground text-sm">•</span>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Lock className="w-3 h-3" />
                      <span className="text-xs font-medium">Bloqueado</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              {getCategoryLabel(post.category)}
            </Badge>
            
            {post.flair_text && (
              <Badge className={`text-xs ${getFlairColor(post.flair_color)}`}>
                {post.flair_text}
              </Badge>
            )}

            <PostActionMenu post={post} />
          </div>
        </div>

        {/* Title - Always Present */}
        <h3 className="reddit-post-title mb-3 line-clamp-2">
          {post.title || 'Post sem título'}
        </h3>

        {/* Content Preview or Multimedia */}
        {post.post_type === 'image' && post.image_url ? (
          <div className="mb-3">
            <img 
              src={post.image_url} 
              alt="Post image" 
              className="max-h-80 w-auto rounded border"
              loading="lazy"
            />
          </div>
        ) : post.post_type === 'video' && post.video_url ? (
          <div className="mb-3">
            <video 
              src={post.video_url} 
              controls 
              className="max-h-80 w-auto rounded border"
              preload="metadata"
            />
          </div>
        ) : post.post_type === 'poll' && post.poll_data ? (
          <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded border">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              📊 Enquete: {post.poll_data.question || 'Clique para participar'}
            </div>
            {post.poll_data.options && (
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                {post.poll_data.options.length} opções disponíveis
              </div>
            )}
          </div>
        ) : post.content ? (
          <div 
            className="reddit-post-body mb-3 line-clamp-3"
            dangerouslySetInnerHTML={{ 
              __html: post.content.length > 300 
                ? `${post.content.substring(0, 300)}...` 
                : post.content 
            }}
          />
        ) : null}
      </div>

      {/* Bottom Action Row - Mobile-Optimized Touch Targets */}
      <div className="px-4 pb-3">
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
              onClick={(e) => {
                e.stopPropagation();
                handleVote('up');
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                handleVote('down');
              }}
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
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/comunidade/${post.id}`);
            }}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {post.reply_count || 0}
          </Button>

          {/* Save */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "reddit-action-button",
              post.is_saved && "text-primary"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={savePostMutation.isPending}
          >
            {post.is_saved ? (
              <BookmarkCheck className="w-4 h-4 mr-1" />
            ) : (
              <Bookmark className="w-4 h-4 mr-1" />
            )}
            Salvar
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="sm"
            className="reddit-action-button"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          >
            <Share2 className="w-4 h-4 mr-1" />
            Compartilhar
          </Button>
        </div>
      </div>
    </div>
  );
};
