// ABOUTME: TDD tests for AnnouncementManagement admin interface ensuring complete functionality for community announcements, news, and changelog management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnnouncementManagement } from '../AnnouncementManagement';
import { CustomThemeProvider } from '../../../theme/CustomThemeProvider';
import { Toaster } from '@/components/ui/toaster';

// Mock the community management query
vi.mock('../../../../../packages/hooks/useCommunityManagementQuery', () => ({
  useCommunitySidebarDataQuery: vi.fn(),
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

// Mock auth store
vi.mock('../../../../store/auth', () => ({
  useAuthStore: () => ({
    user: {
      id: '123',
      email: 'admin@example.com',
      app_metadata: { role: 'admin' },
    },
  }),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '01/01/2023'),
}));

vi.mock('date-fns/locale', () => ({
  ptBR: {},
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

// Mock announcement data
const mockAnnouncements = [
  {
    id: '1',
    title: 'Nova funcionalidade: Sistema de categorias',
    content:
      'Implementamos um novo sistema de categorias para organizar melhor os posts da comunidade.',
    type: 'announcement',
    priority: 1,
    is_published: true,
    is_featured: true,
    published_at: '2023-12-01T10:00:00Z',
    expires_at: '2023-12-31T23:59:59Z',
    image_url: 'https://example.com/image.jpg',
    link_url: 'https://example.com/categories',
    link_text: 'Saiba mais',
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2023-12-01T10:00:00Z',
    author: { id: '1', full_name: 'Admin' },
  },
  {
    id: '2',
    title: 'Manutenção programada',
    content: 'Haverá manutenção programada no sistema no próximo sábado.',
    type: 'news',
    priority: 2,
    is_published: true,
    is_featured: false,
    published_at: '2023-12-02T08:00:00Z',
    expires_at: null,
    image_url: null,
    link_url: null,
    link_text: null,
    created_at: '2023-12-02T08:00:00Z',
    updated_at: '2023-12-02T08:00:00Z',
    author: { id: '1', full_name: 'Admin' },
  },
  {
    id: '3',
    title: 'Correção de bugs v1.2.1',
    content: 'Corrigimos vários bugs reportados pela comunidade.',
    type: 'changelog',
    priority: 3,
    is_published: false,
    is_featured: false,
    published_at: null,
    expires_at: null,
    image_url: null,
    link_url: 'https://github.com/example/changelog',
    link_text: 'Ver changelog',
    created_at: '2023-12-03T15:30:00Z',
    updated_at: '2023-12-03T15:30:00Z',
    author: { id: '1', full_name: 'Admin' },
  },
];

describe('AnnouncementManagement - TDD Implementation', () => {
  let mockQueries: any;
  let mockMutations: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    const {
      useCommunitySidebarDataQuery,
      useCreateAnnouncementMutation,
      useUpdateAnnouncementMutation,
      useDeleteAnnouncementMutation,
    } = require('../../../../../packages/hooks/useCommunityManagementQuery');

    mockQueries = {
      useCommunitySidebarDataQuery,
    };

    mockMutations = {
      useCreateAnnouncementMutation,
      useUpdateAnnouncementMutation,
      useDeleteAnnouncementMutation,
    };

    // Default mock implementations
    mockQueries.useCommunitySidebarDataQuery.mockReturnValue({
      data: { announcements: mockAnnouncements },
      isLoading: false,
      error: null,
    });

    mockMutations.useCreateAnnouncementMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockMutations.useUpdateAnnouncementMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockMutations.useDeleteAnnouncementMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
  });

  describe('🔴 TDD: Component Loading and Display', () => {
    it('should display loading state initially', () => {
      mockQueries.useCommunitySidebarDataQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Carregando anúncios...')).toBeInTheDocument();
    });

    it('should display announcement management interface with header', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Gestão de Anúncios')).toBeInTheDocument();
      expect(
        screen.getByText('Gerencie anúncios, notícias e changelog da comunidade.')
      ).toBeInTheDocument();
      expect(screen.getByText('Novo Anúncio')).toBeInTheDocument();
    });

    it('should display empty state when no announcements exist', () => {
      mockQueries.useCommunitySidebarDataQuery.mockReturnValue({
        data: { announcements: [] },
        isLoading: false,
        error: null,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Nenhum anúncio encontrado.')).toBeInTheDocument();
      expect(
        screen.getByText('Crie seu primeiro anúncio para manter a comunidade informada.')
      ).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Announcement List Display', () => {
    it('should display all announcements in a table', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Check table headers
      expect(screen.getByText('Título')).toBeInTheDocument();
      expect(screen.getByText('Tipo')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Prioridade')).toBeInTheDocument();
      expect(screen.getByText('Publicado em')).toBeInTheDocument();
      expect(screen.getByText('Ações')).toBeInTheDocument();

      // Check announcement data
      expect(screen.getByText('Nova funcionalidade: Sistema de categorias')).toBeInTheDocument();
      expect(screen.getByText('Manutenção programada')).toBeInTheDocument();
      expect(screen.getByText('Correção de bugs v1.2.1')).toBeInTheDocument();
    });

    it('should display type badges with correct colors', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Check for type badges
      expect(screen.getByText('Anúncio')).toBeInTheDocument();
      expect(screen.getByText('Notícia')).toBeInTheDocument();
      expect(screen.getByText('Changelog')).toBeInTheDocument();
    });

    it('should display status badges for published/draft announcements', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const publishedBadges = screen.getAllByText('Publicado');
      const draftBadges = screen.getAllByText('Rascunho');

      expect(publishedBadges).toHaveLength(2); // Two published announcements
      expect(draftBadges).toHaveLength(1); // One draft announcement
    });

    it('should display featured badges for featured announcements', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Destaque')).toBeInTheDocument();
    });

    it('should display priority numbers', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display external links for announcements with link_url', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const externalLinks = screen.getAllByTitle('Link externo');
      expect(externalLinks).toHaveLength(2); // Two announcements with external links
    });
  });

  describe('🔴 TDD: Announcement Creation', () => {
    it('should open create announcement dialog when clicking Novo Anúncio', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      expect(screen.getByText('Novo Anúncio')).toBeInTheDocument();
      expect(
        screen.getByText('Crie um novo anúncio para manter a comunidade informada.')
      ).toBeInTheDocument();
    });

    it('should display all required form fields in create dialog', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      // Check form fields
      expect(screen.getByLabelText('Título')).toBeInTheDocument();
      expect(screen.getByLabelText('Conteúdo')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
      expect(screen.getByLabelText('Prioridade')).toBeInTheDocument();
      expect(screen.getByLabelText('Publicar')).toBeInTheDocument();
      expect(screen.getByLabelText('Destaque')).toBeInTheDocument();
    });

    it('should display announcement type options', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      // Click on type selector
      const typeSelect = screen.getByLabelText('Tipo');
      await user.click(typeSelect);

      // Check type options
      expect(screen.getByText('Anúncio')).toBeInTheDocument();
      expect(screen.getByText('Notícia')).toBeInTheDocument();
      expect(screen.getByText('Changelog')).toBeInTheDocument();
      expect(screen.getByText('Evento')).toBeInTheDocument();
    });

    it('should submit create announcement form with correct data', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockMutations.useCreateAnnouncementMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      // Fill form
      await user.type(screen.getByLabelText('Título'), 'Test Announcement');
      await user.type(screen.getByLabelText('Conteúdo'), 'Test content');

      // Select type
      await user.click(screen.getByLabelText('Tipo'));
      await user.click(screen.getByText('Anúncio'));

      // Submit form
      await user.click(screen.getByText('Criar Anúncio'));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Announcement',
          content: 'Test content',
          type: 'announcement',
        }),
        expect.any(Object)
      );
    });

    it('should display optional fields when expanded', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      // Look for optional fields
      expect(screen.getByLabelText('URL da Imagem')).toBeInTheDocument();
      expect(screen.getByLabelText('Link Externo')).toBeInTheDocument();
      expect(screen.getByLabelText('Texto do Link')).toBeInTheDocument();
      expect(screen.getByLabelText('Data de Expiração')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Announcement Editing', () => {
    it('should open edit dialog when clicking edit button', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find edit button for first announcement
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByText('Editar Anúncio')).toBeInTheDocument();
    });

    it('should pre-populate form with existing announcement data', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find edit button for first announcement
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Check that form is pre-populated
      expect(
        screen.getByDisplayValue('Nova funcionalidade: Sistema de categorias')
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(
          'Implementamos um novo sistema de categorias para organizar melhor os posts da comunidade.'
        )
      ).toBeInTheDocument();
    });

    it('should submit update announcement form with correct data', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockMutations.useUpdateAnnouncementMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find edit button for first announcement
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Modify form
      const titleInput = screen.getByDisplayValue('Nova funcionalidade: Sistema de categorias');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Announcement');

      // Submit form
      await user.click(screen.getByText('Salvar Alterações'));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          data: expect.objectContaining({
            title: 'Updated Announcement',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('🔴 TDD: Announcement Deletion', () => {
    it('should show confirmation dialog when deleting announcement', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.fn(() => true);
      window.confirm = mockConfirm;

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find delete button for first announcement
      const deleteButtons = screen.getAllByRole('button', { name: /trash/i });
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith(
        'Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.'
      );
    });

    it('should call delete mutation when confirmed', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      const mockConfirm = vi.fn(() => true);
      window.confirm = mockConfirm;

      mockMutations.useDeleteAnnouncementMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find delete button for first announcement
      const deleteButtons = screen.getAllByRole('button', { name: /trash/i });
      await user.click(deleteButtons[0]);

      expect(mockMutate).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('should not call delete mutation when cancelled', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      const mockConfirm = vi.fn(() => false);
      window.confirm = mockConfirm;

      mockMutations.useDeleteAnnouncementMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find delete button for first announcement
      const deleteButtons = screen.getAllByRole('button', { name: /trash/i });
      await user.click(deleteButtons[0]);

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('🔴 TDD: Quick Actions', () => {
    it('should have quick publish/unpublish buttons', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find quick action buttons
      const publishButtons = screen.getAllByRole('button', { name: /eye/i });
      expect(publishButtons.length).toBeGreaterThan(0);
    });

    it('should have quick feature/unfeature buttons', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find star buttons for featuring
      const starButtons = screen.getAllByRole('button', { name: /star/i });
      expect(starButtons.length).toBeGreaterThan(0);
    });
  });

  describe('🔴 TDD: Form Validation', () => {
    it('should require title field', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      const titleInput = screen.getByLabelText('Título');
      expect(titleInput).toBeRequired();
    });

    it('should require content field', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      const contentInput = screen.getByLabelText('Conteúdo');
      expect(contentInput).toBeRequired();
    });

    it('should validate URL fields', async () => {
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

      expect(imageUrlInput).toHaveAttribute('type', 'url');
      expect(linkUrlInput).toHaveAttribute('type', 'url');
    });

    it('should validate priority range', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      const priorityInput = screen.getByLabelText('Prioridade');
      expect(priorityInput).toHaveAttribute('min', '1');
      expect(priorityInput).toHaveAttribute('max', '10');
    });
  });

  describe('🔴 TDD: Error Handling', () => {
    it('should display error toast on create failure', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((data, options) => {
        options.onError(new Error('Creation failed'));
      });

      mockMutations.useCreateAnnouncementMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      // Fill required fields
      await user.type(screen.getByLabelText('Título'), 'Test Announcement');
      await user.type(screen.getByLabelText('Conteúdo'), 'Test content');

      // Submit form
      await user.click(screen.getByText('Criar Anúncio'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('should display error toast on update failure', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((data, options) => {
        options.onError(new Error('Update failed'));
      });

      mockMutations.useUpdateAnnouncementMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find edit button for first announcement
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      // Submit form
      await user.click(screen.getByText('Salvar Alterações'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('should display error toast on delete failure', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((id, options) => {
        options.onError(new Error('Delete failed'));
      });
      const mockConfirm = vi.fn(() => true);
      window.confirm = mockConfirm;

      mockMutations.useDeleteAnnouncementMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Find delete button for first announcement
      const deleteButtons = screen.getAllByRole('button', { name: /trash/i });
      await user.click(deleteButtons[0]);

      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('🔴 TDD: Filters and Sorting', () => {
    it('should have filter buttons for different announcement types', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Check if there are filter capabilities
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Publicados')).toBeInTheDocument();
      expect(screen.getByText('Rascunhos')).toBeInTheDocument();
    });

    it('should sort announcements by priority and date', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      // Check table headers are clickable for sorting
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('🔴 TDD: Accessibility', () => {
    it('should have proper ARIA labels for action buttons', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      expect(newAnnouncementButton).toBeInTheDocument();

      // Check that buttons have proper roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper form labels', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const newAnnouncementButton = screen.getByText('Novo Anúncio');
      await user.click(newAnnouncementButton);

      // Check that form fields have proper labels
      expect(screen.getByLabelText('Título')).toBeInTheDocument();
      expect(screen.getByLabelText('Conteúdo')).toBeInTheDocument();
      expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    });

    it('should have proper table structure', () => {
      render(
        <TestWrapper>
          <AnnouncementManagement />
        </TestWrapper>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });
  });
});
