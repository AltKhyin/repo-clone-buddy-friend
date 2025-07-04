// ABOUTME: Metadata editing panel for review title, description, tags, and settings

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUpdateReviewMetadataMutation } from '../../../../packages/hooks/useUpdateReviewMetadataMutation';
import { ReviewManagementData } from '../../../../packages/hooks/useReviewManagementQuery';
import { useSaveContext } from '../common/UnifiedSaveProvider';
import { Save, Upload, X } from 'lucide-react';
import { TagSelector } from './TagSelector';
import { CoverImageUpload } from './CoverImageUpload';
import { AccessLevelSelector } from './AccessLevelSelector';

interface ReviewMetadataPanelProps {
  review: ReviewManagementData;
}

export const ReviewMetadataPanel: React.FC<ReviewMetadataPanelProps> = ({ review }) => {
  const [formData, setFormData] = useState({
    title: review.title || '',
    description: review.description || '',
    access_level: review.access_level || 'free',
    cover_image_url: review.cover_image_url || '',
  });

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    review.tags?.map(tag => tag.id) || []
  );

  const updateMutation = useUpdateReviewMetadataMutation();
  const { updateField } = useSaveContext();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    updateField(field, value);
  };

  const handleTagsChange = (newTagIds: number[]) => {
    setSelectedTagIds(newTagIds);
    updateField('tags', newTagIds);
  };

  // Sync initial data with save context only once on mount
  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      updateField(key, value);
    });
    updateField('tags', selectedTagIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Review Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => handleInputChange('title', e.target.value)}
            placeholder="Enter review title..."
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Enter review description..."
            rows={3}
          />
        </div>

        {/* Access Level */}
        <AccessLevelSelector
          value={formData.access_level}
          onChange={value => handleInputChange('access_level', value)}
        />

        {/* Cover Image */}
        <div className="space-y-2">
          <Label>Cover Image</Label>
          <CoverImageUpload
            reviewId={review.id}
            currentImageUrl={formData.cover_image_url}
            onImageChange={url => handleInputChange('cover_image_url', url)}
          />
        </div>

        {/* Tags */}
        <TagSelector
          reviewId={review.id}
          selectedTags={selectedTagIds}
          onTagsChange={handleTagsChange}
        />

        {/* Save functionality is now handled by the unified save buttons in the header */}
      </CardContent>
    </Card>
  );
};
