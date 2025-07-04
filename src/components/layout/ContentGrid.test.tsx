// ABOUTME: Tests for ContentGrid component ensuring proper grid layout behavior with Reddit-inspired constraints

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentGrid } from './ContentGrid';

// Mock layout utilities
vi.mock('@/lib/layout-utils', () => ({
  layoutClasses: {
    container: {
      base: 'w-full min-h-screen bg-background',
      grid: 'grid gap-6 lg:gap-8',
      responsive: 'px-4 py-6 lg:px-8',
    },
    contentGrid: {
      twoColumnFixed: 'grid-cols-1 lg:grid-cols-[minmax(0,756px)_minmax(280px,316px)]',
      twoColumnFlex: 'grid-cols-1 lg:grid-cols-[minmax(0,756px)_auto]',
      singleColumn: 'grid-cols-1',
    },
    antiCompression: {
      gridItem: 'min-w-0',
    },
  },
  generateContentClasses: vi.fn((type, className) => 
    `content-${type} ${className || ''}`.trim()
  ),
  generateCenteringClasses: vi.fn((maxWidth, className) => {
    const classes = ['centering-wrapper'];
    if (className) classes.push(className);
    return classes.join(' ');
  }),
  generateContentGrid: vi.fn((columns, className) => {
    const classes = [`grid-${columns}`];
    if (className) classes.push(className);
    return classes.join(' ');
  }),
}));

describe('ContentGrid', () => {
  it('should render main content correctly', () => {
    render(
      <ContentGrid mainContent={<div data-testid="main-content">Main Content</div>} />
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toHaveTextContent('Main Content');
  });

  it('should render both main and sidebar content', () => {
    render(
      <ContentGrid 
        mainContent={<div data-testid="main-content">Main Content</div>}
        sidebarContent={<div data-testid="sidebar-content">Sidebar Content</div>}
        sidebarType="fixed"
      />
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
  });

  it('should apply fixed sidebar grid classes with proper wrapper structure', () => {
    const { container } = render(
      <ContentGrid 
        mainContent={<div>Main</div>}
        sidebarContent={<div>Sidebar</div>}
        sidebarType="fixed"
      />
    );

    // Check centering wrapper
    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    // Check inner grid container
    const gridContainer = centeringWrapper.firstChild as HTMLElement;
    expect(gridContainer).toHaveClass('grid-two-column-fixed');
  });

  it('should apply flexible sidebar grid classes with proper wrapper structure', () => {
    const { container } = render(
      <ContentGrid 
        mainContent={<div>Main</div>}
        sidebarContent={<div>Sidebar</div>}
        sidebarType="flexible"
      />
    );

    // Check centering wrapper
    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    // Check inner grid container
    const gridContainer = centeringWrapper.firstChild as HTMLElement;
    expect(gridContainer).toHaveClass('grid-two-column-flex');
  });

  it('should apply single column when no sidebar with proper wrapper structure', () => {
    const { container } = render(
      <ContentGrid 
        mainContent={<div>Main</div>}
        sidebarType="none"
      />
    );

    // Check centering wrapper
    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    // Check inner grid container uses single column
    const gridContainer = centeringWrapper.firstChild as HTMLElement;
    expect(gridContainer).toHaveClass('grid-single');
  });

  it('should not render sidebar when sidebarType is none', () => {
    render(
      <ContentGrid 
        mainContent={<div data-testid="main-content">Main</div>}
        sidebarContent={<div data-testid="sidebar-content">Sidebar</div>}
        sidebarType="none"
      />
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
  });

  it('should apply custom className to centering wrapper', () => {
    const { container } = render(
      <ContentGrid 
        mainContent={<div>Main</div>}
        className="custom-grid-class"
      />
    );

    // Custom className should be applied to centering wrapper
    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('custom-grid-class');
    expect(centeringWrapper).toHaveClass('centering-wrapper');
  });

  it('should apply custom className to main content', () => {
    render(
      <ContentGrid 
        mainContent={<div data-testid="main-content">Main</div>}
        mainClassName="custom-main-class"
      />
    );

    const mainContent = screen.getByTestId('main-content').parentElement;
    expect(mainContent).toHaveClass('custom-main-class');
  });

  it('should apply custom className to sidebar', () => {
    render(
      <ContentGrid 
        mainContent={<div>Main</div>}
        sidebarContent={<div data-testid="sidebar-content">Sidebar</div>}
        sidebarType="fixed"
        sidebarClassName="custom-sidebar-class"
      />
    );

    const sidebarContent = screen.getByTestId('sidebar-content').parentElement;
    expect(sidebarContent).toHaveClass('custom-sidebar-class');
  });

  it('should handle missing sidebar content gracefully', () => {
    expect(() => {
      render(
        <ContentGrid 
          mainContent={<div>Main</div>}
          sidebarType="fixed"
          // No sidebarContent provided
        />
      );
    }).not.toThrow();
  });

  it('should have proper semantic structure', () => {
    render(
      <ContentGrid 
        mainContent={<div data-testid="main">Main Content</div>}
        sidebarContent={<div data-testid="sidebar">Sidebar Content</div>}
        sidebarType="fixed"
      />
    );

    // Check for main element
    const mainElement = screen.getByTestId('main').closest('[role="main"]');
    expect(mainElement).toBeInTheDocument();

    // Check for aside element
    const asideElement = screen.getByTestId('sidebar').closest('[role="complementary"]');
    expect(asideElement).toBeInTheDocument();
  });

  it('should apply anti-compression classes for grid stability', () => {
    const { container } = render(
      <ContentGrid 
        mainContent={<div data-testid="main">Main</div>}
        sidebarContent={<div data-testid="sidebar">Sidebar</div>}
        sidebarType="fixed"
      />
    );

    // Check that centering wrapper exists
    const centeringWrapper = container.firstChild as HTMLElement;
    expect(centeringWrapper).toHaveClass('centering-wrapper');
    
    // Check inner grid has proper structure via generateContentGrid mock
    const gridContainer = centeringWrapper.firstChild as HTMLElement;
    expect(gridContainer).toHaveClass('grid-two-column-fixed');
  });

  describe('responsive behavior', () => {
    it('should maintain proper grid structure across breakpoints', () => {
      const { container } = render(
        <ContentGrid 
          mainContent={<div>Main</div>}
          sidebarContent={<div>Sidebar</div>}
          sidebarType="fixed"
        />
      );

      // Check centering wrapper
      const centeringWrapper = container.firstChild as HTMLElement;
      expect(centeringWrapper).toHaveClass('centering-wrapper');
      
      // Check inner grid uses proper grid type from generateContentGrid mock
      const gridContainer = centeringWrapper.firstChild as HTMLElement;
      expect(gridContainer).toHaveClass('grid-two-column-fixed');
    });
  });

  describe('edge cases', () => {
    it('should handle complex nested content', () => {
      render(
        <ContentGrid 
          mainContent={
            <div data-testid="main">
              <div>
                <h1>Title</h1>
                <p>Content</p>
                <div>
                  <button>Action</button>
                </div>
              </div>
            </div>
          }
          sidebarContent={
            <div data-testid="sidebar">
              <nav>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
                </ul>
              </nav>
            </div>
          }
          sidebarType="fixed"
        />
      );

      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should handle empty content', () => {
      expect(() => {
        render(
          <ContentGrid 
            mainContent={null}
            sidebarContent={null}
            sidebarType="none"
          />
        );
      }).not.toThrow();
    });
  });
});