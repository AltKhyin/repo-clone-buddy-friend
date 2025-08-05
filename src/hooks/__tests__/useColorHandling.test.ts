// ABOUTME: Tests for useColorHandling hook to ensure consistent color handling across admin components

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColorHandling } from '@/hooks/useColorHandling';

describe('useColorHandling', () => {
  it('should create a handleColorChange function', () => {
    const setFormData = vi.fn();
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    expect(result.current.handleColorChange).toBeInstanceOf(Function);
  });

  it('should update form data with new color value', () => {
    const setFormData = vi.fn();
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    act(() => {
      result.current.handleColorChange('text_color', '#ff0000');
    });
    
    expect(setFormData).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the function passed to setFormData
    const updateFunction = setFormData.mock.calls[0][0];
    const prevData = { text_color: '#000000', other_field: 'value' };
    const newData = updateFunction(prevData);
    
    expect(newData).toEqual({
      text_color: '#ff0000',
      other_field: 'value',
    });
  });

  it('should handle theme token values', () => {
    const setFormData = vi.fn();
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    act(() => {
      result.current.handleColorChange('background_color', 'hsl(var(--primary))');
    });
    
    expect(setFormData).toHaveBeenCalledWith(expect.any(Function));
    
    const updateFunction = setFormData.mock.calls[0][0];
    const prevData = { background_color: '#ffffff' };
    const newData = updateFunction(prevData);
    
    expect(newData).toEqual({
      background_color: 'hsl(var(--primary))',
    });
  });

  it('should handle multiple field updates', () => {
    const setFormData = vi.fn();
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    act(() => {
      result.current.handleColorChange('text_color', '#ff0000');
    });
    
    act(() => {
      result.current.handleColorChange('border_color', '#00ff00');
    });
    
    expect(setFormData).toHaveBeenCalledTimes(2);
  });

  it('should work with different field names', () => {
    const setFormData = vi.fn();
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    const testCases = [
      { field: 'text_color', value: '#ff0000' },
      { field: 'border_color', value: '#00ff00' },
      { field: 'background_color', value: '#0000ff' },
      { field: 'customField', value: 'hsl(var(--accent))' },
    ];
    
    testCases.forEach(({ field, value }) => {
      act(() => {
        result.current.handleColorChange(field, value);
      });
      
      const updateFunction = setFormData.mock.calls[setFormData.mock.calls.length - 1][0];
      const prevData = { [field]: 'old-value', otherField: 'unchanged' };
      const newData = updateFunction(prevData);
      
      expect(newData).toEqual({
        [field]: value,
        otherField: 'unchanged',
      });
    });
  });

  it('should preserve existing form data when updating a field', () => {
    const setFormData = vi.fn();
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    act(() => {
      result.current.handleColorChange('text_color', '#ff0000');
    });
    
    const updateFunction = setFormData.mock.calls[0][0];
    const prevData = {
      text_color: '#000000',
      border_color: '#ffffff',
      background_color: '#cccccc',
      label: 'Test Type',
      description: 'Test description',
    };
    
    const newData = updateFunction(prevData);
    
    expect(newData).toEqual({
      text_color: '#ff0000', // Updated
      border_color: '#ffffff', // Preserved
      background_color: '#cccccc', // Preserved
      label: 'Test Type', // Preserved
      description: 'Test description', // Preserved
    });
  });

  it('should be memoized with useCallback', () => {
    const setFormData = vi.fn();
    const { result, rerender } = renderHook(() => useColorHandling(setFormData));
    
    const firstHandleColorChange = result.current.handleColorChange;
    
    // Rerender with same setFormData function
    rerender();
    
    const secondHandleColorChange = result.current.handleColorChange;
    
    // Should be the same reference due to useCallback
    expect(firstHandleColorChange).toBe(secondHandleColorChange);
  });

  it('should update reference when setFormData changes', () => {
    const setFormData1 = vi.fn();
    const setFormData2 = vi.fn();
    
    const { result, rerender } = renderHook(
      ({ setFormData }) => useColorHandling(setFormData),
      { initialProps: { setFormData: setFormData1 } }
    );
    
    const firstHandleColorChange = result.current.handleColorChange;
    
    // Rerender with different setFormData function
    rerender({ setFormData: setFormData2 });
    
    const secondHandleColorChange = result.current.handleColorChange;
    
    // Should be different reference due to dependency change
    expect(firstHandleColorChange).not.toBe(secondHandleColorChange);
  });

  it('should handle empty string values', () => {
    const setFormData = vi.fn();
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    act(() => {
      result.current.handleColorChange('text_color', '');
    });
    
    const updateFunction = setFormData.mock.calls[0][0];
    const prevData = { text_color: '#ff0000' };
    const newData = updateFunction(prevData);
    
    expect(newData).toEqual({
      text_color: '',
    });
  });

  it('should work with TypeScript type safety', () => {
    // This test ensures the hook works with properly typed form data
    interface TestFormData {
      text_color: string;
      border_color: string;
      background_color: string;
      label: string;
    }
    
    const setFormData = vi.fn() as React.Dispatch<React.SetStateAction<TestFormData>>;
    const { result } = renderHook(() => useColorHandling(setFormData));
    
    // Should accept valid field names
    act(() => {
      result.current.handleColorChange('text_color', '#ff0000');
      result.current.handleColorChange('border_color', '#00ff00');
      result.current.handleColorChange('background_color', '#0000ff');
      result.current.handleColorChange('label', 'Not a color but valid field');
    });
    
    expect(setFormData).toHaveBeenCalledTimes(4);
  });

  describe('Integration with ContentType modals', () => {
    it('should work exactly as used in ContentTypeCreateModal', () => {
      interface ContentTypeFormData {
        label: string;
        description: string;
        text_color: string;
        border_color: string;
        background_color: string;
      }
      
      const setFormData = vi.fn() as React.Dispatch<React.SetStateAction<ContentTypeFormData>>;
      const { result } = renderHook(() => useColorHandling(setFormData));
      
      // Simulate the exact usage pattern from ContentTypeCreateModal
      act(() => {
        result.current.handleColorChange('text_color', 'hsl(var(--foreground))');
      });
      
      act(() => {
        result.current.handleColorChange('border_color', 'hsl(var(--border))');
      });
      
      act(() => {
        result.current.handleColorChange('background_color', 'hsl(var(--muted))');
      });
      
      expect(setFormData).toHaveBeenCalledTimes(3);
      
      // Verify each call updates the correct field
      const calls = setFormData.mock.calls;
      
      // Test text_color update
      const textColorUpdate = calls[0][0];
      expect(textColorUpdate({ 
        label: 'Test', 
        description: '', 
        text_color: '#000', 
        border_color: '#fff', 
        background_color: '#ccc' 
      })).toEqual({
        label: 'Test',
        description: '',
        text_color: 'hsl(var(--foreground))',
        border_color: '#fff',
        background_color: '#ccc',
      });
      
      // Test border_color update
      const borderColorUpdate = calls[1][0];
      expect(borderColorUpdate({ 
        label: 'Test', 
        description: '', 
        text_color: '#000', 
        border_color: '#fff', 
        background_color: '#ccc' 
      })).toEqual({
        label: 'Test',
        description: '',
        text_color: '#000',
        border_color: 'hsl(var(--border))',
        background_color: '#ccc',
      });
      
      // Test background_color update
      const backgroundColorUpdate = calls[2][0];
      expect(backgroundColorUpdate({ 
        label: 'Test', 
        description: '', 
        text_color: '#000', 
        border_color: '#fff', 
        background_color: '#ccc' 
      })).toEqual({
        label: 'Test',
        description: '',
        text_color: '#000',
        border_color: '#fff',
        background_color: 'hsl(var(--muted))',
      });
    });
  });

  describe('Error handling', () => {
    it('should handle undefined or null field names gracefully', () => {
      const setFormData = vi.fn();
      const { result } = renderHook(() => useColorHandling(setFormData));
      
      // These shouldn't crash, though they might not be meaningful
      act(() => {
        result.current.handleColorChange(undefined as any, '#ff0000');
      });
      
      act(() => {
        result.current.handleColorChange(null as any, '#ff0000');
      });
      
      expect(setFormData).toHaveBeenCalledTimes(2);
    });

    it('should handle undefined or null values gracefully', () => {
      const setFormData = vi.fn();
      const { result } = renderHook(() => useColorHandling(setFormData));
      
      act(() => {
        result.current.handleColorChange('text_color', undefined as any);
      });
      
      act(() => {
        result.current.handleColorChange('text_color', null as any);
      });
      
      expect(setFormData).toHaveBeenCalledTimes(2);
      
      // Verify the updates work even with null/undefined values
      const updateFunction1 = setFormData.mock.calls[0][0];
      const updateFunction2 = setFormData.mock.calls[1][0];
      
      const prevData = { text_color: '#ff0000' };
      
      expect(updateFunction1(prevData)).toEqual({ text_color: undefined });
      expect(updateFunction2(prevData)).toEqual({ text_color: null });
    });
  });
});