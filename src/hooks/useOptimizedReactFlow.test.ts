// ABOUTME: Tests for optimized React Flow hook ensuring performance configurations work correctly

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimizedReactFlow, useOptimizedNodeUpdates } from './useOptimizedReactFlow';
import { useEditorStore } from '@/store/editorStore';

vi.mock('@/store/editorStore');

describe('useOptimizedReactFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useEditorStore as any).mockReturnValue({
      canvasTheme: 'light'
    });
  });

  it('should return optimized React Flow configuration', () => {
    const { result } = renderHook(() => useOptimizedReactFlow());
    
    expect(result.current.reactFlowConfig).toBeDefined();
    expect(result.current.reactFlowConfig.nodeTypes).toBeDefined();
    expect(result.current.reactFlowConfig.edgeTypes).toBeDefined();
    expect(result.current.reactFlowConfig.connectionMode).toBe('loose');
    expect(result.current.reactFlowConfig.nodesDraggable).toBe(true);
    expect(result.current.reactFlowConfig.nodesConnectable).toBe(false);
  });

  it('should include all required node types', () => {
    const { result } = renderHook(() => useOptimizedReactFlow());
    
    const nodeTypes = result.current.reactFlowConfig.nodeTypes;
    expect(nodeTypes).toHaveProperty('textBlock');
    expect(nodeTypes).toHaveProperty('headingBlock');
    expect(nodeTypes).toHaveProperty('imageBlock');
    expect(nodeTypes).toHaveProperty('tableBlock');
    expect(nodeTypes).toHaveProperty('pollBlock');
    expect(nodeTypes).toHaveProperty('keyTakeawayBlock');
    expect(nodeTypes).toHaveProperty('referenceBlock');
    expect(nodeTypes).toHaveProperty('separatorBlock');
  });

  it('should configure theme-based styling', () => {
    (useEditorStore as any).mockReturnValue({
      canvasTheme: 'dark'
    });

    const { result } = renderHook(() => useOptimizedReactFlow());
    
    expect(result.current.reactFlowConfig.style?.backgroundColor).toBe('#0f172a');
  });

  it('should provide optimized event handlers', () => {
    const { result } = renderHook(() => useOptimizedReactFlow());
    
    expect(result.current.handlers.onSelectionChange).toBeDefined();
    expect(result.current.handlers.onNodeDragStop).toBeDefined();
    expect(result.current.handlers.onConnect).toBeDefined();
  });

  it('should handle single node selection', () => {
    const mockSelectNode = vi.fn();
    (useEditorStore as any).getState = vi.fn().mockReturnValue({
      selectNode: mockSelectNode
    });

    const { result } = renderHook(() => useOptimizedReactFlow());
    
    act(() => {
      result.current.handlers.onSelectionChange({ 
        nodes: [{ id: 'node-1' }] 
      });
    });
    
    expect(mockSelectNode).toHaveBeenCalledWith('node-1');
  });

  it('should handle empty selection', () => {
    const mockSelectNode = vi.fn();
    (useEditorStore as any).getState = vi.fn().mockReturnValue({
      selectNode: mockSelectNode
    });

    const { result } = renderHook(() => useOptimizedReactFlow());
    
    act(() => {
      result.current.handlers.onSelectionChange({ nodes: [] });
    });
    
    expect(mockSelectNode).toHaveBeenCalledWith(null);
  });

  it('should handle node drag stop', () => {
    const mockUpdateNodePosition = vi.fn();
    (useEditorStore as any).getState = vi.fn().mockReturnValue({
      updateNodePosition: mockUpdateNodePosition
    });

    const { result } = renderHook(() => useOptimizedReactFlow());
    
    const mockNode = {
      id: 'node-1',
      position: { x: 100, y: 200 }
    };
    
    act(() => {
      result.current.handlers.onNodeDragStop({}, mockNode);
    });
    
    expect(mockUpdateNodePosition).toHaveBeenCalledWith('node-1', { x: 100, y: 200 });
  });
});

describe('useOptimizedNodeUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide debounced update function', () => {
    const mockUpdateNode = vi.fn();
    (useEditorStore as any).mockReturnValue(mockUpdateNode);

    const { result } = renderHook(() => useOptimizedNodeUpdates());
    
    expect(result.current.debouncedUpdate).toBeDefined();
    expect(typeof result.current.debouncedUpdate).toBe('function');
  });

  it('should debounce multiple rapid updates', () => {
    const mockUpdateNode = vi.fn();
    (useEditorStore as any).mockImplementation((selector) => {
      const state = { updateNode: mockUpdateNode };
      return selector ? selector(state) : state;
    });

    const { result } = renderHook(() => useOptimizedNodeUpdates());
    
    // Call multiple times rapidly
    act(() => {
      result.current.debouncedUpdate('node-1', { text: 'test1' });
      result.current.debouncedUpdate('node-1', { text: 'test2' });
      result.current.debouncedUpdate('node-1', { text: 'test3' });
    });
    
    // Should not have called updateNode yet
    expect(mockUpdateNode).not.toHaveBeenCalled();
    
    // Advance timers
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    // Should have called updateNode only once with the last value
    expect(mockUpdateNode).toHaveBeenCalledTimes(1);
    expect(mockUpdateNode).toHaveBeenCalledWith('node-1', { text: 'test3' });
  });
});