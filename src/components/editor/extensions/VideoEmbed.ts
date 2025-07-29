// ABOUTME: TipTap extension for video embedding supporting YouTube, Vimeo, and direct video URLs

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VideoEmbedComponent } from './VideoEmbedComponent';

export interface VideoEmbedOptions {
  inline: boolean;
  HTMLAttributes: Record<string, any>;
  allowedProviders: ('youtube' | 'vimeo' | 'direct')[];
  width: number;
  height: number;
}

export interface VideoData {
  src: string;
  provider: 'youtube' | 'vimeo' | 'direct';
  videoId?: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  width?: number;
  height?: number;
  allowFullscreen?: boolean;
  placeholder?: boolean;
  objectFit?: string;
  size?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: {
      /**
       * Add a video embed
       */
      setVideoEmbed: (options: VideoData) => ReturnType;
    };
  }
}

// Video URL detection utilities
export const VideoUtils = {
  // YouTube URL patterns
  isYouTubeUrl: (url: string): boolean => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    return patterns.some(pattern => pattern.test(url));
  },

  // Vimeo URL patterns
  isVimeoUrl: (url: string): boolean => {
    const patterns = [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/];
    return patterns.some(pattern => pattern.test(url));
  },

  // Direct video file patterns
  isDirectVideoUrl: (url: string): boolean => {
    const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i;
    return videoExtensions.test(url);
  },

  // Extract YouTube video ID
  getYouTubeId: (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },

  // Extract Vimeo video ID
  getVimeoId: (url: string): string | null => {
    const patterns = [/vimeo\.com\/(\d+)/, /player\.vimeo\.com\/video\/(\d+)/];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },

  // Generate embed URL
  getEmbedUrl: (
    provider: 'youtube' | 'vimeo' | 'direct',
    videoId: string,
    options?: { autoplay?: boolean; muted?: boolean }
  ): string => {
    const { autoplay = false, muted = false } = options || {};

    switch (provider) {
      case 'youtube':
        const youtubeParams = new URLSearchParams({
          rel: '0',
          modestbranding: '1',
          showinfo: '0',
          ...(autoplay && { autoplay: '1' }),
          ...(muted && { mute: '1' }),
        });
        return `https://www.youtube.com/embed/${videoId}?${youtubeParams}`;

      case 'vimeo':
        const vimeoParams = new URLSearchParams({
          title: '0',
          byline: '0',
          portrait: '0',
          ...(autoplay && { autoplay: '1' }),
          ...(muted && { muted: '1' }),
        });
        return `https://player.vimeo.com/video/${videoId}?${vimeoParams}`;

      case 'direct':
        return videoId; // For direct videos, videoId is the full URL

      default:
        return videoId;
    }
  },

  // Generate thumbnail URL
  getThumbnailUrl: (provider: 'youtube' | 'vimeo' | 'direct', videoId: string): string => {
    switch (provider) {
      case 'youtube':
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      case 'vimeo':
        // Vimeo thumbnails require API call, fallback to placeholder
        return `https://vumbnail.com/${videoId}.jpg`;
      case 'direct':
        // For direct videos, we'll use a generic video placeholder
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+Cjxwb2x5Z29uIHBvaW50cz0iMTIwLDYwIDIwMCwxMjAgMTIwLDE4MCIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4=';
      default:
        return '';
    }
  },

  // Parse video URL and extract metadata
  parseVideoUrl: (url: string): VideoData | null => {
    url = url.trim();

    if (VideoUtils.isYouTubeUrl(url)) {
      const videoId = VideoUtils.getYouTubeId(url);
      if (!videoId) return null;

      return {
        src: url,
        provider: 'youtube',
        videoId,
        thumbnail: VideoUtils.getThumbnailUrl('youtube', videoId),
        width: 560,
        height: 315,
        allowFullscreen: true,
      };
    }

    if (VideoUtils.isVimeoUrl(url)) {
      const videoId = VideoUtils.getVimeoId(url);
      if (!videoId) return null;

      return {
        src: url,
        provider: 'vimeo',
        videoId,
        thumbnail: VideoUtils.getThumbnailUrl('vimeo', videoId),
        width: 560,
        height: 315,
        allowFullscreen: true,
      };
    }

    if (VideoUtils.isDirectVideoUrl(url)) {
      return {
        src: url,
        provider: 'direct',
        videoId: url,
        thumbnail: VideoUtils.getThumbnailUrl('direct', url),
        width: 560,
        height: 315,
        allowFullscreen: false,
      };
    }

    return null;
  },
};

export const VideoEmbed = Node.create<VideoEmbedOptions>({
  name: 'videoEmbed',

  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
      allowedProviders: ['youtube', 'vimeo', 'direct'],
      width: 560,
      height: 315,
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      provider: {
        default: 'youtube',
      },
      videoId: {
        default: null,
      },
      title: {
        default: null,
      },
      thumbnail: {
        default: null,
      },
      duration: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
      allowFullscreen: {
        default: true,
      },
      autoplay: {
        default: false,
      },
      muted: {
        default: false,
      },
      loading: {
        default: false,
      },
      error: {
        default: null,
      },
      // Transform attributes for media controls
      objectFit: {
        default: 'contain',
        rendered: false, // Don't render to HTML, used for styling
      },
      size: {
        default: 'medium',
        rendered: false,
      },
      // Placeholder state
      placeholder: {
        default: false,
        parseHTML: element => element.getAttribute('data-placeholder') === 'true',
        renderHTML: attributes => ({ 'data-placeholder': attributes.placeholder.toString() }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
      },
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: element => {
          const src = (element as HTMLElement).getAttribute('src');
          if (!src) return false;

          const videoData = VideoUtils.parseVideoUrl(src);
          return videoData || false;
        },
      },
      {
        tag: 'iframe[src*="vimeo.com"]',
        getAttrs: element => {
          const src = (element as HTMLElement).getAttribute('src');
          if (!src) return false;

          const videoData = VideoUtils.parseVideoUrl(src);
          return videoData || false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-video-embed': '',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedComponent);
  },

  addCommands() {
    return {
      setVideoEmbed:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      // Auto-detect video URLs in text and convert to embeds
      // This will be implemented as part of the paste handler
    ];
  },
});
