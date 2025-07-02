// ABOUTME: Button component for creating new reviews from admin dashboard

import React from 'react';
import { Button } from '@/components/ui/button';
import { useCreateReviewMutation } from '../../../../packages/hooks/useCreateReviewMutation';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const CreateReviewButton: React.FC = () => {
  const navigate = useNavigate();
  const createMutation = useCreateReviewMutation();

  const handleCreateReview = async () => {
    try {
      const newReview = await createMutation.mutateAsync({
        title: 'Untitled Review',
        description: '',
        access_level: 'free',
      });

      // Navigate to review management page
      navigate(`/admin/review/${newReview.id}`);
    } catch (error) {
      console.error('Failed to create review:', error);
    }
  };

  return (
    <Button onClick={handleCreateReview} disabled={createMutation.isPending} size="sm">
      <Plus className="h-4 w-4 mr-2" />
      {createMutation.isPending ? 'Creating...' : 'Create New Review'}
    </Button>
  );
};
