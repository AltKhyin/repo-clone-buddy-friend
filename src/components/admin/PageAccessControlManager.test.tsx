// ABOUTME: Tests for PageAccessControlManager component ensuring proper CRUD UI functionality

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageAccessControlManager } from './PageAccessControlManager';
import { createTestQueryClient } from '../../test-utils/test-query-client';

// Mock dependencies
vi.mock('../../../packages/hooks/usePageAccessQuery', () => ({
  usePageAccessControlQuery: vi.fn(),
}));

vi.mock('../../../packages/hooks/usePageAccessControlMutations', () => ({
  useCreatePageAccessControlMutation: vi.fn(),
  useUpdatePageAccessControlMutation: vi.fn(),
  useDeletePageAccessControlMutation: vi.fn(),
}));

// Mock auth store to provide admin access
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'admin-user-id',
      app_metadata: { role: 'admin' },
      user_metadata: { subscription_tier: 'premium' },
    },
  })),
}));

describe('PageAccessControlManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockAccessRules = [
    {
      id: 1,
      page_path: '/admin',
      required_access_level: 'editor_admin',
      redirect_url: '/acesso-negado',
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
    {
      id: 2,
      page_path: '/premium-content',
      required_access_level: 'premium',
      redirect_url: '/upgrade',
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  ];

  describe('rendering', () => {
    it('should render page access control manager with header', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: { data: mockAccessRules, total_count: 2 },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      expect(screen.getByText('Controle de Acesso de Páginas')).toBeInTheDocument();
      expect(
        screen.getByText('Gerenciar regras de acesso para páginas específicas')
      ).toBeInTheDocument();
      expect(screen.getByText('Nova Regra')).toBeInTheDocument();
    });

    it('should display loading state', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      expect(screen.getByText('Carregando regras de acesso...')).toBeInTheDocument();
    });

    it('should display error state', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load rules'),
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      expect(screen.getByText('Erro ao carregar regras de acesso')).toBeInTheDocument();
      expect(screen.getByText('Failed to load rules')).toBeInTheDocument();
    });
  });

  describe('access rules table', () => {
    it('should display access rules in table format', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: { data: mockAccessRules, total_count: 2 },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      expect(screen.getByText('/admin')).toBeInTheDocument();
      expect(screen.getByText('/premium-content')).toBeInTheDocument();
      expect(screen.getByText('editor_admin')).toBeInTheDocument();
      expect(screen.getByText('premium')).toBeInTheDocument();
      expect(screen.getByText('/acesso-negado')).toBeInTheDocument();
      expect(screen.getByText('/upgrade')).toBeInTheDocument();
    });

    it('should display empty state when no rules exist', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: { data: [], total_count: 0 },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      expect(screen.getByText('Nenhuma regra encontrada')).toBeInTheDocument();
      expect(
        screen.getByText('Adicione uma nova regra para controlar o acesso às páginas.')
      ).toBeInTheDocument();
    });
  });

  describe('create new rule', () => {
    it('should open create dialog when new rule button is clicked', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: { data: [], total_count: 0 },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      const createButton = screen.getByText('Nova Regra');
      fireEvent.click(createButton);

      expect(screen.getByText('Nova Regra de Acesso')).toBeInTheDocument();
      expect(screen.getByLabelText('Caminho da Página')).toBeInTheDocument();
      expect(screen.getByLabelText('Nível de Acesso Necessário')).toBeInTheDocument();
      expect(screen.getByLabelText('URL de Redirecionamento')).toBeInTheDocument();
    });

    it('should create new rule when form is submitted', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');
      const mockCreateMutate = vi.fn();

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: { data: [], total_count: 0 },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: mockCreateMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      // Open create dialog
      fireEvent.click(screen.getByText('Nova Regra'));

      // Fill form
      fireEvent.change(screen.getByLabelText('Caminho da Página'), {
        target: { value: '/new-page' },
      });

      fireEvent.change(screen.getByLabelText('URL de Redirecionamento'), {
        target: { value: '/upgrade' },
      });

      // Submit form (uses default access level 'public')
      fireEvent.click(screen.getByText('Criar Regra'));

      await waitFor(() => {
        expect(mockCreateMutate).toHaveBeenCalledWith(
          {
            page_path: '/new-page',
            required_access_level: 'public',
            redirect_url: '/upgrade',
          },
          expect.any(Object)
        );
      });
    });
  });

  describe('edit rule', () => {
    it('should open edit dialog when edit button is clicked', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: { data: mockAccessRules, total_count: 2 },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      const editButtons = screen.getAllByLabelText('Editar regra');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Editar Regra de Acesso')).toBeInTheDocument();
      expect(screen.getByDisplayValue('/admin')).toBeInTheDocument();
      // Check if the select has the correct initial value by finding the trigger
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('delete rule', () => {
    it('should delete rule when delete button is clicked and confirmed', async () => {
      const mockUsePageAccessControlQuery = await import(
        '../../../packages/hooks/usePageAccessQuery'
      );
      const mockMutations = await import('../../../packages/hooks/usePageAccessControlMutations');
      const mockDeleteMutate = vi.fn();

      vi.mocked(mockUsePageAccessControlQuery.usePageAccessControlQuery).mockReturnValue({
        data: { data: mockAccessRules, total_count: 2 },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      vi.mocked(mockMutations.useCreatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useUpdatePageAccessControlMutation).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      vi.mocked(mockMutations.useDeletePageAccessControlMutation).mockReturnValue({
        mutate: mockDeleteMutate,
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any);

      render(<PageAccessControlManager />, { wrapper });

      const deleteButtons = screen.getAllByLabelText('Deletar regra');
      fireEvent.click(deleteButtons[0]);

      // Confirm deletion
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Deletar'));

      await waitFor(() => {
        expect(mockDeleteMutate).toHaveBeenCalledWith(1);
      });
    });
  });
});
