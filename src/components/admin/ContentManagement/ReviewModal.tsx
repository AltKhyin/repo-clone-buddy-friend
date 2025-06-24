
// ABOUTME: Modal wrapper for detailed review management with workflow integration

import React from 'react';
import { ReviewQueueItem } from '../../../../packages/hooks/useContentQueueQuery';
import { ReviewWorkflow } from './ReviewWorkflow';
import { PublicationScheduler } from './PublicationScheduler';
import { HistoryTimeline } from './HistoryTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Calendar, History, Settings } from 'lucide-react';

interface ReviewModalProps {
  review: ReviewQueueItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal = ({ review, isOpen, onClose }: ReviewModalProps) => {
  if (!review) return null;

  const showScheduler = ['scheduled', 'approved'].includes(review.review_status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Review Management: {review.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="workflow" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Workflow
              </TabsTrigger>
              {showScheduler && (
                <TabsTrigger value="scheduler" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduler
                </TabsTrigger>
              )}
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="workflow" className="h-full">
                <ReviewWorkflow review={review} onClose={onClose} />
              </TabsContent>

              {showScheduler && (
                <TabsContent value="scheduler" className="h-full">
                  <PublicationScheduler
                    reviewId={review.id}
                    currentScheduledDate={review.scheduled_publish_at}
                    onSuccess={onClose}
                  />
                </TabsContent>
              )}

              <TabsContent value="history" className="h-full">
                <HistoryTimeline reviewId={review.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
