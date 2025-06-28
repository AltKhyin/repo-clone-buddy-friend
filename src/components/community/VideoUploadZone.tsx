// ABOUTME: Drag-and-drop video upload component for community posts with preview and validation.

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Upload, X, Video as VideoIcon, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface VideoUploadZoneProps {
  onVideoSelect: (file: File) => void;
  selectedVideo?: File | string | null;
  onVideoRemove: () => void;
  isUploading?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];

export const VideoUploadZone = ({ 
  onVideoSelect, 
  selectedVideo, 
  onVideoRemove, 
  isUploading = false 
}: VideoUploadZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Vídeo muito grande. Máximo 50MB permitido.');
      return;
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use MP4, WebM, OGG, AVI ou MOV.');
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    onVideoSelect(file);
  }, [onVideoSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.quicktime']
    },
    multiple: false,
    disabled: isUploading
  });

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    onVideoRemove();
  };

  // If video is selected, show preview
  if (selectedVideo) {
    const videoUrl = selectedVideo instanceof File ? preview : selectedVideo;
    const fileName = selectedVideo instanceof File ? selectedVideo.name : 'Vídeo selecionado';
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4" />
                <span className="text-sm font-medium truncate">{fileName}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {videoUrl && (
              <div className="aspect-video">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover rounded-md"
                  controls
                  preload="metadata"
                >
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              </div>
            )}
            
            {isUploading && (
              <div className="text-center py-2">
                <div className="text-sm text-muted-foreground">Fazendo upload do vídeo...</div>
              </div>
            )}
          </div>
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
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-border-hover",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="p-3 bg-surface-muted rounded-full">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragActive 
                  ? "Solte o vídeo aqui..." 
                  : "Clique ou arraste um vídeo para fazer upload"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos suportados: MP4, WebM, OGG, AVI, MOV (máx. 50MB)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};