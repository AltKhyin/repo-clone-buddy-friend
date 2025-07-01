// ABOUTME: Tests to ensure all inspector component imports are properly resolved and accessible

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(() => ({
    nodes: [],
    updateNode: vi.fn(),
    selectedNodeId: null,
    isInspectorVisible: true,
    toggleInspector: vi.fn(),
  })),
}));

// Import all inspector components to verify no missing dependencies
import { HeadingBlockInspector } from '../HeadingBlockInspector';
import { TextBlockInspector } from '../TextBlockInspector';
import { PollBlockInspector } from '../PollBlockInspector';
import { VideoEmbedBlockInspector } from '../VideoEmbedBlockInspector';
import { SeparatorBlockInspector } from '../SeparatorBlockInspector';
import { KeyTakeawayBlockInspector } from '../KeyTakeawayBlockInspector';

// Import unified controls to verify exports
import {
  SpacingControls,
  BorderControls,
  BackgroundControls,
  TypographyControls,
  SliderControl,
  ColorControl,
} from '../shared/UnifiedControls';

// Import required icons to verify lucide-react exports
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
} from 'lucide-react';

// Import UI components to verify shadcn/ui exports
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

describe('Inspector Import Validation', () => {
  it('should have all required lucide-react icon imports', () => {
    // Verify that all commonly used icons are imported and accessible
    expect(AlignLeft).toBeDefined();
    expect(AlignCenter).toBeDefined();
    expect(AlignRight).toBeDefined();
    expect(Heading1).toBeDefined();
    expect(Heading2).toBeDefined();
    expect(Heading3).toBeDefined();
    expect(Heading4).toBeDefined();
    expect(Type).toBeDefined();
  });

  it('should have all required UI component imports', () => {
    // Verify that all commonly used UI components are imported and accessible
    expect(Select).toBeDefined();
    expect(SelectContent).toBeDefined();
    expect(SelectItem).toBeDefined();
    expect(SelectTrigger).toBeDefined();
    expect(SelectValue).toBeDefined();
  });

  it('should have all unified control exports', () => {
    // Verify that all unified controls are properly exported and accessible
    expect(SpacingControls).toBeDefined();
    expect(BorderControls).toBeDefined();
    expect(BackgroundControls).toBeDefined();
    expect(TypographyControls).toBeDefined();
    expect(SliderControl).toBeDefined();
    expect(ColorControl).toBeDefined();
  });

  it('should render all inspector components without import errors', () => {
    // Create mock node data for testing
    const mockNodeId = 'test-node-1';

    // Test each inspector component to ensure no missing imports cause runtime errors
    expect(() => {
      render(<HeadingBlockInspector nodeId={mockNodeId} />);
    }).not.toThrow();

    expect(() => {
      render(<TextBlockInspector nodeId={mockNodeId} />);
    }).not.toThrow();

    expect(() => {
      render(<PollBlockInspector nodeId={mockNodeId} />);
    }).not.toThrow();

    expect(() => {
      render(<VideoEmbedBlockInspector nodeId={mockNodeId} />);
    }).not.toThrow();

    expect(() => {
      render(<SeparatorBlockInspector nodeId={mockNodeId} />);
    }).not.toThrow();

    expect(() => {
      render(<KeyTakeawayBlockInspector nodeId={mockNodeId} />);
    }).not.toThrow();
  });
});
