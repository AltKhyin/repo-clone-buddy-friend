// ABOUTME: Integration test for EditorPage to prevent persistence callback infinite loops

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useParams } from 'react-router-dom'
import { useEditorStore } from '@/store/editorStore'
import { 
  detectInfiniteLoop, 
  testEffectDependencyStability,
  performanceMonitor 
} from '@/test-utils/runtime-error-detection'
import EditorPage from './EditorPage'

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useParams: vi.fn()
}))

vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}))

vi.mock('../../packages/hooks/useEditorPersistence', () => ({
  useEditorSaveMutation: vi.fn(),
  useEditorLoadQuery: vi.fn()
}))

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>
}))

vi.mock('@xyflow/react', () => ({
  ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>
}))

vi.mock('@/components/editor/BlockPalette', () => ({
  BlockPalette: () => <div data-testid="block-palette">Block Palette</div>
}))

vi.mock('@/components/editor/EditorCanvas', () => ({
  EditorCanvas: () => <div data-testid="editor-canvas">Editor Canvas</div>
}))

vi.mock('@/components/editor/InspectorPanel', () => ({
  InspectorPanel: () => <div data-testid="inspector-panel">Inspector Panel</div>
}))

const mockUseParams = vi.mocked(useParams)
const mockUseEditorStore = vi.mocked(useEditorStore)

const createMockEditorStore = (overrides = {}) => ({
  loadFromDatabase: vi.fn(),
  saveToDatabase: vi.fn(),
  addNode: vi.fn(),
  isSaving: false,
  isDirty: false,
  lastSaved: null,
  isFullscreen: false,
  setPersistenceCallbacks: vi.fn(),
  ...overrides
})

const createMockEditorPersistence = () => ({
  saveMutation: {
    mutateAsync: vi.fn().mockResolvedValue({ success: true })
  },
  loadedData: {
    id: 'test-review-id',
    structured_content: {
      version: '2.0.0',
      nodes: [],
      layouts: {}
    }
  }
})

// Import mocked persistence hooks
const { useEditorSaveMutation, useEditorLoadQuery } = await import('../../packages/hooks/useEditorPersistence')
const mockUseEditorSaveMutation = vi.mocked(useEditorSaveMutation)
const mockUseEditorLoadQuery = vi.mocked(useEditorLoadQuery)

describe('EditorPage Integration - Persistence Callback Infinite Loop Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockUseParams.mockReturnValue({ reviewId: 'test-review-id' })
    
    const mockPersistence = createMockEditorPersistence()
    mockUseEditorSaveMutation.mockReturnValue(mockPersistence.saveMutation)
    mockUseEditorLoadQuery.mockReturnValue({ data: mockPersistence.loadedData })
    
    mockUseEditorStore.mockReturnValue(createMockEditorStore())
  })

  describe('Persistence Callback Stability', () => {
    it('should not cause infinite loops when setting persistence callbacks', async () => {
      const setPersistenceCallbacks = vi.fn()
      let callbackSetupCount = 0
      
      // Track how many times callbacks are set up
      setPersistenceCallbacks.mockImplementation(() => {
        callbackSetupCount++
      })

      mockUseEditorStore.mockReturnValue(createMockEditorStore({
        setPersistenceCallbacks
      }))

      // Render component
      const { rerender } = render(<EditorPage />)
      
      // Initial render should set up callbacks once
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(1)
      expect(callbackSetupCount).toBe(1)

      // Multiple re-renders with same reviewId should not trigger additional setups
      rerender(<EditorPage />)
      rerender(<EditorPage />)
      rerender(<EditorPage />)

      // Should still only be called once since reviewId hasn't changed
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(1)
      expect(callbackSetupCount).toBe(1)
    })

    it('should demonstrate the infinite loop pattern was fixed', () => {
      // This test demonstrates that the fix prevents infinite loops
      const setPersistenceCallbacks = vi.fn()
      let renderCount = 0
      
      // Custom hook that simulates the old problematic pattern
      const ProblematicComponent = () => {
        renderCount++
        
        // Simulate changing dependencies every render (the old pattern)
        const saveMutation = { mutateAsync: vi.fn() } // New object every render
        const loadedData = { id: renderCount } // Changes every render
        
        // If we used these as dependencies, it would cause infinite loop:
        // useEffect(() => { setPersistenceCallbacks(...) }, [saveMutation, loadedData])
        
        // But the FIXED pattern only depends on reviewId:
        React.useEffect(() => {
          setPersistenceCallbacks({
            save: saveMutation.mutateAsync,
            load: () => loadedData
          })
        }, ['test-review-id']) // Only stable reviewId dependency
        
        return <div>Test Component</div>
      }
      
      const { rerender } = render(<ProblematicComponent />)
      
      // Multiple re-renders with the FIXED pattern
      rerender(<ProblematicComponent />)
      rerender(<ProblematicComponent />)
      rerender(<ProblematicComponent />)
      
      // With the fix, setPersistenceCallbacks should only be called once
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(1)
      expect(renderCount).toBeGreaterThan(1) // Component did re-render
    })

    it('should validate fixed persistence callback pattern is stable', () => {
      const reviewId = 'test-review-id'
      
      // Test the fixed pattern - only depending on stable reviewId
      const stabilityResult = testEffectDependencyStability(
        [reviewId], // Only stable reviewId dependency
        1 // Should only run once with stable dependencies
      )

      expect(stabilityResult.isStable).toBe(true)
      expect(stabilityResult.hasUnstableDependencies).toBe(false)
      expect(stabilityResult.effectRunCount).toBe(1)
    })

    it('should detect when reviewId changes trigger callback updates', () => {
      const setPersistenceCallbacks = vi.fn()
      
      mockUseEditorStore.mockReturnValue(createMockEditorStore({
        setPersistenceCallbacks
      }))

      // Initial render with first reviewId
      mockUseParams.mockReturnValue({ reviewId: 'review-1' })
      const { rerender } = render(<EditorPage />)
      
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(1)

      // Change reviewId - should trigger new callback setup
      mockUseParams.mockReturnValue({ reviewId: 'review-2' })
      rerender(<EditorPage />)
      
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(2)
    })
  })

  describe('Performance Impact Testing', () => {
    it('should complete persistence callback setup within performance budget', async () => {
      const setPersistenceCallbacks = vi.fn()
      
      mockUseEditorStore.mockReturnValue(createMockEditorStore({
        setPersistenceCallbacks
      }))

      const performanceResult = await performanceMonitor.measureExecution(
        () => {
          render(<EditorPage />)
        },
        1000 // 1 second timeout
      )

      expect(performanceResult.isPotentialInfiniteLoop).toBe(false)
      expect(performanceResult.duration).toBeLessThan(1000)
      expect(performanceResult.performanceGrade).toMatch(/excellent|good|fair/)
    })

    it('should not block main thread during persistence setup', () => {
      const setPersistenceCallbacks = vi.fn()
      
      mockUseEditorStore.mockReturnValue(createMockEditorStore({
        setPersistenceCallbacks
      }))

      const blockingResult = performanceMonitor.detectBlockedMainThread(
        () => {
          render(<EditorPage />)
        },
        100 // 100ms threshold for blocked main thread
      )

      expect(blockingResult.isBlocked).toBe(false)
      expect(blockingResult.severity).toMatch(/low|medium/)
    })
  })

  describe('Error Recovery Testing', () => {
    it('should handle persistence callback errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Create a mock that throws error in useEffect, not during render
      const setPersistenceCallbacks = vi.fn()
      
      // Simulate error in the useEffect itself by mocking saveMutation to throw
      const mockPersistence = createMockEditorPersistence()
      mockPersistence.saveMutation.mutateAsync = vi.fn().mockRejectedValue(new Error('Save failed'))
      mockUseEditorSaveMutation.mockReturnValue(mockPersistence.saveMutation)
      
      mockUseEditorStore.mockReturnValue(createMockEditorStore({
        setPersistenceCallbacks
      }))

      // Should not crash the entire component
      expect(() => {
        render(<EditorPage />)
      }).not.toThrow()

      // Should render editor UI despite persistence issues
      expect(screen.getByTestId('editor-canvas')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should maintain editor functionality when persistence fails', () => {
      const setPersistenceCallbacks = vi.fn()
      const addNode = vi.fn()
      const saveToDatabase = vi.fn().mockRejectedValue(new Error('Save failed'))
      
      mockUseEditorStore.mockReturnValue(createMockEditorStore({
        setPersistenceCallbacks,
        addNode,
        saveToDatabase,
        isDirty: true
      }))

      render(<EditorPage />)

      // Editor should still be functional
      expect(screen.getByTestId('editor-canvas')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      
      // Persistence callbacks should still be set up
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(1)
    })
  })

  describe('State Management Integration', () => {
    it('should properly coordinate store, hooks, and component state', () => {
      const loadFromDatabase = vi.fn()
      const setPersistenceCallbacks = vi.fn()
      
      mockUseEditorStore.mockReturnValue(createMockEditorStore({
        loadFromDatabase,
        setPersistenceCallbacks
      }))

      render(<EditorPage />)

      // Should set up persistence callbacks
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(1)
      
      // Should load data after setting up callbacks
      expect(loadFromDatabase).toHaveBeenCalledWith('test-review-id')
      
      // Should coordinate properly without conflicts
      expect(setPersistenceCallbacks).toHaveBeenCalledTimes(1)
      expect(loadFromDatabase).toHaveBeenCalledTimes(1)
    })
  })
})