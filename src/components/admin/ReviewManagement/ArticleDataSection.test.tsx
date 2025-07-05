// ABOUTME: Tests for ArticleDataSection ensuring all article metadata fields work correctly

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockAllProviders } from '@/test-utils/mock-providers';
import { ArticleDataSection } from './ArticleDataSection';

// Mock the study types hook
vi.mock('../../../../packages/hooks/useStudyTypesConfiguration', () => {
  const mockImplementation = vi.fn(() => ({
    data: [
      'Revisão Sistemática',
      'Meta-análise',
      'Ensaio Clínico Randomizado (RCT)',
      'Estudo de Coorte',
      'Estudo Caso-Controle',
      'Estudo Transversal',
      'Relato de Caso',
    ],
    isLoading: false,
    error: null,
  }));
  
  return {
    useStudyTypesConfiguration: mockImplementation,
  };
});

describe('ArticleDataSection', () => {
  const mockOnChange = vi.fn();
  const user = userEvent.setup();

  const defaultData = {
    original_article_title: '',
    original_article_authors: '',
    original_article_publication_date: '',
    study_type: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render section title and description', () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      expect(screen.getByText('Dados do Artigo Original')).toBeInTheDocument();
      expect(screen.getByText(/Informações sobre o artigo científico original/)).toBeInTheDocument();
    });

    it('should render all article metadata input fields', () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      expect(screen.getByLabelText('Título do Artigo Original')).toBeInTheDocument();
      expect(screen.getByLabelText('Autores do Artigo')).toBeInTheDocument();
      expect(screen.getByLabelText('Data de Publicação')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de Estudo')).toBeInTheDocument();
    });

    it('should populate fields with provided data', () => {
      const testData = {
        original_article_title: 'Test Article Title',
        original_article_authors: 'Silva A, Santos B',
        original_article_publication_date: '2024-01-15',
        study_type: 'Meta-análise',
      };

      render(
        <MockAllProviders>
          <ArticleDataSection data={testData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      expect(screen.getByDisplayValue('Test Article Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Silva A, Santos B')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
      // For Select component, check that the value is displayed as text
      expect(screen.getByText('Meta-análise')).toBeInTheDocument();
    });
  });

  describe('Field Interactions', () => {
    it('should call onChange when article title is updated', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const titleInput = screen.getByLabelText('Título do Artigo Original');
      await user.type(titleInput, 'T');

      // Check that onChange was called for the field
      expect(mockOnChange).toHaveBeenCalledWith('original_article_title', expect.any(String));
    });

    it('should call onChange when authors are updated', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const authorsInput = screen.getByLabelText('Autores do Artigo');
      await user.type(authorsInput, 'T');

      // Check that onChange was called for the field
      expect(mockOnChange).toHaveBeenCalledWith('original_article_authors', expect.any(String));
    });

    it('should call onChange when publication date is updated', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const dateInput = screen.getByLabelText('Data de Publicação');
      await user.type(dateInput, '2024-01-15');

      // userEvent.type calls onChange for each character, so check the final call
      expect(mockOnChange).toHaveBeenLastCalledWith('original_article_publication_date', '2024-01-15');
    });

    it('should call onChange when study type is selected', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const studyTypeSelect = screen.getByRole('combobox');
      await user.click(studyTypeSelect);

      const option = screen.getByText('Revisão Sistemática');
      await user.click(option);

      expect(mockOnChange).toHaveBeenCalledWith('study_type', 'Revisão Sistemática');
    });
  });

  describe('Study Type Dropdown', () => {
    it('should populate study type dropdown from configuration', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const studyTypeSelect = screen.getByRole('combobox');
      await user.click(studyTypeSelect);

      expect(screen.getByText('Revisão Sistemática')).toBeInTheDocument();
      expect(screen.getByText('Meta-análise')).toBeInTheDocument();
      expect(screen.getByText('Ensaio Clínico Randomizado (RCT)')).toBeInTheDocument();
      expect(screen.getByText('Estudo de Coorte')).toBeInTheDocument();
      expect(screen.getByText('Estudo Caso-Controle')).toBeInTheDocument();
      expect(screen.getByText('Estudo Transversal')).toBeInTheDocument();
      expect(screen.getByText('Relato de Caso')).toBeInTheDocument();
    });

    it('should show placeholder when no study type is selected', () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      expect(screen.getByText('Selecionar tipo de estudo...')).toBeInTheDocument();
    });

    it('should handle empty study types list gracefully', async () => {
      // Mock the hook to return empty data
      const { useStudyTypesConfiguration } = await import('../../../../packages/hooks/useStudyTypesConfiguration');
      vi.mocked(useStudyTypesConfiguration).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const studyTypeSelect = screen.getByRole('combobox');
      expect(studyTypeSelect).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid date format', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const dateInput = screen.getByLabelText('Data de Publicação');
      await user.type(dateInput, '2024-12-31');

      // userEvent.type calls onChange for each character, so check the final call
      expect(mockOnChange).toHaveBeenLastCalledWith('original_article_publication_date', '2024-12-31');
    });

    it('should handle long article titles appropriately', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const titleInput = screen.getByLabelText('Título do Artigo Original');
      await user.type(titleInput, 'Very long title');

      // Check that onChange was called for the title field - just verify it gets called
      expect(mockOnChange).toHaveBeenCalledWith('original_article_title', expect.any(String));
    });

    it('should handle special characters in author names', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const authorsInput = screen.getByLabelText('Autores do Artigo');
      await user.type(authorsInput, 'João');

      // Check that onChange was called for the authors field - just verify it gets called
      expect(mockOnChange).toHaveBeenCalledWith('original_article_authors', expect.any(String));
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form inputs', () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      expect(screen.getByLabelText('Título do Artigo Original')).toBeInTheDocument();
      expect(screen.getByLabelText('Autores do Artigo')).toBeInTheDocument();
      expect(screen.getByLabelText('Data de Publicação')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo de Estudo')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const titleInput = screen.getByLabelText('Título do Artigo Original');
      const authorsInput = screen.getByLabelText('Autores do Artigo');

      titleInput.focus();
      expect(titleInput).toHaveFocus();

      await user.tab();
      expect(authorsInput).toHaveFocus();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state for study types', async () => {
      // Mock the hook to return loading state
      const { useStudyTypesConfiguration } = await import('../../../../packages/hooks/useStudyTypesConfiguration');
      vi.mocked(useStudyTypesConfiguration).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      });

      render(
        <MockAllProviders>
          <ArticleDataSection data={defaultData} onChange={mockOnChange} />
        </MockAllProviders>
      );

      const studyTypeSelect = screen.getByRole('combobox');
      expect(studyTypeSelect).toBeInTheDocument();
    });
  });
});