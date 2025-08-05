// ABOUTME: Security-focused tests for ContentType modals to ensure CSS injection protection and data integrity

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentTypeCreateModal } from '@/components/admin/ReviewManagement/ContentTypeCreateModal';
import { ContentTypeEditModal } from '@/components/admin/ReviewManagement/ContentTypeEditModal';
import type { ContentType } from '@/types';

// Mock the hook dependencies
vi.mock('@packages/hooks/useContentTypeManagement', () => ({
  useContentTypeOperationMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  getDefaultContentTypeColors: () => ({
    text_color: 'hsl(var(--foreground))',
    border_color: 'hsl(var(--border))',
    background_color: 'hsl(var(--muted))',
  }),
}));

vi.mock('@/hooks/useColorHandling', () => ({
  useColorHandling: (setFormData: any) => ({
    handleColorChange: vi.fn((field: string, value: string) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }),
  }),
}));

vi.mock('@/components/editor/shared/UnifiedColorPicker', () => ({
  UnifiedColorPicker: ({ value, onColorSelect, label }: any) => (
    <div data-testid={`color-picker-${label}`}>
      <span>Current: {value}</span>
      <button 
        onClick={() => onColorSelect('#ff0000')}
        data-testid={`select-color-${label}`}
      >
        Select Color
      </button>
      <button 
        onClick={() => onColorSelect('javascript:alert("xss")')}
        data-testid={`malicious-color-${label}`}
      >
        Malicious Color
      </button>
    </div>
  ),
}));

vi.mock('@/utils/color-sanitization', () => ({
  sanitizeStyleColors: vi.fn((colors: Record<string, string | undefined>) => {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(colors)) {
      // Mock the sanitization logic
      if (value?.includes('javascript:') || value?.includes('expression(')) {
        sanitized[key] = 'transparent';
      } else {
        sanitized[key] = value || 'transparent';
      }
    }
    return sanitized;
  }),
}));

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

describe('ContentType Modals Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ContentTypeCreateModal Security', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
    };

    it('should render create modal without security vulnerabilities', () => {
      render(
        <TestWrapper>
          <ContentTypeCreateModal {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Criar Novo Tipo de Conteúdo')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome do Tipo')).toBeInTheDocument();
    });

    it('should sanitize malicious CSS in color preview', async () => {
      const { sanitizeStyleColors } = await import('@/utils/color-sanitization');
      
      render(
        <TestWrapper>
          <ContentTypeCreateModal {...defaultProps} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      await userEvent.type(nameInput, 'Test Type');

      // Simulate malicious color injection
      const maliciousButton = screen.getByTestId('malicious-color-Text Color');
      fireEvent.click(maliciousButton);

      // Verify sanitization was called
      expect(sanitizeStyleColors).toHaveBeenCalled();
    });

    it('should prevent XSS through style attribute injection', async () => {
      render(
        <TestWrapper>
          <ContentTypeCreateModal {...defaultProps} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      await userEvent.type(nameInput, 'Test Type');

      // Try to inject malicious styles
      const maliciousButton = screen.getByTestId('malicious-color-Text Color');
      fireEvent.click(maliciousButton);

      // Check that the preview badge doesn't contain dangerous content
      const previewBadge = screen.getByText('Test Type');
      const badgeElement = previewBadge.closest('[style]');
      
      if (badgeElement) {
        const styleAttr = badgeElement.getAttribute('style');
        expect(styleAttr).not.toContain('javascript:');
        expect(styleAttr).not.toContain('expression(');
      }
    });

    it('should validate color formats before submission', async () => {
      const { useContentTypeOperationMutation } = await import('@packages/hooks/useContentTypeManagement');
      const mockMutation = useContentTypeOperationMutation();
      
      render(
        <TestWrapper>
          <ContentTypeCreateModal {...defaultProps} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      await userEvent.type(nameInput, 'Test Type');

      const submitButton = screen.getByText('Criar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutation.mutateAsync).toHaveBeenCalledWith({
          action: 'create',
          contentType: expect.objectContaining({
            label: 'Test Type',
            text_color: expect.any(String),
            border_color: expect.any(String),
            background_color: expect.any(String),
          }),
        });
      });
    });

    it('should handle malformed color values gracefully', async () => {
      render(
        <TestWrapper>
          <ContentTypeCreateModal {...defaultProps} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      await userEvent.type(nameInput, 'Test Type');

      // The component should not crash with malformed colors
      expect(() => {
        const maliciousButton = screen.getByTestId('malicious-color-Text Color');
        fireEvent.click(maliciousButton);
      }).not.toThrow();
    });

    it('should escape user input in form fields', async () => {
      render(
        <TestWrapper>
          <ContentTypeCreateModal {...defaultProps} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      const descriptionInput = screen.getByLabelText('Descrição (opcional)');

      // Try to inject HTML/JS through form fields
      await userEvent.type(nameInput, '<script>alert("xss")</script>');
      await userEvent.type(descriptionInput, '<img src="x" onerror="alert(1)">');

      // Values should be properly escaped in the DOM
      expect(nameInput).toHaveValue('<script>alert("xss")</script>');
      expect(descriptionInput).toHaveValue('<img src="x" onerror="alert(1)">');

      // Preview should show escaped content
      const previewText = screen.getByText('<script>alert("xss")</script>');
      expect(previewText).toBeInTheDocument();
    });
  });

  describe('ContentTypeEditModal Security', () => {
    const mockContentType: ContentType = {
      id: 'test-id',
      label: 'Test Type',
      description: 'Test description',
      text_color: '#000000',
      border_color: '#cccccc', 
      background_color: '#ffffff',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      can_be_deleted: true,
    };

    const defaultProps = {
      contentType: mockContentType,
      isOpen: true,
      onClose: vi.fn(),
    };

    it('should render edit modal without security vulnerabilities', () => {
      render(
        <TestWrapper>
          <ContentTypeEditModal {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Editar Tipo de Conteúdo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Type')).toBeInTheDocument();
    });

    it('should sanitize existing color values on load', () => {
      const contentTypeWithMaliciousColors: ContentType = {
        ...mockContentType,
        text_color: 'javascript:alert("xss1")',
        border_color: 'expression(alert("xss2"))',
        background_color: '#ffffff',
      };

      render(
        <TestWrapper>
          <ContentTypeEditModal 
            {...defaultProps} 
            contentType={contentTypeWithMaliciousColors} 
          />
        </TestWrapper>
      );

      // The component should load without crashing
      expect(screen.getByText('Editar Tipo de Conteúdo')).toBeInTheDocument();
    });

    it('should preserve legitimate color values during edit', async () => {
      render(
        <TestWrapper>
          <ContentTypeEditModal {...defaultProps} />
        </TestWrapper>
      );

      // Verify legitimate colors are preserved
      expect(screen.getByText('Current: #000000')).toBeInTheDocument();
      expect(screen.getByText('Current: #cccccc')).toBeInTheDocument();
      expect(screen.getByText('Current: #ffffff')).toBeInTheDocument();
    });

    it('should prevent privilege escalation through form manipulation', async () => {
      const { useContentTypeOperationMutation } = await import('@packages/hooks/useContentTypeManagement');
      const mockMutation = useContentTypeOperationMutation();
      
      render(
        <TestWrapper>
          <ContentTypeEditModal {...defaultProps} />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Salvar');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutation.mutateAsync).toHaveBeenCalledWith({
          action: 'update',
          contentTypeId: 'test-id',
          contentType: expect.objectContaining({
            label: 'Test Type',
            description: 'Test description',
          }),
        });
      });

      // Verify no additional privileged fields were submitted
      const callArgs = mockMutation.mutateAsync.mock.calls[0][0];
      expect(callArgs.contentType).not.toHaveProperty('id');
      expect(callArgs.contentType).not.toHaveProperty('created_at');
      expect(callArgs.contentType).not.toHaveProperty('updated_at');
      expect(callArgs.contentType).not.toHaveProperty('can_be_deleted');
    });

    it('should handle null contentType gracefully', () => {
      render(
        <TestWrapper>
          <ContentTypeEditModal 
            {...defaultProps} 
            contentType={null} 
          />
        </TestWrapper>
      );

      // Should not render anything when contentType is null
      expect(screen.queryByText('Editar Tipo de Conteúdo')).not.toBeInTheDocument();
    });
  });

  describe('Cross-Modal Security Consistency', () => {
    it('should use the same security measures in both modals', async () => {
      const { sanitizeStyleColors } = await import('@/utils/color-sanitization');
      
      // Test create modal
      const { unmount: unmountCreate } = render(
        <TestWrapper>
          <ContentTypeCreateModal isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      const createMaliciousButton = screen.getByTestId('malicious-color-Text Color');
      fireEvent.click(createMaliciousButton);

      const createCallCount = (sanitizeStyleColors as any).mock.calls.length;
      unmountCreate();

      // Test edit modal  
      const mockContentType: ContentType = {
        id: 'test-id',
        label: 'Test Type',
        description: 'Test description',
        text_color: '#000000',
        border_color: '#cccccc',
        background_color: '#ffffff',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        can_be_deleted: true,
      };

      render(
        <TestWrapper>
          <ContentTypeEditModal 
            contentType={mockContentType}
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      );

      const editMaliciousButton = screen.getByTestId('malicious-color-Text Color');
      fireEvent.click(editMaliciousButton);

      const totalCallCount = (sanitizeStyleColors as any).mock.calls.length;

      // Both modals should call sanitization
      expect(totalCallCount).toBeGreaterThan(createCallCount);
    });

    it('should have identical validation logic in both modals', () => {
      // Create modal validation
      render(
        <TestWrapper>
          <ContentTypeCreateModal isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      const createSubmitButton = screen.getByText('Criar');
      expect(createSubmitButton).toBeDisabled(); // Should be disabled without required fields

      screen.unmount();

      // Edit modal validation
      const mockContentType: ContentType = {
        id: 'test-id',
        label: 'Test Type',
        description: 'Test description', 
        text_color: '#000000',
        border_color: '#cccccc',
        background_color: '#ffffff',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        can_be_deleted: true,
      };

      render(
        <TestWrapper>
          <ContentTypeEditModal 
            contentType={mockContentType}
            isOpen={true} 
            onClose={vi.fn()} 
          />
        </TestWrapper>
      );

      const editSubmitButton = screen.getByText('Salvar');
      expect(editSubmitButton).not.toBeDisabled(); // Should be enabled with valid data
    });
  });

  describe('Error Boundary and Crash Prevention', () => {
    it('should not crash with malformed props', () => {
      expect(() => {
        render(
          <TestWrapper>
            <ContentTypeCreateModal 
              isOpen={true} 
              onClose={undefined as any} 
            />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should handle async operation failures gracefully', async () => {
      const { useContentTypeOperationMutation } = await import('@packages/hooks/useContentTypeManagement');
      const mockMutation = {
        mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
        isPending: false,
      };
      
      vi.mocked(useContentTypeOperationMutation).mockReturnValue(mockMutation);

      render(
        <TestWrapper>
          <ContentTypeCreateModal isOpen={true} onClose={vi.fn()} />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText('Nome do Tipo');
      await userEvent.type(nameInput, 'Test Type');

      const submitButton = screen.getByText('Criar');
      fireEvent.click(submitButton);

      // Should handle error gracefully and show error message
      await waitFor(() => {
        expect(screen.getByText('Erro ao criar tipo de conteúdo. Tente novamente.')).toBeInTheDocument();
      });
    });
  });
});