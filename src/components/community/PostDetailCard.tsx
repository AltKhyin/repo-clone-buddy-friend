
// ABOUTME: Reddit-style detailed post card with unified header structure and consistent styling.

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, Lock, ChevronUp, ChevronDown, Bookmark, BookmarkCheck, Share2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '@/types';
import { PostActionMenu } from './PostActionMenu';
import { PollDisplay } from './PollDisplay';
import { useCastVoteMutation } from '../../../packages/hooks/useCastVoteMutation';
import { useSavePostMutation } from '../../../packages/hooks/useSavePostMutation';
import { useAuthStore } from '../../store/auth';

interface PostDetailCardProps {
  post: CommunityPost;
}

const CATEGORY_LABELS: Record<string, string> = {
  // Current frontend Portuguese categories
  'discussao-geral': 'Discussão Geral',
  'duvida-clinica': 'Dúvida Clínica',
  'caso-clinico': 'Caso Clínico',
  'evidencia-cientifica': 'Evidência Científica',
  'tecnologia-saude': 'Tecnologia & Saúde',
  'carreira-medicina': 'Carreira em Medicina',
  'bem-estar-medico': 'Bem-estar Médico',
  // Legacy English categories for backward compatibility
  general: 'Discussão Geral',
  review_discussion: 'Review',
  question: 'Pergunta',
  announcement: 'Anúncio'
};

const CATEGORY_COLORS: Record<string, string> = {
  // Current frontend Portuguese categories
  'discussao-geral': 'default',
  'duvida-clinica': 'outline',
  'caso-clinico': 'secondary',
  'evidencia-cientifica': 'default',
  'tecnologia-saude': 'outline',
  'carreira-medicina': 'secondary',
  'bem-estar-medico': 'outline',
  // Legacy English categories for backward compatibility
  general: 'default',
  review_discussion: 'secondary',
  question: 'outline',
  announcement: 'destructive'
};

// Safe date formatting helper
const formatPostDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    console.warn('PostDetailCard: Missing or null date value:', dateString);
    return 'Data indisponível';
  }

  try {
    // Try parsing as ISO string first
    let date = parseISO(dateString);
    
    // If not valid, try as direct Date constructor
    if (!isValid(date)) {
      date = new Date(dateString);
    }
    
    // Final validation
    if (!isValid(date)) {
      console.error('PostDetailCard: Invalid date after parsing:', dateString);
      return 'Data inválida';
    }
    
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR
    });
  } catch (error) {
    console.error('PostDetailCard: Date formatting error:', error, 'for date:', dateString);
    return 'Data inválida';
  }
};

export const PostDetailCard = ({ post }: PostDetailCardProps) => {
  const { user } = useAuthStore();
  const castVoteMutation = useCastVoteMutation();
  const savePostMutation = useSavePostMutation();
  
  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
  const categoryColor = CATEGORY_COLORS[post.category] || 'default';

  const handleVote = (voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Você precisa estar logado para votar');
      return;
    }

    const newVoteType = post.user_vote === voteType ? null : voteType;

    // The mutation now handles optimistic updates and error handling automatically
    castVoteMutation.mutate({
      entity_id: post.id.toString(),
      vote_type: newVoteType || 'none',
      entity_type: 'community_post'
    });
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
      "reddit-post-item mb-4",
      post.is_pinned && "ring-2 ring-primary/20 bg-primary/5"
    )}>
      <div className="p-4">
        {/* UNIFIED HEADER: Avatar + Author + Time + Badges (matching PostCard) */}
        <div className="flex items-start justify-between gap-3 mb-3">
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
                  {formatPostDate(post.created_at)}
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
            <Badge variant={categoryColor as "default" | "destructive" | "outline" | "secondary"} className="flex-shrink-0">
              {categoryLabel}
            </Badge>

            {/* Post Action Menu */}
            <PostActionMenu post={post} />
          </div>
        </div>

        {/* Title - Always Present */}
        <h1 className="reddit-post-title text-xl mb-3">
          {post.title || 'Post sem título'}
        </h1>

        {/* Full content - Text first, then media */}
        {post.content && (
          <div 
            className="prose dark:prose-invert prose-sm max-w-none text-foreground mb-4"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        {/* Media content - Displayed based on post_type */}
        
        {post.post_type === 'image' && post.image_url && (
          <div className="mb-4">
            <img 
              src={post.image_url} 
              alt="Post image" 
              className="rounded-lg max-w-full h-auto border"
              loading="lazy"
            />
          </div>
        )}

        {post.post_type === 'video' && post.video_url && (
          <div className="mb-4">
            {post.video_url.includes('youtube.com/embed') || post.video_url.includes('player.vimeo.com') ? (
              <iframe
                src={post.video_url}
                className="w-full aspect-video rounded-lg border"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video content"
              />
            ) : (
              <video 
                src={post.video_url} 
                controls 
                className="rounded-lg max-w-full h-auto border"
                preload="metadata"
                onError={(e) => {
                  console.error('Video load error:', e);
                  (e.target as HTMLVideoElement).style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {post.post_type === 'poll' && post.poll_data && (
          <div className="mb-4">
            <PollDisplay 
              pollData={post.poll_data}
              isCompact={false}
              allowVoting={true}
              postId={post.id}
            />
          </div>
        )}
      </div>

      {/* Bottom Action Row - Mobile-Optimized Touch Targets (matching PostCard) */}
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
