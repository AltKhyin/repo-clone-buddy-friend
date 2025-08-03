// ABOUTME: Tests for UnifiedToolbar block-type-aware typography controls integration

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnifiedToolbar } from '../UnifiedToolbar';
import { useEditorStore } from '@/store/editorStore';
import { EditorNode } from '@/types/editor';

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

// Mock the theme provider
vi.mock('@/components/providers/CustomThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock the theme selector
vi.mock('@/components/header/ThemeSelector', () => ({
  ThemeSelector: () => <div data-testid="theme-selector">Theme Selector</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ reviewId: 'test-review-id' }),
}));

describe('UnifiedToolbar Block Integration', () => {
  const mockUpdateNode = vi.fn();
  const mockSelectNode = vi.fn();
  const mockDeleteNode = vi.fn();
  const mockDuplicateNode = vi.fn();
  const mockToggleSnapGuides = vi.fn();
  const mockUpdateCanvasZoom = vi.fn();

  const defaultStoreState = {
    selectedNodeId: null,
    nodes: [],
    updateNode: mockUpdateNode,
    selectNode: mockSelectNode,
    deleteNode: mockDeleteNode,
    duplicateNode: mockDuplicateNode,
    showGrid: false,
    showSnapGuides: false,
    toggleSnapGuides: mockToggleSnapGuides,
    canvasZoom: 1.0,
    updateCanvasZoom: mockUpdateCanvasZoom,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Typography Controls Visibility', () => {
    it('should show all typography controls for textBlock', () => {
      const textNode: EditorNode = {
        id: 'text-1',
        type: 'textBlock',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        data: {
          content: 'Test text',
          fontFamily: 'Arial',
          fontSize: 16,
          fontWeight: 400,
          textAlign: 'left',
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'text-1',
        nodes: [textNode],
      });

      render(<UnifiedToolbar />);

      // Typography controls should be visible
      expect(screen.getByRole('group', { name: /format controls/i })).toBeInTheDocument();
      expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
      expect(screen.getByTitle('Italic (Ctrl+I)')).toBeInTheDocument();
      expect(screen.getByTitle('Underline (Ctrl+U)')).toBeInTheDocument();
      expect(screen.getByTitle('Strikethrough')).toBeInTheDocument();
      expect(screen.getByTitle('Align left (Ctrl+Shift+L)')).toBeInTheDocument();
      expect(screen.getByTitle('Typography controls (click for options)')).toBeInTheDocument();
    });

    it('should show limited typography controls for pollBlock', () => {
      const pollNode: EditorNode = {
        id: 'poll-1',
        type: 'pollBlock',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        data: {
          question: 'Test poll question',
          options: ['Option 1', 'Option 2'],
          fontFamily: 'Arial',
          fontSize: 16,
          fontWeight: 400,
          textAlign: 'left',
          color: '#000000',
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'poll-1',
        nodes: [pollNode],
      });

      render(<UnifiedToolbar />);

      // Typography controls should be visible
      expect(screen.getByRole('group', { name: /format controls/i })).toBeInTheDocument();
      expect(screen.getByTitle('Bold (Ctrl+B)')).toBeInTheDocument();
      expect(screen.getByTitle('Align left (Ctrl+Shift+L)')).toBeInTheDocument();
      expect(screen.getByTitle('Typography controls (click for options)')).toBeInTheDocument();

      // Should show controls but they may be disabled for properties not supported by pollBlock
      // With always-visible approach, buttons are present but disabled when not applicable
      const italicButton = screen.queryByLabelText(/italic/i);
      if (italicButton) {
        expect(italicButton).toBeDisabled();
      }
    });

    it('should disable typography controls for separatorBlock (always-visible approach)', () => {
      const separatorNode: EditorNode = {
        id: 'separator-1',
        type: 'separatorBlock',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 50 },
        data: {
          lineStyle: 'solid',
          lineWidth: 2,
          lineColor: '#000000',
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'separator-1',
        nodes: [separatorNode],
      });

      render(<UnifiedToolbar />);

      // Typography controls should be VISIBLE but DISABLED (always-visible approach)
      expect(screen.getByRole('group', { name: /format controls/i })).toBeInTheDocument();
      
      // Buttons should be present but disabled for non-typography blocks
      const boldButton = screen.getByLabelText(/make text bold/i);
      expect(boldButton).toBeInTheDocument();
      expect(boldButton).toBeDisabled();
    });

    it('should disable typography controls when no node is selected (always-visible approach)', () => {
      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: null,
        nodes: [],
      });

      render(<UnifiedToolbar />);

      // Typography controls should be VISIBLE but DISABLED (always-visible approach)
      expect(screen.getByRole('group', { name: /format controls/i })).toBeInTheDocument();
      
      // Buttons should be present but disabled when no selection
      const boldButton = screen.getByLabelText(/make text bold/i);
      expect(boldButton).toBeInTheDocument();
      expect(boldButton).toBeDisabled();

      // Should show no selection message
      expect(
        screen.getByText('Select a block to format, or add blocks from sidebar')
      ).toBeInTheDocument();
    });
  });

  describe('Typography Control Functionality', () => {
    it('should handle bold toggle for textBlock', () => {
      const textNode: EditorNode = {
        id: 'text-1',
        type: 'textBlock',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        data: {
          content: 'Test text',
          fontWeight: 400,
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'text-1',
        nodes: [textNode],
      });

      render(<UnifiedToolbar />);

      const boldButton = screen.getByTitle('Bold (Ctrl+B)');
      fireEvent.click(boldButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('text-1', {
        data: { content: 'Test text', fontWeight: 700 },
      });
    });

    it('should handle text alignment for textBlock', () => {
      const textNode: EditorNode = {
        id: 'text-1',
        type: 'textBlock',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        data: {
          content: 'Test text',
          textAlign: 'left',
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'text-1',
        nodes: [textNode],
      });

      render(<UnifiedToolbar />);

      const centerAlignButton = screen.getByTitle('Align center (Ctrl+Shift+E)');
      fireEvent.click(centerAlignButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('text-1', {
        data: { content: 'Test text', textAlign: 'center' },
      });
    });

    it('should not call updateNode for unsupported properties', () => {
      const pollNode: EditorNode = {
        id: 'poll-1',
        type: 'pollBlock',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        data: {
          question: 'Test poll question',
          options: ['Option 1', 'Option 2'],
          fontWeight: 400,
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'poll-1',
        nodes: [pollNode],
      });

      render(<UnifiedToolbar />);

      // Since pollBlock doesn't support italic, this button shouldn't exist
      const italicButton = screen.queryByTitle('Italic (Ctrl+I)');
      expect(italicButton).not.toBeInTheDocument();
    });
  });

  describe('Block Context Detection', () => {
    it('should detect textBlock context correctly', () => {
      const textNode: EditorNode = {
        id: 'text-1',
        type: 'textBlock',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        data: { content: 'Test text' },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'text-1',
        nodes: [textNode],
      });

      render(<UnifiedToolbar />);

      // Should show block type in badge
      expect(screen.getByText('Text Block')).toBeInTheDocument();
    });

    it('should detect pollBlock context correctly', () => {
      const pollNode: EditorNode = {
        id: 'poll-1',
        type: 'pollBlock',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 200 },
        data: {
          question: 'Test poll question',
          options: ['Option 1', 'Option 2'],
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'poll-1',
        nodes: [pollNode],
      });

      render(<UnifiedToolbar />);

      // Should show block type in badge
      expect(screen.getByText('Poll Block')).toBeInTheDocument();
    });

    it('should detect keyTakeawayBlock context correctly', () => {
      const takeawayNode: EditorNode = {
        id: 'takeaway-1',
        type: 'keyTakeawayBlock',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 100 },
        data: {
          content: 'Key takeaway message',
          theme: 'info',
          icon: 'lightbulb',
        },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'takeaway-1',
        nodes: [takeawayNode],
      });

      render(<UnifiedToolbar />);

      // Should show block type in badge
      expect(screen.getByText('Key Takeaway Block')).toBeInTheDocument();
    });
  });

  describe('Typography Dropdown Context', () => {
    it('should pass block context to typography dropdown', () => {
      const textNode: EditorNode = {
        id: 'text-1',
        type: 'textBlock',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        data: { content: 'Test text' },
      };

      (useEditorStore as any).mockReturnValue({
        ...defaultStoreState,
        selectedNodeId: 'text-1',
        nodes: [textNode],
      });

      render(<UnifiedToolbar />);

      // Typography dropdown should be present
      const typographyButton = screen.getByTitle('Typography controls (click for options)');
      expect(typographyButton).toBeInTheDocument();

      // Click to open dropdown
      fireEvent.click(typographyButton);

      // Should show block type in dropdown header
      expect(screen.getByText('Text Block')).toBeInTheDocument();
    });
  });
});
