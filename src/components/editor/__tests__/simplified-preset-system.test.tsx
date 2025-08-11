// ABOUTME: Simplified tests for block preset system focusing on core functionality

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavePresetDialog } from '../SavePresetDialog';
import {
  loadBlockPresets,
  createBlockPreset,
  addBlockPreset,
  removeBlockPreset,
  searchBlockPresets,
  getPresetsBy,
  type BlockPreset,
} from '@/types/editor';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock crypto.randomUUID with proper UUID format
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: vi.fn(() => '12345678-1234-1234-1234-123456789012') },
});

// Sample test data
const mockRichBlockData = {
  content: { htmlContent: '<p>Test content</p>' },
  desktopPadding: { top: 16, right: 20, bottom: 12, left: 24 },
  mobilePadding: { top: 8, right: 12, bottom: 8, left: 12 },
  backgroundColor: 'transparent',
};

describe('Simplified Block Preset System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Core Preset Operations', () => {
    it('should create a preset with correct structure', () => {
      const preset = createBlockPreset(
        'Test Block',
        'richBlock',
        mockRichBlockData,
        {
          description: 'A test block preset',
          category: 'text',
          tags: ['test', 'rich'],
        }
      );

      expect(preset.metadata.name).toBe('Test Block');
      expect(preset.metadata.category).toBe('text');
      expect(preset.blockType).toBe('richBlock');
      expect(preset.blockData).toEqual(mockRichBlockData);
      expect(preset.metadata.id).toBeDefined();
      expect(preset.metadata.createdAt).toBeDefined();
    });

    it('should save and load presets from localStorage', () => {
      const preset = createBlockPreset('Test Preset', 'richBlock', mockRichBlockData);
      
      addBlockPreset(preset);
      const loadedPresets = loadBlockPresets();
      
      expect(loadedPresets.presets).toHaveLength(1);
      expect(loadedPresets.presets[0].metadata.name).toBe('Test Preset');
    });

    it('should remove presets correctly', () => {
      const preset = createBlockPreset('To Remove', 'richBlock', mockRichBlockData);
      addBlockPreset(preset);
      
      removeBlockPreset(preset.metadata.id);
      const loadedPresets = loadBlockPresets();
      
      expect(loadedPresets.presets).toHaveLength(0);
    });

    it('should search presets by name', () => {
      const preset1 = createBlockPreset('Header Block', 'richBlock', mockRichBlockData);
      const preset2 = createBlockPreset('Footer Block', 'richBlock', mockRichBlockData);
      
      addBlockPreset(preset1);
      addBlockPreset(preset2);
      
      const results = searchBlockPresets('header');
      expect(results).toHaveLength(1);
      expect(results[0].metadata.name).toBe('Header Block');
    });

    it('should sort presets by name', () => {
      const presetA = createBlockPreset('A Block', 'richBlock', mockRichBlockData);
      const presetZ = createBlockPreset('Z Block', 'richBlock', mockRichBlockData);
      
      addBlockPreset(presetZ);
      addBlockPreset(presetA);
      
      const sorted = getPresetsBy('name');
      expect(sorted[0].metadata.name).toBe('A Block');
      expect(sorted[1].metadata.name).toBe('Z Block');
    });
  });

  describe('SavePresetDialog Core Features', () => {
    it('should render all form fields', () => {
      render(
        <SavePresetDialog
          open={true}
          onOpenChange={() => {}}
          blockType="richBlock"
          blockData={mockRichBlockData}
        />
      );

      expect(screen.getByLabelText(/Preset Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tags/)).toBeInTheDocument();
    });

    it('should validate required name field', () => {
      render(
        <SavePresetDialog
          open={true}
          onOpenChange={() => {}}
          blockType="richBlock"
          blockData={mockRichBlockData}
        />
      );

      const saveButton = screen.getByText('Save Preset');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when name is provided', async () => {
      const user = userEvent.setup();
      
      render(
        <SavePresetDialog
          open={true}
          onOpenChange={() => {}}
          blockType="richBlock"
          blockData={mockRichBlockData}
        />
      );

      const nameInput = screen.getByLabelText(/Preset Name/);
      await user.type(nameInput, 'Test Preset');

      const saveButton = screen.getByText('Save Preset');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const presets = loadBlockPresets();
      expect(presets.presets).toHaveLength(0);
    });

    it('should handle invalid JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const presets = loadBlockPresets();
      expect(presets.presets).toHaveLength(0);
    });
  });
});