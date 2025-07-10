// ABOUTME: Reddit-style sidebar card base component with exact visual styling matching Reddit's design

import React from 'react';
import { cn } from '@/lib/utils';

interface RedditSidebarCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  isLast?: boolean;
}

export const RedditSidebarCard = ({
  title,
  children,
  className,
  headerClassName,
  contentClassName,
  isLast = false,
}: RedditSidebarCardProps) => {
  return (
    <div
      className={cn('bg-reddit-sidebar-bg', !isLast && 'border-b border-reddit-divider', className)}
    >
      {title && (
        <div className={cn('px-4 pt-4 pb-2', headerClassName)}>
          <h3 className="text-[11px] font-bold text-reddit-text-meta uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      <div className={cn('px-4 pb-4', contentClassName)}>{children}</div>
    </div>
  );
};

interface RedditSidebarListProps {
  children: React.ReactNode;
  className?: string;
}

export const RedditSidebarList = ({ children, className }: RedditSidebarListProps) => {
  return <div className={cn('space-y-2', className)}>{children}</div>;
};

interface RedditSidebarListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export const RedditSidebarListItem = ({
  children,
  className,
  onClick,
  href,
}: RedditSidebarListItemProps) => {
  const baseClasses = cn(
    'text-sm text-reddit-text-secondary hover:text-reddit-text-primary cursor-pointer transition-colors',
    className
  );

  if (href) {
    return (
      <a href={href} className={baseClasses} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

interface RedditSidebarStatProps {
  label: string;
  value: string | number;
  className?: string;
}

export const RedditSidebarStat = ({ label, value, className }: RedditSidebarStatProps) => {
  return (
    <div className={cn('flex justify-between items-center', className)}>
      <span className="text-sm text-reddit-text-secondary">{label}</span>
      <span className="text-sm font-medium text-reddit-text-primary">{value}</span>
    </div>
  );
};

interface RedditSidebarButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const RedditSidebarButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: RedditSidebarButtonProps) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none rounded-full',
    {
      'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
      'bg-reddit-hover-bg text-reddit-text-primary hover:bg-reddit-hover-bg/80 border border-reddit-divider':
        variant === 'secondary',
      'border border-reddit-divider text-reddit-text-primary hover:bg-reddit-hover-bg':
        variant === 'outline',
    },
    {
      'px-3 py-1 text-xs': size === 'sm',
      'px-4 py-2 text-sm': size === 'md',
      'px-6 py-3 text-base': size === 'lg',
    },
    {
      'w-full': fullWidth,
    },
    className
  );

  return (
    <button className={baseClasses} onClick={onClick}>
      {children}
    </button>
  );
};

interface RedditSidebarDividerProps {
  className?: string;
}

export const RedditSidebarDivider = ({ className }: RedditSidebarDividerProps) => {
  return <hr className={cn('border-reddit-divider my-3', className)} />;
};
