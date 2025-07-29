// ABOUTME: Tests for inspector integration with unified selection system

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useEditorStore } from '@/store/editorStore';
import { InspectorPanel } from '@/components/editor/Inspector/InspectorPanel';

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

// Mock child components
vi.mock('@/components/editor/Inspector/RichBlockInspector', () => ({
  RichBlockInspector: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="rich-block-inspector">RichBlockInspector for {nodeId}</div>
  ),
}));

vi.mock('@/components/editor/Inspector/shared/ContextAwareInspector', () => ({
  ContextAwareInspector: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="context-aware-inspector">ContextAwareInspector for {nodeId}</div>
  ),
}));

describe('🔍 Inspector Integration with Unified Selection', () => {
  const mockEditorStore = {
    selectedNodeId: null,
    nodes: [
      {
        id: 'rich-block-1',
        type: 'richBlock',
        data: {
          content: { htmlContent: '<p>Test content</p>' },
          backgroundColor: 'transparent',
          borderColor: '#e5e7eb',
        },
      },
      {
        id: 'legacy-block-1',
        type: 'textBlock',
        data: { text: 'Legacy text block' },
      },
    ],
    isInspectorVisible: true,
    toggleInspector: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as any).mockReturnValue(mockEditorStore);
  });

  describe('✅ Inspector Display Logic', () => {
    it('should show "No Block Selected" when selectedNodeId is null', () => {
      mockEditorStore.selectedNodeId = null;

      render(<InspectorPanel />);

      expect(screen.getByText('No Block Selected')).toBeInTheDocument();
      expect(
        screen.getByText('Select a block on the canvas to see its customization options.')
      ).toBeInTheDocument();
    });

    it('should show RichBlockInspector when rich block is selected', () => {
      mockEditorStore.selectedNodeId = 'rich-block-1';

      render(<InspectorPanel />);

      expect(screen.getByTestId('rich-block-inspector')).toBeInTheDocument();
      expect(screen.getByText('RichBlockInspector for rich-block-1')).toBeInTheDocument();
    });

    it('should show ContextAwareInspector for legacy block types', () => {
      mockEditorStore.selectedNodeId = 'legacy-block-1';

      render(<InspectorPanel />);

      expect(screen.getByTestId('context-aware-inspector')).toBeInTheDocument();
      expect(screen.getByText('ContextAwareInspector for legacy-block-1')).toBeInTheDocument();
    });

    it('should display block info footer when block is selected', () => {
      mockEditorStore.selectedNodeId = 'rich-block-1';

      render(<InspectorPanel />);

      expect(screen.getByText('Block Info')).toBeInTheDocument();
      expect(screen.getByText('Type: richBlock')).toBeInTheDocument();
      expect(screen.getByText('ID: rich-block-1')).toBeInTheDocument();
    });
  });

  describe('🎯 Selection System Integration', () => {
    it('should show inspector when selectedNodeId is set (simulating activateBlock)', () => {
      // Simulate what happens when activateBlock is called (sets selectedNodeId)
      const storeWithSelection = { ...mockEditorStore, selectedNodeId: 'rich-block-1' };
      (useEditorStore as any).mockReturnValue(storeWithSelection);

      render(<InspectorPanel />);

      // Inspector should be visible with the selected block
      expect(screen.getByTestId('rich-block-inspector')).toBeInTheDocument();
      expect(screen.getByText('RichBlockInspector for rich-block-1')).toBeInTheDocument();
      expect(screen.getByText('Block Info')).toBeInTheDocument();
      expect(screen.getByText('Type: richBlock')).toBeInTheDocument();
    });

    it('should show no selection state when selectedNodeId is null (simulating clearAllSelection)', () => {
      // Simulate what happens when clearAllSelection is called (clears selectedNodeId)
      const storeWithoutSelection = { ...mockEditorStore, selectedNodeId: null };
      (useEditorStore as any).mockReturnValue(storeWithoutSelection);

      render(<InspectorPanel />);

      // Inspector should show "no selection" state
      expect(screen.getByText('No Block Selected')).toBeInTheDocument();
      expect(
        screen.getByText('Select a block on the canvas to see its customization options.')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('rich-block-inspector')).not.toBeInTheDocument();
    });
  });

  describe('🔧 Inspector Visibility Toggle', () => {
    it('should hide inspector and show toggle button when isInspectorVisible is false', () => {
      const hiddenStore = { ...mockEditorStore, isInspectorVisible: false };
      (useEditorStore as any).mockReturnValue(hiddenStore);

      render(<InspectorPanel />);

      expect(screen.getByTitle('Show Inspector')).toBeInTheDocument();
      expect(screen.queryByText('Inspector')).not.toBeInTheDocument();
    });

    it('should call toggleInspector when hide button is clicked', () => {
      const storeWithSelection = { ...mockEditorStore, selectedNodeId: 'rich-block-1' };
      (useEditorStore as any).mockReturnValue(storeWithSelection);

      render(<InspectorPanel />);

      const hideButton = screen.getByTitle('Hide Inspector');
      fireEvent.click(hideButton);

      expect(mockEditorStore.toggleInspector).toHaveBeenCalled();
    });

    it('should call toggleInspector when show button is clicked', () => {
      const hiddenStore = { ...mockEditorStore, isInspectorVisible: false };
      (useEditorStore as any).mockReturnValue(hiddenStore);

      render(<InspectorPanel />);

      const showButton = screen.getByTitle('Show Inspector');
      fireEvent.click(showButton);

      expect(mockEditorStore.toggleInspector).toHaveBeenCalled();
    });
  });

  describe('📊 Content-Aware Integration', () => {
    it('should pass correct nodeId to RichBlockInspector', () => {
      const storeWithSelection = { ...mockEditorStore, selectedNodeId: 'rich-block-1' };
      (useEditorStore as any).mockReturnValue(storeWithSelection);

      render(<InspectorPanel />);

      const inspector = screen.getByTestId('rich-block-inspector');
      expect(inspector).toHaveTextContent('RichBlockInspector for rich-block-1');
    });

    it('should handle non-existent node gracefully', () => {
      const storeWithInvalidSelection = {
        ...mockEditorStore,
        selectedNodeId: 'non-existent-block',
      };
      (useEditorStore as any).mockReturnValue(storeWithInvalidSelection);

      render(<InspectorPanel />);

      // Should fall back to "No Block Selected" when node doesn't exist
      expect(screen.getByText('No Block Selected')).toBeInTheDocument();
    });
  });
});
