// ABOUTME: Utility functions for handling video URLs and formats

/**
 * Converts various YouTube URL formats to embeddable format
 */
export function convertToEmbeddableYouTubeUrl(url: string): string {
  // Return as-is if already embeddable
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Extract video ID from various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Return original URL if no pattern matches
  return url;
}

/**
 * Converts Vimeo URL to embeddable format
 */
export function convertToEmbeddableVimeoUrl(url: string): string {
  // Return as-is if already embeddable
  if (url.includes('player.vimeo.com/video/')) {
    return url;
  }

  // Extract video ID from Vimeo URL
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) {
    const videoId = match[1];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  return url;
}

/**
 * Validates if a URL is a valid video source
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;

  // YouTube patterns
  const youtubePatterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//,
    /youtube\.com\/v\//,
    /youtube\.com\/shorts\//
  ];

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/\d+/,
    /player\.vimeo\.com\/video\/\d+/
  ];

  // Direct video file patterns
  const directVideoPatterns = [
    /\.(mp4|webm|ogg|avi|mov|wmv|flv)(\?.*)?$/i
  ];

  // Check if URL matches any valid pattern
  return [
    ...youtubePatterns,
    ...vimeoPatterns,
    ...directVideoPatterns
  ].some(pattern => pattern.test(url));
}

/**
 * Processes a video URL to make it embeddable and valid
 */
export function processVideoUrl(url: string): string {
  if (!url) return url;

  // Clean up the URL
  const cleanUrl = url.trim();

  // Convert YouTube URLs to embeddable format
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return convertToEmbeddableYouTubeUrl(cleanUrl);
  }

  // Convert Vimeo URLs to embeddable format
  if (cleanUrl.includes('vimeo.com')) {
    return convertToEmbeddableVimeoUrl(cleanUrl);
  }

  // Return direct video URLs as-is
  return cleanUrl;
}

/**
 * Gets video type based on URL
 */
export function getVideoType(url: string): 'youtube' | 'vimeo' | 'direct' | 'unknown' {
  if (!url) return 'unknown';

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }

  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }

  if (/\.(mp4|webm|ogg|avi|mov|wmv|flv)(\?.*)?$/i.test(url)) {
    return 'direct';
  }

  return 'unknown';
}