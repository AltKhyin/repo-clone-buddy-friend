// ABOUTME: Inspector panel for ImageBlock with comprehensive customization controls

import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEditorStore } from '@/store/editorStore';
import { supabase } from '@/integrations/supabase/client';
import { SpacingControls } from './shared/SpacingControls';
import { BorderControls } from './shared/BorderControls';
import {
  ImageIcon,
  ExternalLink,
  Upload,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Move,
  Square,
} from 'lucide-react';

// Utility function to sanitize color values for HTML color inputs
const sanitizeColorForInput = (color: string | undefined, fallback: string): string => {
  if (!color || color === 'transparent') {
    return fallback;
  }
  return color;
};

interface ImageBlockInspectorProps {
  nodeId: string;
}

export const ImageBlockInspector: React.FC<ImageBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'imageBlock') return null;

  const data = node.data;

  const updateNodeData = (updates: Partial<typeof data>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Helper functions to convert between HTML and plain text for inspector editing
  const htmlToText = (html: string): string => {
    if (!html || html === '<p></p>' || html === '<p><br></p>') return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p><p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  const textToHtml = (text: string): string => {
    if (!text || text.trim() === '') return '<p></p>';
    return `<p>${text.replace(/\n/g, '<br>')}</p>`;
  };

  const handleImageUrlChange = (url: string) => {
    updateNodeData({ src: url });
    setUploadError(null);
    setUploadSuccess(false);
  };

  // Image upload functionality
  const generateFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `images/${timestamp}-${randomId}.${extension}`;
  };

  const validateImageFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select a valid image file';
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'Image must be smaller than 10MB';
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      return 'Supported formats: JPEG, PNG, WebP, GIF';
    }

    return null;
  };

  const compressImage = async (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920px width while maintaining aspect ratio)
        const maxWidth = 1920;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);

        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/webp', // Convert to WebP for better compression
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const fileName = generateFileName(file.name);

    // Upload with progress tracking
    const { data, error } = await supabase.storage.from('review-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(error.message || 'Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('review-images').getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get image URL');
    }

    return urlData.publicUrl;
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      setUploadProgress(20);

      // Compress image
      const compressedFile = await compressImage(file);
      setUploadProgress(50);

      // Upload to Supabase
      const imageUrl = await uploadImageToSupabase(compressedFile);
      setUploadProgress(90);

      // Update node data
      updateNodeData({ src: imageUrl });
      setUploadProgress(100);
      setUploadSuccess(true);

      // Show success for 2 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      handleFileUpload(file);
    }
    // Reset input value to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setOriginalImageFile(file);
      handleFileUpload(file);
    }
  };

  const handleDeleteImage = () => {
    updateNodeData({ src: '' });
    setUploadError(null);
    setUploadSuccess(false);
    setCroppedImageUrl(null);
    setOriginalImageFile(null);
  };

  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    } catch {
      return false;
    }
  };

  const isValidUrl = data.src ? validateImageUrl(data.src) : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon size={16} />
        <h3 className="font-medium">Image Block</h3>
      </div>

      <Separator />

      {/* Image Source Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Upload size={14} />
          Image Source
        </h4>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 transition-colors hover:border-muted-foreground/50 hover:bg-muted/10"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Upload Status */}
            {isUploading && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span className="text-sm">Uploading image...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  {uploadProgress < 30 && 'Validating image...'}
                  {uploadProgress >= 30 && uploadProgress < 60 && 'Compressing image...'}
                  {uploadProgress >= 60 && uploadProgress < 90 && 'Uploading to cloud...'}
                  {uploadProgress >= 90 && 'Finalizing...'}
                </p>
              </div>
            )}

            {/* Success State */}
            {uploadSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Upload successful!</span>
              </div>
            )}

            {/* Error State */}
            {uploadError && (
              <Alert className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Upload Interface */}
            {!isUploading && !uploadSuccess && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <FileImage size={32} className="text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Drop image here or click to upload</p>
                    <p className="text-xs text-muted-foreground">
                      Supports JPEG, PNG, WebP, GIF (max 10MB)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-8"
                    disabled={isUploading}
                  >
                    <Upload size={14} className="mr-1" />
                    Upload File
                  </Button>

                  {data.src && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteImage}
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                      title="Remove current image"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </>
            )}
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

        {/* Current Image Preview */}
        {data.src && !isUploading && (
          <div className="space-y-2">
            <Label className="text-xs">Current Image</Label>
            <div className="relative group">
              <img
                src={data.src}
                alt={data.alt || 'Image preview'}
                className="w-full h-24 object-cover rounded border"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(data.src, '_blank')}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink size={12} className="mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDeleteImage}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 size={12} className="mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Manual URL Input */}
        <div className="space-y-2">
          <Label htmlFor="image-url" className="text-xs">
            Or paste image URL
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-url"
              type="url"
              value={data.src || ''}
              onChange={e => handleImageUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={`flex-1 h-8 text-xs ${!isValidUrl ? 'border-red-400' : ''}`}
              disabled={isUploading}
            />
            {data.src && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(data.src, '_blank')}
                className="h-8 px-2"
                title="Open image in new tab"
                disabled={isUploading}
              >
                <ExternalLink size={14} />
              </Button>
            )}
          </div>
          {!isValidUrl && data.src && (
            <p className="text-xs text-red-500">
              Please enter a valid image URL (.jpg, .png, .gif, .webp, .svg)
            </p>
          )}
        </div>

        {/* Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="image-alt" className="text-xs">
            Alt Text (Accessibility)
          </Label>
          <Input
            id="image-alt"
            value={data.alt || ''}
            onChange={e => updateNodeData({ alt: e.target.value })}
            placeholder="Describe the image for screen readers..."
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Describes the image content for screen readers and SEO
          </p>
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <Label htmlFor="image-caption" className="text-xs">
            Caption (Optional)
          </Label>
          <Textarea
            id="image-caption"
            value={htmlToText(data.htmlCaption || '')}
            onChange={e => {
              const htmlCaption = textToHtml(e.target.value);
              updateNodeData({ htmlCaption });
            }}
            placeholder="Optional caption displayed below the image..."
            className="text-xs min-h-[60px]"
          />
        </div>
      </div>

      <Separator />

      {/* Styling Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ImageIcon size={14} />
          Image Styling
        </h4>

        {/* Background Color */}
        <div className="space-y-2">
          <Label className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={sanitizeColorForInput(data.backgroundColor, '#ffffff')}
              onChange={e => updateNodeData({ backgroundColor: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.backgroundColor || 'transparent'}
              onChange={e => updateNodeData({ backgroundColor: e.target.value })}
              placeholder="transparent"
              className="flex-1 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ backgroundColor: 'transparent' })}
              className="h-8 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Border Color */}
        <div className="space-y-2">
          <Label className="text-xs">Border Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={sanitizeColorForInput(data.borderColor, '#e5e7eb')}
              onChange={e => updateNodeData({ borderColor: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.borderColor || '#e5e7eb'}
              onChange={e => updateNodeData({ borderColor: e.target.value })}
              placeholder="#e5e7eb"
              className="flex-1 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ borderColor: '#e5e7eb' })}
              className="h-8 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Caption Text Color */}
        <div className="space-y-2">
          <Label className="text-xs">Caption Text Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={sanitizeColorForInput(data.color, '#6b7280')}
              onChange={e => updateNodeData({ color: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.color || '#6b7280'}
              onChange={e => updateNodeData({ color: e.target.value })}
              placeholder="#6b7280"
              className="flex-1 h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ color: '#6b7280' })}
              className="h-8 px-2 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Spacing & Layout Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Move size={14} />
          Spacing & Layout
        </h4>

        {/* Spacing Controls - Padding */}
        <SpacingControls
          data={data}
          onChange={updateNodeData}
          fields={[
            {
              key: 'paddingX',
              label: 'Horizontal Padding',
              min: 0,
              max: 80,
              step: 2,
              unit: 'px',
              category: 'padding',
            },
            {
              key: 'paddingY',
              label: 'Vertical Padding',
              min: 0,
              max: 80,
              step: 2,
              unit: 'px',
              category: 'padding',
            },
          ]}
          compact={true}
          enablePresets={true}
          enableBorders={false}
          showDetailedControls={false}
        />
      </div>

      <Separator />

      {/* Border & Radius Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Square size={14} />
          Border & Corners
        </h4>

        {/* Border Controls */}
        <BorderControls
          data={data}
          onChange={updateNodeData}
          enableToggle={true}
          enableStyle={false}
          enableRadius={true}
          compact={true}
          widthKey="borderWidth"
          colorKey="borderColor"
          radiusKey="borderRadius"
          defaultWidth={1}
          defaultColor="#e5e7eb"
          defaultRadius={8}
          maxWidth={8}
          maxRadius={32}
        />
      </div>
    </div>
  );
};
