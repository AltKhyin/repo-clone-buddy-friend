// ABOUTME: Tests for LinkInput component ensuring link preview functionality works correctly.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkInput } from '../LinkInput';
import type { LinkPreviewData } from '@/types/community';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('LinkInput', () => {
  const mockOnValueChange = vi.fn();
  const mockOnPreviewDataChange = vi.fn();
  let mockInvoke: any;

  const mockPreviewData: LinkPreviewData = {
    url: 'https://example.com',
    title: 'Example Title',
    description: 'Example description',
    image: 'https://example.com/image.jpg',
    siteName: 'Example Site',
    domain: 'example.com',
    favicon: 'https://example.com/favicon.ico',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const { supabase } = require('@/integrations/supabase/client');
    mockInvoke = supabase.functions.invoke;
  });

  it('renders input field and fetch button', () => {
    render(
      <LinkInput
        value=""
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    expect(screen.getByPlaceholderText(/cole o link aqui/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('updates input value when typing', async () => {
    const user = userEvent.setup();

    render(
      <LinkInput
        value=""
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    const input = screen.getByPlaceholderText(/cole o link aqui/i);
    await user.type(input, 'https://example.com');

    expect(mockOnValueChange).toHaveBeenCalledWith('https://example.com');
  });

  it('fetches link preview when button is clicked', async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        preview: mockPreviewData,
      },
      error: null,
    });

    render(
      <LinkInput
        value="https://example.com"
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get-link-preview', {
        body: { url: 'https://example.com' },
      });
    });

    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(mockPreviewData);
  });

  it('fetches preview on Enter key press', async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        preview: mockPreviewData,
      },
      error: null,
    });

    render(
      <LinkInput
        value="https://example.com"
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    const input = screen.getByPlaceholderText(/cole o link aqui/i);
    await user.type(input, '{enter}');

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get-link-preview', {
        body: { url: 'https://example.com' },
      });
    });
  });

  it('displays preview data when available', () => {
    render(
      <LinkInput
        value="https://example.com"
        onValueChange={mockOnValueChange}
        previewData={mockPreviewData}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    expect(screen.getByText('Example Title')).toBeInTheDocument();
    expect(screen.getByText('Example description')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByAltText('Link preview')).toBeInTheDocument();
  });

  it('removes preview when remove button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkInput
        value="https://example.com"
        onValueChange={mockOnValueChange}
        previewData={mockPreviewData}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    // Find the X button to remove preview
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(
      button => button.querySelector('svg') && button.getAttribute('class')?.includes('absolute')
    );

    expect(removeButton).toBeInTheDocument();
    await user.click(removeButton!);

    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(null);
  });

  it('shows error for invalid URL', async () => {
    const user = userEvent.setup();

    render(
      <LinkInput
        value="not-a-valid-url"
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/url inválida/i)).toBeInTheDocument();
    });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'API Error' },
    });

    render(
      <LinkInput
        value="https://example.com"
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/erro ao obter preview/i)).toBeInTheDocument();
    });

    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(null);
  });

  it('disables input and button when disabled prop is true', () => {
    render(
      <LinkInput
        value=""
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText(/cole o link aqui/i);
    const button = screen.getByRole('button');

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('shows loading state while fetching preview', async () => {
    const user = userEvent.setup();
    mockInvoke.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <LinkInput
        value="https://example.com"
        onValueChange={mockOnValueChange}
        previewData={null}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Should show loading spinner
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('clears preview data when URL changes', () => {
    const { rerender } = render(
      <LinkInput
        value="https://example.com"
        onValueChange={mockOnValueChange}
        previewData={mockPreviewData}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    // Change URL
    rerender(
      <LinkInput
        value="https://different.com"
        onValueChange={mockOnValueChange}
        previewData={mockPreviewData}
        onPreviewDataChange={mockOnPreviewDataChange}
      />
    );

    expect(mockOnPreviewDataChange).toHaveBeenCalledWith(null);
  });
});
