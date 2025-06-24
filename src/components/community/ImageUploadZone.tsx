
// ABOUTME: Drag-and-drop image upload component for community posts with preview and validation.

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface ImageUploadZoneProps {
  onImageSelect: (file: File) => void;
  selectedImage?: File | string | null;
  onImageRemove: () => void;
  isUploading?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const ImageUploadZone = ({ 
  onImageSelect, 
  selectedImage, 
  onImageRemove, 
  isUploading = false 
}: ImageUploadZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Imagem muito grande. Máximo 5MB permitido.');
      return;
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP.');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    onImageSelect(file);
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    onImageRemove();
  };

  // Determine what to show as preview
  const previewSrc = preview || (typeof selectedImage === 'string' ? selectedImage : null);

  if (selectedImage || preview) {
    return (
      <Card className="relative">
        <CardContent className="p-4">
          <div className="relative">
            <img
              src={previewSrc || ''}
              alt="Preview"
              className="w-full h-48 object-cover rounded-md"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
              <div className="text-white text-sm">Enviando...</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive && "border-primary bg-primary/5",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-primary">Solte a imagem aqui...</p>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                Arraste uma imagem aqui ou clique para selecionar
              </p>
              <Button type="button" variant="outline" size="sm" disabled={isUploading}>
                <Upload className="w-4 h-4 mr-2" />
                Escolher Imagem
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                JPEG, PNG, GIF ou WebP. Máximo 5MB.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
