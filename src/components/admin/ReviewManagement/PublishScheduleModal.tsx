// ABOUTME: Modal for scheduling review publication

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PublishScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: number;
}

export const PublishScheduleModal: React.FC<PublishScheduleModalProps> = ({
  open,
  onOpenChange,
  reviewId,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Publication</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm text-gray-600">
            Schedule modal for review {reviewId} (to be implemented)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
