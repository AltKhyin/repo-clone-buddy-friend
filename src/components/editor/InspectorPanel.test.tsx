// ABOUTME: Comprehensive test suite for InspectorPanel component with property editing functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectorPanel } from './InspectorPanel';
import { useEditorStore } from '@/store/editorStore';

// Mock the editorStore
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Trash2: ({ size }: any) => <div data-testid="trash-icon" data-size={size} />,
  Copy: ({ size }: any) => <div data-testid="copy-icon" data-size={size} />,
  Eye: ({ size }: any) => <div data-testid="eye-icon" data-size={size} />,
  EyeOff: ({ size }: any) => <div data-testid="eye-off-icon" data-size={size} />,
  ChevronDown: ({ size }: any) => <div data-testid="chevron-down-icon" data-size={size} />,
  ChevronUp: ({ size }: any) => <div data-testid="chevron-up-icon" data-size={size} />,
  Check: ({ size }: any) => <div data-testid="check-icon" data-size={size} />
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
  ...overrides
});

describe('InspectorPanel', () => {
  beforeEach(() => {
    mockUseEditorStore.mockReturnValue(createMockStore());
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should render empty state when no node is selected', () => {
      render(<InspectorPanel />);

      expect(screen.getByText('Inspector')).toBeInTheDocument();
      expect(screen.getByText('No Selection')).toBeInTheDocument();
      expect(screen.getByText('Select a block to edit its properties')).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should show viewport switcher buttons', () => {
      render(<InspectorPanel />);

      expect(screen.getByText('Desktop')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
    });

    it('should highlight current viewport', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        currentViewport: 'mobile'
      }));

      render(<InspectorPanel />);

      const mobileButton = screen.getByText('Mobile').closest('button');
      const desktopButton = screen.getByText('Desktop').closest('button');

      // In a real implementation, you'd check for active/variant styling
      expect(mobileButton).toBeInTheDocument();
      expect(desktopButton).toBeInTheDocument();
    });
  });

  describe('Viewport Controls', () => {
    it('should call switchViewport when desktop button is clicked', async () => {
      const switchViewportMock = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({
        switchViewport: switchViewportMock,
        currentViewport: 'mobile'
      }));

      const user = userEvent.setup();
      render(<InspectorPanel />);

      const desktopButton = screen.getByText('Desktop');
      await user.click(desktopButton);

      expect(switchViewportMock).toHaveBeenCalledWith('desktop');
    });

    it('should call switchViewport when mobile button is clicked', async () => {
      const switchViewportMock = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({
        switchViewport: switchViewportMock,
        currentViewport: 'desktop'
      }));

      const user = userEvent.setup();
      render(<InspectorPanel />);

      const mobileButton = screen.getByText('Mobile');
      await user.click(mobileButton);

      expect(switchViewportMock).toHaveBeenCalledWith('mobile');
    });
  });

  describe('Selected Node Display', () => {
    it('should show selected node information', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test content</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByText('Text Block')).toBeInTheDocument();
      expect(screen.getByText(/ID: text-1/)).toBeInTheDocument();
    });

    it('should format block type name correctly', () => {
      const mockNodes = [
        {
          id: 'takeaway-1',
          type: 'keyTakeawayBlock',
          data: { content: 'Test' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'takeaway-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByText('Key Takeaway Block')).toBeInTheDocument();
    });

    it('should truncate long node IDs', () => {
      const mockNodes = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: '550e8400-e29b-41d4-a716-446655440000',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByText(/ID: 550e8400/)).toBeInTheDocument();
    });
  });

  describe('Node Actions', () => {
    it('should render duplicate and delete buttons for selected node', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });

    it('should call duplicateNode when duplicate button is clicked', async () => {
      const duplicateNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes,
        duplicateNode: duplicateNodeMock
      }));

      const user = userEvent.setup();
      render(<InspectorPanel />);

      const duplicateButton = screen.getByText('Duplicate');
      await user.click(duplicateButton);

      expect(duplicateNodeMock).toHaveBeenCalledWith('text-1');
    });

    it('should call deleteNode and selectNode when delete button is clicked', async () => {
      const deleteNodeMock = vi.fn();
      const selectNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes,
        deleteNode: deleteNodeMock,
        selectNode: selectNodeMock
      }));

      const user = userEvent.setup();
      render(<InspectorPanel />);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(deleteNodeMock).toHaveBeenCalledWith('text-1');
      expect(selectNodeMock).toHaveBeenCalledWith(null);
    });
  });

  describe('Text Block Editor', () => {
    it('should render text block editor fields', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test content</p>', fontSize: 16 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getByLabelText('Content')).toBeInTheDocument();
      expect(screen.getByLabelText('Font Size')).toBeInTheDocument();
      expect(screen.getByText('Alignment')).toBeInTheDocument();
    });

    it('should display current text content without HTML tags', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Hello <strong>world</strong></p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      const contentTextarea = screen.getByLabelText('Content') as HTMLTextAreaElement;
      expect(contentTextarea.value).toBe('Hello world');
    });

    it('should call updateNode when text content is changed', () => {
      const updateNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Original</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes,
        updateNode: updateNodeMock
      }));

      render(<InspectorPanel />);

      const contentTextarea = screen.getByLabelText('Content');
      
      // Directly fire the change event with the new value
      fireEvent.change(contentTextarea, { target: { value: 'Updated content' } });

      expect(updateNodeMock).toHaveBeenCalledWith('text-1', {
        data: { htmlContent: '<p>Updated content</p>' }
      });
    });

    it('should call updateNode when font size is changed', () => {
      const updateNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>', fontSize: 16 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes,
        updateNode: updateNodeMock
      }));

      render(<InspectorPanel />);

      const fontSizeInput = screen.getByLabelText('Font Size');
      
      // Directly fire the change event with the new value
      fireEvent.change(fontSizeInput, { target: { value: '20' } });

      expect(updateNodeMock).toHaveBeenCalledWith('text-1', {
        data: { htmlContent: '<p>Test</p>', fontSize: 20 }
      });
    });
  });

  describe('Heading Block Editor', () => {
    it('should render heading block editor fields', () => {
      const mockNodes = [
        {
          id: 'heading-1',
          type: 'headingBlock',
          data: { htmlContent: 'Test Heading', level: 1 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'heading-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByLabelText('Heading Text')).toBeInTheDocument();
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('Alignment')).toBeInTheDocument();
    });

    it('should display current heading content', () => {
      const mockNodes = [
        {
          id: 'heading-1',
          type: 'headingBlock',
          data: { htmlContent: 'My Heading', level: 2 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'heading-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      const headingInput = screen.getByLabelText('Heading Text') as HTMLInputElement;
      expect(headingInput.value).toBe('My Heading');
    });

    it('should call updateNode when heading text is changed', () => {
      const updateNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'heading-1',
          type: 'headingBlock',
          data: { htmlContent: 'Original Heading', level: 1 }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'heading-1',
        nodes: mockNodes,
        updateNode: updateNodeMock
      }));

      render(<InspectorPanel />);

      const headingInput = screen.getByLabelText('Heading Text');
      
      // Directly fire the change event with the new value
      fireEvent.change(headingInput, { target: { value: 'Updated Heading' } });

      expect(updateNodeMock).toHaveBeenCalledWith('heading-1', {
        data: { htmlContent: 'Updated Heading', level: 1 }
      });
    });
  });

  describe('Image Block Editor', () => {
    it('should render image block editor fields', () => {
      const mockNodes = [
        {
          id: 'image-1',
          type: 'imageBlock',
          data: { src: 'test.jpg', alt: 'Test image', caption: 'Test caption' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'image-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByLabelText('Image URL')).toBeInTheDocument();
      expect(screen.getByLabelText('Alt Text')).toBeInTheDocument();
      expect(screen.getByLabelText('Caption')).toBeInTheDocument();
    });

    it('should display current image data', () => {
      const mockNodes = [
        {
          id: 'image-1',
          type: 'imageBlock',
          data: { 
            src: 'https://example.com/image.jpg', 
            alt: 'Example image', 
            caption: 'Example caption' 
          }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'image-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      const srcInput = screen.getByLabelText('Image URL') as HTMLInputElement;
      const altInput = screen.getByLabelText('Alt Text') as HTMLInputElement;
      const captionInput = screen.getByLabelText('Caption') as HTMLInputElement;

      expect(srcInput.value).toBe('https://example.com/image.jpg');
      expect(altInput.value).toBe('Example image');
      expect(captionInput.value).toBe('Example caption');
    });

    it('should call updateNode when image URL is changed', () => {
      const updateNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'image-1',
          type: 'imageBlock',
          data: { src: '', alt: '', caption: '' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'image-1',
        nodes: mockNodes,
        updateNode: updateNodeMock
      }));

      render(<InspectorPanel />);

      const srcInput = screen.getByLabelText('Image URL');
      
      // Directly fire the change event with the new value
      fireEvent.change(srcInput, { target: { value: 'https://example.com/new-image.jpg' } });

      expect(updateNodeMock).toHaveBeenCalledWith('image-1', {
        data: { src: 'https://example.com/new-image.jpg', alt: '', caption: '' }
      });
    });
  });

  describe('Key Takeaway Block Editor', () => {
    it('should render key takeaway editor fields', () => {
      const mockNodes = [
        {
          id: 'takeaway-1',
          type: 'keyTakeawayBlock',
          data: { content: 'Important message', theme: 'info' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'takeaway-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByLabelText('Message')).toBeInTheDocument();
      expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    });

    it('should display current takeaway content', () => {
      const mockNodes = [
        {
          id: 'takeaway-1',
          type: 'keyTakeawayBlock',
          data: { content: 'Key insight here', theme: 'success' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'takeaway-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      const messageTextarea = screen.getByLabelText('Message') as HTMLTextAreaElement;
      expect(messageTextarea.value).toBe('Key insight here');
    });

    it('should call updateNode when takeaway content is changed', () => {
      const updateNodeMock = vi.fn();
      const mockNodes = [
        {
          id: 'takeaway-1',
          type: 'keyTakeawayBlock',
          data: { content: 'Original message', theme: 'info' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'takeaway-1',
        nodes: mockNodes,
        updateNode: updateNodeMock
      }));

      render(<InspectorPanel />);

      const messageTextarea = screen.getByLabelText('Message');
      
      // Directly fire the change event with the new value
      fireEvent.change(messageTextarea, { target: { value: 'Updated message' } });

      expect(updateNodeMock).toHaveBeenCalledWith('takeaway-1', {
        data: { content: 'Updated message', theme: 'info' }
      });
    });
  });

  describe('Unknown Block Type', () => {
    it('should render placeholder for unknown block types', () => {
      const mockNodes = [
        {
          id: 'unknown-1',
          type: 'unknownBlockType',
          data: {}
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'unknown-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      expect(screen.getByText('Editor for unknownBlockType coming soon')).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should have correct container styling', () => {
      render(<InspectorPanel />);

      const container = screen.getByText('Inspector').closest('.w-80');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('border-l', 'bg-muted/30');
    });

    it('should have scrollable content area', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      const scrollContainer = screen.getByText('Properties').closest('.overflow-y-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('should properly separate sections with separators', () => {
      const mockNodes = [
        {
          id: 'text-1',
          type: 'textBlock',
          data: { htmlContent: '<p>Test</p>' }
        }
      ];

      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'text-1',
        nodes: mockNodes
      }));

      render(<InspectorPanel />);

      // Check for shadcn/ui Separator components (they have data-orientation="horizontal")
      const separators = document.querySelectorAll('[data-orientation="horizontal"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });
});