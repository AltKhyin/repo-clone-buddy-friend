// ABOUTME: Tests for sidebar UI cleanup - removing redundant text sections and quick actions

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
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

describe('Sidebar UI Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Blocks Tab', () => {
    it('should NOT render redundant "Block Palette" header text', () => {
      render(<EditorSidebar />);

      // These redundant text elements should be removed
      expect(screen.queryByText('Block Palette')).not.toBeInTheDocument();
      expect(screen.queryByText('Drag blocks to the canvas')).not.toBeInTheDocument();
    });

    it('should still render the Blocks tab trigger with clear labeling', () => {
      render(<EditorSidebar />);

      // Tab trigger should remain for navigation
      expect(screen.getByRole('tab', { name: /blocks/i })).toBeInTheDocument();
    });

    it('should render block content without redundant headers', () => {
      render(<EditorSidebar />);

      // Content should be present but without the redundant descriptive headers
      const blocksTab = screen.getByRole('tab', { name: /blocks/i });
      expect(blocksTab).toBeInTheDocument();
    });
  });

  describe('Properties Tab', () => {
    it('should NOT render redundant "Block Properties" header text when block selected', () => {
      const mockStoreWithSelection = {
        ...mockUseEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };
      vi.mocked(mockUseEditorStore).selectedNodeId = 'test-block-id';
      vi.mocked(mockUseEditorStore).nodes = mockStoreWithSelection.nodes;

      render(<EditorSidebar />);

      // These redundant text elements should be removed
      expect(screen.queryByText('Block Properties')).not.toBeInTheDocument();
      expect(screen.queryByText('Text Block')).not.toBeInTheDocument();
    });

    it('should render properties content without redundant headers', () => {
      const mockStoreWithSelection = {
        ...mockUseEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };
      vi.mocked(mockUseEditorStore).selectedNodeId = 'test-block-id';
      vi.mocked(mockUseEditorStore).nodes = mockStoreWithSelection.nodes;

      render(<EditorSidebar />);

      // Properties tab should exist but without redundant headers
      expect(screen.getByRole('tab', { name: /properties/i })).toBeInTheDocument();
    });
  });

  describe('Quick Actions Removal', () => {
    it('should NOT render Quick Actions section', () => {
      const mockStoreWithSelection = {
        ...mockUseEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };
      vi.mocked(mockUseEditorStore).selectedNodeId = 'test-block-id';
      vi.mocked(mockUseEditorStore).nodes = mockStoreWithSelection.nodes;

      render(<EditorSidebar />);

      // Quick Actions section should be completely removed
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
      expect(screen.queryByText('Reset to Defaults')).not.toBeInTheDocument();
      expect(screen.queryByText('Copy Style')).not.toBeInTheDocument();
      expect(screen.queryByText('Paste Style')).not.toBeInTheDocument();
    });
  });

  describe('Visual Hierarchy Preservation', () => {
    it('should maintain proper spacing and visual hierarchy without redundant text', () => {
      const { container } = render(<EditorSidebar />);

      // Should still have proper container structure (width and border moved to parent)
      expect(container.querySelector('.h-full')).toBeInTheDocument();
      expect(container.querySelector('.bg-muted\\/30')).toBeInTheDocument();
    });

    it('should preserve tab functionality', () => {
      render(<EditorSidebar />);

      // Both tabs should be functional
      expect(screen.getByRole('tab', { name: /blocks/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /properties/i })).toBeInTheDocument();
    });
  });
});
