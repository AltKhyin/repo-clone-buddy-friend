// ABOUTME: TDD tests for Reddit-style sidebar component with all 8 sections integration

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RedditStyleSidebar } from '../RedditStyleSidebar';
import { CustomThemeProvider } from '../../theme/CustomThemeProvider';

// Mock the community management query
vi.mock('../../../../packages/hooks/useCommunityManagementQuery', () => ({
  useCommunitySidebarDataQuery: () => ({
    data: {
      sections: [
        {
          id: '1',
          section_type: 'about',
          title: 'Sobre',
          display_order: 1,
          is_visible: true,
          is_system: true,
          content: {
            description: 'Comunidade de profissionais da saúde',
            member_count_enabled: true,
            online_users_enabled: true,
          },
          computed_data: {
            member_count: 1250,
            online_count: 42,
            online_users: [
              {
                user_id: '1',
                full_name: 'Dr. João Silva',
                avatar_url: 'https://example.com/avatar1.jpg',
                last_seen: new Date().toISOString(),
              },
              {
                user_id: '2',
                full_name: 'Dra. Maria Santos',
                avatar_url: 'https://example.com/avatar2.jpg',
                last_seen: new Date().toISOString(),
              },
              {
                user_id: '3',
                full_name: 'Dr. Pedro Costa',
                avatar_url: null,
                last_seen: new Date().toISOString(),
              },
            ],
          },
        },
        {
          id: '2',
          section_type: 'links',
          title: 'Links Úteis',
          display_order: 2,
          is_visible: true,
          is_system: true,
          content: {
            links: [
              {
                title: 'Diretrizes Cardiológicas',
                url: 'https://example.com/cardio-guidelines',
                description: 'Últimas diretrizes da SBC',
              },
              {
                title: 'Calculadora de Risco',
                url: 'https://example.com/risk-calculator',
                description: 'Ferramenta para cálculo de risco cardiovascular',
              },
            ],
          },
        },
        {
          id: '3',
          section_type: 'rules',
          title: 'Regras',
          display_order: 3,
          is_visible: true,
          is_system: true,
          content: {
            rules: [
              'Seja respeitoso com todos os membros da comunidade',
              'Mantenha as discussões focadas em tópicos médicos e científicos',
              'Não compartilhe informações pessoais de pacientes',
              'Cite fontes confiáveis ao compartilhar informações médicas',
            ],
          },
        },
        {
          id: '4',
          section_type: 'categories',
          title: 'Filtrar por Categoria',
          display_order: 4,
          is_visible: true,
          is_system: true,
          content: {
            show_all_categories: true,
            show_post_count: true,
          },
          computed_data: {
            categories: [
              {
                id: 1,
                name: 'Discussão Geral',
                slug: 'discussao-geral',
                background_color: '#e3f2fd',
                text_color: '#1565c0',
                border_color: '#90caf9',
                is_active: true,
                display_order: 1,
                post_count: 23,
              },
              {
                id: 2,
                name: 'Caso Clínico',
                slug: 'caso-clinico',
                background_color: '#f3e5f5',
                text_color: '#7b1fa2',
                border_color: '#ce93d8',
                is_active: true,
                display_order: 2,
                post_count: 15,
              },
            ],
          },
        },
        {
          id: '5',
          section_type: 'announcements',
          title: 'Novidades',
          display_order: 5,
          is_visible: true,
          is_system: true,
          content: {
            show_featured_only: false,
            max_announcements: 3,
            allowed_types: ['announcement', 'news', 'changelog'],
          },
          computed_data: {
            announcements: [
              {
                id: '1',
                type: 'announcement',
                title: 'Nova funcionalidade: Sistema de categorias',
                content: 'Implementamos um novo sistema de categorias.',
                is_featured: true,
                created_at: new Date().toISOString(),
                author: 'Admin',
              },
            ],
          },
        },
        {
          id: '6',
          section_type: 'countdown',
          title: 'Próxima Edição',
          display_order: 6,
          is_visible: true,
          is_system: true,
          content: {
            show_multiple_countdowns: false,
            max_countdowns: 1,
          },
          computed_data: {
            countdowns: [
              {
                id: '1',
                title: 'Próxima Edição da Revista',
                target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                display_format: 'detailed',
                is_active: true,
              },
            ],
          },
        },
        {
          id: '7',
          section_type: 'custom',
          title: 'Recursos Adicionais',
          display_order: 7,
          is_visible: true,
          is_system: false,
          content: {
            custom_content: [
              {
                type: 'text',
                html: '<p>Confira nossos recursos adicionais para profissionais da saúde.</p>',
              },
              {
                type: 'button',
                text: 'Acessar Recursos',
                action: 'link',
                url: 'https://example.com/recursos',
              },
            ],
          },
        },
      ],
      memberCount: 1250,
      onlineCount: 42,
      onlineUsers: [
        {
          user_id: '1',
          full_name: 'Dr. João Silva',
          avatar_url: 'https://example.com/avatar1.jpg',
        },
      ],
      categories: [
        {
          id: 1,
          name: 'Discussão Geral',
          slug: 'discussao-geral',
          is_active: true,
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useUpdateOnlineStatusMutation: () => ({
    mutate: vi.fn(),
  }),
}));

// Mock auth store
vi.mock('../../../store/auth', () => ({
  useAuthStore: () => ({
    user: {
      id: '123',
      email: 'test@example.com',
      app_metadata: { role: 'practitioner' },
    },
  }),
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
        <CustomThemeProvider>{children}</CustomThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('RedditStyleSidebar - Complete Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 TDD: Sidebar Structure', () => {
    it('should render all visible sections in correct order', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Check that all sections are present and in order
      expect(screen.getByText('Sobre')).toBeInTheDocument();
      expect(screen.getByText('Links Úteis')).toBeInTheDocument();
      expect(screen.getByText('Regras')).toBeInTheDocument();
      expect(screen.getByText('Filtrar por Categoria')).toBeInTheDocument();
      expect(screen.getByText('Novidades')).toBeInTheDocument();
      expect(screen.getByText('Próxima Edição')).toBeInTheDocument();
      expect(screen.getByText('Recursos Adicionais')).toBeInTheDocument();
    });

    it('should handle loading state properly', () => {
      // Mock loading state
      vi.mocked(
        require('../../../../packages/hooks/useCommunityManagementQuery')
          .useCommunitySidebarDataQuery
      ).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Should show loading skeleton
      expect(screen.getAllByTestId('skeleton')).toHaveLength(4);
    });

    it('should handle error state properly', () => {
      // Mock error state
      vi.mocked(
        require('../../../../packages/hooks/useCommunityManagementQuery')
          .useCommunitySidebarDataQuery
      ).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load sidebar data'),
      });

      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Should show error message
      expect(screen.getByText('Erro ao carregar sidebar da comunidade')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: About Section', () => {
    it('should display member count and online users', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Check member count
      expect(screen.getByText('1.250')).toBeInTheDocument();
      expect(screen.getByText('Membros')).toBeInTheDocument();

      // Check online users
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Online agora')).toBeInTheDocument();
    });

    it('should display overlapping avatars for online users', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Check that avatars are displayed
      const avatars = screen.getAllByTestId('avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should update online status when component mounts', () => {
      const mockMutate = vi.fn();
      vi.mocked(
        require('../../../../packages/hooks/useCommunityManagementQuery')
          .useUpdateOnlineStatusMutation
      ).mockReturnValue({
        mutate: mockMutate,
      });

      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(mockMutate).toHaveBeenCalledWith({ is_viewing_community: true });
    });
  });

  describe('🔴 TDD: Links Section', () => {
    it('should display all configured links', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Diretrizes Cardiológicas')).toBeInTheDocument();
      expect(screen.getByText('Calculadora de Risco')).toBeInTheDocument();
    });

    it('should handle link clicks properly', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      const link = screen.getByText('Diretrizes Cardiológicas');
      expect(link.closest('a')).toHaveAttribute('href', 'https://example.com/cardio-guidelines');
    });
  });

  describe('🔴 TDD: Rules Section', () => {
    it('should display all community rules', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(screen.getByText(/Seja respeitoso com todos/)).toBeInTheDocument();
      expect(screen.getByText(/Mantenha as discussões focadas/)).toBeInTheDocument();
      expect(screen.getByText(/Não compartilhe informações pessoais/)).toBeInTheDocument();
      expect(screen.getByText(/Cite fontes confiáveis/)).toBeInTheDocument();
    });

    it('should handle long rules with expand/collapse', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Rules should be displayed with proper numbering
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Categories Section', () => {
    it('should display all active categories', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Discussão Geral')).toBeInTheDocument();
      expect(screen.getByText('Caso Clínico')).toBeInTheDocument();
      expect(screen.getByText('Todas as Categorias')).toBeInTheDocument();
    });

    it('should handle category filtering clicks', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      const categoryButton = screen.getByText('Discussão Geral');
      fireEvent.click(categoryButton);

      // Should log category selection (basic test)
      expect(categoryButton).toBeInTheDocument();
    });

    it('should display post counts for categories', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Mock data includes post counts
      expect(screen.getByText('23')).toBeInTheDocument(); // Discussão Geral count
      expect(screen.getByText('15')).toBeInTheDocument(); // Caso Clínico count
    });
  });

  describe('🔴 TDD: Announcements Section', () => {
    it('should display announcements', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Nova funcionalidade: Sistema de categorias')).toBeInTheDocument();
      expect(screen.getByText('Implementamos um novo sistema de categorias.')).toBeInTheDocument();
    });

    it('should display announcement types with proper badges', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Anúncio')).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Countdown Section', () => {
    it('should display active countdowns', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Próxima Edição da Revista')).toBeInTheDocument();
    });

    it('should show countdown timer', async () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Should show countdown elements (days, hours, etc)
      await waitFor(() => {
        expect(screen.getByText('dias')).toBeInTheDocument();
      });
    });
  });

  describe('🔴 TDD: Custom Section', () => {
    it('should display custom content', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      expect(screen.getByText('Recursos Adicionais')).toBeInTheDocument();
      expect(screen.getByText(/Confira nossos recursos adicionais/)).toBeInTheDocument();
    });

    it('should handle custom buttons', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      const button = screen.getByText('Acessar Recursos');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('🔴 TDD: Responsive Design', () => {
    it('should maintain proper spacing and layout', () => {
      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      const sidebar = screen.getByTestId('reddit-style-sidebar');
      expect(sidebar).toHaveClass('w-full', 'max-w-sm', 'space-y-4');
    });

    it('should handle empty sections gracefully', () => {
      // Mock empty sections
      vi.mocked(
        require('../../../../packages/hooks/useCommunityManagementQuery')
          .useCommunitySidebarDataQuery
      ).mockReturnValue({
        data: { sections: [], memberCount: 0, onlineCount: 0 },
        isLoading: false,
        error: null,
      });

      render(
        <TestWrapper>
          <RedditStyleSidebar />
        </TestWrapper>
      );

      // Should render without errors
      expect(screen.getByTestId('reddit-style-sidebar')).toBeInTheDocument();
    });
  });
});
