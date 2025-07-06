// ABOUTME: Critical utility functions tests - strategic testing for className merging utility
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils - Critical Utility Functions', () => {
  describe('cn - Class Name Merging', () => {
    it('merges multiple class names correctly', () => {
      const result = cn('flex', 'items-center', 'justify-center');
      expect(result).toBe('flex items-center justify-center');
    });

    it('handles conditional class names', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('removes duplicate classes through Tailwind merge', () => {
      const result = cn('p-4', 'p-2'); // p-2 should override p-4
      expect(result).toBe('p-2');
    });

    it('handles object-style conditional classes', () => {
      const result = cn({
        'text-red-500': true,
        'text-blue-500': false,
        'font-bold': true,
      });
      expect(result).toBe('text-red-500 font-bold');
    });

    it('handles arrays of class names', () => {
      const result = cn(['flex', 'items-center'], 'justify-center');
      expect(result).toBe('flex items-center justify-center');
    });

    it('handles empty and falsy values gracefully', () => {
      const result = cn('', null, undefined, false, 'valid-class');
      expect(result).toBe('valid-class');
    });

    it('handles complex responsive and state combinations', () => {
      const result = cn(
        'base-class',
        'sm:text-lg',
        'md:text-xl',
        'hover:text-blue-500',
        'focus:ring-2'
      );
      expect(result).toBe('base-class sm:text-lg md:text-xl hover:text-blue-500 focus:ring-2');
    });

    it('properly merges conflicting Tailwind classes', () => {
      // Test that Tailwind merge properly handles conflicting utilities
      const result = cn('bg-red-500', 'bg-blue-500'); // bg-blue-500 should win
      expect(result).toBe('bg-blue-500');
    });
  });
});
