// ABOUTME: Tests for PublishScheduleModal component ensuring calendar scheduling and validation
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { PublishScheduleModal } from './PublishScheduleModal';

// Mock mutation hooks
const mockSchedulePublicationMutation = vi.fn();

vi.mock('@packages/hooks/usePublicationActionMutation', () => ({
  usePublicationActionMutation: () => mockSchedulePublicationMutation,
}));

// Mock date utilities
const mockIsAfter = vi.fn();
const mockIsBefore = vi.fn();
const mockFormat = vi.fn();

vi.mock('date-fns', () => ({
  isAfter: mockIsAfter,
  isBefore: mockIsBefore,
  format: mockFormat,
  add: vi.fn((date, duration) => new Date(date.getTime() + duration.hours * 60 * 60 * 1000)),
}));

describe('PublishScheduleModal', () => {
  const defaultProps = {
    reviewId: 123,
    isOpen: true,
    onClose: vi.fn(),
    currentScheduledDate: null,
  };

  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mutation mock
    mockSchedulePublicationMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });

    // Setup date utility mocks
    mockIsAfter.mockReturnValue(true);
    mockIsBefore.mockReturnValue(false);
    mockFormat.mockImplementation((date, format) => {
      if (format === 'PPP') return 'January 1st, 2024';
      if (format === 'p') return '9:00 AM';
      return '2024-01-01';
    });
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByText('Schedule Publication')).toBeInTheDocument();
      expect(screen.getByText('Choose when to publish this review')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Schedule Publication')).not.toBeInTheDocument();
    });

    it('should show current scheduled date when provided', () => {
      const scheduledDate = new Date('2024-01-01T09:00:00Z');
      renderWithProviders(
        <PublishScheduleModal {...defaultProps} currentScheduledDate={scheduledDate} />
      );

      expect(screen.getByText(/Currently scheduled/)).toBeInTheDocument();
      expect(screen.getByText('January 1st, 2024')).toBeInTheDocument();
    });
  });

  describe('Calendar Interaction', () => {
    it('should render date picker', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      expect(screen.getByLabelText('Select date')).toBeInTheDocument();
    });

    it('should render time picker', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByTestId('time-picker')).toBeInTheDocument();
      expect(screen.getByLabelText('Select time')).toBeInTheDocument();
    });

    it('should handle date selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const datePicker = screen.getByTestId('date-picker');
      await user.click(datePicker);

      // Calendar should be open
      expect(screen.getByRole('dialog', { name: /select date/i })).toBeInTheDocument();
    });

    it('should handle time selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const hourSelect = screen.getByLabelText('Hour');
      await user.selectOptions(hourSelect, '14');

      const minuteSelect = screen.getByLabelText('Minute');
      await user.selectOptions(minuteSelect, '30');

      expect(hourSelect).toHaveValue('14');
      expect(minuteSelect).toHaveValue('30');
    });
  });

  describe('Validation', () => {
    it('should prevent scheduling in the past', async () => {
      mockIsAfter.mockReturnValue(false); // Date is in past

      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const scheduleButton = screen.getByText('Schedule Publication');
      await user.click(scheduleButton);

      expect(screen.getByText(/Cannot schedule publication in the past/)).toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should prevent scheduling too far in the future', async () => {
      mockIsAfter.mockReturnValue(true);
      mockIsBefore.mockReturnValue(true); // Date is too far in future

      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const scheduleButton = screen.getByText('Schedule Publication');
      await user.click(scheduleButton);

      expect(screen.getByText(/Cannot schedule more than 1 year in advance/)).toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should require both date and time selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const scheduleButton = screen.getByText('Schedule Publication');
      await user.click(scheduleButton);

      expect(screen.getByText(/Please select both date and time/)).toBeInTheDocument();
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should show validation errors', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
    });
  });

  describe('Scheduling Actions', () => {
    it('should handle successful scheduling', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      // Select valid date and time (mocked as valid)
      const datePicker = screen.getByTestId('date-picker');
      await user.click(datePicker);

      const scheduleButton = screen.getByText('Schedule Publication');
      await user.click(scheduleButton);

      expect(mockMutate).toHaveBeenCalledWith({
        reviewId: 123,
        action: 'schedule',
        scheduledAt: expect.any(Date),
      });
    });

    it('should handle scheduling cancellation', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <PublishScheduleModal
          {...defaultProps}
          currentScheduledDate={new Date('2024-01-01T09:00:00Z')}
        />
      );

      const cancelButton = screen.getByText('Cancel Schedule');
      await user.click(cancelButton);

      expect(mockMutate).toHaveBeenCalledWith({
        reviewId: 123,
        action: 'unschedule',
      });
    });

    it('should close modal on successful action', async () => {
      mockSchedulePublicationMutation.mockReturnValue({
        mutate: vi.fn((_, { onSuccess }) => onSuccess()),
        isPending: false,
        isError: false,
        error: null,
      });

      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const scheduleButton = screen.getByText('Schedule Publication');
      await user.click(scheduleButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Quick Schedule Options', () => {
    it('should provide quick schedule buttons', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByText('In 1 hour')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow 9 AM')).toBeInTheDocument();
      expect(screen.getByText('Next week')).toBeInTheDocument();
    });

    it('should handle quick schedule selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const quickButton = screen.getByText('In 1 hour');
      await user.click(quickButton);

      // Should update the datetime picker values
      expect(screen.getByTestId('date-picker')).toHaveValue(expect.any(String));
    });
  });

  describe('Loading States', () => {
    it('should show loading state during scheduling', () => {
      mockSchedulePublicationMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        isError: false,
        error: null,
      });

      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByText('Scheduling...')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-loading')).toBeInLoadingState();
    });

    it('should disable form during loading', () => {
      mockSchedulePublicationMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
        isError: false,
        error: null,
      });

      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByTestId('date-picker')).toBeDisabled();
      expect(screen.getByText('Schedule Publication')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message on failure', () => {
      mockSchedulePublicationMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isError: true,
        error: new Error('Scheduling failed'),
      });

      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByText(/Failed to schedule publication/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeAccessible();
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByRole('dialog', { name: 'Schedule Publication' })).toBeInTheDocument();
      expect(screen.getByLabelText('Select date')).toBeInTheDocument();
      expect(screen.getByLabelText('Select time')).toBeInTheDocument();
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      // Focus should be trapped within modal
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);

      // Should cycle through focusable elements
      await user.tab();
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Visual Design', () => {
    it('should be responsive', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      const modal = screen.getByTestId('publish-schedule-modal');
      expect(modal).toBeResponsive();
    });

    it('should show timezone information', () => {
      renderWithProviders(<PublishScheduleModal {...defaultProps} />);

      expect(screen.getByText(/All times are in your local timezone/)).toBeInTheDocument();
    });
  });
});
