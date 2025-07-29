// ABOUTME: Shared constants and utilities for media transform features

/**
 * Media size configurations with consistent values across images and videos
 */
export const MEDIA_SIZES = {
  small: '320px',
  medium: '560px',
  large: '800px',
  auto: '100%',
} as const;

/**
 * Object fit options for media transforms
 */
export const OBJECT_FIT_OPTIONS = {
  contain: 'contain',
  cover: 'cover',
  fill: 'fill',
  original: 'original',
} as const;

/**
 * Type definitions for media transforms
 */
export type MediaSize = keyof typeof MEDIA_SIZES;
export type ObjectFitOption = keyof typeof OBJECT_FIT_OPTIONS;

/**
 * Get maximum width for media based on size setting
 */
export const getMediaMaxWidth = (size: string): string => {
  return MEDIA_SIZES[size as MediaSize] || MEDIA_SIZES.medium;
};

/**
 * Get CSS object-fit value for images
 */
export const getImageObjectFit = (objectFit?: string): string => {
  switch (objectFit) {
    case 'contain':
      return 'contain';
    case 'cover':
      return 'cover';
    case 'fill':
      return 'fill';
    case 'original':
      return 'none';
    default:
      return 'contain';
  }
};

/**
 * Get CSS object-fit value for video thumbnails
 */
export const getVideoThumbnailObjectFit = (objectFit?: string): string => {
  switch (objectFit) {
    case 'contain':
      return 'contain';
    case 'cover':
      return 'cover';
    case 'fill':
      return 'fill';
    case 'original':
      return 'none';
    default:
      return 'cover'; // Videos typically look better with cover
  }
};

/**
 * Get aspect ratio for video containers based on objectFit setting
 */
export const getVideoAspectRatio = (objectFit?: string): string => {
  switch (objectFit) {
    case 'original':
      return 'auto';
    case 'fill':
      return '16/9';
    case 'contain':
    case 'cover':
    default:
      return '16/9';
  }
};

/**
 * Placeholder configurations for media elements
 */
export const PLACEHOLDER_IMAGES = {
  // Base64 encoded minimal placeholder to avoid external dependencies
  default:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTM1SDIyNVYxNjVIMTc1VjEzNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAyMTBIMjUwVjE4MEgyMDBMMTc1IDE1MEwxNTAgMTgwVjIxMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHR5cGU+CiAgPHRzcGFuIHg9IjIwMCIgeT0iMjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjM3NEJCIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkNsaWNrIHRvIGNvbmZpZ3VyZSBpbWFnZTwvdHNwYW4+Cjwvdext54yGPC90ZXh0Pgo8L3N2Zz4K',
  loading:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIHN0cm9rZT0iI0U1RTdFQiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxwYXRoIGQ9Ik0zOCAyMEMyMCAzOCAyIDIwIDIwIDJDMjAgMTAgMzAgMTAgMzggMjBaIiBmaWxsPSIjMzMzOEZGIi8+CjxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiB2YWx1ZXM9IjAgMjAgMjA7MzYwIDIwIDIwIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPgo8L3N2Zz4K',
} as const;

export const PLACEHOLDER_VIDEOS = {
  thumbnail:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYwIiBoZWlnaHQ9IjMxNSIgdmlld0JveD0iMCAwIDU2MCAzMTUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1NjAiIGhlaWdodD0iMzE1IiBmaWxsPSIjMTExODI3Ii8+CjxjaXJjbGUgY3g9IjI4MCIgY3k9IjE1Ny41IiByPSI0MCIgZmlsbD0iIzMzMzhGRiIvPgo8cGF0aCBkPSJNMjk1IDEzN0wyOTUgMTc4TDI2NSAxNTcuNUwyOTUgMTM3WiIgZmlsbD0id2hpdGUiLz4KPHR5cGU+CiAgPHRzcGFuIHg9IjI4MCIgeT0iMjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjRkZGRkZGIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPkNsaWNrIHRvIGNvbmZpZ3VyZSB2aWRlbzwvdHNwYW4+Cjwvdype54yGPC90ZXh0Pgo8L3N2Zz4K',
  dimensions: { width: 560, height: 315 },
} as const;

export const PLACEHOLDER_DIMENSIONS = {
  image: { width: 400, height: 300 },
  video: { width: 560, height: 315 },
} as const;
