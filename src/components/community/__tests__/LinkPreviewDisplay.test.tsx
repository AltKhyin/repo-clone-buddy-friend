// ABOUTME: Tests for LinkPreviewDisplay component ensuring consistent link preview rendering across all community views.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkPreviewDisplay } from '../LinkPreviewDisplay';

describe('LinkPreviewDisplay', () => {
  const mockPreviewData = {
    url: 'https://example.com',
    title: 'Example Title',
    description: 'Example description',
    domain: 'example.com',
    image: 'https://example.com/image.jpg',
  };

  it('should render link preview with all data', () => {
    render(<LinkPreviewDisplay previewData={mockPreviewData} url="https://example.com" />);

    expect(screen.getByText('Example Title')).toBeInTheDocument();
    expect(screen.getByText('Example description')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
  });

  it('should render without preview data using URL fallback', () => {
    render(<LinkPreviewDisplay url="https://example.com" />);

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('should render image when preview data includes image', () => {
    render(<LinkPreviewDisplay previewData={mockPreviewData} url="https://example.com" />);

    const image = screen.getByAltText('Link preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should not render image section when no image in preview data', () => {
    const previewWithoutImage = {
      ...mockPreviewData,
      image: undefined,
    };

    render(<LinkPreviewDisplay previewData={previewWithoutImage} url="https://example.com" />);

    expect(screen.queryByAltText('Link preview')).not.toBeInTheDocument();
  });

  it('should hide domain when showDomain is false', () => {
    render(
      <LinkPreviewDisplay
        previewData={mockPreviewData}
        url="https://example.com"
        showDomain={false}
      />
    );

    expect(screen.queryByText('example.com')).not.toBeInTheDocument();
    expect(screen.getByText('Example Title')).toBeInTheDocument();
  });

  it('should handle invalid URLs gracefully', () => {
    render(<LinkPreviewDisplay url="not-a-valid-url" />);

    expect(screen.getAllByText('not-a-valid-url')).toHaveLength(2); // Domain badge and fallback URL
    expect(screen.getByRole('link')).toHaveAttribute('href', 'not-a-valid-url');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LinkPreviewDisplay url="https://example.com" className="custom-class" />
    );

    // Check the Card component has the custom class
    const cardElement = container.querySelector('.custom-class');
    expect(cardElement).toBeInTheDocument();
  });

  it('should open link in new tab with security attributes', () => {
    render(<LinkPreviewDisplay url="https://example.com" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should handle image loading errors gracefully', () => {
    render(<LinkPreviewDisplay previewData={mockPreviewData} url="https://example.com" />);

    const image = screen.getByAltText('Link preview');

    // Simulate image error
    const errorEvent = new Event('error');
    image.dispatchEvent(errorEvent);

    // Image should be hidden on error
    expect(image).toHaveStyle({ display: 'none' });
  });
});
