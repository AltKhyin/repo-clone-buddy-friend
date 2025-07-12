// ABOUTME: Standardized author display component for community posts, comments, and replies with profession information

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { AuthorInfo } from '@/types/community';

export interface CommunityAuthorProps {
  author: AuthorInfo | null;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  variant?: 'post-header' | 'comment' | 'sidebar' | 'compact';
  className?: string;
  showTimestamp?: boolean;
  timestamp?: string;
}

// Size configurations for different contexts
const SIZE_CONFIG = {
  sm: {
    avatar: 'h-6 w-6',
    name: 'text-xs',
    profession: 'text-xs',
  },
  md: {
    avatar: 'h-8 w-8',
    name: 'text-sm',
    profession: 'text-xs',
  },
  lg: {
    avatar: 'h-10 w-10',
    name: 'text-base',
    profession: 'text-sm',
  },
} as const;

// Variant-specific styling
const VARIANT_CONFIG = {
  'post-header': {
    container: 'flex items-center gap-3',
    nameColor: 'text-foreground',
    professionColor: 'text-muted-foreground',
  },
  comment: {
    container: 'flex items-center gap-2',
    nameColor: 'text-foreground',
    professionColor: 'text-muted-foreground',
  },
  sidebar: {
    container:
      'flex items-center gap-2 py-1 px-2 -mx-2 rounded hover:bg-reddit-hover-bg transition-colors',
    nameColor: 'text-reddit-text-primary',
    professionColor: 'text-reddit-text-meta',
  },
  compact: {
    container: 'flex items-center gap-1.5',
    nameColor: 'text-foreground',
    professionColor: 'text-muted-foreground',
  },
} as const;

export function CommunityAuthor({
  author,
  showAvatar = true,
  size = 'md',
  layout = 'horizontal',
  variant = 'post-header',
  className,
  showTimestamp = false,
  timestamp,
}: CommunityAuthorProps) {
  if (!author) {
    return (
      <div className={cn(VARIANT_CONFIG[variant].container, className)}>
        <span
          className={cn('font-medium', SIZE_CONFIG[size].name, VARIANT_CONFIG[variant].nameColor)}
        >
          [Usuário excluído]
        </span>
      </div>
    );
  }

  const sizeConfig = SIZE_CONFIG[size];
  const variantConfig = VARIANT_CONFIG[variant];

  // Generate avatar fallback
  const avatarFallback =
    author.full_name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';

  // Get profession display text following moderators section pattern
  const professionText = author.profession;

  if (layout === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center text-center', className)}>
        {showAvatar && (
          <Avatar className={sizeConfig.avatar}>
            <AvatarImage src={author.avatar_url || undefined} alt={author.full_name || 'User'} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0">
          <div className={cn('font-medium truncate', sizeConfig.name, variantConfig.nameColor)}>
            {author.full_name}
          </div>

          {professionText && (
            <div className={cn('truncate', sizeConfig.profession, variantConfig.professionColor)}>
              {professionText}
            </div>
          )}

          {showTimestamp && timestamp && (
            <div className={cn('truncate', sizeConfig.profession, variantConfig.professionColor)}>
              {timestamp}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={cn(variantConfig.container, className)}>
      {showAvatar && (
        <Avatar className={cn(sizeConfig.avatar, layout === 'horizontal' ? 'flex-shrink-0' : '')}>
          <AvatarImage src={author.avatar_url || undefined} alt={author.full_name || 'User'} />
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-medium truncate', sizeConfig.name, variantConfig.nameColor)}>
            {author.full_name}
          </span>

          {showTimestamp && timestamp && (
            <span className={cn('truncate', sizeConfig.profession, variantConfig.professionColor)}>
              • {timestamp}
            </span>
          )}
        </div>

        {professionText && (
          <div className={cn('truncate', sizeConfig.profession, variantConfig.professionColor)}>
            {professionText}
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function PostAuthor(props: Omit<CommunityAuthorProps, 'variant'>) {
  return <CommunityAuthor {...props} variant="post-header" />;
}

export function CommentAuthor(props: Omit<CommunityAuthorProps, 'variant'>) {
  return <CommunityAuthor {...props} variant="comment" />;
}

export function SidebarAuthor(props: Omit<CommunityAuthorProps, 'variant'>) {
  return <CommunityAuthor {...props} variant="sidebar" />;
}

export function CompactAuthor(props: Omit<CommunityAuthorProps, 'variant'>) {
  return <CommunityAuthor {...props} variant="compact" />;
}
