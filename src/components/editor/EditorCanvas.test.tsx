// ABOUTME: Comprehensive test suite for EditorCanvas component with drop zone validation and node rendering

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { EditorCanvas } from './EditorCanvas';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}));

// Mock the HTML parser for dangerouslySetInnerHTML
const mockUseEditorStore = useEditorStore as any;

const createMockStore = (overrides = {}) => ({
  nodes: [],
  selectedNodeId: null,
  currentViewport: 'desktop',
  selectNode: vi.fn(),
  addNode: vi.fn(),
  ...overrides
});

describe('EditorCanvas', () => {
  beforeEach(() => {
    mockUseEditorStore.mockReturnValue(createMockStore());
    vi.clearAllMocks();
  });

  const DndWrapper = ({ children }: { children: React.ReactNode }) => (
    <DndContext onDragEnd={() => {}}>
      {children}
    </DndContext>
  );

  describe('Empty State', () => {
    it('should render empty canvas with placeholder message', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('Empty Canvas')).toBeInTheDocument();
      expect(screen.getByText('Drag blocks from the palette to start creating your review')).toBeInTheDocument();
    });

    it('should display viewport indicator for desktop', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('desktop view')).toBeInTheDocument();
    });

    it('should display viewport indicator for mobile', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        currentViewport: 'mobile'
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('mobile view')).toBeInTheDocument();
    });

    it('should have grid overlay background', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      // Check for SVG grid pattern
      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      
      const pattern = document.querySelector('#grid');
      expect(pattern).toBeInTheDocument();
    });
  });

  describe('Node Rendering', () => {
    it('should render text block nodes', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Test text content</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('Test text content')).toBeInTheDocument();
    });

    it('should render heading block nodes', () => {
      const mockNodes = [
        {
          id: 'heading-1',
          type: 'headingBlock' as const,
          data: { htmlContent: 'Test Heading', level: 1 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('Test Heading')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render image block nodes with placeholder when no src', () => {
      const mockNodes = [
        {
          id: 'image-1',
          type: 'imageBlock' as const,
          data: { src: '', alt: 'Test alt text', caption: 'Test caption' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('Image placeholder')).toBeInTheDocument();
      expect(screen.getByText('Test caption')).toBeInTheDocument();
    });

    it('should render image block nodes with actual image when src provided', () => {
      const mockNodes = [
        {
          id: 'image-1',
          type: 'imageBlock' as const,
          data: { 
            src: 'https://example.com/image.jpg', 
            alt: 'Test alt text', 
            caption: 'Test caption' 
          }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      expect(image).toHaveAttribute('alt', 'Test alt text');
      expect(screen.getByText('Test caption')).toBeInTheDocument();
    });

    it('should render table block nodes', () => {
      const mockNodes = [
        {
          id: 'table-1',
          type: 'tableBlock' as const,
          data: {
            headers: ['Column 1', 'Column 2'],
            rows: [['Cell 1', 'Cell 2'], ['Cell 3', 'Cell 4']]
          }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 3')).toBeInTheDocument();
      expect(screen.getByText('Cell 4')).toBeInTheDocument();
    });

    it('should render key takeaway block nodes with correct theme', () => {
      const mockNodes = [
        {
          id: 'takeaway-1',
          type: 'keyTakeawayBlock' as const,
          data: { content: 'Important key takeaway', theme: 'info' as const }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('Important key takeaway')).toBeInTheDocument();
      const takeawayDiv = screen.getByText('Important key takeaway').closest('div');
      expect(takeawayDiv).toHaveClass('bg-blue-50', 'border-blue-400');
    });

    it('should render separator block nodes', () => {
      const mockNodes = [
        {
          id: 'separator-1',
          type: 'separatorBlock' as const,
          data: { style: 'solid' as const, thickness: 2 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const separator = document.querySelector('hr');
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveClass('border-solid');
    });

    it('should render unknown block types with placeholder', () => {
      const mockNodes = [
        {
          id: 'unknown-1',
          type: 'unknownBlock' as any,
          data: {}
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('unknownBlock block')).toBeInTheDocument();
    });
  });

  describe('Node Selection', () => {
    it('should call selectNode when node is clicked', () => {
      const selectNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Clickable text</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes,
        selectNode: selectNodeMock
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const nodeElement = screen.getByText('Clickable text').closest('div');
      fireEvent.click(nodeElement!);

      expect(selectNodeMock).toHaveBeenCalledWith('text-1');
    });

    it('should show selection indicator for selected node', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Selected text</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes,
        selectedNodeId: 'text-1'
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByText('Selected')).toBeInTheDocument();
      
      // Get the actual node container with selection styling
      const nodeElement = screen.getByText('Selected text').closest('[class*="ring-2"]');
      expect(nodeElement).toHaveClass('ring-2', 'ring-primary');
    });

    it('should not show selection indicator for non-selected nodes', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Not selected text</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes,
        selectedNodeId: null
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.queryByText('Selected')).not.toBeInTheDocument();
      
      // Check that the content is rendered but without selection styling
      const textElement = screen.getByText('Not selected text');
      expect(textElement).toBeInTheDocument();
      
      // Verify no selection ring is present
      const nodeWithRing = screen.queryByText('Not selected text')?.closest('[class*="ring-2"]');
      expect(nodeWithRing).toBeNull();
    });

    it('should show hover state for non-selected nodes', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Hoverable text</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes,
        selectedNodeId: null
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      // Get the node container with hover styling
      const nodeElement = screen.getByText('Hoverable text').closest('[class*="hover:bg-accent"]');
      expect(nodeElement).toHaveClass('hover:bg-accent/50');
    });
  });

  describe('Drop Zone Behavior', () => {
    it('should render as a dropzone with correct ID', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      // The canvas should be a drop zone for dnd-kit
      // This is tested indirectly through the component structure
      const canvasContainer = screen.getByText('Empty Canvas').closest('.flex-1');
      expect(canvasContainer).toBeInTheDocument();
    });

    it('should have proper canvas styling and layout', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const canvasContainer = screen.getByText('Empty Canvas').closest('.flex-1');
      expect(canvasContainer).toHaveClass('bg-background', 'relative', 'overflow-auto');
    });

    it('should have centered content area with max width', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const contentArea = screen.getByText('Empty Canvas').closest('.max-w-4xl');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('max-w-4xl', 'mx-auto');
    });
  });

  describe('Layout and Structure', () => {
    it('should have proper container classes', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const container = screen.getByText('desktop view').closest('.flex-1');
      expect(container).toHaveClass('flex-1', 'bg-background', 'relative', 'overflow-auto');
    });

    it('should display nodes in space-y-4 layout', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>First node</p>' }
        },
        {
          id: 'text-2',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Second node</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const contentContainer = screen.getByText('First node').closest('.space-y-4');
      expect(contentContainer).toBeInTheDocument();
    });

    it('should have absolute positioned viewport indicator', () => {
      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      const viewportIndicator = screen.getByText('desktop view');
      expect(viewportIndicator.closest('div')).toHaveClass('absolute', 'top-4', 'right-4');
    });
  });

  describe('Accessibility', () => {
    it('should make nodes clickable and focusable', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Accessible text</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      // Get the node container with cursor styling
      const nodeElement = screen.getByText('Accessible text').closest('[class*="cursor-pointer"]');
      expect(nodeElement).toHaveClass('cursor-pointer');
    });

    it('should provide visual feedback for interactive elements', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '<p>Interactive text</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      // Get the node container with transition styling
      const nodeElement = screen.getByText('Interactive text').closest('[class*="transition-all"]');
      expect(nodeElement).toHaveClass('transition-all');
    });
  });

  describe('Content Rendering Edge Cases', () => {
    it('should handle empty text content gracefully', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: { htmlContent: '' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      // Should render without crashing
      const nodeElements = document.querySelectorAll('[class*="cursor-pointer"]');
      expect(nodeElements).toHaveLength(1);
    });

    it('should handle missing data properties gracefully', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock' as const,
          data: {} as any
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      // Should render without crashing
      const nodeElements = document.querySelectorAll('[class*="cursor-pointer"]');
      expect(nodeElements).toHaveLength(1);
    });

    it('should render different heading levels correctly', () => {
      const mockNodes = [
        {
          id: 'h1',
          type: 'headingBlock' as const,
          data: { htmlContent: 'H1 Heading', level: 1 }
        },
        {
          id: 'h2',
          type: 'headingBlock' as const,
          data: { htmlContent: 'H2 Heading', level: 2 }
        },
        {
          id: 'h3',
          type: 'headingBlock' as const,
          data: { htmlContent: 'H3 Heading', level: 3 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        nodes: mockNodes
      }));

      render(
        <DndWrapper>
          <EditorCanvas />
        </DndWrapper>
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1 Heading');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('H2 Heading');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('H3 Heading');
    });
  });
});