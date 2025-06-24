
// ABOUTME: Timeline visualization of publication history and workflow actions

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Globe, 
  Archive, 
  Eye 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryTimelineProps {
  reviewId: number;
}

interface HistoryItem {
  id: string;
  action: string;
  performed_by: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  notes?: string;
  metadata?: {
    previous_status?: string;
    new_status?: string;
    scheduled_date?: string;
  };
  created_at: string;
}

export const HistoryTimeline = ({ reviewId }: HistoryTimelineProps) => {
  // Mock data for demonstration - in real implementation, this would fetch from API
  const historyItems: HistoryItem[] = [
    {
      id: '1',
      action: 'created',
      performed_by: {
        id: '1',
        full_name: 'John Doe',
        avatar_url: undefined,
      },
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        new_status: 'draft'
      }
    },
    {
      id: '2',
      action: 'submitted_for_review',
      performed_by: {
        id: '1',
        full_name: 'John Doe',
        avatar_url: undefined,
      },
      notes: 'Ready for editorial review',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        previous_status: 'draft',
        new_status: 'under_review'
      }
    },
    {
      id: '3',
      action: 'approved',
      performed_by: {
        id: '2',
        full_name: 'Editor Smith',
        avatar_url: undefined,
      },
      notes: 'Excellent content, approved for publication',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        previous_status: 'under_review',
        new_status: 'scheduled',
        scheduled_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <FileText className="h-4 w-4" />;
      case 'submitted_for_review':
        return <Send className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'published':
        return <Globe className="h-4 w-4 text-emerald-600" />;
      case 'unpublished':
        return <Eye className="h-4 w-4 text-orange-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Review Created';
      case 'submitted_for_review':
        return 'Submitted for Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'scheduled':
        return 'Scheduled';
      case 'published':
        return 'Published';
      case 'unpublished':
        return 'Unpublished';
      case 'archived':
        return 'Archived';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ');
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: 'Draft', variant: 'secondary' },
      under_review: { label: 'Under Review', variant: 'default' },
      scheduled: { label: 'Scheduled', variant: 'outline' },
      published: { label: 'Published', variant: 'default' },
      archived: { label: 'Archived', variant: 'secondary' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Publication History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {historyItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No history available for this review.
            </p>
          ) : (
            historyItems.map((item, index) => (
              <div key={item.id} className="flex gap-4 relative">
                {/* Timeline Line */}
                {index < historyItems.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-full bg-gray-200"></div>
                )}

                {/* Timeline Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                  {getActionIcon(item.action)}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {getActionLabel(item.action)}
                      </h4>
                      {item.metadata?.new_status && getStatusBadge(item.metadata.new_status)}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>

                  {/* Performer Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.performed_by.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {item.performed_by.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {item.performed_by.full_name}
                    </span>
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {item.notes}
                    </p>
                  )}

                  {/* Metadata */}
                  {item.metadata?.scheduled_date && (
                    <p className="text-xs text-blue-600 mt-1">
                      Scheduled for: {new Date(item.metadata.scheduled_date).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
