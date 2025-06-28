// ABOUTME: Tests for FeaturedReview component ensuring proper rendering and interaction

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { renderWithProviders } from '../../test-utils';
import { createMockReview } from '../../test-utils/test-data-factories';
import FeaturedReview from './FeaturedReview';

// react-router-dom is mocked globally in test-setup.ts

describe('FeaturedReview Component', () => {
  it('should render featured review with all elements', () => {
    const mockReview = createMockReview({
      title: 'Análise sobre Hipertensão Arterial',
      description: 'Uma análise detalhada sobre as diretrizes mais recentes.',
      cover_image_url: 'https://example.com/cover.jpg',
      view_count: 1250,
    });

    renderWithProviders(<FeaturedReview review={mockReview} />);

    expect(screen.getByText('Análise sobre Hipertensão Arterial')).toBeInTheDocument();
    expect(screen.getByText('Uma análise detalhada sobre as diretrizes mais recentes.')).toBeInTheDocument();
    expect(screen.getByText('Ler agora')).toBeInTheDocument();
    expect(screen.getByText(`Edição #${mockReview.id}`)).toBeInTheDocument();
  });

  it('should render edition number correctly', () => {
    const mockReview = createMockReview({ id: 123 });

    renderWithProviders(<FeaturedReview review={mockReview} />);

    expect(screen.getByText('Edição #123')).toBeInTheDocument();
  });

  it('should render without description when not provided', () => {
    const mockReview = createMockReview({ description: null });

    renderWithProviders(<FeaturedReview review={mockReview} />);

    expect(screen.getByText(mockReview.title)).toBeInTheDocument();
    expect(screen.queryByText('Uma análise detalhada')).not.toBeInTheDocument();
  });

  it('should render with null review gracefully', () => {
    renderWithProviders(<FeaturedReview review={null} />);

    expect(screen.queryByText('Ler agora')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhuma edição em destaque')).toBeInTheDocument();
  });

  it('should have proper click navigation', () => {
    const mockReview = createMockReview();
    // Mock window.location.href since component uses that instead of useNavigate
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });

    renderWithProviders(<FeaturedReview review={mockReview} />);

    const heroDiv = screen.getByText(mockReview.title).closest('div');
    fireEvent.click(heroDiv!);

    expect(window.location.href).toBe(`/reviews/${mockReview.id}`);
    
    // Restore original location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('should be accessible', () => {
    const mockReview = createMockReview();

    renderWithProviders(<FeaturedReview review={mockReview} />);
    
    const readButton = screen.getByRole('button', { name: /ler agora/i });
    expect(readButton).toBeAccessible();
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    const mockReview = createMockReview({
      title: 'Test Review Title',
    });

    renderWithProviders(<FeaturedReview review={mockReview} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Test Review Title');

    const readButton = screen.getByRole('button');
    expect(readButton).toBeInTheDocument();
    expect(readButton).toHaveTextContent('Ler agora');
  });

  it('should apply background image when cover image is provided', () => {
    const mockReview = createMockReview({
      title: 'Test Review',
      cover_image_url: 'https://example.com/cover.jpg',
    });

    const { container } = renderWithProviders(<FeaturedReview review={mockReview} />);

    const heroDiv = container.querySelector('.bg-cover');
    expect(heroDiv).toHaveAttribute('style');
    // Check that the style attribute contains the expected values
    const style = heroDiv?.getAttribute('style') || '';
    expect(style).toContain('background-image: url("https://example.com/cover.jpg")');
    expect(style).toContain('background-color: transparent');
  });

  it('should handle missing cover image gracefully', () => {
    const mockReview = createMockReview({
      cover_image_url: null,
    });

    const { container } = renderWithProviders(<FeaturedReview review={mockReview} />);

    const heroDiv = container.querySelector('.bg-cover');
    expect(heroDiv).toHaveAttribute('style');
    // Check that the style attribute contains the expected values
    const style = heroDiv?.getAttribute('style') || '';
    expect(style).toContain('background-image: none');
    expect(style).toContain('background-color: hsl(var(--surface))');
  });

  it('should be responsive', () => {
    const mockReview = createMockReview();

    const { container } = renderWithProviders(<FeaturedReview review={mockReview} />);

    const heroDiv = container.querySelector('.relative.w-full');
    expect(heroDiv).toBeInTheDocument();
    // Check that the component uses responsive design principles
    expect(heroDiv).toHaveClass('relative', 'w-full');
  });

  it('should handle keyboard navigation', () => {
    const mockReview = createMockReview();

    renderWithProviders(<FeaturedReview review={mockReview} />);

    const readButton = screen.getByRole('button');
    readButton.focus();
    
    expect(document.activeElement).toBe(readButton);
    expect(readButton).toBeInTheDocument();
  });

  it('should render long descriptions properly', () => {
    const longDescription = 'A'.repeat(200);
    const mockReview = createMockReview({
      description: longDescription,
    });

    renderWithProviders(<FeaturedReview review={mockReview} />);

    const descriptionElement = screen.getByText(longDescription);
    expect(descriptionElement).toHaveClass('text-white/90', 'leading-relaxed', 'max-w-xl');
  });

  it('should handle mobile responsiveness', () => {
    // Mock mobile detection
    vi.mocked(useIsMobile).mockReturnValue(true);
    
    const mockReview = createMockReview();
    const { container } = renderWithProviders(<FeaturedReview review={mockReview} />);

    // Should use mobile height class
    const heroDiv = container.querySelector('.h-64');
    expect(heroDiv).toBeInTheDocument();
    
    // Restore mock
    vi.mocked(useIsMobile).mockReturnValue(false);
  });

  it('should handle click on entire card area', () => {
    const mockReview = createMockReview();
    // Mock window.location.href since component uses that instead of useNavigate
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: '' },
    });

    renderWithProviders(<FeaturedReview review={mockReview} />);

    const heroDiv = screen.getByText(mockReview.title).closest('div');
    fireEvent.click(heroDiv!);

    expect(window.location.href).toBe(`/reviews/${mockReview.id}`);
    
    // Restore original location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('should show message when no review is provided', () => {
    renderWithProviders(<FeaturedReview review={null} />);

    expect(screen.getByText('Nenhuma edição em destaque')).toBeInTheDocument();
    expect(screen.queryByText('Ler agora')).not.toBeInTheDocument();
  });
});