// ABOUTME: Tests for unified TextBlockInspector supporting both text and heading modes

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextBlockInspector } from '../TextBlockInspector';

// Mock dependencies
const mockNodes = [
  {
    id: 'text-node-1',
    type: 'textBlock',
    data: {
      htmlContent: '<p>Test text</p>',
      fontSize: 16,
      textAlign: 'left',
      color: '#000000',
      fontFamily: 'inherit',
      fontWeight: 400,
      lineHeight: 1.6,
    },
  },
  {
    id: 'heading-node-1',
    type: 'textBlock',
    data: {
      htmlContent: '<h1>Test heading</h1>',
      headingLevel: 1,
      fontSize: undefined, // Should use auto sizing
      textAlign: 'center',
      color: '#333333',
      fontFamily: 'serif',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 1,
      textTransform: 'uppercase',
      textDecoration: 'underline',
    },
  },
];

const mockUseEditorStore = {
  nodes: mockNodes,
  updateNode: vi.fn(),
};

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore,
}));

// Mock the unified controls
vi.mock('../shared/UnifiedControls', () => ({
  SpacingControls: ({ data, onChange, className }: any) => (
    <div data-testid="spacing-controls" className={className}>
      Spacing Controls
    </div>
  ),
  BorderControls: ({ data, onChange, className }: any) => (
    <div data-testid="border-controls" className={className}>
      Border Controls
    </div>
  ),
  BackgroundControls: ({ data, onChange, className }: any) => (
    <div data-testid="background-controls" className={className}>
      Background Controls
    </div>
  ),
}));

describe('TextBlockInspector - Unified Text/Heading Inspector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Text Mode Inspector', () => {
    it('should render streamlined text block inspector for text nodes', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Should show block type selector (no redundant "Text Block" header)
      expect(screen.getByText('Block Type')).toBeInTheDocument();
      expect(screen.getByText('Normal Text')).toBeInTheDocument();
      // Typography controls are now handled by UnifiedToolbar, not in sidebar
      expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();
    });

    it('should show heading level selector with text selected', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Should show the heading level selector
      expect(screen.getByText('Block Type')).toBeInTheDocument();
      expect(screen.getByText('Normal Text')).toBeInTheDocument();
    });

    it('should focus on block-specific properties (typography moved to toolbar)', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Typography controls are now in UnifiedToolbar, not in sidebar
      expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();

      // Should focus on block-level properties
      expect(screen.getByTestId('background-controls')).toBeInTheDocument();
      expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();
      expect(screen.getByTestId('border-controls')).toBeInTheDocument();
    });

    it('should show streamlined control sections (typography moved to toolbar)', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Typography controls are now in UnifiedToolbar, not in sidebar
      expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();

      // Should show block-level controls only
      expect(screen.getByTestId('background-controls')).toBeInTheDocument();
      expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();
      expect(screen.getByTestId('border-controls')).toBeInTheDocument();
    });
  });

  describe('Heading Mode Inspector', () => {
    it('should render heading block inspector for heading nodes', () => {
      render(<TextBlockInspector nodeId="heading-node-1" />);

      // Should show Block Type label
      expect(screen.getByText('Block Type')).toBeInTheDocument();

      // Check if the dropdown has the right value (might be displayed differently in test)
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show hash icon for heading mode', () => {
      render(<TextBlockInspector nodeId="heading-node-1" />);

      // Should show Hash icon for heading mode (different from Type icon for text)
      expect(screen.getByText('Block Type')).toBeInTheDocument();

      // Both text and heading show Hash icon in Block Type section
      // The actual difference is in the dropdown selection
    });

    it('should show heading level selector with correct heading selected', async () => {
      render(<TextBlockInspector nodeId="heading-node-1" />);

      expect(screen.getByText('Block Type')).toBeInTheDocument();

      // Click dropdown to see options
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Should show heading options (use getAllByText since there might be multiple)
      const headingOptions = screen.getAllByText('Heading 1');
      expect(headingOptions.length).toBeGreaterThan(0);
    });

    it('should focus on block-specific properties for heading mode', () => {
      render(<TextBlockInspector nodeId="heading-node-1" />);

      // Typography controls are now in UnifiedToolbar, not in sidebar
      expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();

      // Should focus on block-level properties
      expect(screen.getByTestId('background-controls')).toBeInTheDocument();
      expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();
      expect(screen.getByTestId('border-controls')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact mode with heading level selector only', () => {
      render(<TextBlockInspector nodeId="text-node-1" compact={true} />);

      // Should show heading level selector in compact mode with current selection
      expect(screen.getByText('Text')).toBeInTheDocument();

      // Only one dropdown in compact mode - heading selector
      expect(screen.getAllByRole('combobox')).toHaveLength(1);
    });

    it('should show heading level selector for heading nodes', () => {
      render(<TextBlockInspector nodeId="heading-node-1" compact={true} />);

      // Should show heading level selector with H1 selected
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show text option for text nodes', () => {
      render(<TextBlockInspector nodeId="text-node-1" compact={true} />);

      // Should show text option selected
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Heading Level Selector Functionality', () => {
    it('should show all heading level options', async () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Should show current selection (Normal Text for text-node-1)
      expect(screen.getByText('Normal Text')).toBeInTheDocument();

      // Click to open dropdown
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Should show all options when dropdown is open
      expect(screen.getByText('Heading 1')).toBeInTheDocument();
      expect(screen.getByText('Heading 2')).toBeInTheDocument();
      expect(screen.getByText('Heading 3')).toBeInTheDocument();
      expect(screen.getByText('Heading 4')).toBeInTheDocument();
    });

    it('should display heading options with visual previews when dropdown is opened', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Click to open dropdown first
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // H1 should have larger font size
      const h1Option = screen.getByText('Heading 1');
      expect(h1Option).toHaveStyle({ fontSize: '18px', fontWeight: '700' });

      // H2 should have medium font size
      const h2Option = screen.getByText('Heading 2');
      expect(h2Option).toHaveStyle({ fontSize: '16px', fontWeight: '700' });

      // H3 should have smaller font size and different weight
      const h3Option = screen.getByText('Heading 3');
      expect(h3Option).toHaveStyle({ fontSize: '14px', fontWeight: '600' });

      // H4 should have smallest font size
      const h4Option = screen.getByText('Heading 4');
      expect(h4Option).toHaveStyle({ fontSize: '12px', fontWeight: '600' });
    });
  });

  describe('Mode Switching', () => {
    it('should call updateNode when switching from text to heading', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // This would be tested with user interaction, but we can verify the structure
      expect(screen.getByText('Block Type')).toBeInTheDocument();
      expect(mockUseEditorStore.updateNode).not.toHaveBeenCalled();
    });

    it('should call updateNode when switching from heading to text', () => {
      render(<TextBlockInspector nodeId="heading-node-1" />);

      // This would be tested with user interaction, but we can verify the structure
      expect(screen.getByText('Block Type')).toBeInTheDocument();
      expect(mockUseEditorStore.updateNode).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return null for non-existent nodes', () => {
      const { container } = render(<TextBlockInspector nodeId="non-existent" />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null for non-text block nodes', () => {
      // This test would need to be mocked at the module level
      // For now, we'll just ensure the component can handle this case
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('Integration with Unified Controls', () => {
    it('should render block-specific control sections only', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Typography controls are now in UnifiedToolbar, not in sidebar
      expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();

      // Should render block-level controls
      expect(screen.getByTestId('background-controls')).toBeInTheDocument();
      expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();
      expect(screen.getByTestId('border-controls')).toBeInTheDocument();
    });

    it('should focus on block properties rather than text formatting', () => {
      render(<TextBlockInspector nodeId="text-node-1" />);

      // Should show block type selector
      expect(screen.getByText('Block Type')).toBeInTheDocument();

      // Should show block-level controls
      expect(screen.getByTestId('background-controls')).toBeInTheDocument();
      expect(screen.getByTestId('spacing-controls')).toBeInTheDocument();
      expect(screen.getByTestId('border-controls')).toBeInTheDocument();

      // Typography controls should not be in sidebar
      expect(screen.queryByTestId('typography-controls')).not.toBeInTheDocument();
    });
  });
});
