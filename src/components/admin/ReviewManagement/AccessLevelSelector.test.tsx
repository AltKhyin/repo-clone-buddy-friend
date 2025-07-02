// ABOUTME: Tests for AccessLevelSelector component ensuring new business requirements (free/premium/admin_editor)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { AccessLevelSelector } from './AccessLevelSelector';

describe('AccessLevelSelector', () => {
  const defaultProps = {
    value: 'free',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render access level selector with correct label', () => {
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      expect(screen.getByText('Access Level')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show current value', () => {
      renderWithProviders(<AccessLevelSelector {...defaultProps} value="premium" />);

      expect(screen.getByDisplayValue('Premium Users')).toBeInTheDocument();
    });

    it('should show placeholder when no value selected', () => {
      renderWithProviders(<AccessLevelSelector {...defaultProps} value="" />);

      expect(screen.getByText('Select access level')).toBeInTheDocument();
    });
  });

  describe('Access Level Options', () => {
    it('should show all three access level options', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      // Check all three options are present
      expect(screen.getByText('Free Users')).toBeInTheDocument();
      expect(screen.getByText('Premium Users')).toBeInTheDocument();
      expect(screen.getByText('Admin/Editor Only')).toBeInTheDocument();
    });

    it('should show correct descriptions for each option', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      expect(screen.getByText('Available to all users')).toBeInTheDocument();
      expect(screen.getByText('Requires premium subscription')).toBeInTheDocument();
      expect(screen.getByText('Restricted to admin and editors')).toBeInTheDocument();
    });

    it('should show correct icons for each option', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });
  });

  describe('Selection Behavior', () => {
    it('should handle free user selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} value="premium" />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      const freeOption = screen.getByText('Free Users');
      await user.click(freeOption);

      expect(defaultProps.onChange).toHaveBeenCalledWith('free');
    });

    it('should handle premium user selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      const premiumOption = screen.getByText('Premium Users');
      await user.click(premiumOption);

      expect(defaultProps.onChange).toHaveBeenCalledWith('premium');
    });

    it('should handle admin/editor selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      const adminOption = screen.getByText('Admin/Editor Only');
      await user.click(adminOption);

      expect(defaultProps.onChange).toHaveBeenCalledWith('admin_editor');
    });
  });

  describe('Visual Design', () => {
    it('should show different colors for each access level', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      // Check color indicators are present
      const freeIndicator = screen.getByTestId('access-level-free');
      const premiumIndicator = screen.getByTestId('access-level-premium');
      const adminIndicator = screen.getByTestId('access-level-admin_editor');

      expect(freeIndicator).toBeInTheDocument();
      expect(premiumIndicator).toBeInTheDocument();
      expect(adminIndicator).toBeInTheDocument();
    });

    it('should be responsive', () => {
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByTestId('access-level-selector');
      expect(selector).toBeResponsive();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByTestId('access-level-selector');
      expect(selector).toBeAccessible();
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      expect(screen.getByLabelText('Access Level')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /access level/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      selector.focus();

      // Open with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Free Users')).toBeInTheDocument();

      // Navigate with arrows
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(defaultProps.onChange).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should not allow invalid access level values', () => {
      // Test should ensure only valid values are accepted
      renderWithProviders(<AccessLevelSelector {...defaultProps} value="invalid" />);

      // Should fallback to empty state
      expect(screen.getByText('Select access level')).toBeInTheDocument();
    });

    it('should handle empty/null values gracefully', () => {
      renderWithProviders(<AccessLevelSelector {...defaultProps} value="" />);

      expect(screen.getByText('Select access level')).toBeInTheDocument();
    });
  });

  describe('Business Logic', () => {
    it('should display security warning for admin_editor level', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      const adminOption = screen.getByText('Admin/Editor Only');
      await user.hover(adminOption);

      expect(screen.getByText(/Highly restricted content/)).toBeInTheDocument();
    });

    it('should show premium badge for premium option', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessLevelSelector {...defaultProps} />);

      const selector = screen.getByRole('combobox');
      await user.click(selector);

      expect(screen.getByTestId('premium-badge')).toBeInTheDocument();
    });
  });
});
