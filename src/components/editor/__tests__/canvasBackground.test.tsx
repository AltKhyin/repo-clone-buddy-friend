// ABOUTME: Tests for canvas background color functionality

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useEditorStore } from '@/store/editorStore';
import { WYSIWYGCanvas } from '../WYSIWYGCanvas';

// Mock the editor theme hook
vi.mock('@/hooks/useEditorTheme', () => ({
  useEditorTheme: () => ({
    colors: {
      grid: 'hsl(var(--border))',
    },
  }),
}));

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    isOver: false,
    setNodeRef: vi.fn(),
  }),
}));

describe('Canvas Background Color', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorStore.getState().reset();
  });

  it('should use default background color when none is set', () => {
    render(<WYSIWYGCanvas />);
    
    const canvas = document.querySelector('.wysiwyg-canvas');
    expect(canvas).toHaveStyle('background-color: hsl(var(--background))');
  });

  it('should apply custom background color when set', () => {
    act(() => {
      // Set custom background color
      const customColor = 'hsl(200, 50%, 95%)';
      useEditorStore.getState().setCanvasBackgroundColor(customColor);
    });
    
    render(<WYSIWYGCanvas />);
    
    const canvas = document.querySelector('.wysiwyg-canvas');
    expect(canvas).toHaveStyle(`background-color: hsl(200, 50%, 95%)`);
  });

  it('should show grid overlay when showGrid is true', () => {
    act(() => {
      // Ensure grid is enabled (default is true, but let's be explicit)
      const store = useEditorStore.getState();
      if (!store.showGrid) {
        store.toggleGrid();
      }
    });
    
    const { container } = render(<WYSIWYGCanvas />);
    
    // Look for the grid overlay element using a more specific selector
    const gridOverlay = container.querySelector('.wysiwyg-canvas > div.absolute.inset-0.pointer-events-none.opacity-20');
    expect(gridOverlay).toBeTruthy();
  });

  it('should hide grid overlay when showGrid is false', () => {
    act(() => {
      // Disable grid
      const store = useEditorStore.getState();
      if (store.showGrid) {
        store.toggleGrid();
      }
    });
    
    const { container } = render(<WYSIWYGCanvas />);
    
    // Grid overlay should not exist when showGrid is false
    const gridOverlay = container.querySelector('.wysiwyg-canvas > div.absolute.inset-0.pointer-events-none.opacity-20');
    expect(gridOverlay).toBeFalsy();
  });

  it('should update canvas background color through store action', () => {
    const { container, rerender } = render(<WYSIWYGCanvas />);
    
    const customColor = 'hsl(var(--muted))';
    
    act(() => {
      // Update background color via store action
      useEditorStore.getState().setCanvasBackgroundColor(customColor);
    });
    
    // Re-render to get updated state
    rerender(<WYSIWYGCanvas />);
    
    const canvas = container.querySelector('.wysiwyg-canvas');
    expect(canvas).toHaveStyle(`background-color: ${customColor}`);
  });
});