// ABOUTME: WYSIWYG node component

import React from 'react';
import { VideoEmbedBlockData } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { PlayCircle, ExternalLink, Video } from 'lucide-react';
interface VideoEmbedBlockNodeData extends VideoEmbedBlockData {
  // Additional display properties
  paddingX?: number;
  paddingY?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

interface VideoEmbedBlockNodeProps {
  id: string;
  data: VideoEmbedBlockNodeData;
  selected: boolean;
}

export const VideoEmbedBlockNode: React.FC<VideoEmbedBlockNodeProps> = ({ id, data, selected }) => {
  const { updateNode } = useEditorStore();
  const { colors } = useEditorTheme();

  // Get theme-aware styles and colors

  // Get unified styling
  const selectionClasses = selected ? 'ring-2 ring-blue-500' : '';
  const borderStyles = {
    borderWidth: data.borderWidth || 0,
    borderColor: data.borderColor || '#e5e7eb',
  };

  // Apply styling with theme awareness
  const paddingX = data.paddingX ?? 16;
  const paddingY = data.paddingY ?? 16;
  const backgroundColor = data.backgroundColor ?? 'transparent';
  const borderRadius = data.borderRadius ?? 8;

  const handleVideoClick = () => {
    // Focus the node when video is clicked
    updateNode(id, {});
  };

  // Extract video ID from URL and generate embed URL
  const getEmbedData = (url: string, platform: 'youtube' | 'vimeo') => {
    if (!url) return null;

    try {
      const urlObj = new URL(url);

      if (platform === 'youtube') {
        // Handle various YouTube URL formats
        let videoId = '';

        if (urlObj.hostname.includes('youtube.com')) {
          videoId = urlObj.searchParams.get('v') || '';
        } else if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        }

        if (videoId) {
          const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1${data.autoplay ? '&autoplay=1' : ''}`;
          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          return { embedUrl, thumbnailUrl, videoId };
        }
      } else if (platform === 'vimeo') {
        // Handle Vimeo URLs
        const match = url.match(/vimeo\.com\/(\d+)/);
        const videoId = match ? match[1] : '';

        if (videoId) {
          const embedUrl = `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0${data.autoplay ? '&autoplay=1' : ''}`;
          return { embedUrl, thumbnailUrl: null, videoId };
        }
      }
    } catch (error) {
      console.warn('Invalid video URL:', url);
    }

    return null;
  };

  const embedData = getEmbedData(data.url, data.platform);

  // Dynamic styles with unified border styling
  const dynamicStyles = {
    padding: `${paddingY}px ${paddingX}px`,
    backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
    ...borderStyles,
    borderRadius: `${borderRadius}px`,
    minWidth: '300px',
    maxWidth: '800px',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties;

  const selectionIndicatorProps = {
    className:
      'absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10',
    children: 'Video Block Selected',
  };

  return (
    <>
      <div
        data-block-type="videoEmbedBlock"
        data-block-id={id}
        className={`relative cursor-pointer ${selectionClasses}`}
        style={{
          ...dynamicStyles,
          borderRadius: `${borderRadius}px`,
          backgroundColor: dynamicStyles.backgroundColor,
          padding: `${paddingY}px ${paddingX}px`,
        }}
        onClick={handleVideoClick}
      >
        {/* Selection indicator */}
        {selected && <div {...selectionIndicatorProps} />}

        <div className="relative">
          {data.url && embedData ? (
            <>
              {/* Responsive Video Embed Container */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  paddingBottom: '56.25%', // 16:9 aspect ratio
                  borderRadius: `${borderRadius}px`,
                }}
              >
                <iframe
                  src={embedData.embedUrl}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ borderRadius: `${borderRadius}px` }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${data.platform} video`}
                />
              </div>

              {/* Video Controls Overlay (for non-autoplay videos) */}
              {!data.autoplay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <PlayCircle size={64} className="text-white drop-shadow-lg" />
                </div>
              )}

              {/* Platform Badge */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {data.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
              </div>

              {/* External Link Button */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  window.open(data.url, '_blank');
                }}
                className="absolute top-2 left-2 p-1.5 rounded-full transition-all bg-white hover:bg-gray-50 text-gray-600 shadow-md hover:shadow-lg"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </button>
            </>
          ) : (
            /* Empty State */
            <div
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg"
              style={{
                backgroundColor: colors.block.backgroundSecondary,
                borderColor: colors.block.border,
                color: colors.block.textSecondary,
                minHeight: '200px',
                borderRadius: `${borderRadius}px`,
              }}
            >
              <Video size={48} className="mb-4" />
              <p className="text-sm font-medium mb-1">No video URL provided</p>
              <p className="text-xs opacity-75 text-center">
                Select this block and add a YouTube or Vimeo URL in the inspector
              </p>

              {/* Platform Examples */}
              <div className="mt-4 text-xs opacity-60 text-center">
                <p>Supported formats:</p>
                <p>• youtube.com/watch?v=...</p>
                <p>• youtu.be/...</p>
                <p>• vimeo.com/...</p>
              </div>
            </div>
          )}

          {/* Invalid URL State */}
          {data.url && !embedData && (
            <div
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-300 rounded-lg"
              style={{
                backgroundColor: colors.interactive.error + '10',
                color: colors.interactive.error,
                minHeight: '200px',
                borderRadius: `${borderRadius}px`,
              }}
            >
              <Video size={48} className="mb-4" />
              <p className="text-sm font-medium mb-1">Invalid video URL</p>
              <p className="text-xs opacity-75 text-center">
                Please check the URL format and try again
              </p>
            </div>
          )}
        </div>

        {/* Accessibility Label for Screen Readers */}
        <span className="sr-only">Video embed: {data.platform} video</span>
      </div>
    </>
  );
};
