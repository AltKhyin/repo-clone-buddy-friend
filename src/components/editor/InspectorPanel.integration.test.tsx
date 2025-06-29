// ABOUTME: Integration test for InspectorPanel to prevent infinite loop regressions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectorPanel } from './InspectorPanel';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}));

const mockUseEditorStore = useEditorStore as any;

const createMockStore = (overrides = {}) => ({
  selectedNodeId: null,
  nodes: [],
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
  currentViewport: 'desktop',
  switchViewport: vi.fn(),
  canvasTheme: 'light',
  setCanvasTheme: vi.fn(),
  showGrid: true,
  toggleGrid: vi.fn(),
  showRulers: false,
  toggleRulers: vi.fn(),
  showGuidelines: false,
  toggleGuidelines: vi.fn(),
  toggleFullscreen: vi.fn(),
  isFullscreen: false,
  guidelines: {
    horizontal: [],
    vertical: []
  },
  clearGuidelines: vi.fn(),
  ...overrides
});

describe('InspectorPanel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Switch Component Safety', () => {
    it('should not cause infinite loops when toggle functions are called', async () => {
      const toggleFullscreen = vi.fn();
      const toggleGrid = vi.fn();
      const toggleRulers = vi.fn();
      const toggleGuidelines = vi.fn();

      mockUseEditorStore.mockReturnValue(createMockStore({
        toggleFullscreen,
        toggleGrid,
        toggleRulers,
        toggleGuidelines
      }));

      const user = userEvent.setup();
      render(<InspectorPanel />);

      // Test fullscreen toggle
      const fullscreenSwitch = screen.getByLabelText('Fullscreen');
      await user.click(fullscreenSwitch);
      expect(toggleFullscreen).toHaveBeenCalledTimes(1);

      // Test grid toggle
      const gridSwitch = screen.getByLabelText('Show Grid');
      await user.click(gridSwitch);
      expect(toggleGrid).toHaveBeenCalledTimes(1);

      // Test rulers toggle
      const rulersSwitch = screen.getByLabelText('Show Rulers');
      await user.click(rulersSwitch);
      expect(toggleRulers).toHaveBeenCalledTimes(1);

      // Test guidelines toggle
      const guidelinesSwitch = screen.getByLabelText('Show Guidelines');
      await user.click(guidelinesSwitch);
      expect(toggleGuidelines).toHaveBeenCalledTimes(1);

      // Each function should only be called once, indicating no infinite loops
      expect(toggleFullscreen).toHaveBeenCalledTimes(1);
      expect(toggleGrid).toHaveBeenCalledTimes(1);
      expect(toggleRulers).toHaveBeenCalledTimes(1);
      expect(toggleGuidelines).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid state changes without breaking', async () => {
      const toggleGrid = vi.fn();
      
      // Set initial mock state
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        showGrid: true, 
        toggleGrid 
      }));
      
      const { rerender } = render(<InspectorPanel />);
      
      // Simulate rapid state changes that previously caused infinite loops
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        showGrid: false, 
        toggleGrid 
      }));
      rerender(<InspectorPanel />);
      
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        showGrid: true, 
        toggleGrid 
      }));
      rerender(<InspectorPanel />);
      
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        showGrid: false, 
        toggleGrid 
      }));
      rerender(<InspectorPanel />);

      // Should not cause any errors or infinite loops
      expect(() => screen.getByLabelText('Show Grid')).not.toThrow();
    });

    it('should safely handle store state updates without triggering callbacks', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Set initial mock state
      mockUseEditorStore.mockReturnValue(createMockStore({
        isFullscreen: false,
        showGrid: true,
        showRulers: false,
        showGuidelines: false
      }));
      
      const { rerender } = render(<InspectorPanel />);
      
      // Test multiple re-renders with changing state
      for (let i = 0; i < 10; i++) {
        mockUseEditorStore.mockReturnValue(createMockStore({
          isFullscreen: i % 2 === 0,
          showGrid: i % 3 === 0,
          showRulers: i % 4 === 0,
          showGuidelines: i % 5 === 0
        }));
        rerender(<InspectorPanel />);
      }

      // Should not log any React warnings about maximum update depth
      const reactErrors = consoleSpy.mock.calls.filter(call => 
        call.some(arg => 
          String(arg).includes('Maximum update depth') ||
          String(arg).includes('infinite loop')
        )
      );
      
      expect(reactErrors).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Canvas Controls Rendering', () => {
    it('should render all canvas control switches correctly', () => {
      mockUseEditorStore.mockReturnValue(createMockStore());
      
      render(<InspectorPanel />);

      expect(screen.getByLabelText('Fullscreen')).toBeInTheDocument();
      expect(screen.getByLabelText('Show Grid')).toBeInTheDocument();
      expect(screen.getByLabelText('Show Rulers')).toBeInTheDocument();
      expect(screen.getByLabelText('Show Guidelines')).toBeInTheDocument();
    });

    it('should reflect correct switch states from store', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        isFullscreen: true,
        showGrid: false,
        showRulers: true,
        showGuidelines: false
      }));
      
      render(<InspectorPanel />);

      expect(screen.getByLabelText('Fullscreen')).toBeChecked();
      expect(screen.getByLabelText('Show Grid')).not.toBeChecked();
      expect(screen.getByLabelText('Show Rulers')).toBeChecked();
      expect(screen.getByLabelText('Show Guidelines')).not.toBeChecked();
    });
  });
});