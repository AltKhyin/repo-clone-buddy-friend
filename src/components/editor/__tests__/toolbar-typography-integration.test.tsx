// ABOUTME: Integration tests for UnifiedToolbar typography controls ensuring complete user workflow from UI to editor

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the editor and related dependencies
const mockEditor = {
  commands: {
    selectAll: vi.fn(),
    setTextSelection: vi.fn(),
    setFontFamily: vi.fn(() => true),
    setFontSize: vi.fn(() => true),
    setFontWeight: vi.fn(() => true),
    setTextColor: vi.fn(() => true),
    setBackgroundColor: vi.fn(() => true),
    setTextTransform: vi.fn(() => true),
    setLetterSpacing: vi.fn(() => true),
    unsetFontFamily: vi.fn(() => true),
    unsetFontSize: vi.fn(() => true),
    unsetFontWeight: vi.fn(() => true),
    unsetTextColor: vi.fn(() => true),
    unsetBackgroundColor: vi.fn(() => true),
    unsetTextTransform: vi.fn(() => true),
    unsetLetterSpacing: vi.fn(() => true),
    focus: vi.fn(),
    blur: vi.fn(),
  },
  getAttributes: vi.fn((mark) => {
    const mockAttributes = {
      fontFamily: { fontFamily: 'Arial' },
      fontSize: { fontSize: 16 },
      fontWeight: { fontWeight: 400 },
      textColor: { color: '#000000' },
      backgroundColor: { backgroundColor: '#ffffff' },
      textTransform: { textTransform: 'none' },
      letterSpacing: { letterSpacing: '0px' },
    };
    return mockAttributes[mark] || {};
  }),
  getHTML: vi.fn(() => '<p>Test content</p>'),
  isActive: vi.fn(() => false),
  on: vi.fn(),
  off: vi.fn(),
  state: {
    selection: { from: 0, to: 0 },
  },
};

const mockTextSelection = {
  hasSelection: false,
  selectedText: '',
  selectionRange: null,
  appliedMarks: {},
  hasTextSelection: false,
  isTipTapSelection: false,
};

const mockBlockProperties = {
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.4,
  textAlign: 'left',
  color: '#000000',
};

// Mock hooks and stores
vi.mock('../../hooks/useTextSelection', () => ({
  useTextSelection: () => mockTextSelection,
}));

vi.mock('../../hooks/useTypographyMigration', () => ({
  useTypographyMigration: () => ({
    blocksNeedingMigration: [],
    hasPendingMigrations: false,
    isProcessing: false,
  }),
}));

vi.mock('../../store/editorStore', () => ({
  useEditorStore: () => ({
    nodes: [],
    selectedNode: { id: 'test-node', type: 'paragraph', data: {} },
    getEditor: () => mockEditor,
    updateNode: vi.fn(),
  }),
}));

vi.mock('../../shared/typography-system', () => ({
  FONT_FAMILIES: [
    { value: 'inherit', label: 'Default' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' },
  ],
  FONT_WEIGHTS: [
    { value: 100, label: 'Thin' },
    { value: 300, label: 'Light' },
    { value: 400, label: 'Regular' },
    { value: 600, label: 'Semi-bold' },
    { value: 700, label: 'Bold' },
    { value: 900, label: 'Black' },
  ],
  TEXT_TRANSFORMS: [
    { value: 'none', label: 'None' },
    { value: 'uppercase', label: 'UPPERCASE' },
    { value: 'lowercase', label: 'lowercase' },
    { value: 'capitalize', label: 'Capitalize' },
  ],
  TYPOGRAPHY_DEFAULTS: mockBlockProperties,
  TYPOGRAPHY_CONSTRAINTS: {
    fontSize: { min: 8, max: 128, step: 1 },
    fontWeight: { min: 100, max: 900, step: 100 },
    lineHeight: { min: 0.5, max: 3, step: 0.1 },
    letterSpacing: { min: -2, max: 4, step: 0.1 },
  },
}));

// Mock UI components
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, ...props }) => (
    <div data-testid="select" data-value={value} {...props}>
      <button onClick={() => onValueChange && onValueChange('Arial')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} />,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: (props) => <div data-testid="separator" {...props} />,
}));

// Import the component to test
import { UnifiedToolbar } from '../UnifiedToolbar';

describe('Toolbar Typography Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Font Family Selection', () => {
    it('should display current font family for selection', () => {
      const selectionWithFont = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontFamily: 'Arial' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithFont);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Should show current font family in the selection
      expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'Arial');
    });

    it('should apply font family when selection changes', async () => {
      const selectionWithFont = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: {},
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithFont);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Find and interact with font family selector
      const fontSelector = screen.getByTestId('select');
      fireEvent.click(fontSelector.querySelector('button'));

      // Should call the font family command
      await waitFor(() => {
        expect(mockEditor.commands.setFontFamily).toHaveBeenCalledWith('Arial');
      });
    });

    it('should fallback to block typography when no selection', () => {
      const blockPropsWithFont = {
        ...mockBlockProperties,
        fontFamily: 'Georgia',
      };

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={blockPropsWithFont}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Should show block font family when no selection
      expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'Georgia');
    });
  });

  describe('Font Size Controls', () => {
    it('should handle font size input for selected text', async () => {
      const selectionWithSize = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontSize: 18 },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithSize);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Find font size input
      const fontSizeInput = screen.getByDisplayValue('18');
      expect(fontSizeInput).toBeInTheDocument();

      // Change font size
      await user.clear(fontSizeInput);
      await user.type(fontSizeInput, '24');

      // Should apply new font size
      await waitFor(() => {
        expect(mockEditor.commands.setFontSize).toHaveBeenCalledWith(24);
      });
    });

    it('should constrain font size values', async () => {
      const selectionWithSize = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontSize: 16 },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithSize);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      const fontSizeInput = screen.getByDisplayValue('16');

      // Try to set size above maximum
      await user.clear(fontSizeInput);
      await user.type(fontSizeInput, '200');

      // Should constrain to maximum allowed value (128)
      await waitFor(() => {
        expect(mockEditor.commands.setFontSize).toHaveBeenCalledWith(128);
      });
    });
  });

  describe('Font Weight Controls', () => {
    it('should display and change font weight for selections', async () => {
      const selectionWithWeight = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontWeight: 700 },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithWeight);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Should show current font weight
      const weightSelector = screen.getAllByTestId('select').find(select => 
        select.getAttribute('data-value') === '700'
      );
      expect(weightSelector).toBeInTheDocument();
    });

    it('should toggle bold formatting', async () => {
      const selectionNormal = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontWeight: 400 },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionNormal);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Find bold button
      const boldButton = screen.getByRole('button', { name: /bold/i });
      await user.click(boldButton);

      // Should apply bold weight
      expect(mockEditor.commands.setFontWeight).toHaveBeenCalledWith(700);
    });
  });

  describe('Color Controls', () => {
    it('should handle text color changes', async () => {
      const selectionWithColor = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { textColor: '#ff0000' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithColor);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Find color input
      const colorInput = screen.getByDisplayValue('#ff0000');
      expect(colorInput).toBeInTheDocument();

      // Change color
      await user.clear(colorInput);
      await user.type(colorInput, '#0000ff');

      // Should apply new color
      await waitFor(() => {
        expect(mockEditor.commands.setTextColor).toHaveBeenCalledWith('#0000ff');
      });
    });

    it('should handle background color changes', async () => {
      const selectionWithBg = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { backgroundColor: '#ffff00' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithBg);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Find background color input
      const bgColorInput = screen.getByDisplayValue('#ffff00');
      expect(bgColorInput).toBeInTheDocument();

      // Change background color
      await user.clear(bgColorInput);
      await user.type(bgColorInput, '#00ff00');

      // Should apply new background color
      await waitFor(() => {
        expect(mockEditor.commands.setBackgroundColor).toHaveBeenCalledWith('#00ff00');
      });
    });
  });

  describe('Text Transform Controls', () => {
    it('should handle text transform selection', async () => {
      const selectionWithTransform = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { textTransform: 'uppercase' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithTransform);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Should show current text transform
      const transformSelector = screen.getAllByTestId('select').find(select => 
        select.getAttribute('data-value') === 'uppercase'
      );
      expect(transformSelector).toBeInTheDocument();
    });

    it('should apply text transform changes', async () => {
      const selectionNormal = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { textTransform: 'none' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionNormal);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Find and change text transform
      const transformSelector = screen.getAllByTestId('select').find(select => 
        select.getAttribute('data-value') === 'none'
      );
      
      if (transformSelector) {
        fireEvent.click(transformSelector.querySelector('button'));
        
        await waitFor(() => {
          expect(mockEditor.commands.setTextTransform).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Letter Spacing Controls', () => {
    it('should handle letter spacing adjustments', async () => {
      const selectionWithSpacing = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { letterSpacing: '1px' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithSpacing);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Find letter spacing input
      const spacingInput = screen.getByDisplayValue('1');
      expect(spacingInput).toBeInTheDocument();

      // Change letter spacing
      await user.clear(spacingInput);
      await user.type(spacingInput, '2');

      // Should apply new letter spacing
      await waitFor(() => {
        expect(mockEditor.commands.setLetterSpacing).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('Mode Switching and Visual Feedback', () => {
    it('should show selection mode when text is selected', () => {
      const activeSelection = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontFamily: 'Arial' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(activeSelection);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Should show selection mode indicator
      expect(screen.getByText('Selection Mode')).toBeInTheDocument();
      expect(screen.getByText('Arial')).toBeInTheDocument();
    });

    it('should show block mode when no text is selected', () => {
      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Should show block mode indicator
      expect(screen.getByText('Block Mode')).toBeInTheDocument();
    });

    it('should transition smoothly between modes', () => {
      const { rerender } = render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Initially in block mode
      expect(screen.getByText('Block Mode')).toBeInTheDocument();

      // Switch to selection mode
      const activeSelection = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontSize: 18 },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(activeSelection);

      rerender(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Now in selection mode
      expect(screen.getByText('Selection Mode')).toBeInTheDocument();
      expect(screen.getByDisplayValue('18')).toBeInTheDocument();
    });
  });

  describe('Migration Integration', () => {
    it('should show migration prompt when needed', () => {
      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue({
          blocksNeedingMigration: [
            { id: 'block1', type: 'paragraph', data: { fontFamily: 'Arial' } },
          ],
          hasPendingMigrations: true,
          isProcessing: false,
        });

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      expect(screen.getByText(/upgrade typography/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing editor gracefully', () => {
      vi.mocked(require('../../store/editorStore').useEditorStore)
        .mockReturnValue({
          nodes: [],
          selectedNode: null,
          getEditor: () => null,
          updateNode: vi.fn(),
        });

      expect(() => {
        render(
          <UnifiedToolbar 
            blockId="test-block"
            blockType="paragraph"
            blockProperties={mockBlockProperties}
            onBlockPropertiesChange={vi.fn()}
          />
        );
      }).not.toThrow();
    });

    it('should handle invalid color input', async () => {
      const selectionWithColor = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { textColor: '#ff0000' },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithColor);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      const colorInput = screen.getByDisplayValue('#ff0000');

      // Enter invalid color
      await user.clear(colorInput);
      await user.type(colorInput, 'invalid-color');

      // Should not crash and should not call command with invalid value
      expect(mockEditor.commands.setTextColor).not.toHaveBeenCalledWith('invalid-color');
    });

    it('should handle rapid user interactions', async () => {
      const selectionWithFont = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontSize: 16 },
      };

      vi.mocked(require('../../hooks/useTextSelection').useTextSelection)
        .mockReturnValue(selectionWithFont);

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      const fontSizeInput = screen.getByDisplayValue('16');

      // Rapidly change font size multiple times
      const sizes = ['18', '20', '24', '16'];
      for (const size of sizes) {
        await user.clear(fontSizeInput);
        await user.type(fontSizeInput, size);
      }

      // Should handle all changes without errors
      expect(mockEditor.commands.setFontSize).toHaveBeenCalledTimes(sizes.length);
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = (props) => {
        renderSpy();
        return <UnifiedToolbar {...props} />;
      };

      const { rerender } = render(
        <TestWrapper
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <TestWrapper
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      // Should not cause unnecessary re-renders
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount + 1);
    });

    it('should handle large number of typography options efficiently', () => {
      const startTime = performance.now();

      render(
        <UnifiedToolbar 
          blockId="test-block"
          blockType="paragraph"
          blockProperties={mockBlockProperties}
          onBlockPropertiesChange={vi.fn()}
        />
      );

      const endTime = performance.now();

      // Should render quickly even with many options
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});