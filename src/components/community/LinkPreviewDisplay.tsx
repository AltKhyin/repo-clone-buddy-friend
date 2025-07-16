// ABOUTME: Reusable component for displaying link previews with consistent styling across all community views.

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ExternalLink } from 'lucide-react';
import type { LinkPreviewData } from '@/types/community';

interface LinkPreviewDisplayProps {
  url: string;
  previewData?: LinkPreviewData | null;
  className?: string;
  showDomain?: boolean;
}

export const LinkPreviewDisplay = ({
  url,
  previewData,
  className = '',
  showDomain = true,
}: LinkPreviewDisplayProps) => {
  // Extract domain from URL for fallback
  const getDomain = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const domain = previewData?.domain || getDomain(url);
  const title = previewData?.title;
  const description = previewData?.description;
  const image = previewData?.image;

  return (
    <Card className={`overflow-hidden hover:bg-accent/5 transition-colors ${className}`}>
      <CardContent className="p-0">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <div className="flex">
            {image && (
              <div className="w-32 h-24 flex-shrink-0 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Link preview"
                  className="w-full h-full object-cover"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex-1 p-3 min-w-0">
              {showDomain && (
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {domain}
                  </Badge>
                </div>
              )}

              {title && (
                <h3 className="font-medium text-sm line-clamp-2 mb-1 hover:text-primary">
                  {title}
                </h3>
              )}

              {description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
              )}

              {!title && !description && <p className="text-sm text-muted-foreground">{url}</p>}
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
};
