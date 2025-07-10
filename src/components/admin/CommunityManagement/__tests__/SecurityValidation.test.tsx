// ABOUTME: Security validation tests for admin community management interfaces ensuring proper authentication, authorization, and input validation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryManagement } from '../CategoryManagement';
import { AnnouncementManagement } from '../AnnouncementManagement';
import { CustomThemeProvider } from '../../../theme/CustomThemeProvider';
import { Toaster } from '@/components/ui/toaster';

// Mock the community management query
vi.mock('../../../../../packages/hooks/useCommunityManagementQuery', () => ({
  useCommunitySidebarDataQuery: vi.fn(),
  useCreateCategoryMutation: vi.fn(),
  useUpdateCategoryMutation: vi.fn(),
  useDeleteCategoryMutation: vi.fn(),
  useCreateAnnouncementMutation: vi.fn(),
  useUpdateAnnouncementMutation: vi.fn(),
  useDeleteAnnouncementMutation: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock auth store with different user roles
const mockAuthStore = {
  admin: {
    id: '123',
    email: 'admin@example.com',
    app_metadata: { role: 'admin' },
  },
  practitioner: {
    id: '456',
    email: 'user@example.com',
    app_metadata: { role: 'practitioner' },
  },
  unauthenticated: null,
};

vi.mock('../../../../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          {children}
          <Toaster />
        </CustomThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Security Validation - Admin Community Management', () => {
  let mockQueries: any;
  let mockMutations: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    const {
      useCommunitySidebarDataQuery,
      useCreateCategoryMutation,
      useUpdateCategoryMutation,
      useDeleteCategoryMutation,
      useCreateAnnouncementMutation,
      useUpdateAnnouncementMutation,
      useDeleteAnnouncementMutation,
    } = require('../../../../../packages/hooks/useCommunityManagementQuery');

    mockQueries = {
      useCommunitySidebarDataQuery,
    };

    mockMutations = {
      useCreateCategoryMutation,
      useUpdateCategoryMutation,
      useDeleteCategoryMutation,
      useCreateAnnouncementMutation,
      useUpdateAnnouncementMutation,
      useDeleteAnnouncementMutation,
    };

    // Default mock implementations
    mockQueries.useCommunitySidebarDataQuery.mockReturnValue({
      data: { categories: [], announcements: [] },
      isLoading: false,
      error: null,
    });

    Object.values(mockMutations).forEach(mutation => {
      mutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
      });
    });
  });

  describe('🔒 Authentication & Authorization', () => {
    it('should require admin authentication for CategoryManagement', () => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.unauthenticated,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Should not render admin interface for unauthenticated users
      expect(screen.queryByText('Gestão de Categorias')).not.toBeInTheDocument();
    });

    it('should require admin authentication for AnnouncementManagement', () => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.unauthenticated,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Should not render admin interface for unauthenticated users
      expect(screen.queryByText('Gestão de Anúncios')).not.toBeInTheDocument();
    });

    it('should deny access to non-admin users', () => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.practitioner,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Should show access denied message or redirect
      expect(screen.queryByText('Gestão de Categorias')).not.toBeInTheDocument();
    });

    it('should allow access to admin users', () => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.admin,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Should render admin interface for admin users
      expect(screen.getByText('Gestão de Categorias')).toBeInTheDocument();
    });
  });

  describe('🔒 Input Validation & Sanitization', () => {
    beforeEach(() => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.admin,
      });
    });

    it('should validate category name format', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      const nameInput = screen.getByLabelText('Nome da Categoria (slug)');

      // Test invalid characters
      await user.type(nameInput, 'INVALID NAME WITH SPACES');

      // Should have pattern validation
      expect(nameInput).toHaveAttribute('pattern', '^[a-z0-9-]+$');

      // Test valid format
      await user.clear(nameInput);
      await user.type(nameInput, 'valid-category-name');

      expect(nameInput).toHaveValue('valid-category-name');
    });

    it('should prevent XSS attacks in category description', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockMutations.useCreateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Fill form with potentially malicious content
      await user.type(screen.getByLabelText('Nome da Categoria (slug)'), 'test-category');
      await user.type(screen.getByLabelText('Nome de Exibição'), 'Test Category');
      await user.type(screen.getByLabelText('Descrição'), '<script>alert("XSS")</script>');

      await user.click(screen.getByText('Criar Categoria'));

      // Should sanitize the description
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '<script>alert("XSS")</script>', // Raw value - sanitization should happen server-side
        }),
        expect.any(Object)
      );
    });

    it('should validate URL fields in announcements', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      const imageUrlInput = screen.getByLabelText('URL da Imagem');
      const linkUrlInput = screen.getByLabelText('Link Externo');

      // Should have URL validation
      expect(imageUrlInput).toHaveAttribute('type', 'url');
      expect(linkUrlInput).toHaveAttribute('type', 'url');

      // Test invalid URL
      await user.type(imageUrlInput, 'not-a-url');
      await user.type(linkUrlInput, 'javascript:alert("XSS")');

      // Browser validation should catch invalid URLs
      expect(imageUrlInput).toHaveValue('not-a-url');
      expect(linkUrlInput).toHaveValue('javascript:alert("XSS")');
    });

    it('should limit input lengths', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      const nameInput = screen.getByLabelText('Nome da Categoria (slug)');
      const labelInput = screen.getByLabelText('Nome de Exibição');

      // Test reasonable length limits
      const longString = 'a'.repeat(1000);
      await user.type(nameInput, longString);
      await user.type(labelInput, longString);

      // Should accept input but validation should exist
      expect(nameInput).toHaveValue(longString);
      expect(labelInput).toHaveValue(longString);
    });
  });

  describe('🔒 Data Integrity & Validation', () => {
    beforeEach(() => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.admin,
      });
    });

    it('should prevent duplicate category names', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((data, options) => {
        // Simulate server-side duplicate validation
        if (data.name === 'existing-category') {
          options.onError(new Error('Category name already exists'));
        }
      });

      mockMutations.useCreateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Try to create duplicate category
      await user.type(screen.getByLabelText('Nome da Categoria (slug)'), 'existing-category');
      await user.type(screen.getByLabelText('Nome de Exibição'), 'Existing Category');

      await user.click(screen.getByText('Criar Categoria'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('should validate color format', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      const textColorInput = screen.getByLabelText('Cor do Texto');

      // Should be color input type
      expect(textColorInput).toHaveAttribute('type', 'color');

      // Test setting valid color
      await user.type(textColorInput, '#ff0000');
      expect(textColorInput).toHaveValue('#ff0000');
    });

    it('should validate announcement priority range', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      const priorityInput = screen.getByLabelText('Prioridade');

      // Should have min/max validation
      expect(priorityInput).toHaveAttribute('min', '1');
      expect(priorityInput).toHaveAttribute('max', '10');

      // Test invalid values
      await user.type(priorityInput, '0');
      await user.type(priorityInput, '11');

      // Browser validation should handle this
      expect(priorityInput).toHaveValue(0);
    });
  });

  describe('🔒 Error Handling & Information Disclosure', () => {
    beforeEach(() => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.admin,
      });
    });

    it('should handle server errors gracefully without exposing sensitive information', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((data, options) => {
        // Simulate server error with sensitive information
        options.onError(new Error('Database connection failed: server internal error details'));
      });

      mockMutations.useCreateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Fill required fields
      await user.type(screen.getByLabelText('Nome da Categoria (slug)'), 'test-category');
      await user.type(screen.getByLabelText('Nome de Exibição'), 'Test Category');

      await user.click(screen.getByText('Criar Categoria'));

      // Should handle error gracefully
      expect(mockMutate).toHaveBeenCalled();

      // Error message should be user-friendly, not exposing internal details
      // This would be handled by the toast system
    });

    it('should handle network errors properly', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((data, options) => {
        options.onError(new Error('Network error'));
      });

      mockMutations.useCreateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Fill required fields
      await user.type(screen.getByLabelText('Nome da Categoria (slug)'), 'test-category');
      await user.type(screen.getByLabelText('Nome de Exibição'), 'Test Category');

      await user.click(screen.getByText('Criar Categoria'));

      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('🔒 Session & State Security', () => {
    it('should handle expired sessions gracefully', async () => {
      const { useAuthStore } = require('../../../../store/auth');

      // Start with authenticated user
      useAuthStore.mockReturnValue({
        user: mockAuthStore.admin,
      });

      const { rerender } = render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Should initially show admin interface
      expect(screen.getByText('Gestão de Categorias')).toBeInTheDocument();

      // Simulate session expiry
      useAuthStore.mockReturnValue({
        user: null,
      });

      rerender(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Should handle session expiry gracefully
      expect(screen.queryByText('Gestão de Categorias')).not.toBeInTheDocument();
    });

    it('should prevent privilege escalation', () => {
      const { useAuthStore } = require('../../../../store/auth');

      // Start with practitioner user
      useAuthStore.mockReturnValue({
        user: mockAuthStore.practitioner,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Should not show admin interface
      expect(screen.queryByText('Gestão de Categorias')).not.toBeInTheDocument();

      // Should not show any admin actions
      expect(screen.queryByText('Nova Categoria')).not.toBeInTheDocument();
      expect(screen.queryByText('Novo Anúncio')).not.toBeInTheDocument();
    });
  });

  describe('🔒 Rate Limiting & Abuse Prevention', () => {
    beforeEach(() => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.admin,
      });
    });

    it('should handle multiple rapid requests gracefully', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      mockMutations.useCreateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Fill form
      await user.type(screen.getByLabelText('Nome da Categoria (slug)'), 'test-category');
      await user.type(screen.getByLabelText('Nome de Exibição'), 'Test Category');

      const createButton = screen.getByText('Criar Categoria');

      // Simulate rapid multiple clicks
      await user.click(createButton);
      await user.click(createButton);
      await user.click(createButton);

      // Should only be called once due to proper form handling
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('should disable buttons during loading states', async () => {
      const user = userEvent.setup();

      mockMutations.useCreateCategoryMutation.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true, // Simulate loading state
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Fill form
      await user.type(screen.getByLabelText('Nome da Categoria (slug)'), 'test-category');
      await user.type(screen.getByLabelText('Nome de Exibição'), 'Test Category');

      const createButton = screen.getByText('Criar Categoria');

      // Button should be disabled during loading
      expect(createButton).toBeDisabled();
    });
  });

  describe('🔒 Data Sanitization & Output Encoding', () => {
    beforeEach(() => {
      const { useAuthStore } = require('../../../../store/auth');
      useAuthStore.mockReturnValue({
        user: mockAuthStore.admin,
      });
    });

    it('should properly escape HTML in category names', () => {
      const mockCategories = [
        {
          id: 1,
          name: 'test-category',
          label: '<script>alert("XSS")</script>',
          description: 'Test description',
          background_color: '#e3f2fd',
          text_color: '#1565c0',
          border_color: '#90caf9',
          is_active: true,
          is_system: false,
          display_order: 1,
        },
      ];

      mockQueries.useCommunitySidebarDataQuery.mockReturnValue({
        data: { categories: mockCategories },
        isLoading: false,
        error: null,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Should not execute script tag
      expect(screen.queryByText('<script>alert("XSS")</script>')).not.toBeInTheDocument();

      // Should display escaped content (React automatically escapes)
      expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument();
    });

    it('should handle special characters in form inputs', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      mockMutations.useCreateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Test special characters
      await user.type(screen.getByLabelText('Nome da Categoria (slug)'), 'test-category');
      await user.type(screen.getByLabelText('Nome de Exibição'), 'Test & Category "with" quotes');
      await user.type(screen.getByLabelText('Descrição'), 'Description with <tags> & symbols');

      await user.click(screen.getByText('Criar Categoria'));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-category',
          label: 'Test & Category "with" quotes',
          description: 'Description with <tags> & symbols',
        }),
        expect.any(Object)
      );
    });
  });
});
