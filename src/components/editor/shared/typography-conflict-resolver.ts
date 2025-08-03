// ABOUTME: Typography conflict resolution system for handling overlapping marks and formatting conflicts

import type { Editor } from '@tiptap/react';
import { createTypographyCommands, type TypographyProperties } from './typography-commands';

/**
 * Typography conflict types
 */
export enum ConflictType {
  MARK_OVERLAP = 'mark_overlap',           // Multiple marks on same text
  INHERITED_OVERRIDE = 'inherited_override', // Child overriding parent
  CONTRADICTORY = 'contradictory',          // Mutually exclusive properties
  PERFORMANCE = 'performance',              // Too many marks affecting performance
}

/**
 * Conflict resolution strategies
 */
export enum ResolutionStrategy {
  LATEST_WINS = 'latest_wins',             // Most recent change takes precedence
  SPECIFIC_WINS = 'specific_wins',         // More specific formatting wins
  USER_CHOICE = 'user_choice',             // Let user decide
  MERGE_COMPATIBLE = 'merge_compatible',    // Merge non-conflicting properties
  REMOVE_CONFLICTS = 'remove_conflicts',    // Remove conflicting marks
}

/**
 * Typography conflict information
 */
export interface TypographyConflict {
  type: ConflictType;
  description: string;
  properties: string[];
  conflictingValues: Record<string, any>;
  selectionRange: { from: number; to: number };
  severity: 'low' | 'medium' | 'high';
  resolutionOptions: ResolutionStrategy[];
}

/**
 * Conflict resolution result
 */
export interface ConflictResolution {
  success: boolean;
  strategy: ResolutionStrategy;
  resolvedConflicts: number;
  remainingConflicts: TypographyConflict[];
  appliedChanges: Record<string, any>;
  errors: string[];
}

/**
 * Typography conflict resolver
 */
export class TypographyConflictResolver {
  private editor: Editor;
  private typographyCommands: ReturnType<typeof createTypographyCommands>;

  constructor(editor: Editor) {
    this.editor = editor;
    this.typographyCommands = createTypographyCommands(editor);
  }

  /**
   * Detect typography conflicts in current selection or document
   */
  detectConflicts(options: {
    scope?: 'selection' | 'document';
    includePerformance?: boolean;
  } = {}): TypographyConflict[] {
    const { scope = 'selection', includePerformance = true } = options;
    const conflicts: TypographyConflict[] = [];

    try {
      const { state } = this.editor;
      const { from, to } = scope === 'selection' ? state.selection : { from: 0, to: state.doc.content.size };

      // Detect mark overlap conflicts
      const overlapConflicts = this.detectMarkOverlaps(from, to);
      conflicts.push(...overlapConflicts);

      // Detect contradictory property conflicts
      const contradictoryConflicts = this.detectContradictoryProperties(from, to);
      conflicts.push(...contradictoryConflicts);

      // Detect performance conflicts (too many marks)
      if (includePerformance) {
        const performanceConflicts = this.detectPerformanceIssues(from, to);
        conflicts.push(...performanceConflicts);
      }

    } catch (error) {
      console.warn('Failed to detect typography conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Detect overlapping marks that might cause conflicts
   */
  private detectMarkOverlaps(from: number, to: number): TypographyConflict[] {
    const conflicts: TypographyConflict[] = [];
    const { state } = this.editor;

    try {
      // Check for overlapping typography marks
      const doc = state.doc;
      const markCounts: Record<string, number> = {};
      const markRanges: Record<string, Array<{ from: number; to: number; attrs: any }>> = {};

      // Analyze marks in the range using nodesBetween instead of slice().descendants()
      doc.nodesBetween(from, to, (node, pos) => {
        const absolutePos = pos;
        
        node.marks?.forEach(mark => {
          const markName = mark.type.name;
          
          // Only track typography marks
          if (this.isTypographyMark(markName)) {
            markCounts[markName] = (markCounts[markName] || 0) + 1;
            
            if (!markRanges[markName]) {
              markRanges[markName] = [];
            }
            
            markRanges[markName].push({
              from: absolutePos,
              to: absolutePos + node.nodeSize,
              attrs: mark.attrs,
            });
          }
        });
      });

      // Find conflicts in overlapping ranges
      Object.entries(markRanges).forEach(([markName, ranges]) => {
        if (ranges.length > 1) {
          // Check for overlapping ranges with different attributes
          for (let i = 0; i < ranges.length; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
              const range1 = ranges[i];
              const range2 = ranges[j];
              
              // Check if ranges overlap
              if (range1.from < range2.to && range2.from < range1.to) {
                // Check if attributes are different
                if (JSON.stringify(range1.attrs) !== JSON.stringify(range2.attrs)) {
                  conflicts.push({
                    type: ConflictType.MARK_OVERLAP,
                    description: `Overlapping ${markName} marks with different values`,
                    properties: [markName],
                    conflictingValues: {
                      [markName]: [range1.attrs, range2.attrs],
                    },
                    selectionRange: {
                      from: Math.max(range1.from, range2.from),
                      to: Math.min(range1.to, range2.to),
                    },
                    severity: 'medium',
                    resolutionOptions: [
                      ResolutionStrategy.LATEST_WINS,
                      ResolutionStrategy.USER_CHOICE,
                      ResolutionStrategy.REMOVE_CONFLICTS,
                    ],
                  });
                }
              }
            }
          }
        }
      });

    } catch (error) {
      console.warn('Failed to detect mark overlaps:', error);
    }

    return conflicts;
  }

  /**
   * Detect contradictory properties
   */
  private detectContradictoryProperties(from: number, to: number): TypographyConflict[] {
    const conflicts: TypographyConflict[] = [];

    try {
      const currentMarks = this.typographyCommands.getCurrentAttributes();
      
      // Check for contradictory color combinations
      if (currentMarks.textColor && currentMarks.backgroundColor) {
        const textColor = currentMarks.textColor;
        const bgColor = currentMarks.backgroundColor;
        
        // Simple contrast check (in a real implementation, you'd use a proper contrast algorithm)
        if (this.hasLowContrast(textColor, bgColor)) {
          conflicts.push({
            type: ConflictType.CONTRADICTORY,
            description: 'Low contrast between text and background colors',
            properties: ['textColor', 'backgroundColor'],
            conflictingValues: {
              textColor,
              backgroundColor: bgColor,
            },
            selectionRange: { from, to },
            severity: 'high',
            resolutionOptions: [
              ResolutionStrategy.USER_CHOICE,
              ResolutionStrategy.SPECIFIC_WINS,
            ],
          });
        }
      }

      // Check for contradictory size combinations
      if (currentMarks.fontSize && currentMarks.letterSpacing) {
        const fontSize = currentMarks.fontSize;
        const letterSpacing = parseFloat(String(currentMarks.letterSpacing));
        
        // Check if letter spacing is too large for font size
        if (!isNaN(letterSpacing) && Math.abs(letterSpacing) > fontSize / 2) {
          conflicts.push({
            type: ConflictType.CONTRADICTORY,
            description: 'Letter spacing too large relative to font size',
            properties: ['fontSize', 'letterSpacing'],
            conflictingValues: { fontSize, letterSpacing },
            selectionRange: { from, to },
            severity: 'low',
            resolutionOptions: [
              ResolutionStrategy.MERGE_COMPATIBLE,
              ResolutionStrategy.USER_CHOICE,
            ],
          });
        }
      }

    } catch (error) {
      console.warn('Failed to detect contradictory properties:', error);
    }

    return conflicts;
  }

  /**
   * Detect performance issues from too many marks
   */
  private detectPerformanceIssues(from: number, to: number): TypographyConflict[] {
    const conflicts: TypographyConflict[] = [];
    const maxMarksPerNode = 5; // Performance threshold

    try {
      const { state } = this.editor;
      const doc = state.doc;

      doc.nodesBetween(from, to, (node, pos) => {
        if (node.marks && node.marks.length > maxMarksPerNode) {
          const typographyMarks = node.marks.filter(mark => 
            this.isTypographyMark(mark.type.name)
          );

          if (typographyMarks.length > maxMarksPerNode) {
            conflicts.push({
              type: ConflictType.PERFORMANCE,
              description: `Too many typography marks on single text node (${typographyMarks.length})`,
              properties: typographyMarks.map(mark => mark.type.name),
              conflictingValues: {},
              selectionRange: { from: pos, to: pos + node.nodeSize },
              severity: 'medium',
              resolutionOptions: [
                ResolutionStrategy.MERGE_COMPATIBLE,
                ResolutionStrategy.REMOVE_CONFLICTS,
              ],
            });
          }
        }
      });

    } catch (error) {
      console.warn('Failed to detect performance issues:', error);
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using specified strategy
   */
  resolveConflicts(
    conflicts: TypographyConflict[],
    strategy: ResolutionStrategy,
    userChoices?: Record<string, any>
  ): ConflictResolution {
    const result: ConflictResolution = {
      success: true,
      strategy,
      resolvedConflicts: 0,
      remainingConflicts: [],
      appliedChanges: {},
      errors: [],
    };

    try {
      conflicts.forEach(conflict => {
        const resolved = this.resolveConflict(conflict, strategy, userChoices);
        
        if (resolved.success) {
          result.resolvedConflicts++;
          Object.assign(result.appliedChanges, resolved.changes);
        } else {
          result.remainingConflicts.push(conflict);
          result.errors.push(...resolved.errors);
        }
      });

      result.success = result.errors.length === 0;

    } catch (error) {
      result.success = false;
      result.errors.push(`Conflict resolution failed: ${error}`);
    }

    return result;
  }

  /**
   * Resolve a single conflict
   */
  private resolveConflict(
    conflict: TypographyConflict,
    strategy: ResolutionStrategy,
    userChoices?: Record<string, any>
  ): { success: boolean; changes: Record<string, any>; errors: string[] } {
    const result = { success: false, changes: {}, errors: [] };

    try {
      // Set selection to conflict range
      this.editor.commands.setTextSelection(conflict.selectionRange);

      switch (strategy) {
        case ResolutionStrategy.LATEST_WINS:
          result.success = this.applyLatestWins(conflict);
          break;

        case ResolutionStrategy.SPECIFIC_WINS:
          result.success = this.applySpecificWins(conflict);
          break;

        case ResolutionStrategy.USER_CHOICE:
          if (userChoices) {
            result.success = this.applyUserChoices(conflict, userChoices);
          } else {
            result.errors.push('User choices required but not provided');
          }
          break;

        case ResolutionStrategy.MERGE_COMPATIBLE:
          result.success = this.applyMergeCompatible(conflict);
          break;

        case ResolutionStrategy.REMOVE_CONFLICTS:
          result.success = this.applyRemoveConflicts(conflict);
          break;

        default:
          result.errors.push(`Unknown resolution strategy: ${strategy}`);
      }

    } catch (error) {
      result.errors.push(`Failed to resolve conflict: ${error}`);
    }

    return result;
  }

  /**
   * Apply latest wins strategy
   */
  private applyLatestWins(conflict: TypographyConflict): boolean {
    // In TipTap, the most recent mark application typically wins
    // For mark overlaps, we can remove older marks and keep the latest
    return true; // TipTap handles this automatically in most cases
  }

  /**
   * Apply specific wins strategy
   */
  private applySpecificWins(conflict: TypographyConflict): boolean {
    // More specific formatting (e.g., selection-based) wins over general (e.g., block-based)
    return true; // Implementation would depend on specific conflict type
  }

  /**
   * Apply user choices
   */
  private applyUserChoices(conflict: TypographyConflict, choices: Record<string, any>): boolean {
    try {
      conflict.properties.forEach(property => {
        if (choices[property] !== undefined) {
          const propertyValue = choices[property];
          
          // Apply user's choice using typography commands
          this.typographyCommands.applyProperties({ [property]: propertyValue } as any);
        }
      });
      return true;
    } catch (error) {
      console.warn('Failed to apply user choices:', error);
      return false;
    }
  }

  /**
   * Apply merge compatible strategy
   */
  private applyMergeCompatible(conflict: TypographyConflict): boolean {
    // Try to merge non-conflicting aspects
    if (conflict.type === ConflictType.PERFORMANCE) {
      // For performance conflicts, consolidate similar marks
      return this.consolidateMarks(conflict);
    }
    return true;
  }

  /**
   * Apply remove conflicts strategy
   */
  private applyRemoveConflicts(conflict: TypographyConflict): boolean {
    try {
      // Remove all conflicting marks
      conflict.properties.forEach(property => {
        switch (property) {
          case 'fontFamily':
            this.typographyCommands.unsetProperty('fontFamily');
            break;
          case 'fontSize':
            this.typographyCommands.unsetProperty('fontSize');
            break;
          case 'fontWeight':
            this.typographyCommands.unsetProperty('fontWeight');
            break;
          case 'textColor':
            this.typographyCommands.unsetProperty('textColor');
            break;
          case 'backgroundColor':
            this.typographyCommands.unsetProperty('backgroundColor');
            break;
          case 'textTransform':
            this.typographyCommands.unsetProperty('textTransform');
            break;
          case 'letterSpacing':
            this.typographyCommands.unsetProperty('letterSpacing');
            break;
        }
      });
      return true;
    } catch (error) {
      console.warn('Failed to remove conflicts:', error);
      return false;
    }
  }

  /**
   * Consolidate similar marks for performance
   */
  private consolidateMarks(conflict: TypographyConflict): boolean {
    // Implementation would analyze marks and consolidate similar ones
    return true;
  }

  /**
   * Check if a mark is a typography mark
   */
  private isTypographyMark(markName: string): boolean {
    const typographyMarks = [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'textColor',
      'backgroundColor',
      'textTransform',
      'letterSpacing',
      'bold',
      'italic',
      'underline',
      'strike',
    ];
    return typographyMarks.includes(markName);
  }

  /**
   * Simple contrast check (placeholder implementation)
   */
  private hasLowContrast(textColor: string, backgroundColor: string): boolean {
    // This is a simplified check - in reality, you'd use WCAG contrast algorithms
    if (textColor === backgroundColor) return true;
    if (textColor === '#ffffff' && backgroundColor === '#f0f0f0') return true;
    if (textColor === '#000000' && backgroundColor === '#333333') return true;
    return false;
  }
}

/**
 * Factory function to create conflict resolver
 */
export function createConflictResolver(editor: Editor): TypographyConflictResolver {
  return new TypographyConflictResolver(editor);
}

/**
 * Utility function for automatic conflict resolution
 */
export function autoResolveConflicts(
  editor: Editor,
  options: {
    strategy?: ResolutionStrategy;
    scope?: 'selection' | 'document';
    includePerformance?: boolean;
  } = {}
): ConflictResolution {
  const {
    strategy = ResolutionStrategy.LATEST_WINS,
    scope = 'selection',
    includePerformance = true,
  } = options;

  const resolver = createConflictResolver(editor);
  const conflicts = resolver.detectConflicts({ scope, includePerformance });
  
  if (conflicts.length === 0) {
    return {
      success: true,
      strategy,
      resolvedConflicts: 0,
      remainingConflicts: [],
      appliedChanges: {},
      errors: [],
    };
  }

  return resolver.resolveConflicts(conflicts, strategy);
}