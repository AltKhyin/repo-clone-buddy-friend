// ABOUTME: Tests for ContentTypeCreateModal ensuring form validation and color picker functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockAllProviders } from '@/test-utils/mock-providers';
import { ContentTypeCreateModal } from './ContentTypeCreateModal';

// Mock the operation mutation
const mockMutateAsync = vi.fn();
vi.mock('../../../../packages/hooks/useContentTypeManagement', () => ({
  useContentTypeOperationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  getDefaultContentTypeColors: vi.fn(() => ({
    text_color: '#1e40af',
    border_color: '#3b82f6',
    background_color: '#dbeafe',
  })),
}));

describe('ContentTypeCreateModal', () => {
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should not render when isOpen is false', () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={false} onClose={mockOnClose} />
        </MockAllProviders>
      );

      expect(screen.queryByText('Criar Novo Tipo de Conteúdo')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      expect(screen.getByText('Criar Novo Tipo de Conteúdo')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      expect(screen.getByLabelText('Nome do Tipo')).toBeInTheDocument();
      expect(screen.getByLabelText('Descrição (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Cor do Texto')).toBeInTheDocument();
      expect(screen.getByText('Cor da Borda')).toBeInTheDocument();
      expect(screen.getByText('Cor de Fundo')).toBeInTheDocument();
      expect(screen.getByText('Pré-visualização')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require name field', async () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const createButton = screen.getByText('Criar');
      await user.click(createButton);

      // Form should not submit without name
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('should accept valid form data', async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      const createButton = screen.getByText('Criar');

      await user.type(nameInput, 'Test Content Type');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          action: 'create',
          contentType: {
            label: 'Test Content Type',
            description: '',
            text_color: '#1f2937',
            border_color: '#3b82f6',
            background_color: '#dbeafe',
          },
        });
      });
    });

    it('should include description when provided', async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      const descriptionInput = screen.getByLabelText('Descrição (opcional)');
      const createButton = screen.getByText('Criar');

      await user.type(nameInput, 'Test Type');
      await user.type(descriptionInput, 'Test description');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          action: 'create',
          contentType: expect.objectContaining({
            label: 'Test Type',
            description: 'Test description',
          }),
        });
      });
    });
  });

  describe('Color Picker Functionality', () => {
    it('should display default colors', () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      // Check for default color values in inputs
      const textColorInput = screen.getByDisplayValue('#1f2937');
      const borderColorInput = screen.getByDisplayValue('#3b82f6');
      const backgroundColorInput = screen.getByDisplayValue('#dbeafe');

      expect(textColorInput).toBeInTheDocument();
      expect(borderColorInput).toBeInTheDocument();
      expect(backgroundColorInput).toBeInTheDocument();
    });

    it('should update colors when color inputs change', async () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const textColorInput = screen.getByDisplayValue('#1f2937');
      await user.clear(textColorInput);
      await user.type(textColorInput, '#ff0000');

      expect(textColorInput).toHaveValue('#ff0000');
    });

    it('should show preview with updated colors', async () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      await user.type(nameInput, 'Preview Test');

      // The preview should show the typed name
      expect(screen.getByText('Preview Test')).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    it('should close modal when cancel is clicked', async () => {
      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal after successful creation', async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      const createButton = screen.getByText('Criar');

      await user.type(nameInput, 'Test Type');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle creation errors gracefully', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Creation failed'));

      render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      const createButton = screen.getByText('Criar');

      await user.type(nameInput, 'Test Type');
      await user.click(createButton);

      // Modal should not close on error
      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal closes and reopens', async () => {
      const { rerender } = render(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      await user.type(nameInput, 'Test Content');

      expect(nameInput).toHaveValue('Test Content');

      // Close modal
      rerender(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={false} onClose={mockOnClose} />
        </MockAllProviders>
      );

      // Reopen modal
      rerender(
        <MockAllProviders>
          <ContentTypeCreateModal isOpen={true} onClose={mockOnClose} />
        </MockAllProviders>
      );

      const newNameInput = screen.getByLabelText('Nome do Tipo');
      expect(newNameInput).toHaveValue('');
    });
  });
});
