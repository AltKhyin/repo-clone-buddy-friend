// ABOUTME: Inspector section for media transform controls and placeholder configuration

import React, { useRef, useState } from 'react';
import { InspectorSection } from '../shared/InspectorSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image, Video, Upload, Link, Loader2 } from 'lucide-react';

interface MediaConfig {
  src: string;
  alt?: string;
  placeholder?: boolean;
  [key: string]: any;
}

interface MediaTransformSectionProps {
  nodeType: 'inlineImage' | 'videoEmbed';
  currentFit: string;
  currentSize: string;
  onFitChange: (fit: string) => void;
  onSizeChange: (size: string) => void;
  isPlaceholder?: boolean;
  onConfigurePlaceholder?: (config: MediaConfig) => void;
}

export const MediaTransformSection = ({
  nodeType,
  currentFit,
  currentSize,
  onFitChange,
  onSizeChange,
  isPlaceholder = false,
  onConfigurePlaceholder,
}: MediaTransformSectionProps) => {
  const isImage = nodeType === 'inlineImage';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing state to prevent focus loss during placeholder conversion
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Placeholder configuration handlers with deferred processing
  const handleFileUpload = async (file: File) => {
    if (!onConfigurePlaceholder) return;

    setIsProcessing(true);
    try {
      // Process file and convert placeholder in single operation
      await onConfigurePlaceholder({
        file,
        type: 'upload',
        alt: file.name,
        placeholder: false, // Deferred conversion after processing
      });

      // CRITICAL FIX: Defer state updates to prevent component re-render
      setTimeout(() => {
        setIsProcessing(false);
      }, 50); // Small delay to ensure TipTap updates finish
    } catch (error) {
      console.error('File upload failed:', error);
      setIsProcessing(false);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    if (!onConfigurePlaceholder || !url.trim()) return;

    setIsProcessing(true);
    try {
      // Process URL and convert placeholder in single operation
      await onConfigurePlaceholder({
        src: url.trim(),
        type: 'url',
        placeholder: false, // Deferred conversion after processing
      });

      // CRITICAL FIX: Defer input clearing to prevent focus loss
      // Clear input after TipTap updates are complete
      setTimeout(() => {
        setInputValue(''); // Clear input after successful processing
        setIsProcessing(false);
      }, 50); // Small delay to ensure TipTap updates finish
    } catch (error) {
      console.error('URL processing failed:', error);
      setIsProcessing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // CRITICAL FIX: Unified rendering - always render same component tree
  // Show/hide sections with CSS instead of conditional rendering to prevent focus loss
  return (
    <InspectorSection
      title={
        isPlaceholder
          ? `Configure ${isImage ? 'Image' : 'Video'}`
          : `${isImage ? 'Image' : 'Video'} Display`
      }
      icon={isImage ? Image : Video}
      compact
    >
      <div className="space-y-3">
        {/* Placeholder Configuration Section - Always rendered, conditionally visible */}
        <div className={isPlaceholder ? 'block' : 'hidden'}>
          {isImage ? (
            <>
              {/* Image File Upload */}
              <Button
                onClick={triggerFileUpload}
                className="w-full h-8 text-xs"
                variant="outline"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Upload size={14} className="mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Upload Image File'}
              </Button>

              {/* Image URL Input with controlled state */}
              <div className="space-y-2 mt-3">
                <Input
                  placeholder="Or paste image URL..."
                  className="h-8 text-xs"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleUrlSubmit(inputValue);
                    }
                  }}
                  disabled={isProcessing}
                />
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
            </>
          ) : (
            <>
              {/* Video URL Input with controlled state */}
              <div className="space-y-2">
                <Input
                  placeholder="YouTube, Vimeo, or direct video URL..."
                  className="h-8 text-xs"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleUrlSubmit(inputValue);
                    }
                  }}
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 size={12} className="animate-spin" />
                    Processing video URL...
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Supports YouTube, Vimeo, and direct video links
              </div>
            </>
          )}
        </div>

        {/* Transform Controls Section - Always rendered, conditionally visible */}
        <div className={!isPlaceholder ? 'block space-y-3' : 'hidden'}>
          {/* Simple Fit Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium">Fit Mode</label>
            <Select value={currentFit} onValueChange={onFitChange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">Contain</SelectItem>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="original">Original Size</SelectItem>
                <SelectItem value="fill">Fill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Simple Size Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium">Size</label>
            <div className="flex gap-1">
              {['small', 'medium', 'large', 'auto'].map(size => (
                <Button
                  key={size}
                  variant={currentSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSizeChange(size)}
                  className="flex-1 text-xs h-7"
                >
                  {size[0].toUpperCase() + size.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </InspectorSection>
  );
};
