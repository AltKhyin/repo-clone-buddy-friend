// ABOUTME: Reddit-style Custom section for flexible admin-configurable content with various content types

import React from 'react';
import {
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Zap,
  Star,
  Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  RedditSidebarCard,
  RedditSidebarList,
  RedditSidebarListItem,
  RedditSidebarButton,
  RedditSidebarDivider,
} from './RedditSidebarCard';
import type {
  CommunitySidebarSection,
  CommunitySidebarData,
} from '../../../../packages/hooks/useCommunityManagementQuery';

interface CustomSectionProps {
  section: CommunitySidebarSection;
  sidebarData: CommunitySidebarData;
}

const AlertTypeIcon = ({ type }: { type: string }) => {
  const iconMap = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    feature: Star,
    update: Zap,
  };

  const Icon = iconMap[type as keyof typeof iconMap] || Info;
  return <Icon className="h-4 w-4" />;
};

const AlertTypeStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  success:
    'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  warning:
    'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
  error:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  feature:
    'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300',
  update:
    'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
};

const TextContent = ({ content }: { content: any }) => (
  <div
    className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
    dangerouslySetInnerHTML={{ __html: content.html || content.text }}
  />
);

const LinkContent = ({ content }: { content: any }) => (
  <RedditSidebarListItem href={content.url} className="group">
    <div className="flex items-center gap-2">
      <LinkIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {content.title}
        </div>
        {content.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {content.description}
          </div>
        )}
      </div>
      <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
    </div>
  </RedditSidebarListItem>
);

const ImageContent = ({ content }: { content: any }) => (
  <div className="space-y-2">
    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {content.url ? (
        <img
          src={content.url}
          alt={content.alt || content.title || 'Imagem'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
    {content.title && (
      <div className="text-xs text-gray-600 dark:text-gray-400 text-center">{content.title}</div>
    )}
  </div>
);

const VideoContent = ({ content }: { content: any }) => (
  <div className="space-y-2">
    <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {content.url ? (
        <video controls className="w-full h-full" poster={content.thumbnail}>
          <source src={content.url} type="video/mp4" />
          Seu navegador não suporta reprodução de vídeo.
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
    {content.title && (
      <div className="text-xs text-gray-600 dark:text-gray-400 text-center">{content.title}</div>
    )}
  </div>
);

const AlertContent = ({ content }: { content: any }) => {
  const alertType = content.type || 'info';
  const alertStyles =
    AlertTypeStyles[alertType as keyof typeof AlertTypeStyles] || AlertTypeStyles.info;

  return (
    <div className={`p-3 rounded-lg border-l-4 ${alertStyles}`}>
      <div className="flex items-start gap-2">
        <AlertTypeIcon type={alertType} />
        <div className="flex-1 min-w-0">
          {content.title && <div className="font-medium text-sm mb-1">{content.title}</div>}
          <div className="text-sm leading-relaxed">{content.message}</div>
        </div>
      </div>
    </div>
  );
};

const ButtonContent = ({ content }: { content: any }) => {
  const handleClick = () => {
    if (content.action === 'link' && content.url) {
      window.open(content.url, content.external ? '_blank' : '_self');
    } else if (content.action === 'custom' && content.onClick) {
      content.onClick();
    }
  };

  return (
    <RedditSidebarButton
      variant={content.variant || 'default'}
      size={content.size || 'sm'}
      className="w-full"
      onClick={handleClick}
    >
      {content.icon && <span className="mr-2">{content.icon}</span>}
      {content.text}
    </RedditSidebarButton>
  );
};

const BadgeContent = ({ content }: { content: any }) => (
  <div className="flex flex-wrap gap-1">
    {content.badges?.map((badge: any, index: number) => (
      <Badge
        key={index}
        variant={badge.variant || 'outline'}
        className={`text-xs ${badge.className || ''}`}
      >
        {badge.text}
      </Badge>
    ))}
  </div>
);

const renderContentItem = (item: any, index: number) => {
  switch (item.type) {
    case 'text':
      return <TextContent key={index} content={item} />;
    case 'link':
      return <LinkContent key={index} content={item} />;
    case 'image':
      return <ImageContent key={index} content={item} />;
    case 'video':
      return <VideoContent key={index} content={item} />;
    case 'alert':
      return <AlertContent key={index} content={item} />;
    case 'button':
      return <ButtonContent key={index} content={item} />;
    case 'badge':
      return <BadgeContent key={index} content={item} />;
    case 'divider':
      return <RedditSidebarDivider key={index} />;
    default:
      return (
        <div key={index} className="text-xs text-gray-500 dark:text-gray-400 italic">
          Tipo de conteúdo não suportado: {item.type}
        </div>
      );
  }
};

export const CustomSection = ({ section, sidebarData }: CustomSectionProps) => {
  const content = section.content || {};
  const computedData = section.computed_data || {};

  const customContent = content.custom_content || [];
  const showHeader = content.show_header !== false;
  const headerIcon = content.header_icon || Settings;

  if (!customContent || customContent.length === 0) {
    return null;
  }

  return (
    <RedditSidebarCard title={section.title}>
      <div className="space-y-3">
        {/* Custom Header */}
        {showHeader && (
          <div className="flex items-center gap-2">
            <headerIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {content.header_subtitle || 'Seção personalizada'}
            </span>
          </div>
        )}

        {/* Custom Content Items */}
        <div className="space-y-3">
          {customContent.map((item: any, index: number) => renderContentItem(item, index))}
        </div>

        {/* Custom Footer */}
        {content.footer_text && (
          <>
            <RedditSidebarDivider />
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {content.footer_text}
            </div>
          </>
        )}
      </div>
    </RedditSidebarCard>
  );
};
