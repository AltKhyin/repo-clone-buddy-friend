// ABOUTME: WYSIWYG node component with Tiptap integration for caption typography support

import React, { useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { ImageBlockData } from '@/types/editor';
import { ImageIcon, ImageOff } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import {
  UnifiedBlockWrapper,
  useBlockStyling,
  useStyledBlockDataUpdate,
  PLACEHOLDERS,
} from '@/components/editor/shared';

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
  // Position props for unified wrapper
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  // Interaction callbacks
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
}

export const ImageBlockNode = React.memo<ImageBlockNodeProps>(
  ({ id, data, selected, width = 400, height = 300, x = 0, y = 0, onSelect, onMove }) => {
    const { updateNode } = useEditorStore();
    const { colors, getImagePlaceholderColors } = useEditorTheme();
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Use unified data update hook
    const { updateField } = useStyledBlockDataUpdate(id, data);

    // Handle caption updates from Tiptap
    const handleCaptionUpdate = useCallback(
      (nodeId: string, htmlCaption: string) => {
        updateNode(nodeId, {
          data: {
            ...data,
            htmlCaption,
          },
        });
      },
      [updateNode, data]
    );

    // Get initial content for caption field
    const getInitialCaption = () => {
      return data.htmlCaption || '<p></p>';
    };

    // Initialize Tiptap editor for caption
    const captionEditor = useTiptapEditor({
      nodeId: `${id}-caption`,
      initialContent: getInitialCaption(),
      placeholder: PLACEHOLDERS.IMAGE_CAPTION,
      onUpdate: handleCaptionUpdate,
      editable: true,
      fieldConfig: { fieldType: 'multi-line' },
    });

    // Use styling hook for consistent styling
    const { contentStyles } = useBlockStyling(data, selected || false, {
      defaultPaddingX: 16,
      defaultPaddingY: 16,
      minDimensions: { width: 100, height: 80 },
    });

    // Intersection observer for lazy loading
    const [containerRef, isInView] = useIntersectionObserver({
      threshold: 0.1,
      rootMargin: '100px',
      triggerOnce: true,
    });

    // Get unified styling
    const selectionClasses = selected ? 'ring-2 ring-blue-500' : '';
    const borderWidth = data.borderWidth || 0;
    const borderColor = data.borderColor || '#e5e7eb';

    // Get image placeholder colors from CSS custom properties
    const placeholderColors = getImagePlaceholderColors();

    // Apply styling with theme awareness
    const paddingX = data.paddingX ?? 16;
    const paddingY = data.paddingY ?? 16;
    const backgroundColor = data.backgroundColor ?? 'transparent';

    // Typography styles for caption field (like TextBlockNode)
    const captionDynamicStyles = {
      fontSize: data.fontSize ? `${data.fontSize}px` : '14px',
      textAlign: data.textAlign || 'center',
      color: data.color || colors.block.textSecondary,
      lineHeight: data.lineHeight || 1.5,
      fontFamily: data.fontFamily || 'inherit',
      fontWeight: data.fontWeight || 400,
      letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
      textTransform: data.textTransform || 'none',
      textDecoration: data.textDecoration || 'none',
      fontStyle: data.fontStyle || 'italic', // Default italic for captions
      width: '100%',
      cursor: 'text',
    } as React.CSSProperties;

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
      borderWidth: `${borderWidth}px`,
      borderColor: borderColor,
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

    // Override content styles for image-specific requirements
    const imageContentStyles = {
      ...contentStyles,
      backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : 'transparent',
      borderRadius: data.borderRadius ? `${data.borderRadius}px` : '8px',
      borderWidth: `${borderWidth}px`,
      borderColor: borderColor,
      borderStyle: 'solid',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
    };

    return (
      <UnifiedBlockWrapper
        id={id}
        width={width}
        height={height}
        x={x}
        y={y}
        selected={selected}
        blockType="imageBlock"
        contentStyles={imageContentStyles}
        minDimensions={{ width: 100, height: 80 }}
        maxDimensions={{ width: 1200, height: 800 }}
        onSelect={onSelect}
        onMove={onMove}
      >
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          data-node-id={id}
          data-testid="image-block-container"
          className="w-full h-full flex flex-col"
          style={{ minHeight: '100%' }}
        >
          {/* Main content area - fills wrapper exactly */}
          <div className="flex-1 flex flex-col justify-center items-center relative">
            {data.src && isInView ? (
              <>
                {/* Main Image - matches content boundaries exactly */}
                <img
                  src={optimizedUrl}
                  alt={data.alt || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: data.caption ? 'calc(100% - 2rem)' : '100%',
                    borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                    objectFit: 'contain',
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
                      width: '100%',
                      height: '100%',
                      maxHeight: data.caption ? 'calc(100% - 2rem)' : '100%',
                      borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                      objectFit: 'contain',
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
                    className="flex items-center justify-center animate-pulse w-full h-full"
                    style={{
                      borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                      backgroundColor: placeholderColors.background,
                    }}
                  >
                    <ImageIcon size={48} style={{ color: placeholderColors.text }} />
                  </div>
                )}

                {/* Error State */}
                {imageError && (
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed w-full h-full"
                    style={{
                      borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
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
              </>
            ) : data.src && !isInView ? (
              /* Placeholder while not in view */
              <div
                className="flex items-center justify-center w-full h-full"
                style={{
                  borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                  backgroundColor: placeholderColors.background,
                }}
              >
                <ImageIcon size={48} style={{ color: placeholderColors.text }} />
              </div>
            ) : (
              /* Empty State */
              <div
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg w-full h-full"
                style={{
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

          {/* Caption with Tiptap Integration */}
          {(data.htmlCaption || selected) && (
            <div className="mt-2 w-full">
              <div className="relative w-full">
                <EditorContent
                  editor={captionEditor.editor}
                  className="tiptap-image-caption max-w-none focus:outline-none text-center italic [&>*]:my-0 [&_p]:my-0"
                  style={captionDynamicStyles}
                />
                {/* Focus indicator for caption */}
                {captionEditor.isFocused && (
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-blue-400 ring-opacity-50 rounded" />
                )}
              </div>
            </div>
          )}

          {/* Accessibility Label for Screen Readers */}
          {data.alt && <span className="sr-only">Image: {data.alt}</span>}
        </div>
      </UnifiedBlockWrapper>
    );
  }
);
