// ABOUTME: Simple test to verify ScrollArea components don't cause infinite loops
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea } from '@/components/ui/scroll-area';

describe('ScrollArea Infinite Loop Prevention', () => {
  let consoleErrorSpy: any;
  let renderingErrors: string[] = [];

  beforeEach(() => {
    renderingErrors = [];
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(message => {
      const messageStr = typeof message === 'string' ? message : String(message);
      if (
        messageStr.includes('Maximum update depth exceeded') ||
        messageStr.includes('Warning: Maximum update depth exceeded')
      ) {
        renderingErrors.push(messageStr);
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render ScrollArea without infinite update loops', async () => {
    const { unmount } = render(
      <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Test Content</h4>
          <div className="space-y-2">
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </div>
        </div>
      </ScrollArea>
    );

    // Wait a moment for any potential infinite loops to manifest
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check for infinite loop errors
    expect(renderingErrors).toHaveLength(0);

    unmount();
  });

  it('should handle nested ScrollArea without infinite loops', async () => {
    const { unmount } = render(
      <ScrollArea className="h-[400px] w-[400px]">
        <div className="p-4">
          <ScrollArea className="h-[200px] w-[300px]">
            <div className="p-2">
              <div>Nested content</div>
            </div>
          </ScrollArea>
        </div>
      </ScrollArea>
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(renderingErrors).toHaveLength(0);

    unmount();
  });

  it('should detect infinite loops if they occur', () => {
    // Create a component that would cause infinite loops
    const InfiniteLoopComponent = () => {
      const [count, setCount] = React.useState(0);

      // This effect would cause infinite re-renders
      React.useEffect(() => {
        setCount(prev => prev + 1);
      }, [count]);

      return <div>Count: {count}</div>;
    };

    let errorThrown = false;
    try {
      render(<InfiniteLoopComponent />);
    } catch (error) {
      errorThrown = true;
      expect(error.toString()).toMatch(/Maximum update depth exceeded|Too many re-renders/);
    }

    // Either an error is thrown or we detect console errors
    expect(errorThrown || renderingErrors.length > 0).toBe(true);
  });
});
