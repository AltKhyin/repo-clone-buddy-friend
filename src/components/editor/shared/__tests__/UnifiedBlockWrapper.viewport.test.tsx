// ABOUTME: Tests ensuring UnifiedBlockWrapper uses viewport-aware position updates

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock the editor store to verify viewport-aware calls
const mockUpdateCurrentViewportPosition = vi.fn();

import { UnifiedBlockWrapper } from '../UnifiedBlockWrapper';

vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(() => ({
    updateCurrentViewportPosition: mockUpdateCurrentViewportPosition,
    currentViewport: 'desktop'
  }))
}));

// Mock other dependencies
vi.mock('../../../hooks/useSelectionCoordination', () => ({
  useSelectionCoordination: vi.fn(() => ({
    isActive: false,
    hasContentSelection: false,
    handleBlockActivation: vi.fn()
  }))
}));

vi.mock('@/components/editor/unified-resize', () => ({
  useSimpleResize: vi.fn(() => ({
    isResizing: false
  })),
  SimpleResizeHandles: () => null
}));

describe('UnifiedBlockWrapper Viewport Architecture', () => {
  it('should prevent regressions to direct updateNodePosition calls', () => {
    // Read the component source to verify it doesn't use forbidden direct calls
    const fs = require('fs');
    const path = require('path');
    
    const componentPath = path.resolve(__dirname, '../UnifiedBlockWrapper.tsx');
    const componentSource = fs.readFileSync(componentPath, 'utf-8');
    
    // Ensure no direct updateNodePosition calls exist
    expect(componentSource).not.toMatch(/updateNodePosition\s*\(/);
    
    // Ensure viewport-aware calls are present
    expect(componentSource).toMatch(/updateCurrentViewportPosition/);
    expect(componentSource).toMatch(/currentViewport/);
  });
});