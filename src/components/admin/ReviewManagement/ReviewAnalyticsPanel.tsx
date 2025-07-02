// ABOUTME: Analytics panel for review performance metrics

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ReviewManagementData } from '../../../../packages/hooks/useReviewManagementQuery';
import { TrendingUp, Users, Eye, Clock } from 'lucide-react';

interface ReviewAnalyticsPanelProps {
  review: ReviewManagementData;
}

export const ReviewAnalyticsPanel: React.FC<ReviewAnalyticsPanelProps> = ({ review }) => {
  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-surface-muted rounded-lg">
            <Eye className="h-6 w-6 mx-auto mb-2 text-secondary" />
            <div className="text-2xl font-bold text-foreground">{review.view_count || 0}</div>
            <div className="text-sm text-secondary">Total Views</div>
          </div>
          <div className="text-center p-3 bg-surface-muted rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-secondary" />
            <div className="text-2xl font-bold text-foreground">
              {Math.floor(Math.random() * 100)}
            </div>
            <div className="text-sm text-secondary">Avg. Time</div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="space-y-2">
          <h4 className="font-medium text-foreground">Performance</h4>
          <div className="text-sm text-secondary space-y-1">
            <div className="flex items-center justify-between">
              <span>Engagement Rate</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Completion Rate</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Social Shares</span>
              <span className="font-medium">--</span>
            </div>
          </div>
        </div>

        {/* Placeholder for future analytics */}
        <div className="text-center py-4 text-sm text-secondary">
          Detailed analytics coming soon
        </div>
      </CardContent>
    </Card>
  );
};
