// ABOUTME: Publication workflow controls and history for review management

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReviewManagementData } from '../../../../packages/hooks/useReviewManagementQuery';
import { PublishScheduleModal } from './PublishScheduleModal';
import { PublicationHistoryPanel } from './PublicationHistoryPanel';
import { Send, Calendar, Archive, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

interface PublicationControlPanelProps {
  review: ReviewManagementData;
}

export const PublicationControlPanel: React.FC<PublicationControlPanelProps> = ({ review }) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handlePublishNow = async () => {
    // TODO: Implement with existing usePublicationActionMutation
    console.log('Publishing review:', review.id);
  };

  const handleArchive = async () => {
    if (confirm('Are you sure you want to archive this review?')) {
      // TODO: Implement with existing usePublicationActionMutation
      console.log('Archiving review:', review.id);
    }
  };

  const getStatusInfo = () => {
    switch (review.status) {
      case 'published':
        return {
          color: 'green',
          icon: CheckCircle,
          text: 'Published',
          description: review.published_at
            ? `Published on ${new Date(review.published_at).toLocaleDateString()}`
            : 'Published',
        };
      case 'scheduled':
        return {
          color: 'yellow',
          icon: Calendar,
          text: 'Scheduled',
          description: review.scheduled_publish_at
            ? `Will publish on ${new Date(review.scheduled_publish_at).toLocaleDateString()}`
            : 'Scheduled for publication',
        };
      case 'draft':
        return {
          color: 'gray',
          icon: AlertTriangle,
          text: 'Draft',
          description: 'Not yet published',
        };
      default:
        return {
          color: 'gray',
          icon: AlertTriangle,
          text: review.status,
          description: 'Current status',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Publication Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center space-x-3 p-3 bg-surface-muted rounded-lg">
          <StatusIcon className={`h-5 w-5 text-${statusInfo.color}-500`} />
          <div>
            <div className="font-medium text-foreground">{statusInfo.text}</div>
            <div className="text-sm text-secondary">{statusInfo.description}</div>
          </div>
        </div>

        {/* Publication Actions */}
        <div className="space-y-2">
          {review.status === 'draft' && (
            <>
              <Button onClick={handlePublishNow} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Publish Now
              </Button>
              <Button
                onClick={() => setShowScheduleModal(true)}
                variant="outline"
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Publication
              </Button>
            </>
          )}

          {review.status === 'scheduled' && (
            <Button onClick={handlePublishNow} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Publish Now (Override Schedule)
            </Button>
          )}

          {(review.status === 'published' || review.status === 'scheduled') && (
            <Button onClick={handleArchive} variant="destructive" className="w-full">
              <Archive className="h-4 w-4 mr-2" />
              Archive Review
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{review.view_count || 0}</div>
            <div className="text-sm text-secondary">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {new Date(review.created_at).toLocaleDateString('pt-BR')}
            </div>
            <div className="text-sm text-secondary">Created</div>
          </div>
        </div>
      </CardContent>

      {/* Schedule Modal */}
      <PublishScheduleModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        reviewId={review.id}
      />
    </Card>
  );
};
