// ABOUTME: Tests for TagSelector component ensuring hierarchical tag selection with search and database integration
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
import { TagSelector } from './TagSelector';

// Mock TanStack Query hooks
const mockTagsQuery = vi.fn();
const mockUpdateTagsMutation = vi.fn();

vi.mock('@packages/hooks/useTagsQuery', () => ({
  useTagsQuery: mockTagsQuery,
}));

vi.mock('@packages/hooks/useUpdateReviewTagsMutation', () => ({
  useUpdateReviewTagsMutation: mockUpdateTagsMutation,
}));

// Mock tags data
const mockTags = [
  {
    id: 1,
    tag_name: 'Cardiologia',
    parent_id: null,
    color: '#EF4444',
    description: 'Especialidade médica que trata do coração e sistema circulatório',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    tag_name: 'Neurologia',
    parent_id: null,
    color: '#8B5CF6',
    description: 'Especialidade médica que trata do sistema nervoso',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    tag_name: 'Arritmias',
    parent_id: 1,
    color: null,
    description: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    tag_name: 'Insuficiência Cardíaca',
    parent_id: 1,
    color: null,
    description: null,
    created_at: '2024-01-01T00:00:00Z',
  },
];

describe('TagSelector', () => {
  const defaultProps = {
    reviewId: 123,
    selectedTags: [1, 3], // Cardiologia and Arritmias selected
    onTagsChange: vi.fn(),
  };

  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup tags query mock
    mockTagsQuery.mockReturnValue({
      data: mockTags,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Setup mutation mock
    mockUpdateTagsMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  describe('Rendering', () => {
    it('should render tag selector with search', () => {
      renderWithProviders(<TagSelector {...defaultProps} />);

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search tags...')).toBeInTheDocument();
      expect(screen.getByText('Selected tags will appear here')).toBeInTheDocument();
    });

    it('should render hierarchical tag structure', () => {
      renderWithProviders(<TagSelector {...defaultProps} />);

      // Parent tags should be visible
      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
      expect(screen.getByText('Neurologia')).toBeInTheDocument();

      // Child tags should be indented
      const cardiologyChildren = screen.getByTestId('tag-children-1');
      expect(cardiologyChildren).toBeInTheDocument();
      expect(screen.getByText('Arritmias')).toBeInTheDocument();
      expect(screen.getByText('Insuficiência Cardíaca')).toBeInTheDocument();
    });

    it('should show selected tags with remove option', () => {
      renderWithProviders(<TagSelector {...defaultProps} />);

      // Should show selected tags
      const selectedTagsContainer = screen.getByTestId('selected-tags');
      expect(selectedTagsContainer).toBeInTheDocument();

      // Check if selected tags are marked
      const cardiologiaCheckbox = screen.getByRole('checkbox', { name: /cardiologia/i });
      const arritmiasCheckbox = screen.getByRole('checkbox', { name: /arritmias/i });

      expect(cardiologiaCheckbox).toBeChecked();
      expect(arritmiasCheckbox).toBeChecked();
    });

    it('should show loading state', () => {
      mockTagsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      });

      renderWithProviders(<TagSelector {...defaultProps} />);

      expect(screen.getByText('Loading tags...')).toBeInTheDocument();
      expect(screen.getByTestId('tag-selector-loading')).toBeInLoadingState();
    });

    it('should show error state', () => {
      mockTagsQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load tags'),
      });

      renderWithProviders(<TagSelector {...defaultProps} />);

      expect(screen.getByText(/Failed to load tags/)).toBeInTheDocument();
      expect(screen.getByTestId('tag-selector-error')).toBeInErrorState();
    });
  });

  describe('Tag Selection', () => {
    it('should handle tag selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      const neurologiaCheckbox = screen.getByRole('checkbox', { name: /neurologia/i });
      await user.click(neurologiaCheckbox);

      expect(defaultProps.onTagsChange).toHaveBeenCalledWith([1, 3, 2]); // Added Neurologia
    });

    it('should handle tag deselection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      const cardiologiaCheckbox = screen.getByRole('checkbox', { name: /cardiologia/i });
      await user.click(cardiologiaCheckbox);

      expect(defaultProps.onTagsChange).toHaveBeenCalledWith([3]); // Removed Cardiologia
    });

    it('should handle parent tag selection affecting children', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} selectedTags={[]} />);

      const cardiologiaCheckbox = screen.getByRole('checkbox', { name: /cardiologia/i });
      await user.click(cardiologiaCheckbox);

      // When parent is selected, should include parent
      expect(defaultProps.onTagsChange).toHaveBeenCalledWith([1]);
    });

    it('should save changes to database', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      // Select a new tag
      const neurologiaCheckbox = screen.getByRole('checkbox', { name: /neurologia/i });
      await user.click(neurologiaCheckbox);

      // Click save button
      const saveButton = screen.getByText('Save Tags');
      await user.click(saveButton);

      expect(mockMutate).toHaveBeenCalledWith({
        reviewId: 123,
        tagIds: [1, 3, 2],
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter tags by search term', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tags...');
      await user.type(searchInput, 'cardio');

      // Should show Cardiologia and its children
      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
      expect(screen.getByText('Arritmias')).toBeInTheDocument();

      // Should hide Neurologia
      expect(screen.queryByText('Neurologia')).not.toBeInTheDocument();
    });

    it('should clear search and show all tags', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tags...');
      await user.type(searchInput, 'cardio');
      await user.clear(searchInput);

      // All tags should be visible again
      expect(screen.getByText('Cardiologia')).toBeInTheDocument();
      expect(screen.getByText('Neurologia')).toBeInTheDocument();
    });

    it('should show no results message', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tags...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No tags found matching your search')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should display tag colors correctly', () => {
      renderWithProviders(<TagSelector {...defaultProps} />);

      // Check if color indicators are present
      const cardiologyColorIndicator = screen.getByTestId('tag-color-1');
      expect(cardiologyColorIndicator).toHaveStyle('background-color: #EF4444');

      const neurologyColorIndicator = screen.getByTestId('tag-color-2');
      expect(neurologyColorIndicator).toHaveStyle('background-color: #8B5CF6');
    });

    it('should show tag descriptions on hover', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      const cardiologyTag = screen.getByText('Cardiologia');
      await user.hover(cardiologyTag);

      await waitFor(() => {
        expect(
          screen.getByText('Especialidade médica que trata do coração e sistema circulatório')
        ).toBeInTheDocument();
      });
    });

    it('should be responsive', () => {
      renderWithProviders(<TagSelector {...defaultProps} />);

      const tagSelector = screen.getByTestId('tag-selector');
      expect(tagSelector).toBeResponsive();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      renderWithProviders(<TagSelector {...defaultProps} />);

      const tagSelector = screen.getByTestId('tag-selector');
      expect(tagSelector).toBeAccessible();
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<TagSelector {...defaultProps} />);

      expect(screen.getByLabelText('Search tags')).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Tag selection' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Selected tags' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TagSelector {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search tags...');
      searchInput.focus();

      // Tab to first checkbox
      await user.keyboard('{Tab}');
      const cardiologiaCheckbox = screen.getByRole('checkbox', { name: /cardiologia/i });
      expect(cardiologiaCheckbox).toHaveFocus();

      // Space to toggle
      await user.keyboard(' ');
      expect(defaultProps.onTagsChange).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle large number of tags efficiently', () => {
      const largeMockTags = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        tag_name: `Tag ${i + 1}`,
        parent_id: i % 10 === 0 ? null : Math.floor(i / 10) + 1,
        color: null,
        description: null,
        created_at: '2024-01-01T00:00:00Z',
      }));

      mockTagsQuery.mockReturnValue({
        data: largeMockTags,
        isLoading: false,
        isError: false,
        error: null,
      });

      const startTime = performance.now();
      renderWithProviders(<TagSelector {...defaultProps} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 500ms)
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
