
// ABOUTME: Individual review workflow management interface with preview and action controls

import React, { useState } from 'react';
import { ReviewQueueItem } from '../../../../packages/hooks/useContentQueueQuery';
import { usePublicationActionMutation } from '../../../../packages/hooks/usePublicationActionMutation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Calendar, Send, Eye, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewWorkflowProps {
  review: ReviewQueueItem;
  onClose: () => void;
}

export const ReviewWorkflow = ({ review, onClose }: ReviewWorkflowProps) => {
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  
  const publicationMutation = usePublicationActionMutation();

  const handleAction = async (
    action: 'approve' | 'reject' | 'schedule' | 'publish_now'
  ) => {
    if (!notes.trim() && (action === 'reject' || action === 'approve')) {
      toast.error('Please provide notes for this action');
      return;
    }

    try {
      await publicationMutation.mutateAsync({
        reviewId: review.id,
        action,
        notes: notes.trim() || undefined,
      });

      toast.success(`Review successfully ${action.replace('_', ' ')}`);
      onClose();
    } catch (error) {
      toast.error(`Failed to ${action.replace('_', ' ')}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'under_review': return 'default';
      case 'scheduled': return 'outline';
      case 'published': return 'default';
      case 'archived': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {review.title}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Badge variant={getStatusBadgeVariant(review.review_status)}>
              {review.review_status.replace('_', ' ')}
            </Badge>
            {review.author && (
              <span>by {review.author.full_name}</span>
            )}
            <span>Created {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}</span>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Workflow Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="review">
            <MessageSquare className="h-4 w-4 mr-2" />
            Review
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {review.description ? (
                <div className="prose prose-sm max-w-none">
                  <p>{review.description}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No description available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add your review notes here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              
              {review.publication_notes && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 className="font-medium text-yellow-800 mb-1">Previous Notes:</h4>
                  <p className="text-yellow-700 text-sm">{review.publication_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {review.review_status === 'under_review' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleAction('approve')}
                    disabled={publicationMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    disabled={publicationMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {review.review_status === 'scheduled' && (
                <Button
                  onClick={() => handleAction('publish_now')}
                  disabled={publicationMutation.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publish Now
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Publication History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    Created {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                
                {review.review_requested_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">
                      Submitted for review {formatDistanceToNow(new Date(review.review_requested_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                )}
                
                {review.reviewed_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">
                      Reviewed {formatDistanceToNow(new Date(review.reviewed_at), { addSuffix: true, locale: ptBR })}
                      {review.reviewer && ` by ${review.reviewer.full_name}`}
                    </span>
                  </div>
                )}
                
                {review.scheduled_publish_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">
                      Scheduled for {formatDistanceToNow(new Date(review.scheduled_publish_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                )}
                
                {review.published_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600">
                      Published {formatDistanceToNow(new Date(review.published_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
