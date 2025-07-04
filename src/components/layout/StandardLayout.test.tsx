// ABOUTME: Tests for StandardLayout component ensuring proper Reddit-inspired layout behavior

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StandardLayout } from './StandardLayout';

// Mock the useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false), // Default to desktop
}));

// Mock layout utilities
vi.mock('@/lib/layout-utils', () => ({
  generateLayoutClasses: vi.fn((type, sidebarType, className) => 
    `layout-${type} sidebar-${sidebarType || 'none'} ${className || ''}`.trim()
  ),
  generateContentClasses: vi.fn((type, className) => 
    `content-${type} ${className || ''}`.trim()
  ),
  generateCenteringClasses: vi.fn((maxWidth, className) => {
    const classes = ['centering-wrapper'];
    if (className) classes.push(className);
    return classes.join(' ');
  }),
}));

describe('StandardLayout', () => {
  it('should render children correctly', () => {
    render(
      <StandardLayout type="standard">
        <div data-testid="test-content">Test Content</div>
      </StandardLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Content');
  });

  it('should apply correct layout classes for standard layout with centering wrapper', () => {
    const { container } = render(
      <StandardLayout type="standard" sidebarType="fixed">
        <div>Content</div>
      </StandardLayout>
    );

    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    const layoutContainer = centeringWrapper.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('layout-standard');
    expect(layoutContainer).toHaveClass('sidebar-fixed');
  });

  it('should render sidebar content when provided', () => {
    render(
      <StandardLayout 
        type="standard" 
        sidebarType="fixed"
        sidebarContent={<div data-testid="sidebar-content">Sidebar</div>}
      >
        <div data-testid="main-content">Main Content</div>
      </StandardLayout>
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
  });

  it('should not render sidebar when sidebarType is none', () => {
    render(
      <StandardLayout 
        type="content-only" 
        sidebarType="none"
        sidebarContent={<div data-testid="sidebar-content">Sidebar</div>}
      >
        <div data-testid="main-content">Main Content</div>
      </StandardLayout>
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
  });

  it('should apply custom className to centering wrapper', () => {
    const { container } = render(
      <StandardLayout type="standard" className="custom-layout-class">
        <div>Content</div>
      </StandardLayout>
    );

    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('custom-layout-class');
  });

  it('should apply custom className to main content area', () => {
    render(
      <StandardLayout 
        type="standard"
        contentClassName="custom-content-class"
      >
        <div data-testid="main-content">Content</div>
      </StandardLayout>
    );

    const mainContent = screen.getByTestId('main-content').parentElement;
    expect(mainContent).toHaveClass('custom-content-class');
  });

  it('should apply custom className to sidebar when present', () => {
    render(
      <StandardLayout 
        type="standard"
        sidebarType="fixed"
        sidebarClassName="custom-sidebar-class"
        sidebarContent={<div data-testid="sidebar-content">Sidebar</div>}
      >
        <div>Content</div>
      </StandardLayout>
    );

    const sidebarElement = screen.getByTestId('sidebar-content').parentElement;
    expect(sidebarElement).toHaveClass('custom-sidebar-class');
  });

  it('should handle centered layout type with proper wrapper structure', () => {
    const { container } = render(
      <StandardLayout type="centered">
        <div>Centered Content</div>
      </StandardLayout>
    );

    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    const layoutContainer = centeringWrapper.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('layout-centered');
  });

  it('should handle wide layout type with proper wrapper structure', () => {
    const { container } = render(
      <StandardLayout type="wide">
        <div>Wide Content</div>
      </StandardLayout>
    );

    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    const layoutContainer = centeringWrapper.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('layout-wide');
  });

  it('should handle admin layout type with proper wrapper structure', () => {
    const { container } = render(
      <StandardLayout type="admin">
        <div>Admin Content</div>
      </StandardLayout>
    );

    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    const layoutContainer = centeringWrapper.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('layout-admin');
  });

  it('should handle full-width layout type without centering wrapper', () => {
    const { container } = render(
      <StandardLayout type="full-width">
        <div>Full Width Content</div>
      </StandardLayout>
    );

    // Full-width layout should not have centering wrapper
    const layoutContainer = container.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('layout-full-width');
    expect(layoutContainer).not.toHaveClass('centering-wrapper');
  });

  describe('responsive behavior', () => {
    it('should handle mobile layout differently', async () => {
      // Mock mobile viewport
      const { useIsMobile } = await import('@/hooks/use-mobile');
      vi.mocked(useIsMobile).mockReturnValue(true);

      render(
        <StandardLayout 
          type="standard" 
          sidebarType="fixed"
          sidebarContent={<div data-testid="sidebar-content">Sidebar</div>}
        >
          <div data-testid="main-content">Main Content</div>
        </StandardLayout>
      );

      // On mobile, sidebar should still be rendered but with different classes
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <StandardLayout 
          type="standard"
          sidebarType="fixed"
          sidebarContent={<div>Sidebar</div>}
        >
          <div>Main Content</div>
        </StandardLayout>
      );

      // Check for main and aside elements if they exist
      const mainElement = screen.getByRole('main', { hidden: true });
      expect(mainElement).toBeInTheDocument();
    });

    it('should maintain focus management', () => {
      render(
        <StandardLayout type="standard">
          <button data-testid="focusable-element">Focus me</button>
        </StandardLayout>
      );

      const button = screen.getByTestId('focusable-element');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined children gracefully', () => {
      expect(() => {
        render(
          <StandardLayout type="standard">
            {undefined}
          </StandardLayout>
        );
      }).not.toThrow();
    });

    it('should handle empty children', () => {
      expect(() => {
        render(
          <StandardLayout type="standard">
            {null}
          </StandardLayout>
        );
      }).not.toThrow();
    });

    it('should handle multiple children', () => {
      render(
        <StandardLayout type="standard">
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </StandardLayout>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });
});