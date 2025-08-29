// ABOUTME: Unit tests for simplified MinimalCommentInput component ensuring core comment functionality works correctly.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MinimalCommentInput } from '../MinimalCommentInput';

// Mock the useCreateCommentMutation hook
const mockMutate = vi.fn();
let mockIsPending = false;

vi.mock('@packages/hooks/useCreateCommentMutation', () => ({
  useCreateCommentMutation: () => ({
    mutate: mockMutate,
    get isPending() { return mockIsPending; },
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Test wrapper with QueryClient
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MinimalCommentInput', () => {
  const mockOnCommentPosted = vi.fn();
  const defaultProps = {
    parentPostId: 123,
    rootPostId: 456,
    onCommentPosted: mockOnCommentPosted,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  describe('Collapsed State', () => {
    it('renders collapsed state with default placeholder', () => {
      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Participar da conversa')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('renders collapsed state with custom placeholder', () => {
      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} placeholder="Custom placeholder" />
        </TestWrapper>
      );

      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('expands when clicked', () => {
      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Participar da conversa'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
  });

  describe('Expanded State', () => {
    const renderExpanded = (props = {}) => {
      const result = render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} {...props} />
        </TestWrapper>
      );

      // Click to expand
      fireEvent.click(screen.getByText(props.placeholder || 'Participar da conversa'));
      
      return result;
    };

    it('renders textarea and action buttons when expanded', () => {
      renderExpanded();

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Escreva seu comentário...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Comentar' })).toBeInTheDocument();
    });

    it('does not render any media or rich text buttons', () => {
      renderExpanded();

      // Ensure no buttons with these titles exist
      expect(screen.queryByTitle('Adicionar imagem')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Adicionar GIF')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Alternar editor de texto')).not.toBeInTheDocument();
    });

    it('allows typing in textarea', () => {
      renderExpanded();

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test comment' } });

      expect(textarea).toHaveValue('Test comment');
    });

    it('disables submit button for short content', () => {
      renderExpanded();

      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: 'Comentar' });

      fireEvent.change(textarea, { target: { value: 'AB' } }); // Less than 3 characters

      expect(submitButton).toBeDisabled();
    });

    it('enables submit button for valid content', () => {
      renderExpanded();

      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: 'Comentar' });

      fireEvent.change(textarea, { target: { value: 'Valid comment' } });

      expect(submitButton).toBeEnabled();
    });

    it('collapses and clears content when cancel is clicked', () => {
      renderExpanded();

      const textarea = screen.getByRole('textbox');
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' });

      fireEvent.change(textarea, { target: { value: 'Some content' } });
      fireEvent.click(cancelButton);

      // Should be back to collapsed state
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Participar da conversa')).toBeInTheDocument();
    });
  });

  describe('Comment Submission', () => {
    it('submits comment with correct data', () => {
      const { rerender } = render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      // Expand and type
      fireEvent.click(screen.getByText('Participar da conversa'));
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test comment content' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Comentar' });
      fireEvent.click(submitButton);

      expect(mockMutate).toHaveBeenCalledWith(
        {
          content: 'Test comment content',
          parent_post_id: 123,
          root_post_id: 456,
          category: 'comment',
        },
        expect.any(Object)
      );
    });

    it('shows loading state during submission', () => {
      mockIsPending = true;

      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      // Expand and type
      fireEvent.click(screen.getByText('Participar da conversa'));
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test comment' } });

      expect(screen.getByText('Publicando...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    });

    it('handles successful submission', async () => {
      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      // Expand and type
      fireEvent.click(screen.getByText('Participar da conversa'));
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test comment' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: 'Comentar' });
      fireEvent.click(submitButton);

      // Simulate successful response
      const [, callbacks] = mockMutate.mock.calls[0];
      callbacks.onSuccess();

      expect(mockOnCommentPosted).toHaveBeenCalled();
      
      // Should return to collapsed state
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('prevents submission of empty or whitespace-only content', () => {
      const mockToastError = vi.fn();
      vi.doMock('sonner', () => ({
        toast: {
          error: mockToastError,
          success: vi.fn(),
        },
      }));

      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      // Expand and try to submit whitespace
      fireEvent.click(screen.getByText('Participar da conversa'));
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: 'Comentar' });
      fireEvent.click(submitButton);

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('focuses textarea when expanded', () => {
      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Participar da conversa'));

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    });

    it('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Participar da conversa'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Comentar' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing rootPostId by using parentPostId', () => {
      const propsWithoutRootId = {
        parentPostId: 123,
        onCommentPosted: mockOnCommentPosted,
      };

      render(
        <TestWrapper>
          <MinimalCommentInput {...propsWithoutRootId} />
        </TestWrapper>
      );

      // Expand and submit
      fireEvent.click(screen.getByText('Participar da conversa'));
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(screen.getByRole('button', { name: 'Comentar' }));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_post_id: 123,
          root_post_id: 123, // Should default to parentPostId
        }),
        expect.any(Object)
      );
    });

    it('applies custom className', () => {
      const { container } = render(
        <TestWrapper>
          <MinimalCommentInput {...defaultProps} className="custom-class" />
        </TestWrapper>
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});