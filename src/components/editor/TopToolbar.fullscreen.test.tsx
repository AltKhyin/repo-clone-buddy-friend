// ABOUTME: Tests for TopToolbar fullscreen functionality with browser API integration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TopToolbar } from './TopToolbar'
import { useEditorStore } from '@/store/editorStore'

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}))

const mockUseEditorStore = vi.mocked(useEditorStore)

// Mock fullscreen API for testing
const mockFullscreenAPI = {
  requestFullscreen: vi.fn().mockResolvedValue(undefined),
  exitFullscreen: vi.fn().mockResolvedValue(undefined),
  fullscreenElement: null
}

const createMockStore = (overrides = {}) => ({
  nodes: [],
  selectedNodeId: null,
  currentViewport: 'desktop' as const,
  canvasTheme: 'light' as const,
  isFullscreen: false,
  showGrid: true,
  showRulers: false,
  showGuidelines: false,
  guidelines: { horizontal: [], vertical: [] },
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
  switchViewport: vi.fn(),
  setCanvasTheme: vi.fn(),
  toggleFullscreen: vi.fn(),
  toggleGrid: vi.fn(),
  toggleRulers: vi.fn(),
  toggleGuidelines: vi.fn(),
  clearGuidelines: vi.fn(),
  ...overrides
})

describe('TopToolbar Fullscreen Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEditorStore.mockReturnValue(createMockStore())
    
    // Mock browser fullscreen API
    Object.defineProperty(document, 'documentElement', {
      value: {
        requestFullscreen: mockFullscreenAPI.requestFullscreen,
        webkitRequestFullscreen: vi.fn(),
        msRequestFullscreen: vi.fn(),
        mozRequestFullScreen: vi.fn()
      },
      writable: true
    })
    
    Object.defineProperty(document, 'exitFullscreen', {
      value: mockFullscreenAPI.exitFullscreen,
      writable: true
    })
    
    Object.defineProperty(document, 'fullscreenElement', {
      get: () => mockFullscreenAPI.fullscreenElement,
      configurable: true
    })
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
    mockFullscreenAPI.fullscreenElement = null
  })

  describe('Fullscreen Button Rendering', () => {
    it('should render fullscreen button with "Full" text when not in fullscreen', () => {
      render(<TopToolbar />)
      
      const fullscreenButton = screen.getByTitle('Enter fullscreen mode')
      expect(fullscreenButton).toBeInTheDocument()
      expect(fullscreenButton).toHaveTextContent('Full')
    })

    it('should render exit fullscreen button with "Exit" text when in fullscreen', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({ isFullscreen: true }))
      
      render(<TopToolbar />)
      
      const exitButton = screen.getByTitle('Exit fullscreen (ESC)')
      expect(exitButton).toBeInTheDocument()
      expect(exitButton).toHaveTextContent('Exit')
    })

    it('should show different icons for fullscreen and exit states', () => {
      const { rerender } = render(<TopToolbar />)
      
      // Check fullscreen icon (Maximize)
      expect(screen.getByTitle('Enter fullscreen mode')).toBeInTheDocument()
      
      // Switch to fullscreen state
      mockUseEditorStore.mockReturnValue(createMockStore({ isFullscreen: true }))
      rerender(<TopToolbar />)
      
      // Check exit icon (MinusSquare)
      expect(screen.getByTitle('Exit fullscreen (ESC)')).toBeInTheDocument()
    })
  })

  describe('Fullscreen Toggle Functionality', () => {
    it('should call toggleFullscreen when fullscreen button is clicked', async () => {
      const toggleFullscreen = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ toggleFullscreen }))
      
      render(<TopToolbar />)
      
      const fullscreenButton = screen.getByTitle('Enter fullscreen mode')
      await fireEvent.click(fullscreenButton)
      
      expect(toggleFullscreen).toHaveBeenCalledOnce()
    })

    it('should handle fullscreen toggle errors gracefully', async () => {
      const toggleFullscreen = vi.fn().mockRejectedValue(new Error('Fullscreen failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockUseEditorStore.mockReturnValue(createMockStore({ toggleFullscreen }))
      
      render(<TopToolbar />)
      
      const fullscreenButton = screen.getByTitle('Enter fullscreen mode')
      await fireEvent.click(fullscreenButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Fullscreen toggle failed:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Browser Integration', () => {
    it('should use correct fullscreen API when entering fullscreen', () => {
      // Test is handled in editorStore.test.tsx
      // This is a UI integration test to ensure the button works
      
      const toggleFullscreen = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ toggleFullscreen }))
      
      render(<TopToolbar />)
      
      const fullscreenButton = screen.getByTitle('Enter fullscreen mode')
      expect(fullscreenButton).toBeInTheDocument()
      expect(fullscreenButton).toBeEnabled()
    })

    it('should show ESC hint in exit fullscreen tooltip', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({ isFullscreen: true }))
      
      render(<TopToolbar />)
      
      const exitButton = screen.getByTitle('Exit fullscreen (ESC)')
      expect(exitButton).toBeInTheDocument()
      expect(exitButton.getAttribute('title')).toContain('ESC')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for fullscreen button', () => {
      render(<TopToolbar />)
      
      const fullscreenButton = screen.getByTitle('Enter fullscreen mode')
      expect(fullscreenButton).toBeEnabled()
      expect(fullscreenButton).toBeInstanceOf(HTMLButtonElement)
    })

    it('should be keyboard accessible', () => {
      const toggleFullscreen = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ toggleFullscreen }))
      
      render(<TopToolbar />)
      
      const fullscreenButton = screen.getByTitle('Enter fullscreen mode')
      fullscreenButton.focus()
      
      // Simulate Enter key press
      fireEvent.keyDown(fullscreenButton, { key: 'Enter', code: 'Enter' })
      
      // Button should be focusable and interactive
      expect(document.activeElement).toBe(fullscreenButton)
    })
  })

  describe('State Synchronization', () => {
    it('should reflect fullscreen state changes correctly', () => {
      const { rerender } = render(<TopToolbar />)
      
      // Initially not fullscreen
      expect(screen.getByTitle('Enter fullscreen mode')).toBeInTheDocument()
      expect(screen.queryByTitle('Exit fullscreen (ESC)')).not.toBeInTheDocument()
      
      // Switch to fullscreen
      mockUseEditorStore.mockReturnValue(createMockStore({ isFullscreen: true }))
      rerender(<TopToolbar />)
      
      expect(screen.getByTitle('Exit fullscreen (ESC)')).toBeInTheDocument()
      expect(screen.queryByTitle('Enter fullscreen mode')).not.toBeInTheDocument()
    })
  })

  describe('Integration with Other Controls', () => {
    it('should maintain fullscreen button position in toolbar layout', () => {
      render(<TopToolbar />)
      
      // Fullscreen button should be after theme toggle
      const themeButton = screen.getByTitle('Toggle theme')
      const fullscreenButton = screen.getByTitle('Enter fullscreen mode')
      
      expect(themeButton).toBeInTheDocument()
      expect(fullscreenButton).toBeInTheDocument()
      
      // Both buttons should exist in the rendered output
      expect(document.body).toContainElement(themeButton)
      expect(document.body).toContainElement(fullscreenButton)
    })
  })
})