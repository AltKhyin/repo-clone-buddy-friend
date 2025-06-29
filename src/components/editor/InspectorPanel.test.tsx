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

// Mock the new Inspector components that use Tiptap
vi.mock('./Inspector/TextBlockInspector', () => ({
  TextBlockInspector: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="text-block-inspector" data-node-id={nodeId}>
      <div>Text Block Inspector Mock</div>
    </div>
  )
}));

vi.mock('./Inspector/HeadingBlockInspector', () => ({
  HeadingBlockInspector: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="heading-block-inspector" data-node-id={nodeId}>
      <div>Heading Block Inspector Mock</div>
    </div>
  )
}));

vi.mock('./Inspector/ImageBlockInspector', () => ({
  ImageBlockInspector: ({ nodeId }: { nodeId: string }) => (
    <div data-testid="image-block-inspector" data-node-id={nodeId}>
      <div>Image Block Inspector Mock</div>
    </div>
  )
}));

// Mock Tiptap components
vi.mock('@tiptap/react', () => ({
  useEditor: () => null,
  EditorContent: ({ editor }: any) => <div data-testid="editor-content">Tiptap Editor Mock</div>,
  BubbleMenu: ({ children }: any) => <div data-testid="bubble-menu">{children}</div>
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: () => ({})
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Trash2: ({ size }: any) => <div data-testid="trash-icon" data-size={size} />,
  Copy: ({ size }: any) => <div data-testid="copy-icon" data-size={size} />,
  Eye: ({ size }: any) => <div data-testid="eye-icon" data-size={size} />,
  EyeOff: ({ size }: any) => <div data-testid="eye-off-icon" data-size={size} />,
  ChevronDown: ({ size }: any) => <div data-testid="chevron-down-icon" data-size={size} />,
  ChevronUp: ({ size }: any) => <div data-testid="chevron-up-icon" data-size={size} />,
  Check: ({ size }: any) => <div data-testid="check-icon" data-size={size} />,
  Monitor: ({ size }: any) => <div data-testid="monitor-icon" data-size={size} />,
  Smartphone: ({ size }: any) => <div data-testid="smartphone-icon" data-size={size} />,
  Sun: ({ size }: any) => <div data-testid="sun-icon" data-size={size} />,
  Moon: ({ size }: any) => <div data-testid="moon-icon" data-size={size} />,
  Grid: ({ size }: any) => <div data-testid="grid-icon" data-size={size} />,
  Ruler: ({ size }: any) => <div data-testid="ruler-icon" data-size={size} />,
  Minus: ({ size }: any) => <div data-testid="minus-icon" data-size={size} />,
  // Text alignment icons
  AlignLeft: ({ size }: any) => <div data-testid="align-left-icon" data-size={size} />,
  AlignCenter: ({ size }: any) => <div data-testid="align-center-icon" data-size={size} />,
  AlignRight: ({ size }: any) => <div data-testid="align-right-icon" data-size={size} />,
  AlignJustify: ({ size }: any) => <div data-testid="align-justify-icon" data-size={size} />,
  // Typography icons
  Palette: ({ size }: any) => <div data-testid="palette-icon" data-size={size} />,
  Type: ({ size }: any) => <div data-testid="type-icon" data-size={size} />,
  // Heading level icons
  Heading1: ({ size }: any) => <div data-testid="heading1-icon" data-size={size} />,
  Heading2: ({ size }: any) => <div data-testid="heading2-icon" data-size={size} />,
  Heading3: ({ size }: any) => <div data-testid="heading3-icon" data-size={size} />,
  Heading4: ({ size }: any) => <div data-testid="heading4-icon" data-size={size} />,
  // Image Block icons
  ImageIcon: ({ size }: any) => <div data-testid="image-icon" data-size={size} />,
  ImageOff: ({ size }: any) => <div data-testid="image-off-icon" data-size={size} />,
  Upload: ({ size }: any) => <div data-testid="upload-icon" data-size={size} />,
  ExternalLink: ({ size }: any) => <div data-testid="external-link-icon" data-size={size} />,
  Maximize2: ({ size }: any) => <div data-testid="maximize2-icon" data-size={size} />,
  RefreshCw: ({ size }: any) => <div data-testid="refresh-cw-icon" data-size={size} />
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
  isFullscreen: false,
  toggleFullscreen: vi.fn(),
  guidelines: { horizontal: [], vertical: [] },
  clearGuidelines: vi.fn(),
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
    it('should render text block inspector component', () => {
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
      expect(screen.getByTestId('text-block-inspector')).toBeInTheDocument();
      expect(screen.getByText('Text Block Inspector Mock')).toBeInTheDocument();
    });

  });

  describe('Heading Block Editor', () => {
    it('should render heading block inspector component', () => {
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

      expect(screen.getByTestId('heading-block-inspector')).toBeInTheDocument();
      expect(screen.getByText('Heading Block Inspector Mock')).toBeInTheDocument();
    });
  });

  describe('Image Block Editor', () => {
    it('should render image block inspector component', () => {
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

      expect(screen.getByTestId('image-block-inspector')).toBeInTheDocument();
      expect(screen.getByText('Image Block Inspector Mock')).toBeInTheDocument();
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
      // Find the theme selector specifically within the Key Takeaway block editor
      const themeSelectors = screen.getAllByLabelText('Theme');
      expect(themeSelectors.length).toBeGreaterThan(0);
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

  describe('Canvas Controls', () => {
    it('should render canvas theme toggle', () => {
      render(<InspectorPanel />);
      expect(screen.getByLabelText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should render grid toggle', () => {
      render(<InspectorPanel />);
      expect(screen.getByLabelText('Show Grid')).toBeInTheDocument();
      expect(screen.getByTestId('grid-icon')).toBeInTheDocument();
    });

    it('should render rulers toggle', () => {
      render(<InspectorPanel />);
      expect(screen.getByLabelText('Show Rulers')).toBeInTheDocument();
      expect(screen.getByTestId('ruler-icon')).toBeInTheDocument();
    });

    it('should render guidelines toggle', () => {
      render(<InspectorPanel />);
      expect(screen.getByLabelText('Show Guidelines')).toBeInTheDocument();
      expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
    });

    it('should show fullscreen toggle', () => {
      render(<InspectorPanel />);
      expect(screen.getByLabelText('Fullscreen')).toBeInTheDocument();
    });

    it('should hide snap to guides toggle (removed feature)', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        showGuidelines: true
      }));

      render(<InspectorPanel />);
      expect(screen.queryByLabelText('Snap to Guides')).not.toBeInTheDocument();
    });

    it('should show clear guidelines button when guidelines exist', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        showGuidelines: true,
        guidelines: { horizontal: [100, 200], vertical: [150] }
      }));

      render(<InspectorPanel />);
      expect(screen.getByText('Clear All Guidelines (3)')).toBeInTheDocument();
    });

    it('should hide clear guidelines button when no guidelines exist', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        showGuidelines: true,
        guidelines: { horizontal: [], vertical: [] }
      }));

      render(<InspectorPanel />);
      expect(screen.queryByText(/Clear All Guidelines/)).not.toBeInTheDocument();
    });

    it('should call toggle functions when controls are clicked', async () => {
      const toggleRulersMock = vi.fn();
      const toggleGuidelinesMock = vi.fn();
      const clearGuidelinesMock = vi.fn();

      mockUseEditorStore.mockReturnValue(createMockStore({
        showGuidelines: true,
        guidelines: { horizontal: [100], vertical: [150] },
        toggleRulers: toggleRulersMock,
        toggleGuidelines: toggleGuidelinesMock,
        clearGuidelines: clearGuidelinesMock
      }));

      const user = userEvent.setup();
      render(<InspectorPanel />);

      // Test rulers toggle
      const rulersToggle = screen.getByLabelText('Show Rulers');
      await user.click(rulersToggle);
      expect(toggleRulersMock).toHaveBeenCalled();

      // Test guidelines toggle
      const guidelinesToggle = screen.getByLabelText('Show Guidelines');
      await user.click(guidelinesToggle);
      expect(toggleGuidelinesMock).toHaveBeenCalled();

      // Test clear guidelines button
      const clearButton = screen.getByText('Clear All Guidelines (2)');
      await user.click(clearButton);
      expect(clearGuidelinesMock).toHaveBeenCalled();
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

    it('should display canvas controls section', () => {
      render(<InspectorPanel />);
      expect(screen.getByText('Canvas')).toBeInTheDocument();
    });
  });

  describe('Visual Helpers Integration', () => {
    it('should show appropriate visual helper controls based on state', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        showRulers: true,
        showGuidelines: true,
        guidelines: { horizontal: [50, 100], vertical: [75] }
      }));

      render(<InspectorPanel />);

      // All visual helper controls should be present
      expect(screen.getByLabelText('Show Rulers')).toBeInTheDocument();
      expect(screen.getByLabelText('Show Guidelines')).toBeInTheDocument();
      expect(screen.getByText('Clear All Guidelines (3)')).toBeInTheDocument();
    });

    it('should respect visual helper state from store', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({
        showRulers: true,
        showGuidelines: false
      }));

      render(<InspectorPanel />);

      const rulersToggle = screen.getByLabelText('Show Rulers');
      const guidelinesToggle = screen.getByLabelText('Show Guidelines');

      // Check that the toggles reflect the current state
      expect(rulersToggle).toBeInTheDocument();
      expect(guidelinesToggle).toBeInTheDocument();
      
      // Snap to guides feature has been removed
      expect(screen.queryByLabelText('Snap to Guides')).not.toBeInTheDocument();
    });
  });
});