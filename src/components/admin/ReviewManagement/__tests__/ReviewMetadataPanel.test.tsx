// ABOUTME: Tests for ReviewMetadataPanel ensuring dynamic review card fields are properly rendered and functional

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewMetadataPanel } from '../ReviewMetadataPanel';

// Mock the save context hook
vi.mock('@/hooks/useSaveContext', () => ({
  useSaveContext: vi.fn(() => ({
    updateField: vi.fn(),
    saveState: 'idle',
    hasUnsavedChanges: false,
  })),
}));

// Mock the mutation hook
vi.mock('../../../../../packages/hooks/useUpdateReviewMetadataMutation', () => ({
  useUpdateReviewMetadataMutation: () => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

// Mock child components to avoid complex dependencies
vi.mock('../TagSelector', () => ({
  TagSelector: () => <div data-testid="tag-selector">Mock Tag Selector</div>,
}));

vi.mock('../CoverImageUpload', () => ({
  CoverImageUpload: () => <div data-testid="cover-upload">Mock Cover Upload</div>,
}));

vi.mock('../AccessLevelSelector', () => ({
  AccessLevelSelector: () => <div data-testid="access-level">Mock Access Level</div>,
}));

vi.mock('../ContentTypeSelector', () => ({
  ContentTypeSelector: () => <div data-testid="content-type-selector">Mock Content Type</div>,
}));

vi.mock('../ArticleDataSection', () => ({
  ArticleDataSection: () => <div data-testid="article-data">Mock Article Data</div>,
}));

const mockReview = {
  id: 1,
  title: 'Test Review',
  description: 'Test Description',
  access_level: 'free',
  cover_image_url: 'test-cover.jpg',
  status: 'draft',
  view_count: 0,
  review_status: 'pending',
  created_at: '2023-01-01',
  edicao: '1ª edição',
  original_article_title: 'Original Article',
  original_article_authors: 'Author Name',
  original_article_publication_date: '2023-01-01',
  study_type: 'RCT',
  // Dynamic review card fields
  reading_time_minutes: 8,
  custom_author_name: 'Custom Author',
  custom_author_avatar_url: 'custom-avatar.jpg',
  tags: [],
  content_types: [],
  author: { id: '1', full_name: 'John Doe', avatar_url: 'avatar.jpg' },
  structured_content: null,
};

describe('ReviewMetadataPanel - Dynamic Review Card Fields', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (review = mockReview) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ReviewMetadataPanel review={review} />
      </QueryClientProvider>
    );
  };

  it('should render reading time input field with proper label', () => {
    renderComponent();

    const readingTimeLabel = screen.getByLabelText(/reading time/i);
    expect(readingTimeLabel).toBeInTheDocument();
    expect(readingTimeLabel).toHaveAttribute('type', 'number');
    expect(readingTimeLabel).toHaveValue(8);
  });

  it('should render custom author name input field', () => {
    renderComponent();

    const authorNameInput = screen.getByLabelText(/custom author name/i);
    expect(authorNameInput).toBeInTheDocument();
    expect(authorNameInput).toHaveValue('Custom Author');
  });

  it('should render custom author avatar URL input field', () => {
    renderComponent();

    const avatarUrlInput = screen.getByLabelText(/custom author avatar/i);
    expect(avatarUrlInput).toBeInTheDocument();
    expect(avatarUrlInput).toHaveValue('custom-avatar.jpg');
  });
});
