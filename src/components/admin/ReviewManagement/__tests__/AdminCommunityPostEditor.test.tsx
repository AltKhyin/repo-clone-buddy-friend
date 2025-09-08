// ABOUTME: Tests for AdminCommunityPostEditor ensuring community post creation and management functionality works correctly

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminCommunityPostEditor } from '../AdminCommunityPostEditor';

// Mock the TiptapEditor component to avoid complex dependencies
vi.mock('../../../community/TiptapEditor', () => ({
  TiptapEditor: ({ content, onChange, placeholder }: any) => (
    <textarea
      data-testid="tiptap-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the community post hooks
vi.mock('../../../../../packages/hooks/useReviewCommunityPost', () => ({
  useReviewCommunityPost: vi.fn(() => ({
    data: null,
    isLoading: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('../../../../../packages/hooks/useAdminCommunityPostMutation', () => ({
  useCreateAdminCommunityPost: () => ({
    createPost: vi.fn(),
    isPending: false,
  }),
  useUpdateAdminCommunityPost: () => ({
    updatePost: vi.fn(),
    isPending: false,
  }),
  usePublishAdminCommunityPost: () => ({
    publishPost: vi.fn(),
    isPending: false,
  }),
  useScheduleAdminCommunityPost: () => ({
    schedulePost: vi.fn(),
    isPending: false,
  }),
  useHideAdminCommunityPost: () => ({
    hidePost: vi.fn(),
    isPending: false,
  }),
  useUnhideAdminCommunityPost: () => ({
    unhidePost: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../../../../packages/hooks/usePostCategories', () => ({
  usePostCategoriesAdmin: () => ({
    data: [
      {
        id: 'review',
        name: 'review',
        label: 'Review',
        background_color: '#ef4444',
        text_color: '#ffffff',
        border_color: '#dc2626',
      },
      {
        id: 'discussao-geral',
        name: 'discussao-geral',
        label: 'Discussão Geral',
        background_color: '#6b7280',
        text_color: '#ffffff',
        border_color: '#4b5563',
      },
    ],
    isLoading: false,
  }),
}));

const mockReview = {
  id: 1,
  title: 'Test Review Title',
  description: 'Test Review Description',
  cover_image_url: 'https://example.com/cover.jpg',
  author_id: 'user-123',
  review_status: 'draft' as const,
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AdminCommunityPostEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields correctly', () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    // Check for main form elements
    expect(screen.getByLabelText(/título do post/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();
    expect(screen.getByLabelText(/notas administrativas/i)).toBeInTheDocument();
  });

  it('should display review banner preview', () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    expect(screen.getByText(/preview do banner da review/i)).toBeInTheDocument();
    expect(screen.getByAltText(mockReview.title)).toBeInTheDocument();
  });

  it('should initialize form with default title for new post', () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    const titleInput = screen.getByLabelText(/título do post/i) as HTMLInputElement;
    expect(titleInput.value).toBe(`Discussão: ${mockReview.title}`);
  });

  it('should display action buttons', () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    expect(screen.getByRole('button', { name: /salvar rascunho/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publicar agora/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publicar com review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post oculto/i })).toBeInTheDocument();
  });

  it('should disable buttons when title is empty', async () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    const titleInput = screen.getByLabelText(/título do post/i);
    
    // Clear the title
    fireEvent.change(titleInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salvar rascunho/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /publicar agora/i })).toBeDisabled();
    });
  });

  it('should update form fields when typing', async () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    const titleInput = screen.getByLabelText(/título do post/i);
    const contentEditor = screen.getByTestId('tiptap-editor');
    const notesInput = screen.getByLabelText(/notas administrativas/i);

    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    fireEvent.change(contentEditor, { target: { value: 'New content' } });
    fireEvent.change(notesInput, { target: { value: 'Admin notes' } });

    await waitFor(() => {
      expect((titleInput as HTMLInputElement).value).toBe('New Title');
      expect((contentEditor as HTMLTextAreaElement).value).toBe('New content');
      expect((notesInput as HTMLTextAreaElement).value).toBe('Admin notes');
    });
  });

  it('should display category dropdown with admin categories', () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    // Open the category dropdown
    const categorySelect = screen.getByRole('combobox');
    fireEvent.click(categorySelect);

    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Discussão Geral')).toBeInTheDocument();
  });

  it('should show help text explaining button functions', () => {
    renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

    expect(screen.getByText(/salvar.*mantém como rascunho privado/i)).toBeInTheDocument();
    expect(screen.getByText(/publicar agora.*torna público imediatamente/i)).toBeInTheDocument();
    expect(screen.getByText(/publicar com review.*publica automaticamente/i)).toBeInTheDocument();
    expect(screen.getByText(/post oculto.*permite comentários na review/i)).toBeInTheDocument();
  });

  describe('Existing Post Scenario', () => {
    const mockExistingPost = {
      id: 123,
      title: 'Existing Post Title',
      content: 'Existing content',
      category: 'review',
      post_type: 'image' as const,
      admin_notes: 'Existing notes',
      scheduled_publish_at: null,
      post_status: 'draft' as const,
      visibility_level: 'public' as const,
      admin_creator: {
        id: 'admin-123',
        full_name: 'Admin User',
        avatar_url: null,
      },
    };

    beforeEach(() => {
      // Mock useReviewCommunityPost to return existing post
      vi.mocked(require('../../../../../packages/hooks/useReviewCommunityPost').useReviewCommunityPost)
        .mockReturnValue({
          data: mockExistingPost,
          isLoading: false,
          refetch: vi.fn(),
        });
    });

    it('should initialize form with existing post data', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      const titleInput = screen.getByLabelText(/título do post/i) as HTMLInputElement;
      const contentEditor = screen.getByTestId('tiptap-editor') as HTMLTextAreaElement;
      const notesInput = screen.getByLabelText(/notas administrativas/i) as HTMLTextAreaElement;

      expect(titleInput.value).toBe(mockExistingPost.title);
      expect(contentEditor.value).toBe(mockExistingPost.content);
      expect(notesInput.value).toBe(mockExistingPost.admin_notes);
    });

    it('should display post status badges for existing post', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByText('draft')).toBeInTheDocument();
    });

    it('should show "Salvar Alterações" instead of "Salvar Rascunho" for existing post', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /salvar rascunho/i })).not.toBeInTheDocument();
    });

    it('should display admin creator information', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByText(/criado por.*admin user/i)).toBeInTheDocument();
    });

    it('should show toggle visibility button for existing post', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByRole('button', { name: /ocultar da comunidade/i })).toBeInTheDocument();
    });
  });

  describe('Hidden Post Scenario', () => {
    const mockHiddenPost = {
      id: 123,
      title: 'Hidden Post',
      content: 'Hidden content',
      category: 'review',
      post_type: 'image' as const,
      admin_notes: '',
      scheduled_publish_at: null,
      post_status: 'hidden' as const,
      visibility_level: 'hidden' as const,
      admin_creator: null,
    };

    beforeEach(() => {
      vi.mocked(require('../../../../../packages/hooks/useReviewCommunityPost').useReviewCommunityPost)
        .mockReturnValue({
          data: mockHiddenPost,
          isLoading: false,
          refetch: vi.fn(),
        });
    });

    it('should display hidden post badge', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByText(/oculto/i)).toBeInTheDocument();
    });

    it('should show "Mostrar na Comunidade" button for hidden post', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByRole('button', { name: /mostrar na comunidade/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when loading existing post', () => {
      vi.mocked(require('../../../../../packages/hooks/useReviewCommunityPost').useReviewCommunityPost)
        .mockReturnValue({
          data: null,
          isLoading: true,
          refetch: vi.fn(),
        });

      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    it('should show loading spinner during mutation', () => {
      vi.mocked(require('../../../../../packages/hooks/useAdminCommunityPostMutation').useCreateAdminCommunityPost)
        .mockReturnValue({
          createPost: vi.fn(),
          isPending: true,
        });

      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });
  });

  describe('Review Without Cover Image', () => {
    const reviewWithoutImage = {
      ...mockReview,
      cover_image_url: null,
    };

    it('should display fallback banner when no cover image', () => {
      renderWithQueryClient(<AdminCommunityPostEditor review={reviewWithoutImage} />);

      expect(screen.getByText('T')).toBeInTheDocument(); // First letter fallback
      expect(screen.getByText('EVIDENS')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should prevent form submission with empty title', async () => {
      const mockCreatePost = vi.fn();
      vi.mocked(require('../../../../../packages/hooks/useAdminCommunityPostMutation').useCreateAdminCommunityPost)
        .mockReturnValue({
          createPost: mockCreatePost,
          isPending: false,
        });

      renderWithQueryClient(<AdminCommunityPostEditor review={mockReview} />);

      const titleInput = screen.getByLabelText(/título do post/i);
      fireEvent.change(titleInput, { target: { value: '   ' } }); // Only whitespace

      const saveButton = screen.getByRole('button', { name: /salvar rascunho/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreatePost).not.toHaveBeenCalled();
      });
    });
  });
});