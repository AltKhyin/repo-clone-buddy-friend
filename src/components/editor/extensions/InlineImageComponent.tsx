// ABOUTME: React component for rendering inline images in TipTap editor with upload states

import React, { useState, useCallback, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  ExternalLink,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  Image,
  Eye,
} from 'lucide-react';
import {
  getMediaMaxWidth,
  getImageObjectFit,
  PLACEHOLDER_IMAGES,
  PLACEHOLDER_DIMENSIONS,
} from '../shared/mediaConstants';

interface InlineImageComponentProps extends NodeViewProps {
  // Inherited from NodeViewProps: node, updateAttributes, deleteNode, etc.
  editor?: any; // TipTap editor instance
}

export const InlineImageComponent = React.forwardRef<HTMLDivElement, InlineImageComponentProps>(({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
}, ref) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.src || node.attrs.placeholder);
  const [imageUrl, setImageUrl] = useState(node.attrs.src || '');
  const [altText, setAltText] = useState(node.attrs.alt || '');
  const [caption, setCaption] = useState(node.attrs.caption || '');
  const [isUploading, setIsUploading] = useState(node.attrs.uploading || false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(node.attrs.error || null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🎯 READ-ONLY MODE DETECTION: Check if editor is in read-only mode
  const isReadOnly = editor && !editor.isEditable;

  // Handle image URL update
  const handleSaveUrl = useCallback(() => {
    if (!imageUrl.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    updateAttributes({
      src: imageUrl,
      alt: altText,
      caption: caption,
      error: null,
      uploading: false,
      placeholder: false, // Convert from placeholder to real image
    });

    setError(null);
    setIsEditing(false);
  }, [imageUrl, altText, caption, updateAttributes]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      updateAttributes({
        uploading: true,
        error: null,
      });

      try {
        // Create a temporary blob URL for immediate preview
        const blobUrl = URL.createObjectURL(file);

        updateAttributes({
          src: blobUrl,
          alt: altText || file.name,
          caption: caption,
        });

        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Here you would typically upload to Supabase or your storage service
        // For now, we'll use the blob URL
        updateAttributes({
          uploading: false,
          error: null,
          placeholder: false, // Convert from placeholder to real image
        });

        setIsUploading(false);
        setIsEditing(false);
      } catch (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
        setError(errorMessage);
        updateAttributes({
          uploading: false,
          error: errorMessage,
        });
        setIsUploading(false);
      }
    },
    [altText, caption, updateAttributes]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  // Handle drag & drop
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));

      if (imageFile) {
        handleFileUpload(imageFile);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setError(null);
  }, []);

  const handleImageError = useCallback(() => {
    setError('Failed to load image');
    updateAttributes({ error: 'Failed to load image' });
  }, [updateAttributes]);

  // Render editing interface
  if (isEditing) {
    return (
      <NodeViewWrapper ref={ref} className="inline-image-wrapper">
        <div
          className="inline-block p-3 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10 max-w-md"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Image size={16} />
              Insert Image
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Input
                placeholder="Paste image URL..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="text-sm"
              />

              <Input
                placeholder="Alt text (accessibility)..."
                value={altText}
                onChange={e => setAltText(e.target.value)}
                className="text-sm"
              />

              <Input
                placeholder="Caption (optional)..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Uploading image...
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveUrl}
                disabled={!imageUrl.trim() || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <Eye size={14} className="mr-1" />
                )}
                {isUploading ? 'Uploading...' : 'Insert'}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload size={14} className="mr-1" />
                Upload
              </Button>

              <Button size="sm" variant="outline" onClick={deleteNode} disabled={isUploading}>
                <Trash2 size={14} />
              </Button>
            </div>

            {/* Drag & Drop Hint */}
            <div className="text-xs text-muted-foreground text-center border-t pt-2">
              Drop image files here or click Upload
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </NodeViewWrapper>
    );
  }

  // Render placeholder display
  if (node.attrs.placeholder && !isEditing) {
    return (
      <NodeViewWrapper ref={ref} className="inline-image-wrapper">
        <div
          className={`inline-block cursor-pointer ${selected && !isReadOnly ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
          onClick={() => setIsEditing(true)}
          data-placeholder="true"
        >
          <div className="relative border-2 border-dashed border-gray-300 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
            <img
              src={PLACEHOLDER_IMAGES.default}
              alt="Click to configure image"
              className="opacity-60"
              style={{
                width: isReadOnly ? 'auto' : PLACEHOLDER_DIMENSIONS.image.width,
                height: isReadOnly ? 'auto' : PLACEHOLDER_DIMENSIONS.image.height,
                maxWidth: isReadOnly 
                  ? 'var(--block-max-width, 100%)' 
                  : getMediaMaxWidth(node.attrs.size),
                display: 'block',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Image size={32} className="mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">Click to configure image</span>
              </div>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Render image display
  return (
    <NodeViewWrapper ref={ref} className="inline-image-wrapper">
      <div className={`inline-block group ${selected && !isReadOnly ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
        <div className="relative">
          {/* Image */}
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            title={node.attrs.title || ''}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="max-w-full h-auto rounded border"
            style={{
              // 🎯 BLOCK-AWARE SIZING: Use block constraints in read-only, original sizing in editor
              maxWidth: isReadOnly 
                ? 'var(--block-max-width, 100%)' 
                : (node.attrs.width
                  ? `${node.attrs.width}px`
                  : getMediaMaxWidth(node.attrs.size)),
              maxHeight: isReadOnly 
                ? 'none' 
                : (node.attrs.height ? `${node.attrs.height}px` : 'auto'),
              width: isReadOnly ? 'auto' : undefined,
              height: isReadOnly ? 'auto' : undefined,

              // Object-fit transform using shared utilities
              objectFit: getImageObjectFit(node.attrs.objectFit),
              aspectRatio: node.attrs.objectFit === 'cover' ? '16/9' : 'auto',
            }}
          />

          {/* Loading Overlay */}
          {!imageLoaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 border border-destructive rounded">
              <div className="text-center text-destructive text-sm">
                <AlertCircle size={20} className="mx-auto mb-1" />
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* Hover Controls - Hidden in read-only mode */}
          {selected && !error && !isReadOnly && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0"
                  title="Edit image"
                >
                  <Edit3 size={12} />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(node.attrs.src, '_blank')}
                  className="h-6 w-6 p-0"
                  title="Open full size"
                >
                  <ExternalLink size={12} />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={deleteNode}
                  className="h-6 w-6 p-0"
                  title="Delete image"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        {node.attrs.caption && (
          <div className="text-sm text-muted-foreground mt-1 text-center italic">
            {node.attrs.caption}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
});

InlineImageComponent.displayName = 'InlineImageComponent';
