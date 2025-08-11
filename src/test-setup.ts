// ABOUTME: Minimal test setup for strategic testing approach with essential browser API mocking
import React from 'react';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Essential browser API mocks - minimal set for React components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for components that require it
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock localStorage for auth and settings
const createStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: 0,
    key: vi.fn(),
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Supabase client for database integration tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ user: null, error: null })),
    },
  },
}));

// Mock CustomThemeProvider with proper context structure
vi.mock('@/components/theme/CustomThemeProvider', () => ({
  CustomThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    actualTheme: 'light',
  }),
}));

// Mock useColorTokens with all required functions
vi.mock('@/hooks/useColorTokens', () => ({
  useColorTokens: () => ({
    getColorValue: vi.fn((color) => color),
    getTokenInfo: vi.fn((value) => null),
    getPreviewColor: vi.fn((value) => value),
    resolveColor: vi.fn((value) => value),
    validateColor: vi.fn((value) => ({ isValid: true })),
    isToken: vi.fn(() => false),
    theme: 'light',
    isDarkMode: false,
    allTokens: [],
    tokenCategories: [],
  }),
}));

// Mock useUnifiedSelection with all required exports
vi.mock('@/hooks/useUnifiedSelection', () => ({
  useUnifiedSelection: () => ({
    currentSelection: { type: 'none' },
    hasSelection: false,
    canApplyTypography: false,
    appliedMarks: {},
    selectBlock: vi.fn(),
    selectText: vi.fn(),
    selectTable: vi.fn(),
    selectTableCell: vi.fn(),
    clearSelection: vi.fn(),
    applyTypography: vi.fn(),
    canApplyProperty: vi.fn(),
    preserveDuringToolbarInteraction: vi.fn((op) => op()),
    isBlockSelected: vi.fn(() => false),
    isTableCellSelected: vi.fn(() => false),
    getSelectedBlockId: vi.fn(() => null),
    getSelectedTableCell: vi.fn(() => null),
    enableDebugMode: vi.fn(),
    disableDebugMode: vi.fn(),
  }),
  useToolbarInteraction: () => ({
    preserveDuringOperation: vi.fn((op) => op()),
  }),
  useSelectionState: () => ({
    currentSelection: { type: 'none' },
    hasSelection: false,
    canApplyTypography: false,
    appliedMarks: {},
    selectionType: 'none',
  }),
  useTypographyActions: () => ({
    applyTypography: vi.fn(),
    canApplyProperty: vi.fn(),
    canApplyTypography: false,
    appliedMarks: {},
  }),
  useTableCellSelection: () => ({
    selectCell: vi.fn(),
    clearSelection: vi.fn(),
    isCellSelected: vi.fn(() => false),
    hasAnyCellSelected: false,
    getSelectedPosition: vi.fn(() => null),
  }),
}));

// Mock editorStore with all required exports
vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
    nodes: [],
    positions: {},
    mobilePositions: {},
    selectedNode: null,
    selectedNodeId: null,
    currentViewport: 'desktop',
    getEditor: () => null,
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    duplicateNode: vi.fn(),
    selectNode: vi.fn(),
    addNode: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    saveToDatabase: vi.fn(),
    exportToJSON: vi.fn(),
    loadFromJSON: vi.fn(),
    loadFromDatabase: vi.fn(),
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    isFullscreen: false,
    showGrid: true,
    showSnapGuides: false,
    toggleSnapGuides: vi.fn(),
    canvasZoom: 1.0,
    updateCanvasZoom: vi.fn(),
    setTextSelection: vi.fn(),
    initializeNodePosition: vi.fn(),
    updateNodePosition: vi.fn(),
    updateCurrentViewportPosition: vi.fn(),
    setPersistenceCallbacks: vi.fn(),
    canvas: {
      canvasWidth: 800,
      canvasHeight: 600,
      gridColumns: 12,
      snapTolerance: 10
    },
  }),
  useEditorActions: () => ({
    clearAllSelection: vi.fn(),
    activateBlock: vi.fn(),
    updateCurrentViewportPosition: vi.fn(),
    selectNode: vi.fn(),
    deleteNode: vi.fn(),
    duplicateNode: vi.fn(),
    updateNode: vi.fn(),
  }),
  useCanvasState: () => ({
    canvasBackgroundColor: 'hsl(var(--background))',
    showGrid: true,
    canvasZoom: 1.0,
    currentViewport: 'desktop',
    setCanvasBackgroundColor: vi.fn(),
    toggleGrid: vi.fn(),
    updateCanvasZoom: vi.fn(),
    switchViewport: vi.fn(),
  }),
  useCanvasActions: () => ({
    setCanvasBackgroundColor: vi.fn(),
    toggleGrid: vi.fn(),
    updateCanvasZoom: vi.fn(),
    switchViewport: vi.fn(),
    resetCanvas: vi.fn(),
    exportCanvas: vi.fn(),
  }),
}));

// Mock typography migration hook 
vi.mock('@/hooks/useTypographyMigration', () => ({
  useTypographyMigration: () => ({
    blocksNeedingMigration: [],
    hasPendingMigrations: false,
    isProcessing: false,
    migrateBlock: vi.fn(),
    migrateAllBlocks: vi.fn(),
  }),
}));

// Mock all lucide-react icons with a generic component
vi.mock('lucide-react', () => {
  const MockIcon = ({ size, className, ...props }: any) =>
    React.createElement('div', {
      'data-testid': 'mock-icon',
      'data-size': size,
      className,
      ...props,
    });

  // Create a comprehensive list of commonly used icons
  const iconNames = [
    'Plus',
    'Minus',
    'X',
    'Check',
    'ChevronDown',
    'ChevronUp',
    'ChevronLeft',
    'ChevronRight',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'User',
    'Settings',
    'Search',
    'Bell',
    'Heart',
    'Star',
    'BookOpen',
    'Edit',
    'Trash2',
    'Eye',
    'EyeOff',
    'Save',
    'Download',
    'Upload',
    'Share',
    'Copy',
    'Clipboard',
    'Link',
    'Unlink',
    'ExternalLink',
    'Mail',
    'Phone',
    'MapPin',
    'Calendar',
    'Clock',
    'Tag',
    'Filter',
    'Sort',
    'Grid',
    'List',
    'Image',
    'Video',
    'File',
    'Folder',
    'FolderOpen',
    'Archive',
    'Bookmark',
    'Flag',
    'Pin',
    'Lock',
    'Unlock',
    'Shield',
    'AlertTriangle',
    'AlertCircle',
    'Info',
    'CheckCircle',
    'XCircle',
    'HelpCircle',
    'Menu',
    'MoreHorizontal',
    'MoreVertical',
    'Dots',
    'Maximize',
    'Minimize',
    'Move',
    'Resize',
    'RotateCcw',
    'RotateCw',
    'RefreshCw',
    'Loader',
    'Spinner',
    'Activity',
    'TrendingUp',
    'TrendingDown',
    'BarChart',
    'PieChart',
    'LineChart',
    'Users',
    'UserPlus',
    'UserMinus',
    'MessageCircle',
    'MessageSquare',
    'Send',
    'Reply',
    'Forward',
    'ThumbsUp',
    'ThumbsDown',
    'Smile',
    'Frown',
    'Meh',
    'Coffee',
    'Sun',
    'Moon',
    'Cloud',
    'Zap',
    'Wifi',
    'WifiOff',
    'Battery',
    'Bluetooth',
    'Volume2',
    'VolumeX',
    'Play',
    'Pause',
    'Stop',
    'SkipBack',
    'SkipForward',
    'FastForward',
    'Rewind',
    'Music',
    'Headphones',
    'Mic',
    'MicOff',
    'Camera',
    'CameraOff',
    'Monitor',
    'Smartphone',
    'Tablet',
    'Laptop',
    'Printer',
    'HardDrive',
    'Server',
    'Database',
    'Globe',
    'Navigation',
    'Compass',
    'Map',
    'Route',
    'Car',
    'Truck',
    'Bus',
    'Bike',
    'Plane',
    'Train',
    'Ship',
    'Anchor',
    'Umbrella',
    'Package',
    'Gift',
    'ShoppingCart',
    'ShoppingBag',
    'CreditCard',
    'DollarSign',
    'Percent',
    'Calculator',
    'PlusCircle',
    'MinusCircle',
    'PlayCircle',
    'PauseCircle',
    'StopCircle',
    'Power',
    'Cpu',
    'Type',
    'Bold',
    'Italic',
    'Underline',
    'Strikethrough',
    'AlignLeft',
    'AlignCenter',
    'AlignRight',
    'AlignJustify',
    'Quote',
    'Code',
    'Terminal',
    'Command',
    'Hash',
    'AtSign',
    'Palette',
    'Brush',
    'Scissors',
    'Paperclip',
    'Layers',
    'Layout',
    'Sidebar',
    'PanelLeft',
    'PanelRight',
    'PanelTop',
    'PanelBottom',
    'Columns',
    'Rows',
    'Square',
    'Circle',
    'Triangle',
    'Diamond',
    'Hexagon',
    'Pentagon',
    'Octagon',
    'BarChart3',
    'FileText',
    'Lightbulb',
    'MousePointer',
    'Hand',
    'Table',
    'Table2',
    'ZoomIn',
    'ZoomOut',
    'Ruler',
    'LogOut',
    'LucideIcon',
    // H1-H6 Heading icons
    'Heading1',
    'Heading2',
    'Heading3',
    'Heading4',
    'Heading5',
    'Heading6',
    // Additional toolbar icons
    'Undo',
    'Redo',
    'Bold',
    'Italic',
    'Underline',
    'Strikethrough',
    'Quote',
    'Hash',
    'ListOrdered',
    'Highlighter',
    'AlignLeft',
    'AlignCenter',
    'AlignRight',
    'AlignJustify',
    // Block preset system icons
    'Edit3',
    'Star',
    'StarOff',
    'Search',
    'Settings',
    'Plus',
    'Heart',
    'Clock',
    'Grid',
    'Bookmark',
  ];

  const mockIcons: Record<string, any> = {};
  iconNames.forEach(name => {
    mockIcons[name] = MockIcon;
  });

  // Also add LucideIcon as a fallback
  mockIcons.LucideIcon = MockIcon;

  return {
    ...mockIcons,
    // Ensure default export exists
    default: mockIcons,
  };
});

// Clean test isolation
beforeEach(() => {
  vi.clearAllMocks();

  // Reset DOM
  document.body.innerHTML = '';

  // Reset storage
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});
