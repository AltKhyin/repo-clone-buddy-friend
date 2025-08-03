// ABOUTME: Integration tests for typography UI components ensuring proper visual feedback and user interactions

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock dependencies
const mockEditor = {
  commands: {
    selectAll: vi.fn(),
    setTextSelection: vi.fn(),
    setFontFamily: vi.fn(() => true),
    setFontSize: vi.fn(() => true),
    setFontWeight: vi.fn(() => true),
    setTextColor: vi.fn(() => true),
    unsetFontFamily: vi.fn(() => true),
    focus: vi.fn(),
  },
  getAttributes: vi.fn(() => ({})),
  getHTML: vi.fn(() => '<p>Test content</p>'),
  isActive: vi.fn(() => false),
  on: vi.fn(),
  off: vi.fn(),
};

const mockTextSelection = {
  hasSelection: false,
  selectedText: '',
  selectionRange: null,
  appliedMarks: {},
  hasTextSelection: false,
  isTipTapSelection: false,
};

const mockTypographyMigration = {
  blocksNeedingMigration: [],
  migrationState: {
    isProcessing: false,
    currentBlockId: null,
    progress: 0,
    totalBlocks: 0,
    completedBlocks: 0,
    results: [],
    errors: [],
  },
  migrationStats: {
    totalBlocks: 0,
    completedBlocks: 0,
    successfulBlocks: 0,
    failedBlocks: 0,
    totalMigrated: 0,
    isComplete: false,
  },
  migrateAllBlocks: vi.fn(),
  cancelMigration: vi.fn(),
  resetMigrationState: vi.fn(),
  hasPendingMigrations: false,
  isProcessing: false,
};

// Mock hooks
vi.mock('../../hooks/useTextSelection', () => ({
  useTextSelection: () => mockTextSelection,
}));

vi.mock('../../hooks/useTypographyMigration', () => ({
  useTypographyMigration: () => mockTypographyMigration,
}));

vi.mock('../../store/editorStore', () => ({
  useEditorStore: () => ({
    nodes: [],
    getEditor: () => mockEditor,
    updateNode: vi.fn(),
  }),
}));

// Import components to test
import { SelectionIndicator } from '../shared/SelectionIndicator';
import { TypographyModeIndicator } from '../shared/TypographyModeIndicator';
import { MigrationPrompt } from '../MigrationPrompt';

describe('Typography UI Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('SelectionIndicator Integration', () => {
    it('should display no indicator when no text is selected', () => {
      render(
        <SelectionIndicator 
          textSelection={mockTextSelection}
          className="test-indicator"
        />
      );

      // Should not render anything when no selection
      expect(screen.queryByText(/selection/i)).not.toBeInTheDocument();
    });

    it('should display active formatting when text is selected', () => {
      const selectionWithMarks = {
        ...mockTextSelection,
        hasSelection: true,
        selectedText: 'selected text',
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: {
          fontFamily: 'Arial',
          fontSize: 18,
          fontWeight: 700,
          textColor: '#ff0000',
        },
      };

      render(
        <SelectionIndicator 
          textSelection={selectionWithMarks}
          className="test-indicator"
        />
      );

      // Should show applied formatting
      expect(screen.getByText('Arial')).toBeInTheDocument();
      expect(screen.getByText('18px')).toBeInTheDocument();
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('#ff0000')).toBeInTheDocument();
    });

    it('should display compact format for toolbar integration', () => {
      const selectionWithMarks = {
        ...mockTextSelection,
        hasSelection: true,
        selectedText: 'test',
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: {
          fontFamily: 'Arial',
          fontSize: 16,
        },
      };

      render(
        <SelectionIndicator 
          textSelection={selectionWithMarks}
          compact={true}
          className="test-compact"
        />
      );

      // Should show formatting in compact format
      expect(screen.getByText('Arial')).toBeInTheDocument();
      expect(screen.getByText('16px')).toBeInTheDocument();
    });

    it('should handle multiple active marks gracefully', () => {
      const selectionWithManyMarks = {
        ...mockTextSelection,
        hasSelection: true,
        selectedText: 'complex text',
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: {
          fontFamily: 'Times New Roman',
          fontSize: 24,
          fontWeight: 600,
          textColor: '#0066cc',
          backgroundColor: '#fff3cd',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        },
      };

      render(
        <SelectionIndicator 
          textSelection={selectionWithManyMarks}
          className="test-many-marks"
        />
      );

      // Should display all formatting information
      expect(screen.getByText('Times New Roman')).toBeInTheDocument();
      expect(screen.getByText('24px')).toBeInTheDocument();
      expect(screen.getByText('Semi-bold')).toBeInTheDocument();
      expect(screen.getByText('#0066cc')).toBeInTheDocument();
      expect(screen.getByText('#fff3cd')).toBeInTheDocument();
      expect(screen.getByText('UPPERCASE')).toBeInTheDocument();
      expect(screen.getByText('1.5px')).toBeInTheDocument();
    });
  });

  describe('TypographyModeIndicator Integration', () => {
    it('should indicate selection mode when text is selected', () => {
      const selectionMode = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
      };

      render(
        <TypographyModeIndicator 
          textSelection={selectionMode}
          isBlockTypographySupported={true}
          selectedNodeType="paragraph"
        />
      );

      expect(screen.getByText('Selection Mode')).toBeInTheDocument();
    });

    it('should indicate block mode when no text selection but block supports typography', () => {
      render(
        <TypographyModeIndicator 
          textSelection={mockTextSelection}
          isBlockTypographySupported={true}
          selectedNodeType="paragraph"
        />
      );

      expect(screen.getByText('Block Mode')).toBeInTheDocument();
    });

    it('should indicate no typography support when block does not support typography', () => {
      render(
        <TypographyModeIndicator 
          textSelection={mockTextSelection}
          isBlockTypographySupported={false}
          selectedNodeType="image"
        />
      );

      expect(screen.getByText('No Typography')).toBeInTheDocument();
    });

    it('should show proper visual distinction between modes', () => {
      const { rerender } = render(
        <TypographyModeIndicator 
          textSelection={mockTextSelection}
          isBlockTypographySupported={true}
          selectedNodeType="paragraph"
        />
      );

      // Block mode styling
      const blockModeElement = screen.getByText('Block Mode');
      expect(blockModeElement).toHaveClass('text-blue-600');

      // Switch to selection mode
      const selectionMode = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
      };

      rerender(
        <TypographyModeIndicator 
          textSelection={selectionMode}
          isBlockTypographySupported={true}
          selectedNodeType="paragraph"
        />
      );

      // Selection mode styling
      const selectionModeElement = screen.getByText('Selection Mode');
      expect(selectionModeElement).toHaveClass('text-green-600');
    });
  });

  describe('MigrationPrompt Integration', () => {
    it('should not show migration prompt when no migrations are needed', () => {
      render(<MigrationPrompt />);

      expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/migration/i)).not.toBeInTheDocument();
    });

    it('should show migration prompt when blocks need migration', () => {
      const migrationNeeded = {
        ...mockTypographyMigration,
        hasPendingMigrations: true,
        blocksNeedingMigration: [
          { id: 'block1', type: 'paragraph', data: { fontFamily: 'Arial' } },
          { id: 'block2', type: 'heading', data: { fontSize: 24 } },
        ],
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationNeeded);

      render(<MigrationPrompt />);

      expect(screen.getByText(/upgrade to selection-based typography/i)).toBeInTheDocument();
      expect(screen.getByText('2 blocks')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /migrate now/i })).toBeInTheDocument();
    });

    it('should show migration progress during processing', () => {
      const migrationInProgress = {
        ...mockTypographyMigration,
        hasPendingMigrations: true,
        isProcessing: true,
        migrationState: {
          ...mockTypographyMigration.migrationState,
          isProcessing: true,
          currentBlockId: 'block-123',
          progress: 50,
          totalBlocks: 4,
          completedBlocks: 2,
        },
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationInProgress);

      render(<MigrationPrompt />);

      expect(screen.getByText(/migrating typography/i)).toBeInTheDocument();
      expect(screen.getByText(/processing block 3 of 4/i)).toBeInTheDocument();
      expect(screen.getByText(/block-123/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should show completion status after successful migration', () => {
      const migrationComplete = {
        ...mockTypographyMigration,
        migrationStats: {
          ...mockTypographyMigration.migrationStats,
          isComplete: true,
          totalBlocks: 5,
          successfulBlocks: 4,
          failedBlocks: 1,
          totalMigrated: 12,
        },
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationComplete);

      render(<MigrationPrompt />);

      expect(screen.getByText(/migration complete/i)).toBeInTheDocument();
      expect(screen.getByText(/successfully migrated 12 typography properties/i)).toBeInTheDocument();
      expect(screen.getByText(/across 4 blocks/i)).toBeInTheDocument();
      expect(screen.getByText(/1 had issues/i)).toBeInTheDocument();
    });

    it('should handle migration interaction', async () => {
      const migrationNeeded = {
        ...mockTypographyMigration,
        hasPendingMigrations: true,
        blocksNeedingMigration: [
          { id: 'block1', type: 'paragraph', data: { fontFamily: 'Arial' } },
        ],
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationNeeded);

      render(<MigrationPrompt />);

      const migrateButton = screen.getByRole('button', { name: /migrate now/i });
      await user.click(migrateButton);

      expect(migrationNeeded.migrateAllBlocks).toHaveBeenCalled();
    });

    it('should handle migration cancellation', async () => {
      const migrationInProgress = {
        ...mockTypographyMigration,
        hasPendingMigrations: true,
        isProcessing: true,
        migrationState: {
          ...mockTypographyMigration.migrationState,
          isProcessing: true,
          totalBlocks: 2,
          completedBlocks: 1,
        },
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationInProgress);

      render(<MigrationPrompt />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(migrationInProgress.cancelMigration).toHaveBeenCalled();
    });
  });

  describe('Component Integration Scenarios', () => {
    it('should coordinate between selection indicator and mode indicator', () => {
      const activeSelection = {
        ...mockTextSelection,
        hasSelection: true,
        selectedText: 'test text',
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: {
          fontFamily: 'Arial',
          fontSize: 16,
        },
      };

      render(
        <div>
          <TypographyModeIndicator 
            textSelection={activeSelection}
            isBlockTypographySupported={true}
            selectedNodeType="paragraph"
          />
          <SelectionIndicator 
            textSelection={activeSelection}
          />
        </div>
      );

      // Both components should show selection-related information
      expect(screen.getByText('Selection Mode')).toBeInTheDocument();
      expect(screen.getByText('Arial')).toBeInTheDocument();
      expect(screen.getByText('16px')).toBeInTheDocument();
    });

    it('should handle transition from block mode to selection mode', () => {
      const { rerender } = render(
        <div>
          <TypographyModeIndicator 
            textSelection={mockTextSelection}
            isBlockTypographySupported={true}
            selectedNodeType="paragraph"
          />
          <SelectionIndicator 
            textSelection={mockTextSelection}
          />
        </div>
      );

      // Initially in block mode
      expect(screen.getByText('Block Mode')).toBeInTheDocument();
      expect(screen.queryByText('Arial')).not.toBeInTheDocument();

      // User makes selection
      const withSelection = {
        ...mockTextSelection,
        hasSelection: true,
        selectedText: 'selected',
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontFamily: 'Arial' },
      };

      rerender(
        <div>
          <TypographyModeIndicator 
            textSelection={withSelection}
            isBlockTypographySupported={true}
            selectedNodeType="paragraph"
          />
          <SelectionIndicator 
            textSelection={withSelection}
          />
        </div>
      );

      // Now in selection mode
      expect(screen.getByText('Selection Mode')).toBeInTheDocument();
      expect(screen.getByText('Arial')).toBeInTheDocument();
    });

    it('should show migration prompt alongside other components without conflicts', () => {
      const migrationNeeded = {
        ...mockTypographyMigration,
        hasPendingMigrations: true,
        blocksNeedingMigration: [
          { id: 'block1', type: 'paragraph', data: { fontFamily: 'Arial' } },
        ],
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationNeeded);

      const activeSelection = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontSize: 18 },
      };

      render(
        <div>
          <MigrationPrompt />
          <TypographyModeIndicator 
            textSelection={activeSelection}
            isBlockTypographySupported={true}
            selectedNodeType="paragraph"
          />
          <SelectionIndicator 
            textSelection={activeSelection}
          />
        </div>
      );

      // All components should render without conflicts
      expect(screen.getByText(/upgrade to selection-based typography/i)).toBeInTheDocument();
      expect(screen.getByText('Selection Mode')).toBeInTheDocument();
      expect(screen.getByText('18px')).toBeInTheDocument();
    });
  });

  describe('Accessibility and Usability', () => {
    it('should provide proper ARIA labels and roles', () => {
      const activeSelection = {
        ...mockTextSelection,
        hasSelection: true,
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: { fontFamily: 'Arial', fontSize: 18 },
      };

      render(
        <SelectionIndicator 
          textSelection={activeSelection}
          className="test-aria"
        />
      );

      // Should have appropriate ARIA attributes
      const container = screen.getByRole('group', { name: /active formatting/i });
      expect(container).toBeInTheDocument();
    });

    it('should support keyboard navigation for interactive elements', async () => {
      const migrationNeeded = {
        ...mockTypographyMigration,
        hasPendingMigrations: true,
        blocksNeedingMigration: [
          { id: 'block1', type: 'paragraph', data: { fontFamily: 'Arial' } },
        ],
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationNeeded);

      render(<MigrationPrompt />);

      const migrateButton = screen.getByRole('button', { name: /migrate now/i });
      
      // Should be focusable
      migrateButton.focus();
      expect(migrateButton).toHaveFocus();

      // Should activate with Enter key
      fireEvent.keyDown(migrateButton, { key: 'Enter' });
      expect(migrationNeeded.migrateAllBlocks).toHaveBeenCalled();
    });

    it('should provide clear visual feedback for user actions', () => {
      const migrationInProgress = {
        ...mockTypographyMigration,
        hasPendingMigrations: true,
        isProcessing: true,
        migrationState: {
          ...mockTypographyMigration.migrationState,
          isProcessing: true,
          progress: 75,
        },
      };

      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(migrationInProgress);

      render(<MigrationPrompt />);

      // Should show visual progress indicators
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/migrating typography/i)).toBeInTheDocument();
    });

    it('should handle screen reader compatibility', () => {
      const complexSelection = {
        ...mockTextSelection,
        hasSelection: true,
        selectedText: 'complex formatting example',
        hasTextSelection: true,
        isTipTapSelection: true,
        appliedMarks: {
          fontFamily: 'Times New Roman',
          fontSize: 20,
          fontWeight: 700,
          textColor: '#2c3e50',
          textTransform: 'capitalize',
        },
      };

      render(
        <SelectionIndicator 
          textSelection={complexSelection}
          className="test-screen-reader"
        />
      );

      // Should provide meaningful text for screen readers
      expect(screen.getByText('Times New Roman')).toBeInTheDocument();
      expect(screen.getByText('20px')).toBeInTheDocument();
      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('#2c3e50')).toBeInTheDocument();
      expect(screen.getByText('Capitalize')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed selection data gracefully', () => {
      const malformedSelection = {
        hasSelection: true,
        selectedText: null as any,
        selectionRange: undefined as any,
        appliedMarks: null as any,
        hasTextSelection: true,
        isTipTapSelection: true,
      };

      expect(() => {
        render(
          <SelectionIndicator 
            textSelection={malformedSelection}
            className="test-malformed"
          />
        );
      }).not.toThrow();
    });

    it('should handle missing migration hook data', () => {
      vi.mocked(require('../../hooks/useTypographyMigration').useTypographyMigration)
        .mockReturnValue(null);

      expect(() => {
        render(<MigrationPrompt />);
      }).not.toThrow();
    });

    it('should handle rapid state changes without flickering', async () => {
      const { rerender } = render(
        <TypographyModeIndicator 
          textSelection={mockTextSelection}
          isBlockTypographySupported={true}
          selectedNodeType="paragraph"
        />
      );

      // Rapidly change between states
      const states = [
        { ...mockTextSelection, hasSelection: true, hasTextSelection: true, isTipTapSelection: true },
        { ...mockTextSelection, hasSelection: false },
        { ...mockTextSelection, hasSelection: true, hasTextSelection: true, isTipTapSelection: true },
        { ...mockTextSelection, hasSelection: false },
      ];

      for (const state of states) {
        rerender(
          <TypographyModeIndicator 
            textSelection={state}
            isBlockTypographySupported={true}
            selectedNodeType="paragraph"
          />
        );
        
        // Should always render something meaningful
        expect(screen.getByText(/mode/i)).toBeInTheDocument();
      }
    });
  });
});