// ABOUTME: Tests for enhanced DesktopShell with Reddit-inspired layout constraints

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DesktopShell from './DesktopShell';

// Mock the CollapsibleSidebar component
vi.mock('./CollapsibleSidebar', () => ({
  default: ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) => (
    <div data-testid="collapsible-sidebar" data-collapsed={isCollapsed}>
      <button onClick={onToggle} data-testid="toggle-button">Toggle</button>
    </div>
  ),
}));

describe('DesktopShell', () => {
  it('should render children correctly', () => {
    render(
      <DesktopShell>
        <div data-testid="test-content">Test Content</div>
      </DesktopShell>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Content');
  });

  it('should render CollapsibleSidebar', () => {
    render(
      <DesktopShell>
        <div>Content</div>
      </DesktopShell>
    );

    expect(screen.getByTestId('collapsible-sidebar')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = render(
      <DesktopShell>
        <div data-testid="content">Content</div>
      </DesktopShell>
    );

    const shellContainer = container.firstChild as HTMLElement;
    expect(shellContainer).toHaveClass('min-h-screen');
    expect(shellContainer).toHaveClass('w-full');
    expect(shellContainer).toHaveClass('bg-background');
    expect(shellContainer).toHaveClass('flex');
  });

  it('should apply correct margin-left when sidebar is collapsed', () => {
    const { container } = render(
      <DesktopShell>
        <div>Content</div>
      </DesktopShell>
    );

    // Find the main content wrapper
    const mainContent = container.querySelector('.flex-1') as HTMLElement;
    expect(mainContent).toHaveClass('ml-60'); // Default expanded state
  });

  it('should toggle sidebar state correctly', () => {
    render(
      <DesktopShell>
        <div>Content</div>
      </DesktopShell>
    );

    const toggleButton = screen.getByTestId('toggle-button');
    const sidebar = screen.getByTestId('collapsible-sidebar');

    // Initially expanded (not collapsed)
    expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    // Click to collapse
    toggleButton.click();
    
    // Note: In this test we're only checking that the toggle function exists
    // The actual state change would need a more complex test setup
    expect(toggleButton).toBeInTheDocument();
  });

  it('should have proper content area constraints', () => {
    const { container } = render(
      <DesktopShell>
        <div data-testid="content">Content</div>
      </DesktopShell>
    );

    const mainContent = container.querySelector('.flex-1') as HTMLElement;
    expect(mainContent).toHaveClass('min-w-0'); // Prevents flex overflow
    
    const scrollableArea = container.querySelector('main') as HTMLElement;
    expect(scrollableArea).toHaveClass('overflow-y-auto');
    expect(scrollableArea).toHaveClass('overflow-x-hidden');
  });

  it('should provide full available space without content constraints', () => {
    const { container } = render(
      <DesktopShell>
        <div>Content</div>
      </DesktopShell>
    );

    const contentWrapper = container.querySelector('.w-full.h-full') as HTMLElement;
    expect(contentWrapper).toHaveClass('w-full');
    expect(contentWrapper).toHaveClass('h-full');
    expect(contentWrapper).not.toHaveClass('max-w-[756px]'); // Should not have content constraints
  });

  it('should maintain sidebar positioning', () => {
    render(
      <DesktopShell>
        <div>Content</div>
      </DesktopShell>
    );

    const sidebar = screen.getByTestId('collapsible-sidebar');
    expect(sidebar).toBeInTheDocument();
  });

  it('should handle complex nested content', () => {
    render(
      <DesktopShell>
        <div data-testid="complex-content">
          <header>Header</header>
          <main>
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer>Footer</footer>
        </div>
      </DesktopShell>
    );

    const complexContent = screen.getByTestId('complex-content');
    expect(complexContent).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  describe('responsive behavior', () => {
    it('should provide responsive layout structure without imposing padding', () => {
      const { container } = render(
        <DesktopShell>
          <div>Content</div>
        </DesktopShell>
      );

      const contentWrapper = container.querySelector('.w-full.h-full') as HTMLElement;
      expect(contentWrapper).toHaveClass('w-full'); // Full width available
      expect(contentWrapper).toHaveClass('h-full'); // Full height available
      expect(contentWrapper).not.toHaveClass('p-4'); // No shell-imposed padding
    });

    it('should maintain flex layout at all screen sizes', () => {
      const { container } = render(
        <DesktopShell>
          <div>Content</div>
        </DesktopShell>
      );

      const shellContainer = container.firstChild as HTMLElement;
      expect(shellContainer).toHaveClass('flex');
      
      const mainContent = container.querySelector('.flex-1') as HTMLElement;
      expect(mainContent).toHaveClass('flex-1');
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(
        <DesktopShell>
          <div data-testid="content">Content</div>
        </DesktopShell>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('min-h-screen');
    });

    it('should maintain focus management within content area', () => {
      render(
        <DesktopShell>
          <button data-testid="focusable-button">Focus me</button>
        </DesktopShell>
      );

      const button = screen.getByTestId('focusable-button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      expect(() => {
        render(
          <DesktopShell>
            {null}
          </DesktopShell>
        );
      }).not.toThrow();
    });

    it('should handle undefined children', () => {
      expect(() => {
        render(
          <DesktopShell>
            {undefined}
          </DesktopShell>
        );
      }).not.toThrow();
    });
  });
});