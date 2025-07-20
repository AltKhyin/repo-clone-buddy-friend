// ABOUTME: Unified hook for block data updates that eliminates repetitive updateNode patterns

import { useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';

/**
 * Hook that provides a standardized way to update block data
 * Eliminates the repetitive pattern of accessing updateNode and spreading data
 */
export function useBlockDataUpdate<T extends Record<string, any>>(blockId: string, currentData: T) {
  const { updateNode } = useEditorStore();

  /**
   * Update block data with partial updates
   * Automatically handles data spreading and node updating
   */
  const updateData = useCallback(
    (updates: Partial<T>) => {
      updateNode(blockId, {
        data: { ...currentData, ...updates },
      });
    },
    [blockId, currentData, updateNode]
  );

  /**
   * Update a specific field in the block data
   * Useful for single-field updates from form controls
   */
  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      updateData({ [field]: value } as Partial<T>);
    },
    [updateData]
  );

  /**
   * Update multiple fields at once with validation
   * Filters out undefined values to prevent overriding with undefined
   */
  const updateFields = useCallback(
    (fields: Partial<T>) => {
      const cleanedFields = Object.fromEntries(
        Object.entries(fields).filter(([_, value]) => value !== undefined)
      ) as Partial<T>;

      if (Object.keys(cleanedFields).length > 0) {
        updateData(cleanedFields);
      }
    },
    [updateData]
  );

  /**
   * Reset a field to its default value
   * Useful for clearing optional fields
   */
  const resetField = useCallback(
    <K extends keyof T>(field: K, defaultValue?: T[K]) => {
      const resetValue = defaultValue !== undefined ? defaultValue : '';
      updateField(field, resetValue);
    },
    [updateField]
  );

  /**
   * Batch multiple updates to prevent excessive re-renders
   * Useful when updating multiple related fields
   */
  const batchUpdate = useCallback(
    (updateFn: (current: T) => Partial<T>) => {
      const updates = updateFn(currentData);
      updateData(updates);
    },
    [currentData, updateData]
  );

  return {
    /** Update block data with partial updates */
    updateData,
    /** Update a specific field */
    updateField,
    /** Update multiple fields with undefined filtering */
    updateFields,
    /** Reset a field to default value */
    resetField,
    /** Batch multiple updates */
    batchUpdate,
    /** Current block data (for convenience) */
    data: currentData,
  };
}

/**
 * Specialized hook for text-based blocks
 * Provides common text editing patterns
 */
export function useTextBlockDataUpdate<T extends { htmlContent?: string; content?: string }>(
  blockId: string,
  currentData: T
) {
  const base = useBlockDataUpdate(blockId, currentData);

  /**
   * Update text content (handles both htmlContent and content fields)
   */
  const updateText = useCallback(
    (text: string, isHtml = false) => {
      if (isHtml) {
        base.updateField('htmlContent' as keyof T, text as T[keyof T]);
      } else {
        base.updateField('content' as keyof T, text as T[keyof T]);
      }
    },
    [base]
  );

  /**
   * Clear text content
   */
  const clearText = useCallback(
    (isHtml = false) => {
      updateText('', isHtml);
    },
    [updateText]
  );

  return {
    ...base,
    /** Update text content */
    updateText,
    /** Clear text content */
    clearText,
  };
}

/**
 * Specialized hook for styling-enabled blocks
 * Provides common styling update patterns
 */
export function useStyledBlockDataUpdate<
  T extends {
    paddingX?: number;
    paddingY?: number;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
  },
>(blockId: string, currentData: T) {
  const base = useBlockDataUpdate(blockId, currentData);

  /**
   * Update padding (both X and Y)
   */
  const updatePadding = useCallback(
    (x?: number, y?: number) => {
      const updates: Partial<T> = {};
      if (x !== undefined) updates.paddingX = x as T['paddingX'];
      if (y !== undefined) updates.paddingY = y as T['paddingY'];
      base.updateFields(updates);
    },
    [base]
  );

  /**
   * Update border properties
   */
  const updateBorder = useCallback(
    (width?: number, color?: string, radius?: number) => {
      const updates: Partial<T> = {};
      if (width !== undefined) updates.borderWidth = width as T['borderWidth'];
      if (color !== undefined) updates.borderColor = color as T['borderColor'];
      if (radius !== undefined) updates.borderRadius = radius as T['borderRadius'];
      base.updateFields(updates);
    },
    [base]
  );

  /**
   * Update background color
   */
  const updateBackground = useCallback(
    (color: string) => {
      base.updateField('backgroundColor' as keyof T, color as T[keyof T]);
    },
    [base]
  );

  return {
    ...base,
    /** Update padding values */
    updatePadding,
    /** Update border properties */
    updateBorder,
    /** Update background color */
    updateBackground,
  };
}
