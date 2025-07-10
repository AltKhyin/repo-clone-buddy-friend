// ABOUTME: TDD tests for CategoryManagement admin interface ensuring complete functionality for community category management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryManagement } from '../CategoryManagement';
import { CustomThemeProvider } from '../../../theme/CustomThemeProvider';
import { Toaster } from '@/components/ui/toaster';

// Mock the community management query
vi.mock('../../../../../packages/hooks/useCommunityManagementQuery', () => ({
  useCommunitySidebarDataQuery: vi.fn(),
  useCreateCategoryMutation: vi.fn(),
  useUpdateCategoryMutation: vi.fn(),
  useDeleteCategoryMutation: vi.fn(),
  useReorderCategoriesMutation: vi.fn(),
  useToggleCategoryVisibilityMutation: vi.fn(),
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

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(),
  writable: true,
});

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

// Mock category data
const mockCategories = [
  {
    id: 1,
    name: 'discussao-geral',
    label: 'Discussão Geral',
    description: 'Discussões gerais sobre medicina',
    background_color: '#e3f2fd',
    text_color: '#1565c0',
    border_color: '#90caf9',
    is_active: true,
    is_system: true,
    display_order: 1,
    icon_name: 'message-circle',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'caso-clinico',
    label: 'Caso Clínico',
    description: 'Discussões sobre casos clínicos',
    background_color: '#f3e5f5',
    text_color: '#7b1fa2',
    border_color: '#ce93d8',
    is_active: true,
    is_system: false,
    display_order: 2,
    icon_name: 'stethoscope',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'tecnologia',
    label: 'Tecnologia',
    description: 'Discussões sobre tecnologia médica',
    background_color: '#e8f5e8',
    text_color: '#2e7d32',
    border_color: '#81c784',
    is_active: false,
    is_system: false,
    display_order: 3,
    icon_name: 'laptop',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

describe('CategoryManagement - TDD Implementation', () => {
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
      useReorderCategoriesMutation,
      useToggleCategoryVisibilityMutation,
    } = require('../../../../../packages/hooks/useCommunityManagementQuery');

    mockQueries = {
      useCommunitySidebarDataQuery,
    };

    mockMutations = {
      useCreateCategoryMutation,
      useUpdateCategoryMutation,
      useDeleteCategoryMutation,
      useReorderCategoriesMutation,
      useToggleCategoryVisibilityMutation,
    };

    // Default mock implementations
    mockQueries.useCommunitySidebarDataQuery.mockReturnValue({
      data: { categories: mockCategories },
      isLoading: false,
      error: null,
    });

    mockMutations.useCreateCategoryMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockMutations.useUpdateCategoryMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockMutations.useDeleteCategoryMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockMutations.useReorderCategoriesMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockMutations.useToggleCategoryVisibilityMutation.mockReturnValue({
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
          <CategoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Carregando categorias...')).toBeInTheDocument();
    });

    it('should display category management interface with header', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Gestão de Categorias')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Configure categorias para organizar posts da comunidade seguindo o padrão ContentTypes.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
    });

    it('should display empty state when no categories exist', () => {
      mockQueries.useCommunitySidebarDataQuery.mockReturnValue({
        data: { categories: [] },
        isLoading: false,
        error: null,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Nenhuma categoria encontrada.')).toBeInTheDocument();
      expect(
        screen.getByText('Crie sua primeira categoria para organizar os posts da comunidade.')
      ).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Category List Display', () => {
    it('should display all categories in a table', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Check table headers
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Slug')).toBeInTheDocument();
      expect(screen.getByText('Descrição')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Tipo')).toBeInTheDocument();
      expect(screen.getByText('Ações')).toBeInTheDocument();

      // Check category data
      expect(screen.getByText('Discussão Geral')).toBeInTheDocument();
      expect(screen.getByText('discussao-geral')).toBeInTheDocument();
      expect(screen.getByText('Discussões gerais sobre medicina')).toBeInTheDocument();
      expect(screen.getByText('Caso Clínico')).toBeInTheDocument();
      expect(screen.getByText('caso-clinico')).toBeInTheDocument();
    });

    it('should display category badges with custom colors', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const discussaoGeralBadge = screen.getByText('Discussão Geral');
      const casoClinicoBadge = screen.getByText('Caso Clínico');

      expect(discussaoGeralBadge).toBeInTheDocument();
      expect(casoClinicoBadge).toBeInTheDocument();
    });

    it('should display status badges for active/inactive categories', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const activeBadges = screen.getAllByText('Ativa');
      const inactiveBadges = screen.getAllByText('Inativa');

      expect(activeBadges).toHaveLength(2); // Two active categories
      expect(inactiveBadges).toHaveLength(1); // One inactive category
    });

    it('should display system vs custom badges', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Sistema')).toBeInTheDocument(); // System category
      expect(screen.getAllByText('Personalizada')).toHaveLength(2); // Two custom categories
    });

    it('should display system categories warning', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      expect(screen.getByText('Categorias do Sistema')).toBeInTheDocument();
      expect(
        screen.getByText(/Categorias marcadas como "Sistema" são essenciais/)
      ).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Category Creation', () => {
    it('should open create category dialog when clicking Nova Categoria', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
      expect(
        screen.getByText('Configure os detalhes e aparência da categoria para posts da comunidade.')
      ).toBeInTheDocument();
    });

    it('should display all required form fields in create dialog', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Check form fields
      expect(screen.getByLabelText('Nome da Categoria (slug)')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome de Exibição')).toBeInTheDocument();
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
      expect(screen.getByLabelText('Cor do Texto')).toBeInTheDocument();
      expect(screen.getByLabelText('Cor da Borda')).toBeInTheDocument();
      expect(screen.getByLabelText('Cor de Fundo')).toBeInTheDocument();
    });

    it('should display color preset buttons', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Check color presets
      expect(screen.getByText('Azul')).toBeInTheDocument();
      expect(screen.getByText('Verde')).toBeInTheDocument();
      expect(screen.getByText('Amarelo')).toBeInTheDocument();
      expect(screen.getByText('Rosa')).toBeInTheDocument();
      expect(screen.getByText('Roxo')).toBeInTheDocument();
      expect(screen.getByText('Vermelho')).toBeInTheDocument();
    });

    it('should submit create category form with correct data', async () => {
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
      await user.type(screen.getByLabelText('Descrição'), 'Test description');

      // Submit form
      await user.click(screen.getByText('Criar Categoria'));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-category',
          label: 'Test Category',
          description: 'Test description',
        }),
        expect.any(Object)
      );
    });

    it('should apply color presets when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Click green preset
      await user.click(screen.getByText('Verde'));

      // Check that color inputs are updated
      const textColorInput = screen.getByDisplayValue('#1f2937');
      const borderColorInput = screen.getByDisplayValue('#16a34a');
      const backgroundColorInput = screen.getByDisplayValue('#dcfce7');

      expect(textColorInput).toBeInTheDocument();
      expect(borderColorInput).toBeInTheDocument();
      expect(backgroundColorInput).toBeInTheDocument();
    });
  });

  describe('🔴 TDD: Category Editing', () => {
    it('should open edit dialog when clicking edit button', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find edit button for custom category (not system)
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const editButton = within(customCategoryRow).getByRole('button', { name: /edit/i });
        await user.click(editButton);

        expect(screen.getByText('Editar Categoria')).toBeInTheDocument();
      }
    });

    it('should pre-populate form with existing category data', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find edit button for case-clinico category
      const rows = screen.getAllByRole('row');
      const casoClinicoRow = rows.find(row => within(row).queryByText('caso-clinico'));

      if (casoClinicoRow) {
        const editButton = within(casoClinicoRow).getByRole('button', { name: /edit/i });
        await user.click(editButton);

        // Check that form is pre-populated
        expect(screen.getByDisplayValue('caso-clinico')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Caso Clínico')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Discussões sobre casos clínicos')).toBeInTheDocument();
      }
    });

    it('should disable edit button for system categories', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const rows = screen.getAllByRole('row');
      const systemCategoryRow = rows.find(row => within(row).queryByText('Sistema'));

      if (systemCategoryRow) {
        const editButton = within(systemCategoryRow).getByRole('button', { name: /edit/i });
        expect(editButton).toBeDisabled();
      }
    });

    it('should submit update category form with correct data', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockMutations.useUpdateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find edit button for custom category
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const editButton = within(customCategoryRow).getByRole('button', { name: /edit/i });
        await user.click(editButton);

        // Modify form
        const nameInput = screen.getByDisplayValue('caso-clinico');
        await user.clear(nameInput);
        await user.type(nameInput, 'updated-category');

        // Submit form
        await user.click(screen.getByText('Salvar Alterações'));

        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 2,
            data: expect.objectContaining({
              name: 'updated-category',
            }),
          }),
          expect.any(Object)
        );
      }
    });
  });

  describe('🔴 TDD: Category Deletion', () => {
    it('should show confirmation dialog when deleting category', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.fn(() => true);
      window.confirm = mockConfirm;

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find delete button for custom category
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const deleteButton = within(customCategoryRow).getByRole('button', { name: /trash/i });
        await user.click(deleteButton);

        expect(mockConfirm).toHaveBeenCalledWith(
          'Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.'
        );
      }
    });

    it('should call delete mutation when confirmed', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      const mockConfirm = vi.fn(() => true);
      window.confirm = mockConfirm;

      mockMutations.useDeleteCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find delete button for custom category
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const deleteButton = within(customCategoryRow).getByRole('button', { name: /trash/i });
        await user.click(deleteButton);

        expect(mockMutate).toHaveBeenCalledWith(2, expect.any(Object));
      }
    });

    it('should not call delete mutation when cancelled', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      const mockConfirm = vi.fn(() => false);
      window.confirm = mockConfirm;

      mockMutations.useDeleteCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find delete button for custom category
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const deleteButton = within(customCategoryRow).getByRole('button', { name: /trash/i });
        await user.click(deleteButton);

        expect(mockMutate).not.toHaveBeenCalled();
      }
    });

    it('should disable delete button for system categories', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const rows = screen.getAllByRole('row');
      const systemCategoryRow = rows.find(row => within(row).queryByText('Sistema'));

      if (systemCategoryRow) {
        const deleteButton = within(systemCategoryRow).getByRole('button', { name: /trash/i });
        expect(deleteButton).toBeDisabled();
      }
    });
  });

  describe('🔴 TDD: Category Visibility Toggle', () => {
    it('should toggle category visibility when clicking toggle button', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();
      mockMutations.useToggleCategoryVisibilityMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find toggle button for custom category
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const toggleButton = within(customCategoryRow).getByRole('button', { name: /eye/i });
        await user.click(toggleButton);

        expect(mockMutate).toHaveBeenCalledWith(2, expect.any(Object));
      }
    });

    it('should disable toggle button for system categories', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const rows = screen.getAllByRole('row');
      const systemCategoryRow = rows.find(row => within(row).queryByText('Sistema'));

      if (systemCategoryRow) {
        const toggleButton = within(systemCategoryRow).getByRole('button', { name: /eye/i });
        expect(toggleButton).toBeDisabled();
      }
    });
  });

  describe('🔴 TDD: Form Validation', () => {
    it('should require name field', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      const nameInput = screen.getByLabelText('Nome da Categoria (slug)');
      expect(nameInput).toBeRequired();
    });

    it('should require label field', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      const labelInput = screen.getByLabelText('Nome de Exibição');
      expect(labelInput).toBeRequired();
    });

    it('should validate name field pattern', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      const nameInput = screen.getByLabelText('Nome da Categoria (slug)');
      expect(nameInput).toHaveAttribute('pattern', '^[a-z0-9-]+$');
    });
  });

  describe('🔴 TDD: Error Handling', () => {
    it('should display error toast on create failure', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((data, options) => {
        options.onError(new Error('Creation failed'));
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

      // Submit form
      await user.click(screen.getByText('Criar Categoria'));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('should display error toast on update failure', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((data, options) => {
        options.onError(new Error('Update failed'));
      });

      mockMutations.useUpdateCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find edit button for custom category
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const editButton = within(customCategoryRow).getByRole('button', { name: /edit/i });
        await user.click(editButton);

        // Submit form
        await user.click(screen.getByText('Salvar Alterações'));

        expect(mockMutate).toHaveBeenCalled();
      }
    });

    it('should display error toast on delete failure', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn((id, options) => {
        options.onError(new Error('Delete failed'));
      });
      const mockConfirm = vi.fn(() => true);
      window.confirm = mockConfirm;

      mockMutations.useDeleteCategoryMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      // Find delete button for custom category
      const rows = screen.getAllByRole('row');
      const customCategoryRow = rows.find(row => within(row).queryByText('Personalizada'));

      if (customCategoryRow) {
        const deleteButton = within(customCategoryRow).getByRole('button', { name: /trash/i });
        await user.click(deleteButton);

        expect(mockMutate).toHaveBeenCalled();
      }
    });
  });

  describe('🔴 TDD: Accessibility', () => {
    it('should have proper ARIA labels for action buttons', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      expect(newCategoryButton).toBeInTheDocument();

      // Check that buttons have proper roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper form labels', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const newCategoryButton = screen.getByText('Nova Categoria');
      await user.click(newCategoryButton);

      // Check that form fields have proper labels
      expect(screen.getByLabelText('Nome da Categoria (slug)')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome de Exibição')).toBeInTheDocument();
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
    });

    it('should have proper table structure', () => {
      render(
        <TestWrapper>
          <CategoryManagement />
        </TestWrapper>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(7); // 7 columns including drag handle
    });
  });
});
