// ABOUTME: WYSIWYG node component

import React from 'react';
import { ImageBlockData } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { ImageIcon, ImageOff } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface ImageBlockNodeData extends ImageBlockData {
  // Additional display properties
  paddingX?: number;
  paddingY?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
}

interface ImageBlockNodeProps {
  id: string;
  data: ImageBlockNodeData;
  selected: boolean;
}

export const ImageBlockNode = React.memo<ImageBlockNodeProps>(({ id, data, selected }) => {
  const { updateNode } = useEditorStore();
  const { colors, getImagePlaceholderColors } = useEditorTheme();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Intersection observer for lazy loading
  const [containerRef, isInView] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true,
  });

  // Get unified styling
  const selectionClasses = selected ? 'ring-2 ring-blue-500' : '';
  const borderStyles = {
    borderWidth: data.borderWidth || 0,
    borderColor: data.borderColor || '#e5e7eb',
  };

  // Get image placeholder colors from CSS custom properties
  const placeholderColors = getImagePlaceholderColors();

  // Apply styling with theme awareness
  const paddingX = data.paddingX ?? 16;
  const paddingY = data.paddingY ?? 16;
  const backgroundColor = data.backgroundColor ?? 'transparent';

  // Convert image URL to WebP if supported and provide fallback
  const getOptimizedImageUrl = (originalUrl: string): string => {
    if (!originalUrl) return '';

    // For demonstration purposes, this is a simple WebP optimization
    // In a real implementation, this would interface with an image service
    try {
      const url = new URL(originalUrl);

      // Check if it's already WebP
      if (url.pathname.endsWith('.webp')) {
        return originalUrl;
      }

      // For common image hosts, add WebP parameters
      if (url.hostname.includes('imgur.com')) {
        return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }

      // For unsplash, add format parameter
      if (url.hostname.includes('unsplash.com')) {
        url.searchParams.set('fm', 'webp');
        url.searchParams.set('q', '80');
        return url.toString();
      }

      return originalUrl;
    } catch {
      return originalUrl;
    }
  };

  const optimizedUrl = getOptimizedImageUrl(data.src);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageClick = () => {
    // Focus the node when image is clicked
    updateNode(id, {});
  };

  // Calculate responsive sizing
  const imageWidth = data.width ? `${data.width}px` : '100%';
  const imageHeight = data.height ? `${data.height}px` : 'auto';
  const maxWidth = data.width ? Math.min(data.width, 600) : 600;

  // Dynamic styles with unified border styling and theme integration
  const dynamicStyles = {
    padding: `${paddingY}px ${paddingX}px`,
    backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
    ...borderStyles,
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : '8px',
    minWidth: '200px',
    maxWidth: `${maxWidth}px`,
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties;

  const selectionIndicatorProps = {
    className:
      'absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10',
    children: 'Image Block Selected',
  };

  return (
    <>
      <div
        data-block-type="imageBlock"
        className={`relative cursor-pointer ${selectionClasses}`}
        style={dynamicStyles}
      >
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          data-node-id={id}
          data-testid="image-block-container"
          onClick={handleImageClick}
          className="w-full h-full"
        >
          {/* Selection indicator */}
          {selected && <div {...selectionIndicatorProps} />}

          <div className="relative">
            {data.src && isInView ? (
              <>
                {/* Main Image */}
                <img
                  src={optimizedUrl}
                  alt={data.alt || ''}
                  style={{
                    width: imageWidth,
                    height: imageHeight,
                    borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                    maxWidth: '100%',
                    objectFit: 'cover',
                    display: imageError ? 'none' : 'block',
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                  className={`
                transition-all duration-300
                ${!imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'}
              `}
                />

                {/* Fallback Image */}
                {optimizedUrl !== data.src && (
                  <img
                    src={data.src}
                    alt={data.alt || ''}
                    style={{
                      width: imageWidth,
                      height: imageHeight,
                      borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                      maxWidth: '100%',
                      objectFit: 'cover',
                      display: imageError && !imageLoaded ? 'block' : 'none',
                    }}
                    onLoad={handleImageLoad}
                    onError={() => setImageError(true)}
                    loading="lazy"
                  />
                )}

                {/* Loading State */}
                {!imageLoaded && !imageError && (
                  <div
                    className="flex items-center justify-center animate-pulse"
                    style={{
                      width: imageWidth,
                      height: imageHeight || '200px',
                      borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                      minHeight: '120px',
                      backgroundColor: placeholderColors.background,
                    }}
                  >
                    <ImageIcon size={48} style={{ color: placeholderColors.text }} />
                  </div>
                )}

                {/* Error State */}
                {imageError && (
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed"
                    style={{
                      width: imageWidth,
                      height: imageHeight || '200px',
                      borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                      minHeight: '120px',
                      backgroundColor: placeholderColors.background,
                      borderColor: placeholderColors.border,
                      color: placeholderColors.text,
                    }}
                  >
                    <ImageOff size={48} className="mb-2" />
                    <p className="text-sm font-medium">Failed to load image</p>
                    <p className="text-xs opacity-75">Check the URL and try again</p>
                  </div>
                )}

                {/* Caption */}
                {data.caption && (
                  <p
                    className="mt-3 text-sm italic text-center"
                    style={{ color: colors.block.textSecondary }}
                  >
                    {data.caption}
                  </p>
                )}
              </>
            ) : data.src && !isInView ? (
              /* Placeholder while not in view */
              <div
                className="flex items-center justify-center"
                style={{
                  width: imageWidth,
                  height: imageHeight || '200px',
                  borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                  minHeight: '120px',
                  backgroundColor: placeholderColors.background,
                }}
              >
                <ImageIcon size={48} style={{ color: placeholderColors.text }} />
              </div>
            ) : (
              /* Empty State */
              <div
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg"
                style={{
                  minHeight: '200px',
                  borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                  backgroundColor: placeholderColors.background,
                  borderColor: placeholderColors.border,
                  color: placeholderColors.text,
                }}
              >
                <ImageIcon size={48} className="mb-4" />
                <p className="text-sm font-medium mb-1">No image selected</p>
                <p className="text-xs opacity-75 text-center">
                  Select this block and add an image URL in the inspector
                </p>
              </div>
            )}
          </div>

          {/* Accessibility Label for Screen Readers */}
          {data.alt && <span className="sr-only">Image: {data.alt}</span>}
        </div>
      </div>
    </>
  );
});
