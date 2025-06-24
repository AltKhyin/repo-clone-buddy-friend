
// ABOUTME: Quick action buttons for publication workflow transitions

import React from 'react';
import { ReviewQueueItem } from '../../../../packages/hooks/useContentQueueQuery';
import { usePublicationActionMutation } from '../../../../packages/hooks/usePublicationActionMutation';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Send, 
  Archive,
  Eye,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowActionsProps {
  review: ReviewQueueItem;
}

export const WorkflowActions = ({ review }: WorkflowActionsProps) => {
  const publicationMutation = usePublicationActionMutation();

  const handleAction = async (
    action: 'submit_for_review' | 'approve' | 'reject' | 'schedule' | 'publish_now' | 'unpublish' | 'archive',
    notes?: string
  ) => {
    try {
      await publicationMutation.mutateAsync({
        reviewId: review.id,
        action,
        notes,
      });

      toast.success(`Action completed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action.replace('_', ' ')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (review.review_status) {
      case 'draft':
        actions.push(
          <Button
            key="submit"
            size="sm"
            variant="outline"
            onClick={() => handleAction('submit_for_review')}
            disabled={publicationMutation.isPending}
          >
            <Send className="h-4 w-4 mr-1" />
            Submit for Review
          </Button>
        );
        break;

      case 'under_review':
        actions.push(
          <Button
            key="approve"
            size="sm"
            variant="default"
            onClick={() => handleAction('approve')}
            disabled={publicationMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>,
          <Button
            key="reject"
            size="sm"
            variant="destructive"
            onClick={() => handleAction('reject')}
            disabled={publicationMutation.isPending}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        );
        break;

      case 'scheduled':
        actions.push(
          <Button
            key="publish_now"
            size="sm"
            variant="default"
            onClick={() => handleAction('publish_now')}
            disabled={publicationMutation.isPending}
          >
            <Send className="h-4 w-4 mr-1" />
            Publish Now
          </Button>
        );
        break;

      case 'published':
        actions.push(
          <Button
            key="unpublish"
            size="sm"
            variant="outline"
            onClick={() => handleAction('unpublish')}
            disabled={publicationMutation.isPending}
          >
            <Eye className="h-4 w-4 mr-1" />
            Unpublish
          </Button>
        );
        break;
    }

    // Archive action is always available (except for already archived)
    if (review.review_status !== 'archived') {
      actions.push(
        <Button
          key="archive"
          size="sm"
          variant="outline"
          onClick={() => handleAction('archive')}
          disabled={publicationMutation.isPending}
        >
          <Archive className="h-4 w-4 mr-1" />
          Archive
        </Button>
      );
    }

    // Schedule action for approved content
    if (review.review_status === 'approved' || review.review_status === 'scheduled') {
      actions.push(
        <Button
          key="schedule"
          size="sm"
          variant="outline"
          onClick={() => {
            // For now, just schedule for 1 hour from now
            // In a full implementation, this would open a scheduling modal
            const scheduledDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            handleAction('schedule');
          }}
          disabled={publicationMutation.isPending}
        >
          <Clock className="h-4 w-4 mr-1" />
          Schedule
        </Button>
      );
    }

    return actions;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {getAvailableActions()}
    </div>
  );
};
