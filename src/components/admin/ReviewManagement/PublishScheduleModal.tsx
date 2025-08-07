// ABOUTME: Professional modal for scheduling review publication with calendar picker and validation
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format, isAfter, isBefore, add } from 'date-fns';
import { usePublicationActionMutation } from '@packages/hooks/usePublicationActionMutation';
import { useToast } from '../../../hooks/use-toast';
import { cn } from '@/lib/utils';

interface PublishScheduleModalProps {
  reviewId: number;
  isOpen: boolean;
  onClose: () => void;
  currentScheduledDate?: Date | null;
}

export const PublishScheduleModal: React.FC<PublishScheduleModalProps> = ({
  reviewId,
  isOpen,
  onClose,
  currentScheduledDate = null,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>('09');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [errors, setErrors] = useState<string[]>([]);

  const { toast } = useToast();
  const publicationMutation = usePublicationActionMutation();

  // Initialize with current scheduled date if provided
  useEffect(() => {
    if (currentScheduledDate) {
      setSelectedDate(currentScheduledDate);
      setSelectedHour(format(currentScheduledDate, 'HH'));
      setSelectedMinute(format(currentScheduledDate, 'mm'));
    }
  }, [currentScheduledDate]);

  const validateSchedule = (date: Date): string[] => {
    const validationErrors: string[] = [];
    const now = new Date();
    const oneYearFromNow = add(now, { years: 1 });

    if (!isAfter(date, now)) {
      validationErrors.push('Cannot schedule publication in the past');
    }

    if (isAfter(date, oneYearFromNow)) {
      validationErrors.push('Cannot schedule more than 1 year in advance');
    }

    return validationErrors;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setErrors([]);
  };

  const handleQuickSchedule = (type: 'hour' | 'tomorrow' | 'week') => {
    const now = new Date();
    let quickDate: Date;

    switch (type) {
      case 'hour':
        quickDate = add(now, { hours: 1 });
        break;
      case 'tomorrow':
        quickDate = add(now, { days: 1 });
        quickDate.setHours(9, 0, 0, 0);
        break;
      case 'week':
        quickDate = add(now, { weeks: 1 });
        quickDate.setHours(9, 0, 0, 0);
        break;
    }

    setSelectedDate(quickDate);
    setSelectedHour(format(quickDate, 'HH'));
    setSelectedMinute(format(quickDate, 'mm'));
    setErrors([]);
  };

  const handleSchedule = async () => {
    if (!selectedDate) {
      setErrors(['Please select both date and time']);
      return;
    }

    // Combine date with selected time
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);

    const validationErrors = validateSchedule(scheduledDateTime);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await publicationMutation.mutateAsync({
        reviewId,
        action: 'schedule',
        scheduledAt: scheduledDateTime,
      });

      toast({
        title: 'Success',
        description: `Review scheduled for ${format(scheduledDateTime, 'PPP p')}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule publication',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSchedule = async () => {
    try {
      await publicationMutation.mutateAsync({
        reviewId,
        action: 'unschedule',
      });

      toast({
        title: 'Success',
        description: 'Publication schedule cancelled',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel schedule',
        variant: 'destructive',
      });
    }
  };

  const isLoading = publicationMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" data-testid="publish-schedule-modal">
        <DialogHeader>
          <DialogTitle>Schedule Publication</DialogTitle>
          <DialogDescription>Choose when to publish this review</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8" data-testid="schedule-loading">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Scheduling...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Schedule Display */}
            {currentScheduledDate && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Currently scheduled for{' '}
                  <strong>
                    {format(currentScheduledDate, 'PPP')} at {format(currentScheduledDate, 'p')}
                  </strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Schedule Options */}
            <div className="space-y-2">
              <Label>Quick Schedule</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSchedule('hour')}
                  disabled={isLoading}
                >
                  In 1 hour
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSchedule('tomorrow')}
                  disabled={isLoading}
                >
                  Tomorrow 9 AM
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSchedule('week')}
                  disabled={isLoading}
                >
                  Next week
                </Button>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date-picker">Select date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-picker"
                    variant="outline"
                    disabled={isLoading}
                    data-testid="date-picker"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={date => date < new Date()}
                    initialFocus
                    aria-label="Select date"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label>Select time</Label>
              <div className="flex gap-2 items-center" data-testid="time-picker">
                <Select value={selectedHour} onValueChange={setSelectedHour} disabled={isLoading}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span>:</span>

                <Select
                  value={selectedMinute}
                  onValueChange={setSelectedMinute}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map(minute => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label htmlFor="hour-select" className="sr-only">
                  Hour
                </Label>
                <Label htmlFor="minute-select" className="sr-only">
                  Minute
                </Label>
              </div>

              <p className="text-xs text-muted-foreground">All times are in your local timezone</p>
            </div>

            {/* Validation Errors */}
            <div data-testid="validation-errors">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Error from mutation */}
            {publicationMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to schedule publication. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              {currentScheduledDate && (
                <Button variant="outline" onClick={handleCancelSchedule} disabled={isLoading}>
                  Cancel Schedule
                </Button>
              )}

              <Button onClick={handleSchedule} disabled={isLoading || !selectedDate}>
                Schedule Publication
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
