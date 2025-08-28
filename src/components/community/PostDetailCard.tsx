// ABOUTME: Reddit-style detailed post card with unified header structure and consistent styling.

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pin, Lock, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '@/types';
import { PostActionMenu } from './PostActionMenu';
import { PollDisplay } from './PollDisplay';
import { useSavePostMutation } from '@packages/hooks/useSavePostMutation';
import { useAuthStore } from '../../store/auth';
import { processVideoUrl, getVideoType } from '../../lib/video-utils';
import { VoteButton } from '../ui/VoteButton';
import { useTheme } from '../theme/CustomThemeProvider';
import { PostAuthor } from './CommunityAuthor';

interface PostDetailCardProps {
  post: CommunityPost;
  totalComments?: number; // Total recursive comment count
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
  announcement: 'Anúncio',
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
  announcement: 'destructive',
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
      locale: ptBR,
    });
  } catch (error) {
    console.error('PostDetailCard: Date formatting error:', error, 'for date:', dateString);
    return 'Data inválida';
  }
};

export const PostDetailCard = ({ post, totalComments }: PostDetailCardProps) => {
  const { user } = useAuthStore();
  const { actualTheme } = useTheme();
  const savePostMutation = useSavePostMutation();

  const categoryLabel = CATEGORY_LABELS[post.category] || post.category;
  const categoryColor = CATEGORY_COLORS[post.category] || 'default';

  const handleSave = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar');
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

  // Theme-aware pinned post styling
  const getPinnedBackgroundClass = () => {
    if (!post.is_pinned) return '';

    switch (actualTheme) {
      case 'light':
        return 'bg-accent text-accent-foreground'; // Orange background, white text
      case 'dark':
        return 'bg-primary text-primary-foreground'; // White background, dark text
      case 'black':
        return 'bg-accent text-accent-foreground'; // Blue background, white text
      default:
        return 'bg-accent text-accent-foreground';
    }
  };

  const getPinnedTextClass = () => {
    if (!post.is_pinned) return '';

    switch (actualTheme) {
      case 'light':
        return 'text-accent-foreground'; // White text on orange
      case 'dark':
        return 'text-primary-foreground'; // Dark text on white
      case 'black':
        return 'text-accent-foreground'; // White text on blue
      default:
        return 'text-accent-foreground';
    }
  };

  const getPinnedMutedTextClass = () => {
    if (!post.is_pinned) return '';

    switch (actualTheme) {
      case 'light':
        return 'text-accent-foreground/80'; // Semi-transparent white on orange
      case 'dark':
        return 'text-primary-foreground/70'; // Semi-transparent dark on white
      case 'black':
        return 'text-accent-foreground/80'; // Semi-transparent white on blue
      default:
        return 'text-accent-foreground/80';
    }
  };

  return (
    <div
      className={cn(
        'reddit-post-item mb-4',
        post.is_pinned && 'pinned-post',
        getPinnedBackgroundClass()
      )}
    >
      <div className="p-4">
        {/* UNIFIED HEADER: Avatar + Author + Time + Badges (matching PostCard) */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <PostAuthor
              author={post.author}
              size="lg"
              showTimestamp={true}
              timestamp={formatPostDate(post.created_at)}
              className={cn(
                'flex-1',
                // Apply pinned styling to the entire author component
                post.is_pinned && actualTheme === 'dark'
                  ? '[&_.font-medium]:text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/70'
                  : post.is_pinned &&
                      '[&_.font-medium]:text-accent-foreground [&_.text-muted-foreground]:text-accent-foreground/70'
              )}
            />

            {/* Status indicators moved to separate section */}
            <div className="flex items-center gap-2 ml-2">
              {post.is_pinned && (
                <div className={cn('flex items-center gap-1', getPinnedTextClass())}>
                  <Pin className="w-4 h-4" />
                  <span className="text-sm font-medium">Fixado</span>
                </div>
              )}

              {post.is_locked && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    post.is_pinned ? getPinnedTextClass() : 'text-orange-500'
                  )}
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Bloqueado</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Custom flair */}
            {post.flair_text && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-sm',
                  post.is_pinned && actualTheme === 'dark'
                    ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
                    : post.is_pinned &&
                        'bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30'
                )}
                style={{
                  backgroundColor: post.is_pinned
                    ? undefined
                    : post.flair_color
                      ? `${post.flair_color}20`
                      : undefined,
                  borderColor: post.is_pinned ? undefined : post.flair_color || undefined,
                  color: post.is_pinned ? undefined : post.flair_color || undefined,
                }}
              >
                {post.flair_text}
              </Badge>
            )}

            {/* Category badge */}
            <Badge
              variant={categoryColor as 'default' | 'destructive' | 'outline' | 'secondary'}
              className={cn(
                'flex-shrink-0',
                post.is_pinned && actualTheme === 'dark'
                  ? 'border-primary-foreground/30 text-primary-foreground/90'
                  : post.is_pinned && 'border-accent-foreground/30 text-accent-foreground/90'
              )}
            >
              {categoryLabel}
            </Badge>

            {/* Post Action Menu */}
            <PostActionMenu post={post} isPinned={post.is_pinned} />
          </div>
        </div>

        {/* Title - Always Present */}
        <h1
          className={cn(
            'reddit-post-title text-xl mb-3',
            getPinnedTextClass(),
            post.is_pinned && 'pinned-post'
          )}
        >
          {post.title || 'Post sem título'}
        </h1>

        {/* Full content - Text first, then media */}
        {post.content && (
          <div
            className={cn(
              'prose dark:prose-invert prose-sm max-w-none text-foreground mb-4',
              post.is_pinned && actualTheme === 'dark'
                ? 'text-primary-foreground/90'
                : post.is_pinned && 'text-accent-foreground/90'
            )}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}

        {/* Media content - Displayed based on post_type */}

        {post.post_type === 'image' && post.image_url && (
          <div className="mb-4">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full aspect-video object-cover rounded-lg border"
              loading="lazy"
            />
          </div>
        )}

        {post.post_type === 'video' && post.video_url && (
          <div className="mb-4">
            {(() => {
              const processedUrl = processVideoUrl(post.video_url);
              const videoType = getVideoType(processedUrl);

              return videoType === 'youtube' || videoType === 'vimeo' ? (
                <div className="relative">
                  <iframe
                    src={processedUrl}
                    className="w-full aspect-video rounded-lg border"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video content"
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                    onError={e => {
                      console.error('Embed video load error:', e);
                      const iframe = e.target as HTMLIFrameElement;
                      const container = iframe.parentElement;
                      if (container) {
                        const originalUrl =
                          videoType === 'youtube'
                            ? processedUrl.replace('/embed/', '/watch?v=')
                            : processedUrl.replace('player.vimeo.com/video/', 'vimeo.com/');
                        container.innerHTML = `
                          <div class="flex items-center justify-center h-64 bg-muted rounded-lg border">
                            <div class="text-center text-muted-foreground">
                              <p class="mb-2 text-lg">Video não pode ser carregado</p>
                              <p class="mb-4 text-sm">Pode estar bloqueado pelo navegador ou não disponível para incorporação</p>
                              <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" 
                                 class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                                Assistir no ${videoType === 'youtube' ? 'YouTube' : 'Vimeo'}
                              </a>
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
                  className="w-full aspect-video object-cover rounded-lg border"
                  preload="metadata"
                  crossOrigin="anonymous"
                  onError={e => {
                    console.error('Direct video load error:', e);
                    const video = e.target as HTMLVideoElement;
                    const container = video.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="flex items-center justify-center h-64 bg-muted rounded-lg border">
                          <div class="text-center text-muted-foreground">
                            <p class="mb-2 text-lg">Vídeo não pode ser carregado</p>
                            <p class="mb-4 text-sm">Arquivo pode estar corrompido ou inacessível</p>
                            <a href="${processedUrl}" target="_blank" rel="noopener noreferrer" 
                               class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                              Abrir vídeo em nova aba
                            </a>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              );
            })()}
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

        {/* Link preview - Displayed for link posts */}
        {post.post_type === 'link' && (post.link_url || post.link_preview_data) && (
          <div className="mb-4">
            <div className="border rounded-lg overflow-hidden bg-card hover:bg-accent/15 transition-colors">
              <a
                href={post.link_url || post.link_preview_data?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex">
                  {post.link_preview_data?.image && (
                    <div className="w-32 h-24 flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={post.link_preview_data.image}
                        alt="Link preview"
                        className="w-full h-full object-cover"
                        onError={e => {
                          // Hide broken images gracefully
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {post.link_preview_data?.domain ||
                          (post.link_url ? new URL(post.link_url).hostname : 'Link externo')}
                      </Badge>
                    </div>

                    {post.link_preview_data?.title && (
                      <h3 className="font-medium text-base line-clamp-2 mb-2 text-foreground">
                        {post.link_preview_data.title}
                      </h3>
                    )}

                    {post.link_preview_data?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                        {post.link_preview_data.description}
                      </p>
                    )}

                    {post.link_preview_data?.siteName && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {post.link_preview_data.siteName}
                      </p>
                    )}

                    {!post.link_preview_data && post.link_url && (
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Link compartilhado</p>
                        <p className="text-xs break-all">{post.link_url}</p>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Row - Mobile-Optimized Touch Targets (matching PostCard) */}
      <div className="px-4 pb-3">
        <div
          className={cn('flex items-center gap-3 text-muted-foreground', getPinnedMutedTextClass())}
        >
          {/* Vote Section */}
          <VoteButton
            entityId={post.id.toString()}
            entityType="community_post"
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            userVote={post.user_vote}
            orientation="horizontal"
            size="lg"
            isPinned={post.is_pinned}
          />

          {/* Comments */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'reddit-action-button',
              post.is_pinned && actualTheme === 'dark'
                ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                : post.is_pinned &&
                    'text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10'
            )}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            {totalComments !== undefined 
              ? (totalComments > 0 ? `${totalComments} comentários` : 'Nenhum comentário')
              : (post.reply_count > 0 ? `${post.reply_count} comentários` : 'Nenhum comentário')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};
