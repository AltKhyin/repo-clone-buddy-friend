// ABOUTME: Tests for ReviewCard with enhanced metadata display functionality

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewCard } from './ReviewCard';
import { ReviewQueueItem } from '../../../../packages/hooks/useAdminContentQueue';
import { MemoryRouter } from 'react-router-dom';

// Mock content type for testing
const mockContentType = {
  id: 1,
  label: 'Meta-análise',
  text_color: '#1e40af',
  border_color: '#3b82f6',
  background_color: '#dbeafe',
  description: 'Revisões de meta-análises',
  is_system: false,
  created_at: '2024-01-01T00:00:00Z',
  created_by: null
};

// Helper to create mock review with enhanced metadata
const createMockReview = (overrides: Partial<ReviewQueueItem> = {}): ReviewQueueItem => ({
  id: 1,
  title: 'Sample Review Title',
  description: 'Sample review description',
  cover_image_url: null,
  review_status: 'pending',
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
  access_level: 'free',
  published_at: null,
  scheduled_publish_at: null,
  review_requested_at: null,
  reviewed_at: null,
  author_id: 'author-1',
  reviewer_id: null,
  publication_notes: null,
  author: {
    id: 'author-1',
    full_name: 'Dr. Test Author',
    avatar_url: null
  },
  reviewer: null,
  content_types: [],
  ...overrides
});

// Wrapper component to provide routing context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('ReviewCard with Enhanced Metadata', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('Article Metadata Display', () => {
    it('displays article metadata when present', () => {
      const reviewWithMetadata = createMockReview({
        edicao: 'Janeiro 2024',
        original_article_title: 'A Comprehensive Meta-Analysis of Treatment Effectiveness',
        original_article_authors: 'Dr. Smith, Dr. Johnson, Dr. Williams',
        study_type: 'Randomized Controlled Trial',
        original_article_publication_date: '2024-01-14',
        content_types: [mockContentType]
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithMetadata} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      // Check for article metadata section header
      expect(screen.getByText('Dados do Artigo')).toBeInTheDocument();
      
      // Check for edition
      expect(screen.getByText('Janeiro 2024')).toBeInTheDocument();
      
      // Check for article title
      expect(screen.getByText('A Comprehensive Meta-Analysis of Treatment Effectiveness')).toBeInTheDocument();
      
      // Check for authors
      expect(screen.getByText('Dr. Smith, Dr. Johnson, Dr. Williams')).toBeInTheDocument();
      
      // Check for study type
      expect(screen.getByText('Randomized Controlled Trial')).toBeInTheDocument();
      
      // Check for publication date label (date formatting is complex to test)
      expect(screen.getByText(/Data:/)).toBeInTheDocument();
    });

    it('hides article metadata section when no data present', () => {
      const reviewWithoutMetadata = createMockReview({
        edicao: null,
        original_article_title: null,
        original_article_authors: null,
        study_type: null,
        original_article_publication_date: null
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithoutMetadata} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Dados do Artigo')).not.toBeInTheDocument();
    });

    it('shows partial metadata when only some fields are present', () => {
      const reviewWithPartialMetadata = createMockReview({
        edicao: 'Fevereiro 2024',
        study_type: 'Case Study',
        original_article_title: null,
        original_article_authors: null,
        original_article_publication_date: null
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithPartialMetadata} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Dados do Artigo')).toBeInTheDocument();
      expect(screen.getByText('Fevereiro 2024')).toBeInTheDocument();
      expect(screen.getByText('Case Study')).toBeInTheDocument();
      
      // Should not show missing fields
      expect(screen.queryByText('Título:')).not.toBeInTheDocument();
      expect(screen.queryByText('Autores:')).not.toBeInTheDocument();
    });
  });

  describe('Content Types Display', () => {
    it('displays content type badges with proper styling', () => {
      const reviewWithContentTypes = createMockReview({
        content_types: [mockContentType]
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithContentTypes} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      const badge = screen.getByText('Meta-análise');
      expect(badge).toBeInTheDocument();
      
      // Check that the badge has the correct styling
      expect(badge).toHaveStyle({
        color: '#1e40af',
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6'
      });
    });

    it('displays multiple content types', () => {
      const secondContentType = {
        ...mockContentType,
        id: 2,
        label: 'Revisão Sistemática',
        text_color: '#065f46',
        border_color: '#10b981',
        background_color: '#d1fae5',
        is_system: false
      };

      const reviewWithMultipleTypes = createMockReview({
        content_types: [mockContentType, secondContentType]
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithMultipleTypes} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Meta-análise')).toBeInTheDocument();
      expect(screen.getByText('Revisão Sistemática')).toBeInTheDocument();
    });

    it('hides content types section when no types are present', () => {
      const reviewWithoutTypes = createMockReview({
        content_types: []
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithoutTypes} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Meta-análise')).not.toBeInTheDocument();
    });
  });

  describe('Enhanced Information Architecture', () => {
    it('maintains logical information hierarchy', () => {
      const reviewWithAllData = createMockReview({
        title: 'Comprehensive Review Title',
        description: 'Detailed review description',
        edicao: 'Março 2024',
        original_article_title: 'Original Research Article',
        content_types: [mockContentType]
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithAllData} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      // Check that information appears in the correct order
      const title = screen.getByText('Comprehensive Review Title');
      const description = screen.getByText('Detailed review description');
      const contentType = screen.getByText('Meta-análise');
      const articleSection = screen.getByText('Dados do Artigo');
      
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      expect(contentType).toBeInTheDocument();
      expect(articleSection).toBeInTheDocument();
    });

    it('handles missing data gracefully without breaking layout', () => {
      const reviewWithMissingData = createMockReview({
        description: null,
        content_types: null,
        edicao: null,
        original_article_title: null
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithMissingData} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      // Should still render basic information
      expect(screen.getByText('Sample Review Title')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      
      // Should not show sections with no data
      expect(screen.queryByText('Dados do Artigo')).not.toBeInTheDocument();
    });
  });

  describe('Status and Layout Integration', () => {
    it('preserves existing status display functionality', () => {
      const publishedReview = createMockReview({
        status: 'published',
        published_at: '2024-01-14T00:00:00Z'
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={publishedReview} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText(/Publicado:/)).toBeInTheDocument();
    });

    it('maintains responsive design with new metadata', () => {
      const reviewWithAllData = createMockReview({
        edicao: 'Abril 2024',
        original_article_title: 'Very Long Article Title That Should Wrap Properly in Mobile Layout',
        original_article_authors: 'Dr. First Author, Dr. Second Author, Dr. Third Author, Dr. Fourth Author',
        content_types: [mockContentType]
      });

      render(
        <TestWrapper>
          <ReviewCard 
            review={reviewWithAllData} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      // Should render without layout issues
      expect(screen.getByText('Abril 2024')).toBeInTheDocument();
      expect(screen.getByText('Very Long Article Title That Should Wrap Properly in Mobile Layout')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Interaction', () => {
    it('maintains proper action buttons functionality', () => {
      const review = createMockReview();

      render(
        <TestWrapper>
          <ReviewCard 
            review={review} 
            isSelected={false} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      const viewButton = screen.getByRole('link', { name: /visualizar/i });
      const manageButton = screen.getByRole('link', { name: /manage/i });

      expect(viewButton).toBeInTheDocument();
      expect(manageButton).toBeInTheDocument();
      expect(viewButton).toHaveAttribute('href', '/reviews/1');
      expect(manageButton).toHaveAttribute('href', '/admin/review/1');
    });

    it('supports selection functionality', () => {
      const review = createMockReview();

      render(
        <TestWrapper>
          <ReviewCard 
            review={review} 
            isSelected={true} 
            onSelect={mockOnSelect}
          />
        </TestWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });
  });
});