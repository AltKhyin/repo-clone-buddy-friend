// ABOUTME: Reusable color handling hook to eliminate duplication in admin components

import { useCallback } from 'react';

/**
 * Hook for handling color changes in form components
 * Eliminates duplication of handleColorChange functions across admin components
 */
export function useColorHandling<T extends Record<string, any>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  const handleColorChange = useCallback((field: string, value: string) => {
    // Accept any valid color format - don't force conversions
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [setFormData]);

  return { handleColorChange };
}