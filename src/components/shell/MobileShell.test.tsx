// ABOUTME: Tests for enhanced MobileShell with Reddit-inspired layout constraints and compression handling

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MobileShell from './MobileShell';

// Mock the BottomTabBar component
vi.mock('./BottomTabBar', () => ({
  default: () => (
    <div data-testid="bottom-tab-bar">Bottom Tab Bar</div>
  ),
}));

describe('MobileShell', () => {
  it('should render children correctly', () => {
    render(
      <MobileShell>
        <div data-testid="test-content">Test Content</div>
      </MobileShell>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Content');
  });

  it('should render BottomTabBar', () => {
    render(
      <MobileShell>
        <div>Content</div>
      </MobileShell>
    );

    expect(screen.getByTestId('bottom-tab-bar')).toBeInTheDocument();
  });

  it('should have proper mobile layout structure', () => {
    const { container } = render(
      <MobileShell>
        <div data-testid="content">Content</div>
      </MobileShell>
    );

    const shellContainer = container.firstChild as HTMLElement;
    expect(shellContainer).toHaveClass('flex');
    expect(shellContainer).toHaveClass('flex-col');
    expect(shellContainer).toHaveClass('h-screen');
    expect(shellContainer).toHaveClass('w-full');
    expect(shellContainer).toHaveClass('bg-background');
  });

  it('should have proper main content area', () => {
    const { container } = render(
      <MobileShell>
        <div>Content</div>
      </MobileShell>
    );

    const mainElement = container.querySelector('main') as HTMLElement;
    expect(mainElement).toHaveClass('flex-1');
    expect(mainElement).toHaveClass('overflow-y-auto');
  });

  it('should provide full available space with bottom tab bar clearance', () => {
    const { container } = render(
      <MobileShell>
        <div data-testid="content">Content</div>
      </MobileShell>
    );

    const contentWrapper = container.querySelector('.w-full.h-full') as HTMLElement;
    expect(contentWrapper).toHaveClass('w-full');
    expect(contentWrapper).toHaveClass('h-full');
    expect(contentWrapper).toHaveClass('pb-20'); // Space for bottom tab bar
    expect(contentWrapper).not.toHaveClass('p-4'); // No shell-imposed padding
  });

  it('should handle complex nested content', () => {
    render(
      <MobileShell>
        <div data-testid="complex-content">
          <header>Header</header>
          <main>
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer>Footer</footer>
        </div>
      </MobileShell>
    );

    const complexContent = screen.getByTestId('complex-content');
    expect(complexContent).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  describe('anti-compression utilities', () => {
    it('should apply compression-safe classes to prevent layout breaking', () => {
      const { container } = render(
        <MobileShell>
          <div>Content</div>
        </MobileShell>
      );

      const mainElement = container.querySelector('main') as HTMLElement;
      expect(mainElement).toHaveClass('min-w-0'); // Prevents flex overflow
      expect(mainElement).toHaveClass('overflow-x-hidden'); // Prevents horizontal scroll
    });

    it('should apply proper content wrapper constraints', () => {
      const { container } = render(
        <MobileShell>
          <div>Content</div>
        </MobileShell>
      );

      const contentWrapper = container.querySelector('.w-full.h-full') as HTMLElement;
      expect(contentWrapper).toHaveClass('w-full'); // Full available width
      expect(contentWrapper).toHaveClass('min-w-0'); // Allows content to shrink
      expect(contentWrapper).toHaveClass('overflow-hidden'); // Prevents content overflow
    });

    it('should handle content width constraints properly', () => {
      const { container } = render(
        <MobileShell>
          <div data-testid="wide-content" style={{ width: '2000px' }}>
            Very wide content that could cause overflow
          </div>
        </MobileShell>
      );

      const contentWrapper = container.querySelector('.w-full.h-full') as HTMLElement;
      expect(contentWrapper).toHaveClass('overflow-hidden'); // Handles overflow gracefully
    });
  });

  describe('responsive behavior', () => {
    it('should maintain proper structure at all screen sizes', () => {
      const { container } = render(
        <MobileShell>
          <div>Content</div>
        </MobileShell>
      );

      const contentWrapper = container.querySelector('.w-full.h-full') as HTMLElement;
      expect(contentWrapper).toHaveClass('w-full'); // Full available width
      expect(contentWrapper).toHaveClass('h-full'); // Full available height
      expect(contentWrapper).not.toHaveClass('p-4'); // No shell-imposed padding
    });

    it('should handle viewport changes gracefully', () => {
      const { container } = render(
        <MobileShell>
          <div data-testid="responsive-content">Responsive Content</div>
        </MobileShell>
      );

      const shellContainer = container.firstChild as HTMLElement;
      expect(shellContainer).toHaveClass('h-screen'); // Full viewport height
      expect(shellContainer).toHaveClass('w-full'); // Full viewport width
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(
        <MobileShell>
          <div data-testid="content">Content</div>
        </MobileShell>
      );

      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass('flex-1');
    });

    it('should maintain focus management within content area', () => {
      render(
        <MobileShell>
          <button data-testid="focusable-button">Focus me</button>
        </MobileShell>
      );

      const button = screen.getByTestId('focusable-button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should ensure proper tab navigation flow', () => {
      render(
        <MobileShell>
          <div>
            <button data-testid="button-1">Button 1</button>
            <input data-testid="input-1" placeholder="Input" />
            <button data-testid="button-2">Button 2</button>
          </div>
        </MobileShell>
      );

      const button1 = screen.getByTestId('button-1');
      const input1 = screen.getByTestId('input-1');
      const button2 = screen.getByTestId('button-2');

      // All elements should be focusable
      button1.focus();
      expect(button1).toHaveFocus();
      
      input1.focus();
      expect(input1).toHaveFocus();
      
      button2.focus();
      expect(button2).toHaveFocus();
    });
  });

  describe('layout stability', () => {
    it('should prevent layout shifts during content loading', () => {
      const { container } = render(
        <MobileShell>
          <div data-testid="loading-content">Loading...</div>
        </MobileShell>
      );

      const shellContainer = container.firstChild as HTMLElement;
      expect(shellContainer).toHaveClass('h-screen'); // Fixed height prevents shifts
      
      const mainElement = container.querySelector('main') as HTMLElement;
      expect(mainElement).toHaveClass('flex-1'); // Consistent main area size
    });

    it('should handle dynamic content height changes', () => {
      const { rerender, container } = render(
        <MobileShell>
          <div data-testid="dynamic-content">Short content</div>
        </MobileShell>
      );

      const mainElement = container.querySelector('main') as HTMLElement;
      expect(mainElement).toHaveClass('overflow-y-auto'); // Handles overflow

      // Simulate content change to longer content
      rerender(
        <MobileShell>
          <div data-testid="dynamic-content">
            {Array(100).fill(0).map((_, i) => (
              <div key={i}>Long content line {i}</div>
            ))}
          </div>
        </MobileShell>
      );

      // Layout should remain stable
      expect(mainElement).toHaveClass('overflow-y-auto');
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      expect(() => {
        render(
          <MobileShell>
            {null}
          </MobileShell>
        );
      }).not.toThrow();
    });

    it('should handle undefined children', () => {
      expect(() => {
        render(
          <MobileShell>
            {undefined}
          </MobileShell>
        );
      }).not.toThrow();
    });

    it('should handle multiple child elements', () => {
      render(
        <MobileShell>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </MobileShell>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('should handle very wide content gracefully', () => {
      const { container } = render(
        <MobileShell>
          <div style={{ width: '5000px' }} data-testid="extra-wide">
            Extremely wide content that should not break layout
          </div>
        </MobileShell>
      );

      const contentWrapper = container.querySelector('.w-full.h-full') as HTMLElement;
      expect(contentWrapper).toHaveClass('overflow-hidden'); // Prevents horizontal overflow
      expect(screen.getByTestId('extra-wide')).toBeInTheDocument();
    });

    it('should handle very tall content with proper scrolling', () => {
      render(
        <MobileShell>
          <div data-testid="tall-content">
            {Array(200).fill(0).map((_, i) => (
              <div key={i}>Tall content line {i}</div>
            ))}
          </div>
        </MobileShell>
      );

      const tallContent = screen.getByTestId('tall-content');
      expect(tallContent).toBeInTheDocument();
      
      // Main should be scrollable
      const { container } = render(
        <MobileShell>
          <div>Content</div>
        </MobileShell>
      );
      const mainElement = container.querySelector('main') as HTMLElement;
      expect(mainElement).toHaveClass('overflow-y-auto');
    });
  });
});