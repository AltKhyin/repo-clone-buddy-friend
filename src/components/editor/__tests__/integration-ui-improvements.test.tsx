// ABOUTME: Integration tests for UI improvements - verifying all changes work together

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EditorSidebar } from '../EditorSidebar';

// Mock dependencies
const mockUseEditorStore = {
  selectedNodeId: null,
  nodes: [],
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
};

const mockUseEditorTheme = {
  colors: {
    block: { text: '#000000' },
  },
  theme: 'light',
};

const mockUseTiptapEditor = {
  editor: {
    commands: {
      setContent: vi.fn(),
      focus: vi.fn(),
    },
    isEditable: true,
    isEmpty: false,
  },
  focusEditor: vi.fn(),
  isFocused: false,
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
}));

vi.mock('@/hooks/useEditorTheme', () => ({
  useEditorTheme: () => mockUseEditorTheme,
}));

vi.mock('@/hooks/useTiptapEditor', () => ({
  useTiptapEditor: () => mockUseTiptapEditor,
}));

vi.mock('@tiptap/react', () => ({
  EditorContent: ({ className, style }: any) => (
    <div data-testid="editor-content" className={className} style={style}>
      Sample heading content
    </div>
  ),
}));

// Mock child components
vi.mock('../Inspector/shared/BackgroundControls', () => ({
  BackgroundControls: ({ className }: any) => (
    <div data-testid="background-controls" className={className}>
      Background Controls
    </div>
  ),
}));

vi.mock('../Inspector/shared/SpacingControls', () => ({
  SpacingControls: ({ className }: any) => (
    <div data-testid="spacing-controls" className={className}>
      Spacing Controls
    </div>
  ),
}));

vi.mock('../Inspector/shared/BorderControls', () => ({
  BorderControls: ({ className }: any) => (
    <div data-testid="border-controls" className={className}>
      Border Controls
    </div>
  ),
}));

describe('UI Improvements Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUseEditorStore.selectedNodeId = null;
    mockUseEditorStore.nodes = [];
  });

  afterEach(() => {
    cleanup();
  });

  describe('Sidebar UI Cleanup Integration', () => {
    it('should render sidebar without any redundant text sections', () => {
      render(<EditorSidebar />);

      // Verify all redundant elements are removed
      expect(screen.queryByText('Block Palette')).not.toBeInTheDocument();
      expect(screen.queryByText('Drag blocks to the canvas')).not.toBeInTheDocument();
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
      expect(screen.queryByText('Reset to Defaults')).not.toBeInTheDocument();
      expect(screen.queryByText('Copy Style')).not.toBeInTheDocument();
      expect(screen.queryByText('Paste Style')).not.toBeInTheDocument();
    });

    it('should maintain clean tab interface without redundant headers', () => {
      render(<EditorSidebar />);

      // Tabs should be clean and functional
      expect(screen.getByRole('tab', { name: /blocks/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /properties/i })).toBeInTheDocument();
    });

    it('should have streamlined properties tab when block selected', () => {
      // Set up mock state for this test
      mockUseEditorStore.selectedNodeId = 'test-block-id';
      mockUseEditorStore.nodes = [
        {
          id: 'test-block-id',
          type: 'textBlock',
          data: { content: 'Test content' },
        },
      ];

      render(<EditorSidebar />);

      // Should not have redundant headers but should have property controls visible
      expect(screen.queryByText('Block Properties')).not.toBeInTheDocument();
      expect(screen.queryByText('Text Block')).not.toBeInTheDocument();

      // Should have at least one set of property controls
      expect(screen.getAllByTestId('background-controls').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('spacing-controls').length).toBeGreaterThan(0);
    });
  });

  describe('Overall System Integration', () => {
    it('should have reduced visual complexity across all components', () => {
      render(<EditorSidebar />);

      // Overall result: cleaner interface with no redundant elements
      const redundantTexts = [
        'Block Palette',
        'Drag blocks to the canvas',
        'Block Properties',
        'Quick Actions',
        'Reset to Defaults',
        'Copy Style',
        'Paste Style',
      ];

      redundantTexts.forEach(text => {
        expect(screen.queryByText(text)).not.toBeInTheDocument();
      });
    });

    it('should maintain all essential functionality while removing redundancy', () => {
      render(<EditorSidebar />);

      // Essential elements should remain
      expect(screen.getByRole('tab', { name: /blocks/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /properties/i })).toBeInTheDocument();

      // Container structure should be intact
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should provide optimized user experience with consistent spacing', () => {
      const { container } = render(<EditorSidebar />);

      // Should have proper structure without redundant elements
      expect(container.querySelector('.h-full')).toBeInTheDocument();
      expect(container.querySelector('.flex.flex-col')).toBeInTheDocument();
    });
  });

  describe('Performance and Consistency', () => {
    it('should render efficiently without redundant DOM elements', () => {
      const { container } = render(<EditorSidebar />);

      // Should not have unnecessary header divs
      const headerDivs = container.querySelectorAll('.border-b');
      // Only the tab navigation should have border-b, not redundant headers
      expect(headerDivs.length).toBeLessThanOrEqual(1);
    });

    it('should maintain consistent visual hierarchy', () => {
      render(<EditorSidebar />);

      // Tab triggers should be the primary navigation elements
      const tabTriggers = screen.getAllByRole('tab');
      expect(tabTriggers.length).toBe(2); // Blocks and Properties tabs only
    });

    it('should have streamlined component structure', () => {
      const { container } = render(<EditorSidebar />);

      // Should have efficient structure without unnecessary nesting
      const mainContainer = container.querySelector('.h-full');
      expect(mainContainer).toBeInTheDocument();

      // Should use modern layout approaches
      expect(mainContainer).toHaveClass('h-full');
    });
  });
});
