// ABOUTME: Reddit-style flat post card with unified header structure and mobile-optimized touch targets.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Pin, Lock, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PostActionMenu } from './PostActionMenu';
import { PollDisplay } from './PollDisplay';
import { cn } from '../../lib/utils';
import type { CommunityPost } from '../../types/community';
import { useSavePostMutation } from '@packages/hooks/useSavePostMutation';
import { useAuthStore } from '../../store/auth';
import { toast } from 'sonner';
import { processVideoUrl, getVideoType } from '../../lib/video-utils';
import { VoteButton } from '../ui/VoteButton';
import { useTheme } from '../theme/CustomThemeProvider';
import { useIsMobile } from '../../hooks/use-mobile';
import { PostAuthor } from './CommunityAuthor';

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
  announcement: 'Anúncio',
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

    const formattedDate = formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR,
    });
    
    // Simplify "há cerca de" to just "há" for cleaner mobile display
    return formattedDate.replace('há cerca de', 'há');
  } catch (error) {
    console.error('PostCard: Date formatting error:', error, 'for date:', dateString);
    return 'Data inválida';
  }
};

export const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { actualTheme } = useTheme();
  const isMobile = useIsMobile();
  const savePostMutation = useSavePostMutation();

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a')) return;
    navigate(`/comunidade/${post.id}`);
  };

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

  const getCategoryLabel = (category: string) => {
    // If we have dynamic category data, use it
    if (post.category_data) {
      return post.category_data.name;
    }
    // Otherwise, fall back to hardcoded labels
    return CATEGORY_LABELS[category] || category;
  };

  const getCategoryStyle = () => {
    if (post.category_data) {
      return {
        backgroundColor: post.category_data.background_color,
        color: post.category_data.text_color,
        borderColor: post.category_data.border_color,
      };
    }
    return {};
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement category filtering functionality
    console.log('Category clicked:', post.category);
  };

  const getFlairColor = (color?: string) => {
    if (!color) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };

    return colorMap[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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

  // Theme-aware outline for comment button pills (matches VoteButton logic)
  const getCommentPillOutlineStyle = () => {
    if (post.is_pinned) {
      if (actualTheme === 'dark') {
        return 'border-primary-foreground/30'; // Visible outline for pinned posts in dark theme
      }
      return 'border-accent-foreground/30'; // Visible outline for pinned posts in light theme
    }
    // Normal posts - more visible than before but still discrete
    return 'border-border/40'; // Increased visibility for normal posts
  };

  return (
    <div
      className={cn(
        'reddit-post-item',
        post.is_pinned && 'pinned-post',
        getPinnedBackgroundClass()
      )}
    >
      <div className="px-4 pt-4 pb-0 cursor-pointer" onClick={handlePostClick}> {/* Eliminated bottom padding */}
        {/* UNIFIED HEADER: Avatar + Author + Time + Badges (top-left alignment) */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <PostAuthor
              author={post.author}
              size="md"
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
                  <Pin className="w-3 h-3" />
                  <span className="text-xs font-medium">Fixado</span>
                </div>
              )}

              {post.is_locked && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    post.is_pinned ? getPinnedTextClass() : 'text-orange-500'
                  )}
                >
                  <Lock className="w-3 h-3" />
                  <span className="text-xs font-medium">Bloqueado</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={cn(
                'text-xs cursor-pointer hover:opacity-80 transition-opacity',
                post.is_pinned && actualTheme === 'dark'
                  ? 'border-primary-foreground/30 text-primary-foreground/90'
                  : post.is_pinned && 'border-accent-foreground/30 text-accent-foreground/90'
              )}
              style={getCategoryStyle()}
              onClick={handleCategoryClick}
            >
              {getCategoryLabel(post.category)}
            </Badge>

            {post.flair_text && (
              <Badge
                className={cn(
                  `text-xs ${getFlairColor(post.flair_color)}`,
                  post.is_pinned && actualTheme === 'dark'
                    ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30'
                    : post.is_pinned &&
                        'bg-accent-foreground/20 text-accent-foreground border-accent-foreground/30'
                )}
              >
                {post.flair_text}
              </Badge>
            )}

            <PostActionMenu post={post} isPinned={post.is_pinned} />
          </div>
        </div>

        {/* Title - Always Present */}
        <h3
          className={cn(
            'reddit-post-title mb-3 line-clamp-2',
            getPinnedTextClass(),
            post.is_pinned && 'pinned-post'
          )}
        >
          {post.title || 'Post sem título'}
        </h3>

        {/* Content Preview or Multimedia */}
        {post.post_type === 'image' && post.image_url ? (
          <div className="mb-3">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full aspect-video object-cover rounded border"
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
                    className="w-full aspect-video rounded border"
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
                  className="w-full aspect-video object-cover rounded border"
                  preload="metadata"
                  crossOrigin="anonymous"
                  onError={e => {
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
        ) : post.post_type === 'link' && (post.link_url || post.link_preview_data) ? (
          <div className="mb-3">
            <div className="border rounded-lg overflow-hidden bg-card hover:bg-accent/15 transition-colors">
              <a
                href={post.link_url || post.link_preview_data?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex">
                  {post.link_preview_data?.image && (
                    <div className="w-24 h-20 flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={post.link_preview_data.image}
                        alt="Link preview"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {post.link_preview_data?.domain ||
                          (() => {
                            try {
                              return post.link_url
                                ? new URL(post.link_url).hostname
                                : 'Link externo';
                            } catch {
                              return 'Link externo';
                            }
                          })()}
                      </Badge>
                    </div>

                    {post.link_preview_data?.title && (
                      <h4
                        className={cn(
                          'font-medium text-sm line-clamp-2 mb-1',
                          getPinnedTextClass()
                        )}
                      >
                        {post.link_preview_data.title}
                      </h4>
                    )}

                    {post.link_preview_data?.description && (
                      <p
                        className={cn(
                          'text-xs line-clamp-2',
                          post.is_pinned ? getPinnedMutedTextClass() : 'text-muted-foreground'
                        )}
                      >
                        {post.link_preview_data.description}
                      </p>
                    )}

                    {post.link_preview_data?.siteName && (
                      <p
                        className={cn(
                          'text-xs mt-1',
                          post.is_pinned ? getPinnedMutedTextClass() : 'text-muted-foreground'
                        )}
                      >
                        {post.link_preview_data.siteName}
                      </p>
                    )}
                  </div>
                </div>
              </a>
            </div>
          </div>
        ) : post.content ? (
          <div
            className={cn(
              'reddit-post-body mb-3 line-clamp-3',
              post.is_pinned && actualTheme === 'dark'
                ? 'text-primary-foreground/90'
                : post.is_pinned && 'text-accent-foreground/90'
            )}
            dangerouslySetInnerHTML={{
              __html:
                post.content.length > 300 ? `${post.content.substring(0, 300)}...` : post.content,
            }}
          />
        ) : null}
      </div>

      {/* Bottom Action Row - Mobile-Optimized Touch Targets */}
      <div className="px-4 pb-3"> {/* Removed top padding for tighter spacing */}
        <div
          className={cn(
            'flex items-center text-muted-foreground',
            isMobile ? 'gap-3' : 'gap-3', // Consistent spacing
            getPinnedMutedTextClass()
          )}
        >
          {/* Vote Section */}
          <div onClick={e => e.stopPropagation()}>
            <VoteButton
              entityId={post.id.toString()}
              entityType="community_post"
              upvotes={post.upvotes}
              downvotes={post.downvotes}
              userVote={post.user_vote}
              orientation="horizontal"
              size="md"
              isPinned={post.is_pinned}
            />
          </div>

          {/* Comments - Pill-shaped button for both mobile and desktop */}
          <button
            className={cn(
              'flex items-center justify-center',
              'px-3 py-1.5 h-9 rounded-full border', // Reduced height from h-10 to h-9, py-2 to py-1.5
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted/10 transition-all duration-150',
              getCommentPillOutlineStyle(),
              post.is_pinned && actualTheme === 'dark'
                ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                : post.is_pinned &&
                    'text-accent-foreground/70 hover:text-accent-foreground hover:bg-accent-foreground/10'
            )}
            onClick={e => {
              e.stopPropagation();
              navigate(`/comunidade/${post.id}`);
            }}
          >
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className={cn('font-medium', isMobile ? 'text-xs' : 'text-sm')}>
                {isMobile 
                  ? post.reply_count 
                  : post.reply_count > 0 ? `${post.reply_count} comentários` : 'Nenhum comentário'
                }
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
