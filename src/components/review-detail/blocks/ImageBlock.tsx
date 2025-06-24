
// ABOUTME: Enhanced image block component with improved responsive behavior and accessibility per [D3.6] and [DOC_7].

import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface ImageBlockData {
  url?: string;
  src?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
}

interface ImageBlockProps {
  data: ImageBlockData;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ data }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  console.log('ImageBlock data:', data);

  if (!data) {
    return null;
  }

  const imageUrl = data.url || data.src || '';
  const altText = data.alt || data.caption || 'Imagem do review';
  const caption = data.caption;
  const size = data.size || 'medium';

  // Enhanced responsive sizing per [D3.6]
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'max-w-xs md:max-w-sm';
      case 'medium':
        return 'max-w-md md:max-w-lg';
      case 'large':
        return 'max-w-lg md:max-w-2xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-md md:max-w-lg';
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  if (!imageUrl || imageError) {
    return (
      <figure className={`mx-auto ${getSizeClasses(size)} ${data.className || ''}`}>
        <div className="bg-muted/50 rounded-lg p-8 text-center border-2 border-dashed border-muted-foreground/20 aspect-video flex items-center justify-center">
          <div className="space-y-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {imageError ? 'Erro ao carregar imagem' : 'Imagem não disponível'}
            </p>
          </div>
        </div>
        {caption && (
          <figcaption className="mt-3 text-sm text-muted-foreground text-center italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className={`mx-auto ${getSizeClasses(size)} ${data.className || ''}`}>
      <div className="relative overflow-hidden rounded-lg bg-muted/20">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
            <div className="w-8 h-8 bg-muted-foreground/20 rounded-full animate-bounce"></div>
          </div>
        )}
        <img 
          src={imageUrl}
          alt={altText}
          className={`w-full h-auto object-cover transition-all duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100 hover:scale-105'
          }`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          {...(data.width && data.height && {
            width: data.width,
            height: data.height
          })}
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-muted-foreground text-center italic leading-relaxed">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default ImageBlock;
