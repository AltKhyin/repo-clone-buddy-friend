// ABOUTME: Publication history timeline for review management

import React from 'react';

interface PublicationHistoryPanelProps {
  reviewId: number;
}

export const PublicationHistoryPanel: React.FC<PublicationHistoryPanelProps> = ({ reviewId }) => {
  return (
    <div className="space-y-2">
      <div className="text-sm text-secondary">
        Publication history for review {reviewId} (to be implemented)
      </div>
    </div>
  );
};
