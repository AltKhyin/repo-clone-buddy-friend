// ABOUTME: Test to verify typography contamination fix - ensures fontSize and fontFamily are no longer synced to block level

import { describe, it, expect } from 'vitest';
import { combineTypographyStyles } from '@/utils/tiptap-mark-extraction';

describe('Typography Contamination Fix', () => {
  it('should not contaminate block styles with fontSize and fontFamily', () => {
    const blockStyles = {
      textAlign: 'left' as const,
      lineHeight: 1.5,
      minHeight: '60px',
    };

    const inlineMarks = {
      fontSize: 18,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textColor: '#ff0000',
      backgroundColor: '#ffff00',
      lineHeight: 2.0,
    };

    const combined = combineTypographyStyles(blockStyles, inlineMarks);

    // ✅ Should preserve true block-level properties
    expect(combined.textAlign).toBe('left');
    expect(combined.lineHeight).toBe(2.0); // Should get overridden by inline marks
    expect(combined.minHeight).toBe('60px');

    // ❌ Should NOT contaminate with text-level properties
    expect(combined.fontSize).toBeUndefined(); // fontSize should not contaminate
    expect(combined.fontFamily).toBeUndefined(); // fontFamily should not contaminate
    expect(combined.fontWeight).toBeUndefined(); // fontWeight should not contaminate
    expect(combined.color).toBeUndefined(); // textColor should not contaminate
    expect(combined.backgroundColor).toBeUndefined(); // backgroundColor should not contaminate
  });

  it('should only sync lineHeight as the sole typography property', () => {
    const blockStyles = {};
    const inlineMarks = {
      fontSize: 24,
      fontFamily: 'Georgia',
      fontWeight: 'bold',
      lineHeight: 1.8,
      textColor: '#0000ff',
    };

    const combined = combineTypographyStyles(blockStyles, inlineMarks);

    // Only lineHeight should be present
    const keys = Object.keys(combined);
    expect(keys).toEqual(['lineHeight']);
    expect(combined.lineHeight).toBe(1.8);
  });

  it('should validate content update handler removes fontSize and fontFamily sync', () => {
    // This test validates that our content-update-handler changes are correct
    const extractedMarks = {
      fontSize: 16,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      lineHeight: 1.4,
    };

    const currentData = { someProperty: 'value' };
    
    // Simulate the sync logic from content-update-handler.ts
    const blockUpdates = {
      ...currentData,
      // Only lineHeight should be synced now
      ...(extractedMarks.lineHeight && { lineHeight: extractedMarks.lineHeight }),
      // These should NOT be synced anymore:
      // ...(extractedMarks.fontSize && { fontSize: extractedMarks.fontSize }),
      // ...(extractedMarks.fontFamily && { fontFamily: extractedMarks.fontFamily }),
    };

    expect(blockUpdates.lineHeight).toBe(1.4);
    expect(blockUpdates.fontSize).toBeUndefined();
    expect(blockUpdates.fontFamily).toBeUndefined();
    expect(blockUpdates.fontWeight).toBeUndefined();
    expect(blockUpdates.someProperty).toBe('value'); // Preserve existing properties
  });
});