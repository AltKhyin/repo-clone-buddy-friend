// ABOUTME: Inspector panel for ImageBlock with comprehensive customization controls

import React, { useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEditorStore } from '@/store/editorStore';
import { SafeSwitch } from '../SafeSwitch';
import { supabase } from '@/integrations/supabase/client';
import {
  ImageIcon,
  Palette,
  Maximize2,
  ExternalLink,
  Upload,
  RefreshCw,
  Crop,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
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

  // Common image sizes for quick selection
  const imageSizes = [
    { label: 'Auto', width: undefined, height: undefined },
    { label: 'Small (300px)', width: 300, height: undefined },
    { label: 'Medium (500px)', width: 500, height: undefined },
    { label: 'Large (700px)', width: 700, height: undefined },
    { label: 'Square 300x300', width: 300, height: 300 },
    { label: 'Square 400x400', width: 400, height: 400 },
    { label: 'Landscape 16:9', width: 600, height: 338 },
    { label: 'Portrait 3:4', width: 450, height: 600 },
  ];

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

  const handleSizePreset = (preset: (typeof imageSizes)[0]) => {
    updateNodeData({
      width: preset.width,
      height: preset.height,
    });
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
            value={data.caption || ''}
            onChange={e => updateNodeData({ caption: e.target.value })}
            placeholder="Optional caption displayed below the image..."
            className="text-xs min-h-[60px]"
          />
        </div>
      </div>

      <Separator />

      {/* Size & Dimensions Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Maximize2 size={14} />
          Size & Dimensions
        </h4>

        {/* Size Presets */}
        <div className="space-y-2">
          <Label className="text-xs">Size Presets</Label>
          <Select
            value={
              imageSizes.find(size => size.width === data.width && size.height === data.height)
                ?.label || 'Custom'
            }
            onValueChange={value => {
              const preset = imageSizes.find(size => size.label === value);
              if (preset) {
                handleSizePreset(preset);
              }
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageSizes.map(size => (
                <SelectItem key={size.label} value={size.label}>
                  {size.label}
                </SelectItem>
              ))}
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Width */}
        <div className="space-y-2">
          <Label htmlFor="image-width" className="text-xs">
            Width
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-width"
              type="number"
              value={data.width || ''}
              onChange={e =>
                updateNodeData({ width: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="Auto"
              className="flex-1 h-8 text-xs"
              min={50}
              max={1200}
            />
            <span className="text-xs text-muted-foreground">px</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ width: undefined })}
              className="h-8 px-2 text-xs"
            >
              Auto
            </Button>
          </div>
        </div>

        {/* Custom Height */}
        <div className="space-y-2">
          <Label htmlFor="image-height" className="text-xs">
            Height
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-height"
              type="number"
              value={data.height || ''}
              onChange={e =>
                updateNodeData({ height: e.target.value ? parseInt(e.target.value) : undefined })
              }
              placeholder="Auto"
              className="flex-1 h-8 text-xs"
              min={50}
              max={800}
            />
            <span className="text-xs text-muted-foreground">px</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateNodeData({ height: undefined })}
              className="h-8 px-2 text-xs"
            >
              Auto
            </Button>
          </div>
        </div>

        {/* Aspect Ratio Lock */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Lock Aspect Ratio</Label>
          <SafeSwitch
            checked={!data.height || !data.width}
            onCheckedChange={checked => {
              if (checked) {
                updateNodeData({ height: undefined });
              }
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Spacing & Style Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Palette size={14} />
          Spacing & Style
        </h4>

        {/* Horizontal Padding */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Horizontal Padding</div>
          <div className="flex items-center gap-2">
            <Slider
              id="image-padding-x"
              min={0}
              max={48}
              step={4}
              value={[data.paddingX || 16]}
              onValueChange={([value]) => updateNodeData({ paddingX: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.paddingX || 16}
              onChange={e => updateNodeData({ paddingX: parseInt(e.target.value) || 16 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={48}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Vertical Padding */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Vertical Padding</div>
          <div className="flex items-center gap-2">
            <Slider
              id="image-padding-y"
              min={0}
              max={48}
              step={4}
              value={[data.paddingY || 16]}
              onValueChange={([value]) => updateNodeData({ paddingY: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.paddingY || 16}
              onChange={e => updateNodeData({ paddingY: parseInt(e.target.value) || 16 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={48}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Border Radius</div>
          <div className="flex items-center gap-2">
            <Slider
              id="image-border-radius"
              min={0}
              max={24}
              step={2}
              value={[data.borderRadius || 6]}
              onValueChange={([value]) => updateNodeData({ borderRadius: value })}
              className="flex-1"
            />
            <Input
              type="number"
              value={data.borderRadius || 6}
              onChange={e => updateNodeData({ borderRadius: parseInt(e.target.value) || 6 })}
              className="w-16 h-8 text-xs"
              min={0}
              max={24}
            />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="image-bg-color" className="text-xs">
            Background Color
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="image-bg-color"
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

        {/* Border Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="image-border-toggle" className="text-xs">
              Enable Border
            </Label>
            <SafeSwitch
              id="image-border-toggle"
              checked={(data.borderWidth || 0) > 0}
              onCheckedChange={checked => updateNodeData({ borderWidth: checked ? 1 : 0 })}
            />
          </div>
        </div>

        {/* Border Controls - Only show when border is enabled */}
        {(data.borderWidth || 0) > 0 && (
          <>
            {/* Border Width */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Border Width</div>
              <div className="flex items-center gap-2">
                <Slider
                  id="image-border-width"
                  min={1}
                  max={8}
                  step={1}
                  value={[data.borderWidth || 1]}
                  onValueChange={([value]) => updateNodeData({ borderWidth: value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={data.borderWidth || 1}
                  onChange={e => updateNodeData({ borderWidth: parseInt(e.target.value) || 1 })}
                  className="w-16 h-8 text-xs"
                  min={1}
                  max={8}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            {/* Border Color */}
            <div className="space-y-2">
              <Label htmlFor="image-border-color" className="text-xs">
                Border Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-border-color"
                  type="color"
                  value={data.borderColor || '#e5e7eb'}
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
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upload & Optimization Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Upload size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Smart Image Processing
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-300 mt-1 space-y-1">
              <li>• Auto-compression and WebP conversion for faster loading</li>
              <li>• Drag & drop or click to upload from your device</li>
              <li>• Secure cloud storage with instant global CDN delivery</li>
              <li>• Perfect quality maintained with up to 80% size reduction</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
