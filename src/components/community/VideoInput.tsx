// ABOUTME: Comprehensive video input component supporting both URL input and file upload for community posts.

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { VideoUrlInput } from './VideoUrlInput';
import { VideoUploadZone } from './VideoUploadZone';

interface VideoInputProps {
  urlValue?: string;
  fileValue?: File | null;
  onUrlChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  isUploading?: boolean;
}

export const VideoInput = ({ 
  urlValue = '', 
  fileValue = null, 
  onUrlChange, 
  onFileChange, 
  onRemove, 
  isUploading = false 
}: VideoInputProps) => {
  const [inputType, setInputType] = useState<'url' | 'upload'>('url');
  
  const hasUrlInput = urlValue.trim().length > 0;
  const hasFileInput = fileValue !== null;

  const handleTabChange = (value: string) => {
    const newType = value as 'url' | 'upload';
    setInputType(newType);
    
    // Clear the other input when switching tabs
    if (newType === 'url' && hasFileInput) {
      onFileChange(null);
    } else if (newType === 'upload' && hasUrlInput) {
      onUrlChange('');
    }
  };

  const handleUrlRemove = () => {
    onUrlChange('');
    onRemove();
  };

  const handleFileRemove = () => {
    onFileChange(null);
    onRemove();
  };

  return (
    <div className="space-y-4">
      <Tabs value={inputType} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">URL do Vídeo</TabsTrigger>
          <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-4">
          <VideoUrlInput 
            value={urlValue}
            onChange={onUrlChange}
            onRemove={handleUrlRemove}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <VideoUploadZone 
            selectedVideo={fileValue}
            onVideoSelect={onFileChange}
            onVideoRemove={handleFileRemove}
            isUploading={isUploading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};