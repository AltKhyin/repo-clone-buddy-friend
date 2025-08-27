// ABOUTME: Tests for ReviewMetadataPanel reading time validation functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewMetadataPanel } from '../ReviewMetadataPanel';
import { UnifiedSaveProvider } from '../../common/UnifiedSaveProvider';

// Mock the hooks and context
const mockUpdateField = vi.fn();
vi.mock('../../../hooks/useSaveContext', () => ({
  useSaveContext: () => ({
    updateField: mockUpdateField,
  }),
}));

// Mock the mutation hook
vi.mock('../../../../../packages/hooks/useUpdateReviewMetadataMutation', () => ({
  useUpdateReviewMetadataMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock child components to focus on validation logic
vi.mock('../TagSelector', () => ({
  TagSelector: () => <div data-testid="tag-selector">TagSelector</div>,
}));

vi.mock('../CoverImageUpload', () => ({
  CoverImageUpload: () => <div data-testid="cover-upload">CoverImageUpload</div>,
}));

vi.mock('../AccessLevelSelector', () => ({
  AccessLevelSelector: () => <div data-testid="access-level-selector">AccessLevelSelector</div>,
}));

vi.mock('../ContentTypeSelector', () => ({
  ContentTypeSelector: () => <div data-testid="content-type-selector">ContentTypeSelector</div>,
}));

vi.mock('../ArticleDataSection', () => ({
  ArticleDataSection: () => <div data-testid="article-data-section">ArticleDataSection</div>,
}));

// Test data
const mockReview = {
  id: 1,
  title: 'Test Review',
  description: 'Test Description',
  access_level: 'free',
  cover_image_url: null,
  edicao: null,
  original_article_title: null,
  original_article_authors: null,
  original_article_publication_date: null,
  study_type: null,
  reading_time_minutes: null,
  custom_author_name: null,
  custom_author_avatar_url: null,
  tags: [],
  content_types: [],
};

// Test wrapper with QueryClient and SaveProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <UnifiedSaveProvider reviewId={1}>
        {children}
      </UnifiedSaveProvider>
    </QueryClientProvider>
  );
};

describe('ReviewMetadataPanel - Reading Time Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render reading time input without errors initially', () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    expect(readingTimeInput).toBeInTheDocument();
    expect(readingTimeInput).toHaveAttribute('type', 'number');
    expect(readingTimeInput).toHaveAttribute('min', '1');
    expect(readingTimeInput).toHaveAttribute('max', '999');
  });

  it('should show error for non-numeric input', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    fireEvent.change(readingTimeInput, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(screen.getByText('Reading time must be a number')).toBeInTheDocument();
    });

    // Check that input has error styling
    expect(readingTimeInput).toHaveClass('border-red-500');
  });

  it('should show error for zero value', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    fireEvent.change(readingTimeInput, { target: { value: '0' } });

    await waitFor(() => {
      expect(screen.getByText('Reading time must be greater than 0')).toBeInTheDocument();
    });

    expect(readingTimeInput).toHaveClass('border-red-500');
  });

  it('should show error for negative values', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    fireEvent.change(readingTimeInput, { target: { value: '-5' } });

    await waitFor(() => {
      expect(screen.getByText('Reading time must be greater than 0')).toBeInTheDocument();
    });

    expect(readingTimeInput).toHaveClass('border-red-500');
  });

  it('should show error for decimal values', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    fireEvent.change(readingTimeInput, { target: { value: '5.5' } });

    await waitFor(() => {
      expect(screen.getByText('Reading time must be a whole number')).toBeInTheDocument();
    });

    expect(readingTimeInput).toHaveClass('border-red-500');
  });

  it('should show error for values exceeding 999', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    fireEvent.change(readingTimeInput, { target: { value: '1000' } });

    await waitFor(() => {
      expect(screen.getByText('Reading time cannot exceed 999 minutes')).toBeInTheDocument();
    });

    expect(readingTimeInput).toHaveClass('border-red-500');
  });

  it('should not show error for valid positive integers', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    fireEvent.change(readingTimeInput, { target: { value: '8' } });

    // Wait a bit to ensure no error appears
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.queryByText(/Reading time/)).not.toBeInTheDocument();
    expect(readingTimeInput).not.toHaveClass('border-red-500');
  });

  it('should not show error for empty value', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    // First add a value, then clear it
    fireEvent.change(readingTimeInput, { target: { value: '8' } });
    fireEvent.change(readingTimeInput, { target: { value: '' } });

    // Wait a bit to ensure no error appears
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.queryByText(/Reading time/)).not.toBeInTheDocument();
    expect(readingTimeInput).not.toHaveClass('border-red-500');
  });

  it('should clear error when valid value is entered after invalid', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    // First enter invalid value
    fireEvent.change(readingTimeInput, { target: { value: 'abc' } });

    await waitFor(() => {
      expect(screen.getByText('Reading time must be a number')).toBeInTheDocument();
    });

    // Then enter valid value
    fireEvent.change(readingTimeInput, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.queryByText('Reading time must be a number')).not.toBeInTheDocument();
    });

    expect(readingTimeInput).not.toHaveClass('border-red-500');
  });

  it('should call updateField when input changes', async () => {
    render(
      <TestWrapper>
        <ReviewMetadataPanel review={mockReview} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)');
    
    fireEvent.change(readingTimeInput, { target: { value: '15' } });

    expect(mockUpdateField).toHaveBeenCalledWith('reading_time_minutes', '15');
  });

  it('should initialize with existing reading time value', () => {
    const reviewWithReadingTime = {
      ...mockReview,
      reading_time_minutes: 12,
    };

    render(
      <TestWrapper>
        <ReviewMetadataPanel review={reviewWithReadingTime} />
      </TestWrapper>
    );

    const readingTimeInput = screen.getByLabelText('Reading Time (minutes)') as HTMLInputElement;
    expect(readingTimeInput.value).toBe('12');
  });
});