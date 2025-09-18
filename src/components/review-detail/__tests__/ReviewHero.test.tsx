// ABOUTME: Tests for ReviewHero component ensuring magazine-style layout and responsive behavior.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReviewHero from '../ReviewHero';
import { ReviewDetail } from '../../../../packages/hooks/useReviewDetailQuery';

// Mock useIsMobile hook
const mockUseIsMobile = vi.fn();
vi.mock('../../../hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockReview: ReviewDetail = {
  id: 123,
  title: 'Sample Review Title',
  description: 'This is a sample review description for testing purposes.',
  cover_image_url: 'https://example.com/cover.jpg',
  structured_content: {},
  published_at: '2024-01-15T10:00:00Z',
  author: {
    id: 'author-1',
    full_name: 'John Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    profession: 'Cardiologist',
  },
  access_level: 'public',
  community_post_id: null,
  view_count: 1250,
  edicao: null,
  tags: ['test', 'sample'],
  // Custom author fields
  custom_author_name: null,
  custom_author_avatar_url: null,
  custom_author_description: null,
  // V3 Content Bridge metadata
  contentFormat: 'v3',
  nodeCount: 10,
  hasPositions: true,
  hasMobilePositions: true,
};

describe('ReviewHero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should render magazine-style desktop layout with side-by-side structure', () => {
      render(<ReviewHero review={mockReview} />);
      
      // Check for cover image
      const coverImage = screen.getByAltText(mockReview.title);
      expect(coverImage).toBeInTheDocument();
      expect(coverImage).toHaveClass('w-full', 'h-full', 'object-cover');
      
      // Check for article title with large typography
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent(mockReview.title);
      expect(title).toHaveClass('text-5xl', 'lg:text-6xl', 'font-serif');
    });

    it('should display author credibility section prominently', () => {
      render(<ReviewHero review={mockReview} />);
      
      // Check author name
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Autor desta edição')).toBeInTheDocument();
      
      // Check author avatar
      const avatar = screen.getByRole('img', { name: /john doe/i });
      expect(avatar).toBeInTheDocument();
    });

    it('should show rich publication metadata', () => {
      render(<ReviewHero review={mockReview} />);
      
      // Check publication date (Portuguese format)
      expect(screen.getByText('15 de janeiro de 2024')).toBeInTheDocument();
      
      // Check reading time
      expect(screen.getByText('5min de leitura')).toBeInTheDocument();
      
      // Check view count
      expect(screen.getByText('1,3k visualizações')).toBeInTheDocument();
      
      // Check article type
      expect(screen.getByText('Artigo')).toBeInTheDocument();
    });

    it('should display review ID badge', () => {
      render(<ReviewHero review={mockReview} />);
      
      const badge = screen.getByText('#123');
      expect(badge).toBeInTheDocument();
      expect(badge.closest('.badge')).toHaveClass('border');
    });

    it('should render fallback cover image when cover_image_url is null', () => {
      const reviewWithoutCover = { ...mockReview, cover_image_url: null };
      render(<ReviewHero review={reviewWithoutCover} />);
      
      // Should show fallback with first letter
      expect(screen.getByText('S')).toBeInTheDocument(); // First letter of "Sample"
      expect(screen.getByText('EVIDENS')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it('should render magazine-style mobile layout with compact cover', () => {
      render(<ReviewHero review={mockReview} />);
      
      // Check for compact cover image
      const coverImage = screen.getByAltText(mockReview.title);
      expect(coverImage).toBeInTheDocument();
      expect(coverImage.closest('div')).toHaveClass('w-32', 'h-48');
      
      // Check for article title with mobile typography
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent(mockReview.title);
      expect(title).toHaveClass('text-3xl', 'sm:text-4xl');
    });

    it('should display metadata in grid layout on mobile', () => {
      render(<ReviewHero review={mockReview} />);
      
      // Check metadata grid exists
      const metadataGrid = screen.getByText('15 de janeiro de 2024').closest('.grid');
      expect(metadataGrid).toHaveClass('grid-cols-2');
    });

    it('should not render compact cover when cover_image_url is null on mobile', () => {
      const reviewWithoutCover = { ...mockReview, cover_image_url: null };
      render(<ReviewHero review={reviewWithoutCover} />);
      
      // Should not show cover section at all
      expect(screen.queryByAltText(reviewWithoutCover.title)).not.toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should handle missing author data gracefully', () => {
      const reviewWithoutAuthor = { ...mockReview, author: null };
      render(<ReviewHero review={reviewWithoutAuthor} />);
      
      expect(screen.getByText('EVIDENS')).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument(); // Fallback initial
    });

    it('should handle missing description gracefully', () => {
      const reviewWithoutDescription = { ...mockReview, description: null };
      render(<ReviewHero review={reviewWithoutDescription} />);
      
      // Should not crash and title should still be visible
      expect(screen.getByText(mockReview.title)).toBeInTheDocument();
      expect(screen.queryByText(mockReview.description!)).not.toBeInTheDocument();
    });

    it('should format view counts correctly', () => {
      mockUseIsMobile.mockReturnValue(false);
      
      // Test different view count scenarios
      const scenarios = [
        { count: 0, expected: '0 visualizações' },
        { count: 1, expected: '1 visualização' },
        { count: 500, expected: '500 visualizações' },
        { count: 1500, expected: '1,5k visualizações' },
        { count: 1000000, expected: '1,0M visualizações' },
      ];

      scenarios.forEach(({ count, expected }) => {
        const reviewWithCount = { ...mockReview, view_count: count };
        const { rerender } = render(<ReviewHero review={reviewWithCount} />);
        
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        // Clean up for next iteration
        rerender(<div />);
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    it('should have proper heading hierarchy', () => {
      render(<ReviewHero review={mockReview} />);
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent(mockReview.title);
    });

    it('should have proper alt text for images', () => {
      render(<ReviewHero review={mockReview} />);
      
      const coverImage = screen.getByAltText(mockReview.title);
      expect(coverImage).toBeInTheDocument();
      
      // Author avatar should also have alt text via Avatar component
      const authorImage = screen.getByRole('img', { name: /john doe/i });
      expect(authorImage).toBeInTheDocument();
    });

    it('should have proper loading attributes for images', () => {
      render(<ReviewHero review={mockReview} />);
      
      const coverImage = screen.getByAltText(mockReview.title);
      expect(coverImage).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Author Prioritization and Description Fallback', () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false);
    });

    describe('Author Name Prioritization', () => {
      it('should prioritize custom_author_name over author.full_name', () => {
        const reviewWithCustomName = {
          ...mockReview,
          custom_author_name: 'Custom Author Name',
          author: { ...mockReview.author!, full_name: 'Original Author' }
        };

        render(<ReviewHero review={reviewWithCustomName} />);

        expect(screen.getByText('Por Custom Author Name')).toBeInTheDocument();
        expect(screen.queryByText('Por Original Author')).not.toBeInTheDocument();
      });

      it('should fallback to author.full_name when custom_author_name is null', () => {
        const reviewWithoutCustomName = {
          ...mockReview,
          custom_author_name: null,
          author: { ...mockReview.author!, full_name: 'Original Author' }
        };

        render(<ReviewHero review={reviewWithoutCustomName} />);

        expect(screen.getByText('Por Original Author')).toBeInTheDocument();
      });

      it('should fallback to EVIDENS when both custom_author_name and author.full_name are null', () => {
        const reviewWithNoAuthor = {
          ...mockReview,
          custom_author_name: null,
          author: null
        };

        render(<ReviewHero review={reviewWithNoAuthor} />);

        expect(screen.getByText('Por EVIDENS')).toBeInTheDocument();
      });
    });

    describe('Author Avatar Prioritization', () => {
      it('should prioritize custom_author_avatar_url over author.avatar_url', () => {
        const reviewWithCustomAvatar = {
          ...mockReview,
          custom_author_avatar_url: 'https://example.com/custom-avatar.jpg',
          author: { ...mockReview.author!, avatar_url: 'https://example.com/original-avatar.jpg' }
        };

        render(<ReviewHero review={reviewWithCustomAvatar} />);

        const avatarImage = screen.getByRole('img');
        expect(avatarImage).toHaveAttribute('src', 'https://example.com/custom-avatar.jpg');
      });

      it('should fallback to author.avatar_url when custom_author_avatar_url is null', () => {
        const reviewWithoutCustomAvatar = {
          ...mockReview,
          custom_author_avatar_url: null,
          author: { ...mockReview.author!, avatar_url: 'https://example.com/original-avatar.jpg' }
        };

        render(<ReviewHero review={reviewWithoutCustomAvatar} />);

        const avatarImage = screen.getByRole('img');
        expect(avatarImage).toHaveAttribute('src', 'https://example.com/original-avatar.jpg');
      });

      it('should show fallback when both avatar URLs are null', () => {
        const reviewWithNoAvatar = {
          ...mockReview,
          custom_author_avatar_url: null,
          author: { ...mockReview.author!, avatar_url: null }
        };

        render(<ReviewHero review={reviewWithNoAvatar} />);

        // Should show fallback initials (first letter of author name)
        expect(screen.getByText('J')).toBeInTheDocument(); // First letter of "John"
      });
    });

    describe('Author Description Fallback', () => {
      it('should display custom_author_description when available', () => {
        const reviewWithCustomDescription = {
          ...mockReview,
          custom_author_description: 'Custom author description text',
          author: { ...mockReview.author!, profession: 'Original Profession' }
        };

        render(<ReviewHero review={reviewWithCustomDescription} />);

        expect(screen.getByText('Custom author description text')).toBeInTheDocument();
        expect(screen.queryByText('Original Profession')).not.toBeInTheDocument();
      });

      it('should fallback to author.profession when custom_author_description is null', () => {
        const reviewWithProfession = {
          ...mockReview,
          custom_author_description: null,
          author: { ...mockReview.author!, profession: 'Cardiologist' }
        };

        render(<ReviewHero review={reviewWithProfession} />);

        expect(screen.getByText('Cardiologist')).toBeInTheDocument();
      });

      it('should not display description section when both fields are null', () => {
        const reviewWithNoDescription = {
          ...mockReview,
          custom_author_description: null,
          author: { ...mockReview.author!, profession: null }
        };

        render(<ReviewHero review={reviewWithNoDescription} />);

        // Description element should not exist
        const descriptionElements = screen.queryAllByText(/cardiologist|custom/i);
        expect(descriptionElements).toHaveLength(0);
      });

      it('should not display description section when author is null', () => {
        const reviewWithNoAuthor = {
          ...mockReview,
          custom_author_description: null,
          author: null
        };

        render(<ReviewHero review={reviewWithNoAuthor} />);

        // Only EVIDENS author name should be visible, no description
        expect(screen.getByText('Por EVIDENS')).toBeInTheDocument();
        expect(screen.queryByText(/cardiologist|custom/i)).not.toBeInTheDocument();
      });
    });

    describe('Mobile Layout Author Features', () => {
      beforeEach(() => {
        mockUseIsMobile.mockReturnValue(true);
      });

      it('should apply author prioritization on mobile layout', () => {
        const reviewWithCustomFields = {
          ...mockReview,
          custom_author_name: 'Mobile Custom Author',
          custom_author_description: 'Mobile custom description'
        };

        render(<ReviewHero review={reviewWithCustomFields} />);

        expect(screen.getByText('Por Mobile Custom Author')).toBeInTheDocument();
        expect(screen.getByText('Mobile custom description')).toBeInTheDocument();
      });

      it('should show profession fallback on mobile layout', () => {
        const reviewWithProfession = {
          ...mockReview,
          custom_author_name: null,
          custom_author_description: null,
          author: { ...mockReview.author!, full_name: 'Mobile Author', profession: 'Mobile Specialist' }
        };

        render(<ReviewHero review={reviewWithProfession} />);

        expect(screen.getByText('Por Mobile Author')).toBeInTheDocument();
        expect(screen.getByText('Mobile Specialist')).toBeInTheDocument();
      });
    });
  });
});