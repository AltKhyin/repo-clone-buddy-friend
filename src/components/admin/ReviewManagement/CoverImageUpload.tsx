// ABOUTME: Professional cover image upload component with drag-drop, validation, and Supabase Storage integration
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image, X, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoverImageUploadProps {
  reviewId: number;
  currentImageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
  reviewId,
  currentImageUrl,
  onImageChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, WebP, or GIF)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${reviewId}/${Date.now()}.${fileExt}`;

      setUploadProgress(25);

      const { data, error } = await supabase.storage.from('review-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) throw error;

      setUploadProgress(75);

      const {
        data: { publicUrl },
      } = supabase.storage.from('review-images').getPublicUrl(data.path);

      setUploadProgress(100);
      return publicUrl;
    },
    [reviewId]
  );

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const publicUrl = await uploadImage(file);
        onImageChange(publicUrl);
        toast({
          title: 'Success',
          description: 'Cover image uploaded successfully',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onImageChange, toast, uploadImage]
  );

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      // Extract file path from URL
      const urlParts = currentImageUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // Get "reviewId/filename.ext"

      const { error } = await supabase.storage.from('review-images').remove([fileName]);

      if (error) throw error;

      onImageChange(null);
      toast({
        title: 'Success',
        description: 'Cover image removed successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove image',
        variant: 'destructive',
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: false,
    disabled: isUploading,
  });

  if (isUploading) {
    return (
      <div className="space-y-4 p-4 border rounded-lg sm:p-6" data-testid="upload-loading">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 animate-pulse" />
          <h3 className="font-medium">Uploading...</h3>
        </div>
        <Progress value={uploadProgress} className="w-full" />
        <p className="text-sm text-muted-foreground">Uploading your cover image...</p>
      </div>
    );
  }

  if (currentImageUrl) {
    return (
      <div className="space-y-4 p-4 border rounded-lg sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Image className="h-5 w-5" />
            Cover Image
          </h3>
        </div>

        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Cover"
            className="w-full h-48 object-cover rounded-lg border"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('cover-image-input')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Change Image
          </Button>
          <Button variant="outline" size="sm" onClick={handleRemoveImage}>
            <X className="h-4 w-4 mr-2" />
            Remove Image
          </Button>
        </div>

        <input
          id="cover-image-input"
          type="file"
          accept="image/*"
          onChange={e => e.target.files && handleFileUpload(Array.from(e.target.files))}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 border rounded-lg sm:p-6" data-testid="cover-image-upload">
      <h3 className="font-medium flex items-center gap-2 text-base sm:text-lg">
        <Upload className="h-5 w-5" />
        Upload Cover Image
      </h3>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors cursor-pointer
          ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/10'
          }
        `}
      >
        <input {...getInputProps()} aria-label="Upload cover image" />

        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <FileImage className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />

          <div className="space-y-2">
            <p className="text-sm sm:text-base font-medium">
              {isDragActive ? 'Drop image here' : 'Drag and drop an image here, or click to browse'}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Supports JPEG, PNG, WebP, GIF (max 10MB)
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            role="button"
            aria-label="Browse files"
            className="w-full sm:w-auto touch-target"
          >
            <Upload className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
        </div>
      </div>
    </div>
  );
};
