// ABOUTME: Essential tests for PageHeader component - core functionality only to avoid bloat

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PageHeader from '../PageHeader';
import * as usePageSettingsModule from '../../../../packages/hooks/usePageSettings';

// Mock the usePageSettings hook
const mockUsePageSettings = vi.fn();
vi.mock('../../../../packages/hooks/usePageSettings', () => ({
  usePageSettings: (...args: any[]) => mockUsePageSettings(...args),
  getResponsiveBannerUrl: vi.fn(() => null),
  getDefaultPageSettings: vi.fn((pageId: string) => ({
    title: pageId === 'acervo' ? 'Acervo EVIDENS' : 'Comunidade EVIDENS',
    description: pageId === 'acervo' ? 'Reviews collection' : 'Community discussions',
    theme_color: '#0F172A'
  }))
}));

describe('PageHeader', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  it('renders loading state correctly', () => {
    mockUsePageSettings.mockReturnValue({
      data: null,
      isLoading: true
    });

    renderWithClient(<PageHeader pageId="acervo" />);
    
    // Should show skeleton loading elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders with default settings when no data', () => {
    mockUsePageSettings.mockReturnValue({
      data: null,
      isLoading: false
    });

    renderWithClient(<PageHeader pageId="acervo" />);
    
    // Should show simplified title (just "Acervo", capitalized from pageId)
    expect(screen.getByRole('heading', { name: /acervo/i })).toBeInTheDocument();
  });

  it('renders with custom settings when data available', () => {
    const mockSettings = {
      title: 'Custom Acervo Title',
      avatar_url: 'https://example.com/avatar.png',
      banner_url: 'https://example.com/banner.png'
    };

    mockUsePageSettings.mockReturnValue({
      data: mockSettings,
      isLoading: false
    });

    renderWithClient(<PageHeader pageId="acervo" />);
    
    expect(screen.getByRole('heading', { name: /custom acervo title/i })).toBeInTheDocument();
    // No description for Reddit parity
    expect(screen.queryByText('Custom description')).not.toBeInTheDocument();
    
    // Should show single avatar (simplified structure)
    const avatar = screen.getByAltText(/custom acervo title avatar/i);
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('renders fallback avatar when no avatar_url provided', () => {
    mockUsePageSettings.mockReturnValue({
      data: {
        title: 'Test Page',
        avatar_url: null
      },
      isLoading: false
    });

    renderWithClient(<PageHeader pageId="test" />);
    
    // Should show first letter of title as fallback (single avatar)
    const fallbackAvatar = screen.getByText('T');
    expect(fallbackAvatar).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    mockUsePageSettings.mockReturnValue({
      data: null,
      isLoading: false
    });

    renderWithClient(
      <PageHeader pageId="acervo">
        <button>Custom Action</button>
      </PageHeader>
    );
    
    expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUsePageSettings.mockReturnValue({
      data: null,
      isLoading: false
    });

    const { container } = renderWithClient(
      <PageHeader pageId="acervo" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});