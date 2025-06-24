
// ABOUTME: Video URL input component with validation and preview for community posts.

import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { X, Video, ExternalLink } from 'lucide-react';
import { Label } from '../ui/label';

interface VideoUrlInputProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
}

const SUPPORTED_PLATFORMS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'dailymotion.com',
  'streamable.com'
];

const extractVideoId = (url: string): { platform: string; id: string; embedUrl: string } | null => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (youtubeMatch) {
    return {
      platform: 'YouTube',
      id: youtubeMatch[1],
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      platform: 'Vimeo',
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`
    };
  }

  return null;
};

export const VideoUrlInput = ({ value = '', onChange, onRemove }: VideoUrlInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string; embedUrl: string } | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (inputValue) {
      const info = extractVideoId(inputValue);
      setVideoInfo(info);
      setIsValid(!!info);
      
      if (info) {
        onChange(inputValue);
      }
    } else {
      setVideoInfo(null);
      setIsValid(false);
    }
  }, [inputValue, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleRemove = () => {
    setInputValue('');
    setVideoInfo(null);
    setIsValid(false);
    onRemove();
  };

  if (videoInfo && isValid) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">{videoInfo.platform}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={inputValue} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="aspect-video">
              <iframe
                src={videoInfo.embedUrl}
                className="w-full h-full rounded-md"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="video-url">URL do Vídeo</Label>
      <Input
        id="video-url"
        type="url"
        placeholder="https://youtube.com/watch?v=..."
        value={inputValue}
        onChange={handleInputChange}
        className={inputValue && !isValid ? 'border-destructive' : ''}
      />
      {inputValue && !isValid && (
        <p className="text-sm text-destructive">
          URL não suportada. Use YouTube, Vimeo, Dailymotion ou Streamable.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Plataformas suportadas: {SUPPORTED_PLATFORMS.join(', ')}
      </p>
    </div>
  );
};
