// ABOUTME: Simple integration test to verify highlight button functionality is working

import { describe, it, expect, vi } from 'vitest';
import { createTypographyCommands } from '../shared/typography-commands';

// Mock a more complete TipTap editor for testing
const mockEditor = {
  commands: {
    setMark: vi.fn(() => true),
    unsetMark: vi.fn(() => true),
    setBackgroundColor: vi.fn(() => true),
    unsetBackgroundColor: vi.fn(() => true),
  },
  getAttributes: vi.fn((markName: string) => {
    if (markName === 'backgroundColor') {
      return { backgroundColor: undefined };
    }
    return {};
  }),
  isActive: vi.fn(() => false),
};

describe('Highlight Button Integration', () => {
  it('should create typography commands with highlight functionality', () => {
    const typographyCommands = createTypographyCommands(mockEditor as any);
    
    expect(typographyCommands).toBeDefined();
    expect(typeof typographyCommands.toggleHighlight).toBe('function');
  });

  it('should toggle highlight on when no background color is set', () => {
    mockEditor.getAttributes.mockReturnValue({ backgroundColor: undefined });
    
    const typographyCommands = createTypographyCommands(mockEditor as any);
    const result = typographyCommands.toggleHighlight();
    
    expect(result.success).toBe(true);
    expect(mockEditor.commands.setBackgroundColor).toHaveBeenCalledWith('#ffeb3b');
  });

  it('should toggle highlight off when background color is already set', () => {
    mockEditor.getAttributes.mockReturnValue({ backgroundColor: '#ffeb3b' });
    
    const typographyCommands = createTypographyCommands(mockEditor as any);
    const result = typographyCommands.toggleHighlight();
    
    expect(result.success).toBe(true);
    expect(mockEditor.commands.unsetBackgroundColor).toHaveBeenCalled();
  });

  it('should set custom background color', () => {
    const typographyCommands = createTypographyCommands(mockEditor as any);
    const result = typographyCommands.setBackgroundColor('#ff0000');
    
    expect(result.success).toBe(true);
    expect(result.appliedProperties.backgroundColor).toBe('#ff0000');
    expect(mockEditor.commands.setBackgroundColor).toHaveBeenCalledWith('#ff0000');
  });

  it('should validate color format', () => {
    const typographyCommands = createTypographyCommands(mockEditor as any);
    // Use a value that starts with special characters to fail the regex
    const result = typographyCommands.setBackgroundColor('!@#invalid');
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Invalid background color format');
  });

  it('should handle unset background color', () => {
    const typographyCommands = createTypographyCommands(mockEditor as any);
    const result = typographyCommands.unsetProperty('backgroundColor');
    
    expect(result.success).toBe(true);
    expect(mockEditor.commands.unsetBackgroundColor).toHaveBeenCalled();
  });
});