// ABOUTME: End-to-end integration tests for selection-based typography workflow ensuring complete user experience

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

// Import typography marks
import { FontFamilyMark } from '../extensions/marks/FontFamilyMark';
import { FontSizeMark } from '../extensions/marks/FontSizeMark';
import { FontWeightMark } from '../extensions/marks/FontWeightMark';
import { TextColorMark } from '../extensions/marks/TextColorMark';
import { BackgroundColorMark } from '../extensions/marks/BackgroundColorMark';
import { TextTransformMark } from '../extensions/marks/TextTransformMark';
import { LetterSpacingMark } from '../extensions/marks/LetterSpacingMark';

// Import components for integration testing
import { UnifiedToolbar } from '../UnifiedToolbar';
import { SelectionIndicator } from '../shared/SelectionIndicator';
import { TypographyModeIndicator } from '../shared/TypographyModeIndicator';
import { MigrationPrompt } from '../MigrationPrompt';

// Import hooks and utilities
import { useTextSelection } from '../../hooks/useTextSelection';
import { createTypographyCommands } from '../shared/typography-commands';
import { createTypographyMigration } from '../shared/typography-migration';
import { createConflictResolver } from '../shared/typography-conflict-resolver';

// Mock React hook
const mockUseTextSelection = vi.fn();
vi.mock('../../hooks/useTextSelection', () => ({
  useTextSelection: () => mockUseTextSelection(),
}));

// Mock editor store
const mockEditorStore = {
  nodes: [],
  getEditor: vi.fn(),
  updateNode: vi.fn(),
};

vi.mock('../../store/editorStore', () => ({
  useEditorStore: () => mockEditorStore,
}));

describe('Typography Integration Tests', () => {
  let editor: Editor;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    editor = new Editor({
      extensions: [
        Document,
        Paragraph,
        Text,
        FontFamilyMark,
        FontSizeMark,
        FontWeightMark,
        TextColorMark,
        BackgroundColorMark,
        TextTransformMark,
        LetterSpacingMark,
      ],
      content: '<p>The quick brown fox jumps over the lazy dog. This is a sample text for testing typography features.</p>',
    });

    user = userEvent.setup();

    // Setup default mock returns
    mockUseTextSelection.mockReturnValue({
      hasSelection: false,
      selectedText: '',
      selectionRange: null,
      appliedMarks: {},
      hasTextSelection: false,
      isTipTapSelection: false,
    });

    mockEditorStore.getEditor.mockReturnValue(editor);
  });

  describe('Complete Selection-to-Typography Workflow', () => {
    it('should handle complete user workflow: select text → apply typography → verify results', async () => {
      // Step 1: User makes a text selection
      editor.commands.setTextSelection({ from: 5, to: 15 }); // Select "quick brown"
      
      // Mock text selection hook to reflect selection
      mockUseTextSelection.mockReturnValue({
        hasSelection: true,
        selectedText: 'quick brown',
        selectionRange: { from: 5, to: 15 },
        appliedMarks: {},
        hasTextSelection: true,
        isTipTapSelection: true,
      });

      // Step 2: Create typography commands for the selection
      const typographyCommands = createTypographyCommands(editor);
      
      // Step 3: Apply multiple typography properties
      const result = typographyCommands.applyProperties({
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        textColor: '#ff0000',
      });

      expect(result.success).toBe(true);
      expect(result.appliedProperties).toEqual({
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 700,
        textColor: '#ff0000',
      });

      // Step 4: Verify HTML output contains the applied styling
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-size: 18px');
      expect(html).toContain('font-weight: 700');
      expect(html).toContain('color: #ff0000');

      // Step 5: Verify selection still contains the expected text content
      expect(html).toContain('quick brown');
    });

    it('should handle overlapping selections with different typography', async () => {
      // Apply formatting to first selection
      editor.commands.setTextSelection({ from: 1, to: 10 });
      editor.commands.setFontFamily('Arial');
      editor.commands.setFontSize(16);

      // Apply different formatting to overlapping selection
      editor.commands.setTextSelection({ from: 5, to: 15 });
      editor.commands.setFontFamily('Georgia');
      editor.commands.setTextColor('#0000ff');

      // Verify both formatting applications exist in HTML
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-family: Georgia');
      expect(html).toContain('color: #0000ff');
    });

    it('should handle typography changes on existing formatted text', async () => {
      // Initial formatting
      editor.commands.selectAll();
      editor.commands.setFontFamily('Arial');
      editor.commands.setFontSize(16);

      // Change formatting on subset
      editor.commands.setTextSelection({ from: 10, to: 20 });
      editor.commands.setFontWeight(700);
      editor.commands.setTextColor('#ff0000');

      // Verify mixed formatting
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-size: 16px');
      expect(html).toContain('font-weight: 700');
      expect(html).toContain('color: #ff0000');
    });
  });

  describe('Typography Command Integration', () => {
    it('should integrate typography commands with editor state', async () => {
      const typographyCommands = createTypographyCommands(editor);

      editor.commands.selectAll();

      // Apply properties through command system
      const result = typographyCommands.applyProperties({
        fontFamily: 'Georgia',
        fontSize: 20,
        textTransform: 'uppercase',
      });

      expect(result.success).toBe(true);

      // Verify through editor attributes
      expect(editor.getAttributes('fontFamily').fontFamily).toBe('Georgia');
      expect(editor.getAttributes('fontSize').fontSize).toBe(20);
      expect(editor.getAttributes('textTransform').textTransform).toBe('uppercase');

      // Verify through getCurrentAttributes
      const currentAttrs = typographyCommands.getCurrentAttributes();
      expect(currentAttrs.fontFamily).toBe('Georgia');
      expect(currentAttrs.fontSize).toBe(20);
      expect(currentAttrs.textTransform).toBe('uppercase');
    });

    it('should handle property removal through command system', async () => {
      const typographyCommands = createTypographyCommands(editor);

      editor.commands.selectAll();

      // Apply initial properties
      typographyCommands.applyProperties({
        fontFamily: 'Arial',
        fontSize: 18,
        textColor: '#ff0000',
      });

      // Remove specific property
      const removeResult = typographyCommands.unsetProperty('fontSize');
      expect(removeResult.success).toBe(true);

      // Verify property was removed but others remain
      const currentAttrs = typographyCommands.getCurrentAttributes();
      expect(currentAttrs.fontFamily).toBe('Arial');
      expect(currentAttrs.fontSize).toBeUndefined();
      expect(currentAttrs.textColor).toBe('#ff0000');
    });
  });

  describe('Migration Integration', () => {
    it('should migrate block typography to selection-based marks', async () => {
      const migration = createTypographyMigration(editor);

      // Simulate block with legacy typography data
      const blockData = {
        fontFamily: 'Times New Roman',
        fontSize: 24,
        fontWeight: 600,
        color: '#333333',
      };

      const result = migration.migrateBlockTypographyToMarks(blockData);

      expect(result.success).toBe(true);
      expect(result.migratedProperties).toEqual(['fontFamily', 'fontSize', 'fontWeight', 'color']);
      expect(result.appliedMarksCount).toBe(4);

      // Verify migration applied to editor
      const html = editor.getHTML();
      expect(html).toContain('font-family: Times New Roman');
      expect(html).toContain('font-size: 24px');
      expect(html).toContain('font-weight: 600');
      expect(html).toContain('color: #333333');
    });

    it('should preview migration without applying changes', async () => {
      const migration = createTypographyMigration(editor);
      const originalHtml = editor.getHTML();

      const blockData = {
        fontFamily: 'Arial',
        fontSize: 16,
        invalidProperty: 'invalid',
      };

      const preview = migration.previewMigration(blockData);

      expect(preview.willMigrate).toEqual(['fontFamily', 'fontSize']);
      expect(preview.willSkip).toContain('invalidProperty');
      expect(preview.estimatedMarksCount).toBe(2);

      // Verify no changes were actually applied
      expect(editor.getHTML()).toBe(originalHtml);
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should detect and resolve typography conflicts', async () => {
      const resolver = createConflictResolver(editor);

      // Create conflicting typography
      editor.commands.setTextSelection({ from: 1, to: 10 });
      editor.commands.setFontFamily('Arial');
      editor.commands.setTextColor('#ffffff');
      editor.commands.setBackgroundColor('#f0f0f0'); // Low contrast

      editor.commands.setTextSelection({ from: 5, to: 15 });
      editor.commands.setFontFamily('Georgia'); // Overlapping different font

      // Detect conflicts
      const conflicts = resolver.detectConflicts({ scope: 'document' });

      expect(conflicts.length).toBeGreaterThan(0);

      // Find specific conflict types
      const overlapConflicts = conflicts.filter(c => c.type === 'mark_overlap');
      const contrastConflicts = conflicts.filter(c => c.type === 'contradictory');

      expect(overlapConflicts.length).toBeGreaterThan(0);
      expect(contrastConflicts.length).toBeGreaterThan(0);

      // Resolve conflicts
      const resolution = resolver.resolveConflicts(conflicts, 'latest_wins');

      expect(resolution.success).toBe(true);
      expect(resolution.resolvedConflicts).toBeGreaterThan(0);
    });

    it('should auto-resolve conflicts with user preferences', async () => {
      const resolver = createConflictResolver(editor);

      // Create conflicts
      editor.commands.setTextSelection({ from: 1, to: 10 });
      editor.commands.setFontFamily('Arial');
      
      editor.commands.setTextSelection({ from: 5, to: 15 });
      editor.commands.setFontFamily('Georgia');

      // Auto-resolve with specific strategy
      const resolution = resolver.resolveConflicts(
        resolver.detectConflicts(),
        'user_choice',
        { fontFamily: 'Times New Roman' }
      );

      expect(resolution.success).toBe(true);
    });
  });

  describe('Real-world User Scenarios', () => {
    it('should handle complex document editing workflow', async () => {
      const typographyCommands = createTypographyCommands(editor);

      // Scenario: User formats document title
      editor.commands.setTextSelection({ from: 1, to: 20 });
      typographyCommands.applyProperties({
        fontFamily: 'Georgia',
        fontSize: 24,
        fontWeight: 700,
        textColor: '#2c3e50',
      });

      // Scenario: User formats a specific word for emphasis
      editor.commands.setTextSelection({ from: 25, to: 30 });
      typographyCommands.applyProperties({
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
      });

      // Scenario: User highlights important section
      editor.commands.setTextSelection({ from: 40, to: 70 });
      typographyCommands.applyProperties({
        backgroundColor: '#fff3cd',
        textColor: '#856404',
      });

      // Verify all formatting exists
      const html = editor.getHTML();
      expect(html).toContain('font-family: Georgia');
      expect(html).toContain('font-size: 24px');
      expect(html).toContain('text-transform: uppercase');
      expect(html).toContain('letter-spacing: 1px');
      expect(html).toContain('background-color: #fff3cd');
      expect(html).toContain('color: #856404');
    });

    it('should handle rapid successive formatting changes', async () => {
      const typographyCommands = createTypographyCommands(editor);

      editor.commands.selectAll();

      // Simulate user rapidly changing their mind about formatting
      const changes = [
        { fontFamily: 'Arial', fontSize: 16 },
        { fontFamily: 'Georgia', fontSize: 18 },
        { fontFamily: 'Times New Roman', fontSize: 20 },
        { fontWeight: 700, textColor: '#ff0000' },
        { fontWeight: 300, textColor: '#0000ff' },
      ];

      changes.forEach(change => {
        const result = typographyCommands.applyProperties(change);
        expect(result.success).toBe(true);
      });

      // Verify final state
      const currentAttrs = typographyCommands.getCurrentAttributes();
      expect(currentAttrs.fontFamily).toBe('Times New Roman');
      expect(currentAttrs.fontSize).toBe(20);
      expect(currentAttrs.fontWeight).toBe(300);
      expect(currentAttrs.textColor).toBe('#0000ff');
    });

    it('should handle copy-paste with formatting preservation', async () => {
      // Apply initial formatting
      editor.commands.selectAll();
      editor.commands.setFontFamily('Arial');
      editor.commands.setFontSize(18);
      editor.commands.setTextColor('#333333');

      // Simulate copy operation (get formatted content)
      const formattedContent = editor.getHTML();

      // Create new editor instance to simulate paste destination
      const newEditor = new Editor({
        extensions: [
          Document,
          Paragraph,
          Text,
          FontFamilyMark,
          FontSizeMark,
          FontWeightMark,
          TextColorMark,
          BackgroundColorMark,
          TextTransformMark,
          LetterSpacingMark,
        ],
        content: '<p>Target document content</p>',
      });

      // Simulate paste operation
      newEditor.commands.setContent(formattedContent);

      // Verify formatting was preserved
      const pastedHtml = newEditor.getHTML();
      expect(pastedHtml).toContain('font-family: Arial');
      expect(pastedHtml).toContain('font-size: 18px');
      expect(pastedHtml).toContain('color: #333333');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large documents with complex formatting efficiently', async () => {
      // Create large document content
      const largeContent = Array.from({ length: 1000 }, (_, i) => 
        `Paragraph ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
      ).join(' ');

      editor.commands.setContent(`<p>${largeContent}</p>`);

      const startTime = performance.now();

      // Apply formatting to multiple sections
      for (let i = 0; i < 50; i++) {
        const start = i * 100;
        const end = start + 50;
        
        editor.commands.setTextSelection({ from: start, to: end });
        editor.commands.setFontFamily(i % 2 === 0 ? 'Arial' : 'Georgia');
        editor.commands.setFontSize(14 + (i % 4));
        editor.commands.setTextColor(i % 3 === 0 ? '#ff0000' : '#0000ff');
      }

      const endTime = performance.now();

      // Should complete in reasonable time (under 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);

      // Verify formatting was applied
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-family: Georgia');
      expect(html).toContain('color: #ff0000');
      expect(html).toContain('color: #0000ff');
    });

    it('should handle edge cases gracefully', async () => {
      const typographyCommands = createTypographyCommands(editor);

      // Edge case: Empty selection
      editor.commands.setTextSelection({ from: 0, to: 0 });
      const result1 = typographyCommands.applyProperties({ fontFamily: 'Arial' });
      expect(typeof result1.success).toBe('boolean'); // Should not throw

      // Edge case: Invalid selection range
      editor.commands.setTextSelection({ from: -1, to: 1000000 });
      const result2 = typographyCommands.applyProperties({ fontSize: 16 });
      expect(typeof result2.success).toBe('boolean'); // Should not throw

      // Edge case: Null/undefined values
      const result3 = typographyCommands.applyProperties({
        fontFamily: null as any,
        fontSize: undefined as any,
        textColor: '',
      });
      expect(result3.success).toBe(true); // Should handle gracefully
    });

    it('should maintain consistency across multiple operations', async () => {
      const typographyCommands = createTypographyCommands(editor);

      // Perform multiple operations that might interfere with each other
      editor.commands.selectAll();
      
      // Initial formatting
      typographyCommands.applyProperties({
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 400,
      });

      // Partial selection change
      editor.commands.setTextSelection({ from: 5, to: 15 });
      typographyCommands.applyProperties({
        fontWeight: 700,
        textColor: '#ff0000',
      });

      // Another selection change
      editor.commands.setTextSelection({ from: 10, to: 25 });
      typographyCommands.applyProperties({
        textTransform: 'uppercase',
        letterSpacing: 1,
      });

      // Verify document integrity
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-weight: 700');
      expect(html).toContain('text-transform: uppercase');
      
      // Verify content is still readable and intact
      expect(html).toContain('quick brown fox');
    });
  });

  describe('Error Recovery and Robustness', () => {
    it('should recover from command failures gracefully', async () => {
      const typographyCommands = createTypographyCommands(editor);

      editor.commands.selectAll();

      // Mix valid and invalid properties
      const result = typographyCommands.applyProperties({
        fontFamily: 'Arial', // Valid
        fontSize: 'invalid' as any, // Invalid
        textColor: '#ff0000', // Valid
        fontWeight: 450, // Invalid (not standard weight)
      });

      // Should report partial success
      expect(result.success).toBe(false); // Overall failure due to invalid properties
      expect(result.errors.length).toBeGreaterThan(0);
      
      // But valid properties should still be applied
      expect(editor.getAttributes('fontFamily').fontFamily).toBe('Arial');
      expect(editor.getAttributes('textColor').color).toBe('#ff0000');
    });

    it('should handle concurrent operations without corruption', async () => {
      const typographyCommands1 = createTypographyCommands(editor);
      const typographyCommands2 = createTypographyCommands(editor);

      // Simulate concurrent operations
      editor.commands.setTextSelection({ from: 1, to: 10 });
      const promise1 = Promise.resolve(typographyCommands1.applyProperties({
        fontFamily: 'Arial',
        fontSize: 16,
      }));

      editor.commands.setTextSelection({ from: 5, to: 15 });
      const promise2 = Promise.resolve(typographyCommands2.applyProperties({
        fontWeight: 700,
        textColor: '#ff0000',
      }));

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both operations should complete
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Document should contain all formatting
      const html = editor.getHTML();
      expect(html).toContain('font-family: Arial');
      expect(html).toContain('font-weight: 700');
      expect(html).toContain('color: #ff0000');
    });
  });
});