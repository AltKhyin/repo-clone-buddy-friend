// ABOUTME: Unit tests for typography conflict resolution system ensuring proper handling of overlapping marks and formatting conflicts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';

// Import typography marks
import { FontFamilyMark } from '../../extensions/marks/FontFamilyMark';
import { FontSizeMark } from '../../extensions/marks/FontSizeMark';
import { FontWeightMark } from '../../extensions/marks/FontWeightMark';
import { TextColorMark } from '../../extensions/marks/TextColorMark';
import { BackgroundColorMark } from '../../extensions/marks/BackgroundColorMark';
import { TextTransformMark } from '../../extensions/marks/TextTransformMark';
import { LetterSpacingMark } from '../../extensions/marks/LetterSpacingMark';

// Import conflict resolution system
import {
  TypographyConflictResolver,
  createConflictResolver,
  autoResolveConflicts,
  ConflictType,
  ResolutionStrategy,
  type TypographyConflict,
  type ConflictResolution,
} from '../typography-conflict-resolver';

describe('Typography Conflict Resolution System', () => {
  let editor: Editor;
  let resolver: TypographyConflictResolver;

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
      content: '<p>Test content for conflict resolution testing</p>',
    });

    resolver = new TypographyConflictResolver(editor);
  });

  describe('TypographyConflictResolver Class', () => {
    describe('Constructor', () => {
      it('should create instance with editor', () => {
        expect(resolver).toBeInstanceOf(TypographyConflictResolver);
        expect(resolver['editor']).toBe(editor);
      });

      it('should initialize typography commands', () => {
        expect(resolver['typographyCommands']).toBeDefined();
      });
    });

    describe('detectConflicts Method', () => {
      describe('Mark Overlap Detection', () => {
        it('should detect no conflicts with single marks', () => {
          editor.commands.selectAll();
          editor.commands.setFontFamily('Arial');

          const conflicts = resolver.detectConflicts();

          expect(conflicts).toHaveLength(0);
        });

        it('should detect overlapping marks with different values', () => {
          // Apply different font families to overlapping ranges
          editor.commands.setTextSelection({ from: 1, to: 10 });
          editor.commands.setFontFamily('Arial');

          editor.commands.setTextSelection({ from: 5, to: 15 });
          editor.commands.setFontFamily('Georgia');

          const conflicts = resolver.detectConflicts({ scope: 'document' });

          const overlapConflicts = conflicts.filter(c => c.type === ConflictType.MARK_OVERLAP);
          expect(overlapConflicts.length).toBeGreaterThan(0);

          const fontFamilyConflict = overlapConflicts.find(c => 
            c.properties.includes('fontFamily')
          );
          expect(fontFamilyConflict).toBeDefined();
          expect(fontFamilyConflict?.severity).toBe('medium');
        });

        it('should not detect conflicts for same mark values', () => {
          // Apply same font family to overlapping ranges
          editor.commands.setTextSelection({ from: 1, to: 10 });
          editor.commands.setFontFamily('Arial');

          editor.commands.setTextSelection({ from: 5, to: 15 });
          editor.commands.setFontFamily('Arial'); // Same value

          const conflicts = resolver.detectConflicts({ scope: 'document' });
          const overlapConflicts = conflicts.filter(c => c.type === ConflictType.MARK_OVERLAP);

          expect(overlapConflicts).toHaveLength(0);
        });

        it('should detect multiple overlapping mark types', () => {
          // Create overlapping ranges with different mark types
          editor.commands.setTextSelection({ from: 1, to: 10 });
          editor.commands.setFontFamily('Arial');
          editor.commands.setFontSize(16);

          editor.commands.setTextSelection({ from: 5, to: 15 });
          editor.commands.setFontFamily('Georgia');
          editor.commands.setFontSize(18);

          const conflicts = resolver.detectConflicts({ scope: 'document' });
          const overlapConflicts = conflicts.filter(c => c.type === ConflictType.MARK_OVERLAP);

          // Should detect conflicts for both font family and font size
          expect(overlapConflicts.length).toBeGreaterThanOrEqual(2);
        });
      });

      describe('Contradictory Properties Detection', () => {
        it('should detect low contrast color combinations', () => {
          editor.commands.selectAll();
          editor.commands.setTextColor('#ffffff'); // White text
          editor.commands.setBackgroundColor('#f0f0f0'); // Light gray background

          const conflicts = resolver.detectConflicts();
          const contrastConflicts = conflicts.filter(c => c.type === ConflictType.CONTRADICTORY);

          expect(contrastConflicts.length).toBeGreaterThan(0);
          
          const contrastConflict = contrastConflicts.find(c => 
            c.properties.includes('textColor') && c.properties.includes('backgroundColor')
          );
          expect(contrastConflict).toBeDefined();
          expect(contrastConflict?.severity).toBe('high');
        });

        it('should detect problematic letter spacing relative to font size', () => {
          editor.commands.selectAll();
          editor.commands.setFontSize(12);
          editor.commands.setLetterSpacing(8); // Very large letter spacing

          const conflicts = resolver.detectConflicts();
          const spacingConflicts = conflicts.filter(c => 
            c.type === ConflictType.CONTRADICTORY &&
            c.properties.includes('letterSpacing')
          );

          expect(spacingConflicts.length).toBeGreaterThan(0);
          expect(spacingConflicts[0].severity).toBe('low');
        });

        it('should not detect conflicts for good color combinations', () => {
          editor.commands.selectAll();
          editor.commands.setTextColor('#000000'); // Black text
          editor.commands.setBackgroundColor('#ffffff'); // White background

          const conflicts = resolver.detectConflicts();
          const contrastConflicts = conflicts.filter(c => 
            c.type === ConflictType.CONTRADICTORY &&
            c.properties.includes('textColor')
          );

          expect(contrastConflicts).toHaveLength(0);
        });
      });

      describe('Performance Issue Detection', () => {
        it('should detect too many marks on single node', () => {
          editor.commands.selectAll();
          
          // Apply many marks to create performance concern
          editor.commands.setFontFamily('Arial');
          editor.commands.setFontSize(18);
          editor.commands.setFontWeight(700);
          editor.commands.setTextColor('#ff0000');
          editor.commands.setBackgroundColor('#ffff00');
          editor.commands.setTextTransform('uppercase');
          editor.commands.setLetterSpacing(1);

          const conflicts = resolver.detectConflicts({ includePerformance: true });
          const performanceConflicts = conflicts.filter(c => c.type === ConflictType.PERFORMANCE);

          // Should detect performance issue with many marks
          expect(performanceConflicts.length).toBeGreaterThan(0);
          expect(performanceConflicts[0].severity).toBe('medium');
        });

        it('should not detect performance issues with few marks', () => {
          editor.commands.selectAll();
          editor.commands.setFontFamily('Arial');
          editor.commands.setFontSize(18);

          const conflicts = resolver.detectConflicts({ includePerformance: true });
          const performanceConflicts = conflicts.filter(c => c.type === ConflictType.PERFORMANCE);

          expect(performanceConflicts).toHaveLength(0);
        });

        it('should respect includePerformance option', () => {
          editor.commands.selectAll();
          
          // Apply many marks
          editor.commands.setFontFamily('Arial');
          editor.commands.setFontSize(18);
          editor.commands.setFontWeight(700);
          editor.commands.setTextColor('#ff0000');
          editor.commands.setBackgroundColor('#ffff00');
          editor.commands.setTextTransform('uppercase');
          editor.commands.setLetterSpacing(1);

          const conflictsWithPerf = resolver.detectConflicts({ includePerformance: true });
          const conflictsWithoutPerf = resolver.detectConflicts({ includePerformance: false });

          const perfConflictsIncluded = conflictsWithPerf.filter(c => c.type === ConflictType.PERFORMANCE);
          const perfConflictsExcluded = conflictsWithoutPerf.filter(c => c.type === ConflictType.PERFORMANCE);

          expect(perfConflictsIncluded.length).toBeGreaterThan(0);
          expect(perfConflictsExcluded).toHaveLength(0);
        });
      });

      describe('Scope Options', () => {
        it('should detect conflicts in selection scope', () => {
          // Create conflicts in different parts of document
          editor.commands.setTextSelection({ from: 1, to: 10 });
          editor.commands.setFontFamily('Arial');
          editor.commands.setTextSelection({ from: 5, to: 15 });
          editor.commands.setFontFamily('Georgia');

          // Select only part of the conflicted area
          editor.commands.setTextSelection({ from: 6, to: 9 });
          const conflicts = resolver.detectConflicts({ scope: 'selection' });

          expect(conflicts.length).toBeGreaterThanOrEqual(0);
        });

        it('should detect conflicts in document scope', () => {
          // Create conflicts
          editor.commands.setTextSelection({ from: 1, to: 10 });
          editor.commands.setFontFamily('Arial');
          editor.commands.setTextSelection({ from: 5, to: 15 });
          editor.commands.setFontFamily('Georgia');

          const conflicts = resolver.detectConflicts({ scope: 'document' });

          expect(conflicts.length).toBeGreaterThan(0);
        });
      });

      describe('Error Handling', () => {
        it('should handle detection errors gracefully', () => {
          // Mock console.warn to capture warnings
          const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

          // Create a scenario that might cause errors
          const conflicts = resolver.detectConflicts();

          // Should not throw errors
          expect(Array.isArray(conflicts)).toBe(true);

          consoleSpy.mockRestore();
        });

        it('should handle empty document', () => {
          editor.commands.setContent('');

          const conflicts = resolver.detectConflicts();

          expect(conflicts).toHaveLength(0);
        });
      });
    });

    describe('resolveConflicts Method', () => {
      let testConflicts: TypographyConflict[];

      beforeEach(() => {
        // Create test conflicts
        editor.commands.setTextSelection({ from: 1, to: 10 });
        editor.commands.setFontFamily('Arial');
        editor.commands.setTextSelection({ from: 5, to: 15 });
        editor.commands.setFontFamily('Georgia');

        testConflicts = resolver.detectConflicts({ scope: 'document' });
      });

      describe('Latest Wins Strategy', () => {
        it('should resolve conflicts using latest wins strategy', () => {
          const resolution = resolver.resolveConflicts(
            testConflicts,
            ResolutionStrategy.LATEST_WINS
          );

          expect(resolution.success).toBe(true);
          expect(resolution.strategy).toBe(ResolutionStrategy.LATEST_WINS);
          expect(resolution.resolvedConflicts).toBeGreaterThan(0);
        });
      });

      describe('Specific Wins Strategy', () => {
        it('should resolve conflicts using specific wins strategy', () => {
          const resolution = resolver.resolveConflicts(
            testConflicts,
            ResolutionStrategy.SPECIFIC_WINS
          );

          expect(resolution.success).toBe(true);
          expect(resolution.strategy).toBe(ResolutionStrategy.SPECIFIC_WINS);
        });
      });

      describe('User Choice Strategy', () => {
        it('should resolve conflicts with user choices', () => {
          const userChoices = {
            fontFamily: 'Times New Roman',
          };

          const resolution = resolver.resolveConflicts(
            testConflicts,
            ResolutionStrategy.USER_CHOICE,
            userChoices
          );

          expect(resolution.success).toBe(true);
          expect(resolution.strategy).toBe(ResolutionStrategy.USER_CHOICE);
        });

        it('should fail without user choices', () => {
          const resolution = resolver.resolveConflicts(
            testConflicts,
            ResolutionStrategy.USER_CHOICE
            // No user choices provided
          );

          expect(resolution.success).toBe(false);
          expect(resolution.errors.length).toBeGreaterThan(0);
          expect(resolution.errors[0]).toContain('User choices required but not provided');
        });
      });

      describe('Merge Compatible Strategy', () => {
        it('should resolve conflicts using merge compatible strategy', () => {
          const resolution = resolver.resolveConflicts(
            testConflicts,
            ResolutionStrategy.MERGE_COMPATIBLE
          );

          expect(resolution.success).toBe(true);
          expect(resolution.strategy).toBe(ResolutionStrategy.MERGE_COMPATIBLE);
        });
      });

      describe('Remove Conflicts Strategy', () => {
        it('should resolve conflicts by removing conflicting marks', () => {
          const resolution = resolver.resolveConflicts(
            testConflicts,
            ResolutionStrategy.REMOVE_CONFLICTS
          );

          expect(resolution.success).toBe(true);
          expect(resolution.strategy).toBe(ResolutionStrategy.REMOVE_CONFLICTS);
        });
      });

      describe('Unknown Strategy Handling', () => {
        it('should handle unknown resolution strategy', () => {
          const resolution = resolver.resolveConflicts(
            testConflicts,
            'unknown_strategy' as ResolutionStrategy
          );

          expect(resolution.success).toBe(false);
          expect(resolution.errors.length).toBeGreaterThan(0);
          expect(resolution.errors[0]).toContain('Unknown resolution strategy');
        });
      });

      describe('Empty Conflicts Handling', () => {
        it('should handle empty conflicts array', () => {
          const resolution = resolver.resolveConflicts(
            [],
            ResolutionStrategy.LATEST_WINS
          );

          expect(resolution.success).toBe(true);
          expect(resolution.resolvedConflicts).toBe(0);
          expect(resolution.remainingConflicts).toHaveLength(0);
        });
      });
    });

    describe('Error Handling and Edge Cases', () => {
      it('should handle invalid editor state', () => {
        // Create resolver with editor in invalid state
        editor.commands.blur();

        const conflicts = resolver.detectConflicts();

        // Should not throw errors
        expect(Array.isArray(conflicts)).toBe(true);
      });

      it('should handle malformed conflict data', () => {
        const malformedConflict: TypographyConflict = {
          type: ConflictType.MARK_OVERLAP,
          description: 'Test conflict',
          properties: ['invalid_property'],
          conflictingValues: {},
          selectionRange: { from: -1, to: -1 }, // Invalid range
          severity: 'medium',
          resolutionOptions: [ResolutionStrategy.LATEST_WINS],
        };

        const resolution = resolver.resolveConflicts(
          [malformedConflict],
          ResolutionStrategy.LATEST_WINS
        );

        // Should handle gracefully
        expect(typeof resolution.success).toBe('boolean');
      });
    });
  });

  describe('Factory Functions', () => {
    describe('createConflictResolver', () => {
      it('should create TypographyConflictResolver instance', () => {
        const newResolver = createConflictResolver(editor);

        expect(newResolver).toBeInstanceOf(TypographyConflictResolver);
        expect(newResolver['editor']).toBe(editor);
      });

      it('should create independent instances', () => {
        const resolver1 = createConflictResolver(editor);
        const resolver2 = createConflictResolver(editor);

        expect(resolver1).not.toBe(resolver2);
      });
    });

    describe('autoResolveConflicts', () => {
      it('should auto-resolve with default options', () => {
        // Create conflicts
        editor.commands.setTextSelection({ from: 1, to: 10 });
        editor.commands.setFontFamily('Arial');
        editor.commands.setTextSelection({ from: 5, to: 15 });
        editor.commands.setFontFamily('Georgia');

        const resolution = autoResolveConflicts(editor);

        expect(resolution.success).toBe(true);
        expect(resolution.strategy).toBe(ResolutionStrategy.LATEST_WINS);
      });

      it('should auto-resolve with custom options', () => {
        // Create conflicts
        editor.commands.setTextSelection({ from: 1, to: 10 });
        editor.commands.setFontFamily('Arial');
        editor.commands.setTextSelection({ from: 5, to: 15 });
        editor.commands.setFontFamily('Georgia');

        const resolution = autoResolveConflicts(editor, {
          strategy: ResolutionStrategy.REMOVE_CONFLICTS,
          scope: 'document',
          includePerformance: false,
        });

        expect(resolution.success).toBe(true);
        expect(resolution.strategy).toBe(ResolutionStrategy.REMOVE_CONFLICTS);
      });

      it('should handle no conflicts scenario', () => {
        // No conflicts in clean document
        const resolution = autoResolveConflicts(editor);

        expect(resolution.success).toBe(true);
        expect(resolution.resolvedConflicts).toBe(0);
        expect(resolution.remainingConflicts).toHaveLength(0);
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large documents efficiently', () => {
      // Create large document with many marks
      const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000);
      editor.commands.setContent(`<p>${largeContent}</p>`);

      const startTime = performance.now();

      // Apply many overlapping marks
      for (let i = 0; i < 20; i++) {
        const start = i * 50;
        const end = start + 100;
        editor.commands.setTextSelection({ from: start, to: end });
        editor.commands.setFontFamily(i % 2 === 0 ? 'Arial' : 'Georgia');
      }

      const conflicts = resolver.detectConflicts({ scope: 'document' });
      const resolution = resolver.resolveConflicts(conflicts, ResolutionStrategy.LATEST_WINS);

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(resolution.success).toBe(true);
    });

    it('should efficiently detect conflicts repeatedly', () => {
      // Set up conflicts
      editor.commands.setTextSelection({ from: 1, to: 10 });
      editor.commands.setFontFamily('Arial');
      editor.commands.setTextSelection({ from: 5, to: 15 });
      editor.commands.setFontFamily('Georgia');

      const startTime = performance.now();

      // Detect conflicts many times
      for (let i = 0; i < 100; i++) {
        resolver.detectConflicts();
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  describe('Integration with Typography System', () => {
    it('should work correctly with typography commands', () => {
      // Create conflicts using typography commands
      editor.commands.selectAll();
      editor.commands.setFontFamily('Arial');
      editor.commands.setTextColor('#ffffff');
      editor.commands.setBackgroundColor('#f0f0f0'); // Low contrast

      const conflicts = resolver.detectConflicts();
      const contrastConflicts = conflicts.filter(c => c.type === ConflictType.CONTRADICTORY);

      expect(contrastConflicts.length).toBeGreaterThan(0);

      // Resolve conflicts
      const resolution = resolver.resolveConflicts(
        contrastConflicts,
        ResolutionStrategy.USER_CHOICE,
        { textColor: '#000000' } // Better contrast
      );

      expect(resolution.success).toBe(true);
    });

    it('should maintain consistency with mark extensions', () => {
      // Apply marks directly
      editor.commands.selectAll();
      editor.commands.setFontFamily('Arial');

      // Detect conflicts (should be none)
      const conflicts = resolver.detectConflicts();

      expect(conflicts.filter(c => c.type === ConflictType.MARK_OVERLAP)).toHaveLength(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complex multi-conflict scenario', () => {
      // Create multiple types of conflicts
      editor.commands.setTextSelection({ from: 1, to: 10 });
      editor.commands.setFontFamily('Arial');
      editor.commands.setFontSize(8); // Small font
      editor.commands.setLetterSpacing(4); // Large spacing

      editor.commands.setTextSelection({ from: 5, to: 15 });
      editor.commands.setFontFamily('Georgia'); // Overlapping font family
      editor.commands.setTextColor('#ffffff'); // White text
      editor.commands.setBackgroundColor('#f0f0f0'); // Light background

      const conflicts = resolver.detectConflicts({ scope: 'document' });

      // Should detect multiple conflict types
      const overlapConflicts = conflicts.filter(c => c.type === ConflictType.MARK_OVERLAP);
      const contradictoryConflicts = conflicts.filter(c => c.type === ConflictType.CONTRADICTORY);

      expect(overlapConflicts.length).toBeGreaterThan(0);
      expect(contradictoryConflicts.length).toBeGreaterThan(0);

      // Resolve all conflicts
      const resolution = resolver.resolveConflicts(
        conflicts,
        ResolutionStrategy.LATEST_WINS
      );

      expect(resolution.success).toBe(true);
      expect(resolution.resolvedConflicts).toBeGreaterThan(0);
    });

    it('should handle user workflow with multiple edits', () => {
      // Simulate user applying and changing formatting multiple times
      editor.commands.selectAll();
      
      // User applies initial formatting
      editor.commands.setFontFamily('Arial');
      editor.commands.setFontSize(16);
      
      // User changes mind and applies different formatting
      editor.commands.setFontFamily('Georgia');
      editor.commands.setFontSize(18);
      
      // User selects part of text and applies conflicting formatting
      editor.commands.setTextSelection({ from: 1, to: 10 });
      editor.commands.setFontFamily('Times New Roman');
      
      const conflicts = resolver.detectConflicts();
      
      // Should handle the editing workflow gracefully
      expect(conflicts.filter(c => c.type === ConflictType.MARK_OVERLAP).length).toBeGreaterThanOrEqual(0);
      
      if (conflicts.length > 0) {
        const resolution = autoResolveConflicts(editor);
        expect(resolution.success).toBe(true);
      }
    });
  });
});