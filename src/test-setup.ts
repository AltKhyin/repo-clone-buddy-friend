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
    'Zap',
    'Battery',
    'Cpu',
    'HardDrive',
    'Wifi',
    'Bluetooth',
    'Type',
    'Bold',
    'Italic',
    'Underline',
    'AlignLeft',
    'AlignCenter',
    'AlignRight',
    'AlignJustify',
    'List',
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
    'Hash',
    'Minus',
    'MousePointer',
    'Hand',
  ];

  const mockIcons: Record<string, any> = {};
  iconNames.forEach(name => {
    mockIcons[name] = MockIcon;
  });

  return mockIcons;
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
