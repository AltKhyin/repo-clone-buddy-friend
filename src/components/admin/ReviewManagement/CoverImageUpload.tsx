// ABOUTME: Cover image upload component for review metadata

import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image } from 'lucide-react';

interface CoverImageUploadProps {
  currentImageUrl: string;
  onImageChange: (url: string) => void;
}

export const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
}) => {
  // Temporary placeholder - will be enhanced later
  return (
    <div className="space-y-2">
      {currentImageUrl ? (
        <div className="space-y-2">
          <img
            src={currentImageUrl}
            alt="Cover preview"
            className="w-full h-32 object-cover rounded border"
          />
          <Button variant="outline" size="sm" onClick={() => onImageChange('')} className="w-full">
            Remove Image
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <div className="text-sm text-gray-600">No cover image</div>
          <Button variant="outline" size="sm" className="mt-2">
            <Upload className="h-4 w-4 mr-2" />
            Upload Image (placeholder)
          </Button>
        </div>
      )}
    </div>
  );
};
