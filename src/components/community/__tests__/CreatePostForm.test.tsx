// ABOUTME: Tests for CreatePostForm component ensuring Link post type and validation requirements work correctly.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreatePostForm } from '../CreatePostForm';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'mock-url' } })),
      })),
    },
  },
}));

vi.mock('../../../packages/hooks/useCreateCommunityPostMutation', () => ({
  useCreateCommunityPostMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', user_metadata: { full_name: 'Test User' } },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/video-utils', () => ({
  processVideoUrl: vi.fn(url => url),
  isValidVideoUrl: vi.fn(() => true),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('CreatePostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all post type tabs including Link', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Check that all 5 tabs are present
    expect(screen.getByText('Texto')).toBeInTheDocument();
    expect(screen.getByText('Imagem')).toBeInTheDocument();
    expect(screen.getByText('Vídeo')).toBeInTheDocument();
    expect(screen.getByText('Enquete')).toBeInTheDocument();
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('shows correct header text', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    expect(screen.getByText('Nova Discussão')).toBeInTheDocument();
    expect(
      screen.getByText('Compartilhe suas ideias com a comunidade EVIDENS')
    ).toBeInTheDocument();
  });

  it('shows title as mandatory field', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Title should be marked as required
    expect(screen.getByText('Título *')).toBeInTheDocument();
  });

  it('shows content as optional field', () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Content should be marked as optional
    expect(screen.getByText('Conteúdo (opcional)')).toBeInTheDocument();
  });

  it('validates title requirement on submit', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Select a category
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Discussão Geral'));

    // Try to submit without title
    const submitButton = screen.getByText('Publicar Discussão');
    await user.click(submitButton);

    // Should show error about missing title
    expect(screen.getByText(/o título da discussão é obrigatório/i)).toBeInTheDocument();
  });

  it('allows submission with only title and category (content optional)', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(
      require('../../../packages/hooks/useCreateCommunityPostMutation')
        .useCreateCommunityPostMutation
    ).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Fill in required fields
    const titleInput = screen.getByPlaceholderText(/digite um título/i);
    await user.type(titleInput, 'Test Title');

    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Discussão Geral'));

    // Submit without content (should be valid)
    const submitButton = screen.getByText('Publicar Discussão');
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Title',
        category: 'discussao-geral',
        post_type: 'text',
      }),
      expect.any(Object)
    );
  });

  it('displays Link tab content when selected', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Click Link tab
    const linkTab = screen.getByText('Link');
    await user.click(linkTab);

    // Should show link-specific content
    expect(screen.getByPlaceholderText(/cole o link aqui/i)).toBeInTheDocument();
    expect(screen.getByText(/título para o link compartilhado/i)).toBeInTheDocument();
  });

  it('validates link URL for link posts', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Switch to Link tab
    const linkTab = screen.getByText('Link');
    await user.click(linkTab);

    // Fill in title and category
    const titleInput = screen.getByPlaceholderText(/título para o link/i);
    await user.type(titleInput, 'Test Link Post');

    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Discussão Geral'));

    // Try to submit without link URL
    const submitButton = screen.getByText('Publicar Discussão');
    await user.click(submitButton);

    expect(screen.getByText(/adicione um link válido/i)).toBeInTheDocument();
  });

  it('updates content placeholder for link posts', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Switch to Link tab
    const linkTab = screen.getByText('Link');
    await user.click(linkTab);

    // Check that content placeholder is updated for links
    expect(screen.getByText('Comentário sobre o link')).toBeInTheDocument();
  });

  it('submits link post with correct payload', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(
      require('../../../packages/hooks/useCreateCommunityPostMutation')
        .useCreateCommunityPostMutation
    ).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Switch to Link tab
    const linkTab = screen.getByText('Link');
    await user.click(linkTab);

    // Fill in required fields
    const titleInput = screen.getByPlaceholderText(/título para o link/i);
    await user.type(titleInput, 'Test Link Post');

    const linkInput = screen.getByPlaceholderText(/cole o link aqui/i);
    await user.type(linkInput, 'https://example.com');

    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Discussão Geral'));

    // Add some content
    const contentEditor = screen.getByRole('textbox');
    await user.type(contentEditor, 'This is a great link!');

    // Submit
    const submitButton = screen.getByText('Publicar Discussão');
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Link Post',
        content: 'This is a great link!',
        category: 'discussao-geral',
        post_type: 'link',
        link_url: 'https://example.com',
      }),
      expect.any(Object)
    );
  });

  it('includes link preview data in submission when available', async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    vi.mocked(
      require('../../../packages/hooks/useCreateCommunityPostMutation')
        .useCreateCommunityPostMutation
    ).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    // Mock the LinkInput component to simulate preview data
    vi.mock('../LinkInput', () => ({
      LinkInput: ({ onPreviewDataChange }: any) => {
        React.useEffect(() => {
          onPreviewDataChange({
            url: 'https://example.com',
            title: 'Example Title',
            description: 'Example description',
            domain: 'example.com',
          });
        }, [onPreviewDataChange]);

        return <input placeholder="Cole o link aqui" />;
      },
    }));

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Switch to Link tab
    const linkTab = screen.getByText('Link');
    await user.click(linkTab);

    // Fill in required fields
    const titleInput = screen.getByPlaceholderText(/título para o link/i);
    await user.type(titleInput, 'Test Link Post');

    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Discussão Geral'));

    // Submit
    const submitButton = screen.getByText('Publicar Discussão');
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        post_type: 'link',
        link_preview_data: expect.objectContaining({
          title: 'Example Title',
          description: 'Example description',
          domain: 'example.com',
        }),
      }),
      expect.any(Object)
    );
  });

  it('disables submit button when only category is filled (title required)', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Select category but don't fill title
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Discussão Geral'));

    // Submit button should be disabled
    const submitButton = screen.getByText('Publicar Discussão');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when title and category are filled (content optional)', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <CreatePostForm />
      </Wrapper>
    );

    // Fill title
    const titleInput = screen.getByPlaceholderText(/digite um título/i);
    await user.type(titleInput, 'Test Title');

    // Select category
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    await user.click(screen.getByText('Discussão Geral'));

    // Submit button should be enabled
    const submitButton = screen.getByText('Publicar Discussão');
    expect(submitButton).not.toBeDisabled();
  });
});
