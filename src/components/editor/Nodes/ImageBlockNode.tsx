// ABOUTME: React Flow node component for ImageBlock with WebP optimization and responsive sizing

import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { ImageBlockData } from '@/types/editor'
import { useEditorStore } from '@/store/editorStore'
import { ImageIcon, ImageOff } from 'lucide-react'

interface ImageBlockNodeData extends ImageBlockData {
  // Additional display properties
  paddingX?: number
  paddingY?: number
  borderWidth?: number
  borderColor?: string
  backgroundColor?: string
}

export const ImageBlockNode: React.FC<NodeProps<ImageBlockNodeData>> = ({ 
  id, 
  data, 
  selected 
}) => {
  const { updateNode, canvasTheme } = useEditorStore()
  const [imageError, setImageError] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)

  // Apply styling with theme awareness
  const paddingX = data.paddingX ?? 16
  const paddingY = data.paddingY ?? 16
  const borderWidth = data.borderWidth ?? 0
  const borderColor = data.borderColor ?? '#e5e7eb'
  const backgroundColor = data.backgroundColor ?? 'transparent'

  // Convert image URL to WebP if supported and provide fallback
  const getOptimizedImageUrl = (originalUrl: string): string => {
    if (!originalUrl) return ''
    
    // For demonstration purposes, this is a simple WebP optimization
    // In a real implementation, this would interface with an image service
    try {
      const url = new URL(originalUrl)
      
      // Check if it's already WebP
      if (url.pathname.endsWith('.webp')) {
        return originalUrl
      }
      
      // For common image hosts, add WebP parameters
      if (url.hostname.includes('imgur.com')) {
        return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp')
      }
      
      // For unsplash, add format parameter
      if (url.hostname.includes('unsplash.com')) {
        url.searchParams.set('fm', 'webp')
        url.searchParams.set('q', '80')
        return url.toString()
      }
      
      return originalUrl
    } catch {
      return originalUrl
    }
  }

  const optimizedUrl = getOptimizedImageUrl(data.src)

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  const handleImageClick = () => {
    // Focus the node when image is clicked
    updateNode(id, {})
  }

  // Calculate responsive sizing
  const imageWidth = data.width ? `${data.width}px` : '100%'
  const imageHeight = data.height ? `${data.height}px` : 'auto'
  const maxWidth = data.width ? Math.min(data.width, 600) : 600

  // Theme-aware base classes
  const getBaseClasses = () => {
    let classes = `relative rounded-lg shadow-sm transition-all duration-200 min-w-[200px] max-w-[${maxWidth}px]`
    
    // Apply theme-aware background and border classes only if no custom border/background
    if (backgroundColor === 'transparent' && borderWidth === 0) {
      if (canvasTheme === 'dark') {
        classes += ' bg-gray-800'
      } else {
        classes += ' bg-white'
      }
    }
    
    // Apply selection styles
    if (selected) {
      classes += ' border-blue-500 shadow-lg'
      if (borderWidth === 0) {
        classes += ' border-2'
      }
    } else if (borderWidth === 0) {
      // Default border when no custom border is set
      if (canvasTheme === 'dark') {
        classes += ' border-gray-600 border-2'
      } else {
        classes += ' border-gray-200 border-2'
      }
    }
    
    return classes
  }

  return (
    <div
      data-testid="image-block-container"
      className={getBaseClasses()}
      style={{
        padding: `${paddingY}px ${paddingX}px`,
        borderWidth: borderWidth > 0 ? `${borderWidth}px` : undefined,
        borderColor: borderWidth > 0 ? borderColor : undefined,
        borderStyle: borderWidth > 0 ? 'solid' : 'none',
        backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined,
      }}
      onClick={handleImageClick}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />

      <div className="relative">
        {data.src ? (
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
                display: imageError ? 'none' : 'block'
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
                  display: imageError && !imageLoaded ? 'block' : 'none'
                }}
                onLoad={handleImageLoad}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}

            {/* Loading State */}
            {!imageLoaded && !imageError && (
              <div 
                className={`
                  flex items-center justify-center bg-gray-100 animate-pulse
                  ${canvasTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}
                `}
                style={{
                  width: imageWidth,
                  height: imageHeight || '200px',
                  borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                  minHeight: '120px'
                }}
              >
                <ImageIcon 
                  size={48} 
                  className={canvasTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'} 
                />
              </div>
            )}

            {/* Error State */}
            {imageError && (
              <div 
                className={`
                  flex flex-col items-center justify-center border-2 border-dashed
                  ${canvasTheme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-500'
                  }
                `}
                style={{
                  width: imageWidth,
                  height: imageHeight || '200px',
                  borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px',
                  minHeight: '120px'
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
                className={`
                  mt-3 text-sm italic text-center
                  ${canvasTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
                `}
              >
                {data.caption}
              </p>
            )}
          </>
        ) : (
          /* Empty State */
          <div 
            className={`
              flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg
              ${canvasTheme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-gray-400' 
                : 'bg-gray-50 border-gray-300 text-gray-500'
              }
            `}
            style={{
              minHeight: '200px',
              borderRadius: data.borderRadius ? `${data.borderRadius}px` : '6px'
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
      {data.alt && (
        <span className="sr-only">
          Image: {data.alt}
        </span>
      )}
    </div>
  )
}