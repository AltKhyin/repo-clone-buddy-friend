
// ABOUTME: Reddit-style flat post card with unified header structure and mobile-optimized touch targets.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Pin, Lock, ChevronUp, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PostActionMenu } from './PostActionMenu';
import { PollDisplay } from './PollDisplay';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '../../types/community';
import { useCastVoteMutation } from '../../../packages/hooks/useCastVoteMutation';
import { useSavePostMutation } from '../../../packages/hooks/useSavePostMutation';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';
import { processVideoUrl, getVideoType } from '../../lib/video-utils';

interface PostCardProps {
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
  general: 'Geral',
  review_discussion: 'Review',
  question: 'Pergunta',
  announcement: 'Anúncio'
};

// Safe date formatting helper
const formatPostDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    console.warn('PostCard: Missing or null date value:', dateString);
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
      console.error('PostCard: Invalid date after parsing:', dateString);
      return 'Data inválida';
    }
    
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR
    });
  } catch (error) {
    console.error('PostCard: Date formatting error:', error, 'for date:', dateString);
    return 'Data inválida';
  }
};

export const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const castVoteMutation = useCastVoteMutation();
  const savePostMutation = useSavePostMutation();

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a')) return;
    navigate(`/comunidade/${post.id}`);
  };

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
                  {formatPostDate(post.created_at)}
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
            {(() => {
              const processedUrl = processVideoUrl(post.video_url);
              const videoType = getVideoType(processedUrl);
              
              return videoType === 'youtube' || videoType === 'vimeo' ? (
                <div className="relative">
                  <iframe
                    src={processedUrl}
                    className="w-full aspect-video max-h-80 rounded border"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video content"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                    onError={(e) => {
                      console.error('Embed video load error:', e);
                      const iframe = e.target as HTMLIFrameElement;
                      const container = iframe.parentElement;
                      if (container) {
                        const originalUrl = videoType === 'youtube' 
                          ? processedUrl.replace('/embed/', '/watch?v=')
                          : processedUrl.replace('player.vimeo.com/video/', 'vimeo.com/');
                        container.innerHTML = `
                          <div class="flex items-center justify-center h-48 bg-muted rounded border">
                            <div class="text-center text-muted-foreground">
                              <p class="mb-2">Video não pode ser carregado</p>
                              <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" 
                                 class="text-primary hover:underline">Assistir no ${videoType === 'youtube' ? 'YouTube' : 'Vimeo'}</a>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : (
                <video 
                  src={processedUrl} 
                  controls 
                  className="max-h-80 w-auto rounded border"
                  preload="metadata"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Direct video load error:', e);
                    const video = e.target as HTMLVideoElement;
                    const container = video.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="flex items-center justify-center h-48 bg-muted rounded border">
                          <div class="text-center text-muted-foreground">
                            <p class="mb-2">Vídeo não pode ser carregado</p>
                            <a href="${processedUrl}" target="_blank" rel="noopener noreferrer" 
                               class="text-primary hover:underline">Abrir vídeo em nova aba</a>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              );
            })()}
          </div>
        ) : post.post_type === 'poll' && post.poll_data ? (
          <div className="mb-3">
            <PollDisplay 
              pollData={post.poll_data}
              isCompact={true}
              allowVoting={true}
              postId={post.id}
            />
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
        </div>
      </div>
    </div>
  );
};
