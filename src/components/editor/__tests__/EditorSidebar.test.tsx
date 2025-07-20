// ABOUTME: Test suite for EditorSidebar component ensuring tab behavior and user override functionality

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEditorStore } from '@/store/editorStore';
import { EditorSidebar } from '../EditorSidebar';

// Mock the editor store
vi.mock('@/store/editorStore');

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

// Mock child components
vi.mock('../Inspector/shared/BackgroundControls', () => ({
  BackgroundControls: ({ data, onChange, className }: any) => (
    <div data-testid="background-controls" className={className}>
      <input
        data-testid="background-color-input"
        type="color"
        value={data.backgroundColor || 'transparent'}
        onChange={e => onChange({ backgroundColor: e.target.value })}
      />
    </div>
  ),
}));

vi.mock('../Inspector/shared/SpacingControls', () => ({
  SpacingControls: ({ data, onChange, className }: any) => (
    <div data-testid="spacing-controls" className={className}>
      <input
        data-testid="padding-input"
        type="number"
        value={data.padding || 0}
        onChange={e => onChange({ padding: parseInt(e.target.value) })}
      />
    </div>
  ),
}));

vi.mock('../Inspector/shared/BorderControls', () => ({
  BorderControls: ({ data, onChange, className }: any) => (
    <div data-testid="border-controls" className={className}>
      <input
        data-testid="border-width-input"
        type="number"
        value={data.borderWidth || 0}
        onChange={e => onChange({ borderWidth: parseInt(e.target.value) })}
      />
    </div>
  ),
}));

vi.mock('../Inspector/TextBlockInspector', () => ({
  TextBlockInspector: ({ nodeId }: any) => (
    <div data-testid="text-block-inspector">
      <div data-testid="heading-selector">
        <select data-testid="heading-level-select">
          <option value="text">Normal Text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
      </div>
      <div data-testid="text-block-properties">Text Block Properties for {nodeId}</div>
    </div>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Blocks: () => <div data-testid="blocks-icon" />,
  Settings2: () => <div data-testid="settings-icon" />,
  Palette: () => <div data-testid="palette-icon" />,
  Move: () => <div data-testid="move-icon" />,
  Type: () => <div data-testid="type-icon" />,
  Image: () => <div data-testid="image-icon" />,
  Table: () => <div data-testid="table-icon" />,
  BarChart: () => <div data-testid="bar-chart-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Quote: () => <div data-testid="quote-icon" />,
  Video: () => <div data-testid="video-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Heading1: () => <div data-testid="heading1-icon" />,
  Heading2: () => <div data-testid="heading2-icon" />,
  Heading3: () => <div data-testid="heading3-icon" />,
  Heading4: () => <div data-testid="heading4-icon" />,
  Underline: () => <div data-testid="underline-icon" />,
  Strikethrough: () => <div data-testid="strikethrough-icon" />,
  Bold: () => <div data-testid="bold-icon" />,
  Italic: () => <div data-testid="italic-icon" />,
  Hash: () => <div data-testid="hash-icon" />,
  AlignLeft: () => <div data-testid="align-left-icon" />,
  AlignCenter: () => <div data-testid="align-center-icon" />,
  AlignRight: () => <div data-testid="align-right-icon" />,
  AlignJustify: () => <div data-testid="align-justify-icon" />,
  ArrowLeftRight: () => <div data-testid="arrow-left-right-icon" />,
  ArrowUpDown: () => <div data-testid="arrow-up-down-icon" />,
  Square: () => <div data-testid="square-icon" />,
}));

const mockEditorStore = {
  selectedNodeId: null,
  nodes: [],
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
  addNode: vi.fn(),
};

describe('EditorSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as any).mockReturnValue(mockEditorStore);
  });

  describe('Tab Behavior', () => {
    it('should start with Blocks tab active by default', () => {
      render(<EditorSidebar />);

      const blocksTab = screen.getByRole('tab', { name: /blocks/i });
      const propertiesTab = screen.getByRole('tab', { name: /properties/i });

      expect(blocksTab).toHaveAttribute('aria-selected', 'true');
      expect(propertiesTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should auto-switch to Properties tab when block is first selected', () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      const { rerender } = render(<EditorSidebar />);

      // Initially should be on Blocks tab
      expect(screen.getByRole('tab', { name: /blocks/i })).toHaveAttribute('aria-selected', 'true');

      // Simulate block selection by re-rendering with selected block
      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      rerender(<EditorSidebar />);

      // Should auto-switch to Properties tab
      expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('should allow user to manually switch back to Blocks tab when block is selected', async () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      render(<EditorSidebar />);

      // Should be on Properties tab due to auto-switch
      expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // User manually clicks Blocks tab
      const user = userEvent.setup();
      const blocksTab = screen.getByRole('tab', { name: /blocks/i });
      await user.click(blocksTab);

      // Should allow switch to Blocks tab
      expect(blocksTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute(
        'aria-selected',
        'false'
      );
    });

    it('should allow user to manually switch back to Properties tab after manual override', async () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      render(<EditorSidebar />);

      // Should auto-switch to Properties initially
      expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // User manually switches to Blocks
      const user = userEvent.setup();
      const blocksTab = screen.getByRole('tab', { name: /blocks/i });
      await user.click(blocksTab);
      expect(blocksTab).toHaveAttribute('aria-selected', 'true');

      // User manually switches back to Properties
      const propertiesTab = screen.getByRole('tab', { name: /properties/i });
      await user.click(propertiesTab);
      expect(propertiesTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should NOT auto-switch if user has manually overridden tab selection', async () => {
      // Start with a block selected so properties tab auto-switches
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      const { rerender } = render(<EditorSidebar />);

      // Should auto-switch to Properties tab initially
      expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // User manually switches to Blocks tab
      const user = userEvent.setup();
      const blocksTab = screen.getByRole('tab', { name: /blocks/i });
      await user.click(blocksTab);
      expect(blocksTab).toHaveAttribute('aria-selected', 'true');

      // Now simulate selecting another block (which normally would auto-switch)
      const anotherMockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'another-block-id',
        nodes: [
          {
            id: 'another-block-id',
            type: 'textBlock',
            data: { content: 'Another block', headingLevel: 1 },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(anotherMockStoreWithSelection);
      rerender(<EditorSidebar />);

      // Should NOT auto-switch because user already made a manual choice
      expect(screen.getByRole('tab', { name: /blocks/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('should reset override behavior when no block is selected', () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      const { rerender } = render(<EditorSidebar />);
      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      rerender(<EditorSidebar />);

      // User manually switches to Blocks tab
      fireEvent.click(screen.getByRole('tab', { name: /blocks/i }));

      // Simulate block deselection
      (useEditorStore as any).mockReturnValue(mockEditorStore);
      rerender(<EditorSidebar />);

      // Now select a block again - should auto-switch since override was reset
      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      rerender(<EditorSidebar />);

      expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('should render TextBlockInspector for textBlock nodes', () => {
      const mockStoreWithTextBlock = {
        ...mockEditorStore,
        selectedNodeId: 'text-block-id',
        nodes: [
          {
            id: 'text-block-id',
            type: 'textBlock',
            data: { content: 'Test content', headingLevel: 2 },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithTextBlock);
      render(<EditorSidebar />);

      // Should show TextBlockInspector for textBlock nodes
      expect(screen.getByTestId('text-block-inspector')).toBeInTheDocument();
      expect(screen.getByTestId('heading-selector')).toBeInTheDocument();
      expect(screen.getByTestId('heading-level-select')).toBeInTheDocument();
      expect(screen.getByTestId('text-block-properties')).toBeInTheDocument();

      // Should NOT show generic controls for textBlock
      expect(screen.queryByTestId('background-controls')).not.toBeInTheDocument();
      expect(screen.queryByTestId('spacing-controls')).not.toBeInTheDocument();
      expect(screen.queryByTestId('border-controls')).not.toBeInTheDocument();
    });

    it('should render generic controls for non-textBlock nodes', () => {
      const mockStoreWithImageBlock = {
        ...mockEditorStore,
        selectedNodeId: 'image-block-id',
        nodes: [
          {
            id: 'image-block-id',
            type: 'imageBlock',
            data: { url: 'test.jpg' },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithImageBlock);
      render(<EditorSidebar />);

      // Should show generic controls for non-textBlock nodes
      expect(screen.getByTestId('background-controls')).toBeInTheDocument();
      expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();

      // Should NOT show TextBlockInspector for non-textBlock nodes
      expect(screen.queryByTestId('text-block-inspector')).not.toBeInTheDocument();
    });
  });

  describe('Tab Content', () => {
    it('should show Blocks content when Blocks tab is active', () => {
      render(<EditorSidebar />);

      expect(screen.getByText('Block Palette')).toBeInTheDocument();
      expect(screen.getByText('Drag blocks to the canvas')).toBeInTheDocument();
    });

    it('should show Properties content when Properties tab is active and block is selected', () => {
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      render(<EditorSidebar />);

      expect(screen.getByText('Block Properties')).toBeInTheDocument();
      expect(screen.getByText('Text Block')).toBeInTheDocument();
    });

    it('should show no selection message when Properties tab becomes active with no block selected', () => {
      // Start with a block selected so Properties tab is active
      const mockStoreWithSelection = {
        ...mockEditorStore,
        selectedNodeId: 'test-block-id',
        nodes: [
          {
            id: 'test-block-id',
            type: 'textBlock',
            data: { content: 'Test content' },
          },
        ],
      };

      (useEditorStore as any).mockReturnValue(mockStoreWithSelection);
      const { rerender } = render(<EditorSidebar />);

      // Should be on Properties tab with block selected
      expect(screen.getByRole('tab', { name: /properties/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByText('Block Properties')).toBeInTheDocument();

      // Now deselect the block
      (useEditorStore as any).mockReturnValue(mockEditorStore);
      rerender(<EditorSidebar />);

      // Properties tab should still be active but show no selection message
      expect(screen.getByText('No Block Selected')).toBeInTheDocument();
      expect(
        screen.getByText('Select a block on the canvas to edit its properties')
      ).toBeInTheDocument();
    });
  });
});
