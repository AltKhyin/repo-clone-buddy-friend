// ABOUTME: Metadata editing panel for review title, description, tags, and settings

import React, { useState } from 'react';
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
import { Save, Upload, X } from 'lucide-react';
import { TagSelector } from './TagSelector';
import { CoverImageUpload } from './CoverImageUpload';

interface ReviewMetadataPanelProps {
  review: ReviewManagementData;
}

export const ReviewMetadataPanel: React.FC<ReviewMetadataPanelProps> = ({ review }) => {
  const [formData, setFormData] = useState({
    title: review.title || '',
    description: review.description || '',
    access_level: review.access_level || 'public',
    cover_image_url: review.cover_image_url || '',
  });

  const [selectedTags, setSelectedTags] = useState(review.tags || []);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useUpdateReviewMetadataMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleTagsChange = (newTags: any[]) => {
    setSelectedTags(newTags);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        reviewId: review.id,
        metadata: {
          ...formData,
          tags: selectedTags.map(tag => tag.id),
        },
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Metadata</CardTitle>
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
        <div className="space-y-2">
          <Label>Access Level</Label>
          <Select
            value={formData.access_level}
            onValueChange={value => handleInputChange('access_level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select access level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="premium">Premium Only</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <Label>Cover Image</Label>
          <CoverImageUpload
            currentImageUrl={formData.cover_image_url}
            onImageChange={url => handleInputChange('cover_image_url', url)}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <TagSelector selectedTags={selectedTags} onTagsChange={handleTagsChange} />
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedTags.map(tag => (
              <Badge key={tag.id} variant="secondary">
                {tag.tag_name}
                <button
                  onClick={() => handleTagsChange(selectedTags.filter(t => t.id !== tag.id))}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
