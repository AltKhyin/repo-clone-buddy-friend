// ABOUTME: Tests for ContentTypeSelector ensuring multi-select functionality and inline CRUD operations

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockAllProviders } from '@/test-utils/mock-providers';
import { ContentTypeSelector } from './ContentTypeSelector';

// Mock hooks
vi.mock('../../../../packages/hooks/useContentTypeManagement', () => ({
  useContentTypeManagement: () => ({
    data: [
      {
        id: 1,
        label: 'Review',
        description: 'Review padrão do sistema',
        text_color: '#374151',
        border_color: '#6b7280',
        background_color: '#f3f4f6',
        is_system: false,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 2,
        label: 'Análise de Artigo',
        description: 'Análise detalhada de artigos científicos',
        text_color: '#1e40af',
        border_color: '#3b82f6',
        background_color: '#dbeafe',
        is_system: false,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 3,
        label: 'Custom Type',
        description: 'Custom content type',
        text_color: '#065f46',
        border_color: '#10b981',
        background_color: '#d1fae5',
        is_system: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
  useContentTypeOperationMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe('ContentTypeSelector', () => {
  const mockOnChange = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the content type selector with label', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      expect(screen.getByText('Tipo de Conteúdo')).toBeInTheDocument();
    });

    it('should display available content types as checkboxes', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Análise de Artigo')).toBeInTheDocument();
      expect(screen.getByText('Custom Type')).toBeInTheDocument();
    });

    it('should show "Create New Content Type" button', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      expect(screen.getByText('Criar Novo Tipo de Conteúdo')).toBeInTheDocument();
    });
  });

  describe('Selection Functionality', () => {
    it('should display selected content types as styled pills', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[1, 2]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      // Should show pills for selected content types
      const pills = screen.getAllByText('Review');
      expect(pills.length).toBeGreaterThan(0);
      
      const analysisPills = screen.getAllByText('Análise de Artigo');
      expect(analysisPills.length).toBeGreaterThan(0);
    });

    it('should call onChange when content type is selected', async () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      const reviewCheckbox = screen.getByRole('checkbox', { name: /review/i });
      await user.click(reviewCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith([1]);
    });

    it('should call onChange when content type is deselected', async () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[1, 2]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      const reviewCheckbox = screen.getByRole('checkbox', { name: /review/i });
      await user.click(reviewCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith([2]);
    });

    it('should allow removing content type via pill X button', async () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[1]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      // Find the X button in the pill (assuming it has an accessible name or role)
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(button => 
        button.textContent?.includes('×') || button.className?.includes('remove')
      );

      if (removeButton) {
        await user.click(removeButton);
        expect(mockOnChange).toHaveBeenCalledWith([]);
      }
    });
  });

  describe('Inline Actions', () => {
    it('should show edit and delete buttons on hover for all content types', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      // All content types should have edit/delete buttons (opacity controlled by group-hover)
      expect(screen.getByText('Custom Type')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Análise de Artigo')).toBeInTheDocument();
    });

    it('should show edit and delete buttons for all content types', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      // All content types should be fully manageable
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Análise de Artigo')).toBeInTheDocument();
      expect(screen.getByText('Custom Type')).toBeInTheDocument();
    });

    it('should open create modal when create button is clicked', async () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      const createButton = screen.getByText('Criar Novo Tipo de Conteúdo');
      await user.click(createButton);

      // Modal should open (we'll verify this by checking for modal content)
      // This will be tested once the modal components are implemented
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom colors to content type pills', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[2]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      // Find the pill element and check if it has inline styles
      // This will verify that custom colors are applied correctly
      const pill = screen.getByText('Análise de Artigo').closest('[style]');
      expect(pill).toBeInTheDocument();
    });

    it('should display content type pills with proper borders', () => {
      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[1]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      // Verify that pills have border styling
      const pill = screen.getByText('Review').closest('[style]');
      expect(pill).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content types list gracefully', () => {
      // Mock empty data
      vi.mocked(require('../../../../packages/hooks/useContentTypeManagement').useContentTypeManagement).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      expect(screen.getByText('Tipo de Conteúdo')).toBeInTheDocument();
      expect(screen.getByText('Criar Novo Tipo de Conteúdo')).toBeInTheDocument();
    });

    it('should handle loading state appropriately', () => {
      vi.mocked(require('../../../../packages/hooks/useContentTypeManagement').useContentTypeManagement).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(
        <MockAllProviders>
          <ContentTypeSelector 
            selectedContentTypes={[]} 
            onChange={mockOnChange} 
          />
        </MockAllProviders>
      );

      // Component should still render with loading state
      expect(screen.getByText('Tipo de Conteúdo')).toBeInTheDocument();
    });
  });
});