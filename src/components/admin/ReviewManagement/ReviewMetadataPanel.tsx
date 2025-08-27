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
import { ReviewManagementData } from '../../../../packages/hooks/useAdminReviewManagement';
import { useSaveContext } from '../../../hooks/useSaveContext';
import { Save, Upload, X } from 'lucide-react';
import { TagSelector } from './TagSelector';
import { CoverImageUpload } from './CoverImageUpload';
import { AccessLevelSelector } from './AccessLevelSelector';
import { ContentTypeSelector } from './ContentTypeSelector';
import { ArticleDataSection } from './ArticleDataSection';

interface ReviewMetadataPanelProps {
  review: ReviewManagementData;
}

export const ReviewMetadataPanel: React.FC<ReviewMetadataPanelProps> = ({ review }) => {
  const [formData, setFormData] = useState({
    title: review.title || '',
    description: review.description || '',
    access_level: review.access_level || 'free',
    cover_image_url: review.cover_image_url || '',
    // New metadata fields
    edicao: review.edicao || '',
    original_article_title: review.original_article_title || '',
    original_article_authors: review.original_article_authors || '',
    original_article_publication_date: review.original_article_publication_date || '',
    study_type: review.study_type || '',
    // Dynamic review card fields
    reading_time_minutes: review.reading_time_minutes?.toString() || '',
    custom_author_name: review.custom_author_name || '',
    custom_author_avatar_url: review.custom_author_avatar_url || '',
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    review.tags?.map(tag => tag.id) || []
  );

  const [selectedContentTypes, setSelectedContentTypes] = useState<number[]>(
    review.content_types?.map(ct => ct.id) || []
  );

  const updateMutation = useUpdateReviewMetadataMutation();
  const { updateField } = useSaveContext();

  const validateReadingTime = (value: string): string | null => {
    if (value === '' || value === null || value === undefined) {
      return null; // Empty is valid (will be converted to null)
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 'Reading time must be a number';
    }
    
    if (numValue <= 0) {
      return 'Reading time must be greater than 0';
    }
    
    if (!Number.isInteger(numValue)) {
      return 'Reading time must be a whole number';
    }
    
    if (numValue > 999) {
      return 'Reading time cannot exceed 999 minutes';
    }
    
    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Special validation for reading_time_minutes
    if (field === 'reading_time_minutes') {
      const error = validateReadingTime(value);
      setValidationErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
    } else {
      // Clear any existing errors for other fields
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    updateField(field, value);
  };

  const handleTagsChange = (newTagIds: number[]) => {
    setSelectedTagIds(newTagIds);
    updateField('tags', newTagIds);
  };

  const handleContentTypesChange = (newContentTypeIds: number[]) => {
    setSelectedContentTypes(newContentTypeIds);
    updateField('content_types', newContentTypeIds);
  };

  // Sync initial data with save context only once on mount
  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      updateField(key, value);
    });
    updateField('tags', selectedTagIds);
    updateField('content_types', selectedContentTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - only run on mount

  return (
    <div className="space-y-6">
      {/* Main Metadata Card */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">Review Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder="Enter review title..."
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </Label>
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
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Cover Image</Label>
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

          {/* New: Edição field */}
          <div className="space-y-3">
            <Label htmlFor="edicao" className="text-sm font-medium text-foreground">
              Edição
            </Label>
            <Input
              id="edicao"
              value={formData.edicao}
              onChange={e => handleInputChange('edicao', e.target.value)}
              placeholder="Ex: 1ª edição, 2ª edição revisada..."
            />
          </div>

          {/* New: Content Type Selector */}
          <ContentTypeSelector
            selectedContentTypes={selectedContentTypes}
            onChange={handleContentTypesChange}
          />

          {/* Save functionality is now handled by the unified save buttons in the header */}
        </CardContent>
      </Card>

      {/* Dynamic Review Card Fields Section */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">
            Dynamic Card Display Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reading Time */}
          <div className="space-y-3">
            <Label htmlFor="reading_time_minutes" className="text-sm font-medium text-foreground">
              Reading Time (minutes)
            </Label>
            <Input
              id="reading_time_minutes"
              type="number"
              min="1"
              max="999"
              value={formData.reading_time_minutes}
              onChange={e => handleInputChange('reading_time_minutes', e.target.value)}
              placeholder="Ex: 8"
              className={validationErrors.reading_time_minutes ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {validationErrors.reading_time_minutes && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.reading_time_minutes}
              </p>
            )}
          </div>

          {/* Custom Author Name */}
          <div className="space-y-3">
            <Label htmlFor="custom_author_name" className="text-sm font-medium text-foreground">
              Custom Author Name
            </Label>
            <Input
              id="custom_author_name"
              value={formData.custom_author_name}
              onChange={e => handleInputChange('custom_author_name', e.target.value)}
              placeholder="Leave empty to use review creator"
            />
          </div>

          {/* Custom Author Avatar URL */}
          <div className="space-y-3">
            <Label
              htmlFor="custom_author_avatar_url"
              className="text-sm font-medium text-foreground"
            >
              Custom Author Avatar URL
            </Label>
            <Input
              id="custom_author_avatar_url"
              value={formData.custom_author_avatar_url}
              onChange={e => handleInputChange('custom_author_avatar_url', e.target.value)}
              placeholder="Leave empty to use review creator avatar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Article Data Section */}
      <ArticleDataSection
        data={{
          original_article_title: formData.original_article_title,
          original_article_authors: formData.original_article_authors,
          original_article_publication_date: formData.original_article_publication_date,
          study_type: formData.study_type,
        }}
        onChange={handleInputChange}
      />
    </div>
  );
};
