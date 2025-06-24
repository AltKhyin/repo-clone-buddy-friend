
// ABOUTME: Publication scheduling interface with date/time picker and timezone handling

import React, { useState } from 'react';
import { usePublicationActionMutation } from '../../../../packages/hooks/usePublicationActionMutation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

interface PublicationSchedulerProps {
  reviewId: number;
  currentScheduledDate?: string;
  onSuccess?: () => void;
}

export const PublicationScheduler = ({ 
  reviewId, 
  currentScheduledDate, 
  onSuccess 
}: PublicationSchedulerProps) => {
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (currentScheduledDate) {
      return new Date(currentScheduledDate).toISOString().slice(0, 16);
    }
    // Default to 1 hour from now
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    return defaultDate.toISOString().slice(0, 16);
  });
  
  const [notes, setNotes] = useState('');
  
  const publicationMutation = usePublicationActionMutation();

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error('Please select a publication date and time');
      return;
    }

    const selectedDateTime = new Date(scheduledDate);
    const now = new Date();

    if (selectedDateTime <= now) {
      toast.error('Scheduled date must be in the future');
      return;
    }

    try {
      await publicationMutation.mutateAsync({
        reviewId,
        action: 'schedule',
        scheduledDate: selectedDateTime.toISOString(),
        notes: notes.trim() || undefined,
      });

      toast.success('Publication scheduled successfully');
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to schedule publication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePublishNow = async () => {
    try {
      await publicationMutation.mutateAsync({
        reviewId,
        action: 'publish_now',
        notes: notes.trim() || undefined,
      });

      toast.success('Content published successfully');
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const minDateTime = new Date();
  minDateTime.setMinutes(minDateTime.getMinutes() + 5); // Minimum 5 minutes from now

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Publication Scheduling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date and Time Input */}
        <div className="space-y-2">
          <Label htmlFor="scheduledDate" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Publication Date & Time
          </Label>
          <Input
            id="scheduledDate"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={minDateTime.toISOString().slice(0, 16)}
          />
          <p className="text-xs text-gray-500">
            Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="schedulingNotes">Notes (Optional)</Label>
          <Textarea
            id="schedulingNotes"
            placeholder="Add any notes about this scheduling..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Current Schedule Info */}
        {currentScheduledDate && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>Currently scheduled for:</strong>{' '}
              {new Date(currentScheduledDate).toLocaleString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSchedule}
            disabled={publicationMutation.isPending}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {currentScheduledDate ? 'Update Schedule' : 'Schedule Publication'}
          </Button>
          <Button
            variant="outline"
            onClick={handlePublishNow}
            disabled={publicationMutation.isPending}
            className="flex-1"
          >
            Publish Now
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Content will be automatically published at the scheduled time</p>
          <p>• You can update the schedule or publish immediately at any time</p>
          <p>• Scheduled content can be unpublished before the scheduled time</p>
        </div>
      </CardContent>
    </Card>
  );
};
