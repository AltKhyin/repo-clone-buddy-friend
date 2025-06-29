// ABOUTME: Tests for editorStore fullscreen functionality with browser fullscreen API integration

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEditorStore } from './editorStore'

// Mock the browser fullscreen API
const mockFullscreenAPI = {
  requestFullscreen: vi.fn().mockResolvedValue(undefined),
  exitFullscreen: vi.fn().mockResolvedValue(undefined),
  webkitRequestFullscreen: vi.fn().mockResolvedValue(undefined),
  webkitExitFullscreen: vi.fn().mockResolvedValue(undefined),
  msRequestFullscreen: vi.fn().mockResolvedValue(undefined),
  msExitFullscreen: vi.fn().mockResolvedValue(undefined),
  mozRequestFullScreen: vi.fn().mockResolvedValue(undefined),
  mozCancelFullScreen: vi.fn().mockResolvedValue(undefined),
  fullscreenElement: null,
  webkitFullscreenElement: null,
  msFullscreenElement: null,
  mozFullScreenElement: null
}

describe('EditorStore Fullscreen Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the document fullscreen API
    Object.defineProperty(document, 'documentElement', {
      value: {
        requestFullscreen: mockFullscreenAPI.requestFullscreen,
        webkitRequestFullscreen: mockFullscreenAPI.webkitRequestFullscreen,
        msRequestFullscreen: mockFullscreenAPI.msRequestFullscreen,
        mozRequestFullScreen: mockFullscreenAPI.mozRequestFullScreen
      },
      writable: true
    })
    
    Object.defineProperty(document, 'exitFullscreen', {
      value: mockFullscreenAPI.exitFullscreen,
      writable: true
    })
    
    Object.defineProperty(document, 'webkitExitFullscreen', {
      value: mockFullscreenAPI.webkitExitFullscreen,
      writable: true
    })
    
    Object.defineProperty(document, 'msExitFullscreen', {
      value: mockFullscreenAPI.msExitFullscreen,
      writable: true
    })
    
    Object.defineProperty(document, 'mozCancelFullScreen', {
      value: mockFullscreenAPI.mozCancelFullScreen,
      writable: true
    })
    
    // Mock fullscreen detection properties
    Object.defineProperty(document, 'fullscreenElement', {
      get: () => mockFullscreenAPI.fullscreenElement,
      configurable: true
    })
    
    Object.defineProperty(document, 'webkitFullscreenElement', {
      get: () => mockFullscreenAPI.webkitFullscreenElement,
      configurable: true
    })
    
    Object.defineProperty(document, 'msFullscreenElement', {
      get: () => mockFullscreenAPI.msFullscreenElement,
      configurable: true
    })
    
    Object.defineProperty(document, 'mozFullScreenElement', {
      get: () => mockFullscreenAPI.mozFullScreenElement,
      configurable: true
    })
    
    // Reset store state
    useEditorStore.getState().reset()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
    // Reset all fullscreen elements
    mockFullscreenAPI.fullscreenElement = null
    mockFullscreenAPI.webkitFullscreenElement = null
    mockFullscreenAPI.msFullscreenElement = null
    mockFullscreenAPI.mozFullScreenElement = null
  })

  describe('Initial State', () => {
    it('should start with fullscreen disabled', () => {
      const { isFullscreen } = useEditorStore.getState()
      expect(isFullscreen).toBe(false)
    })
  })

  describe('Enter Fullscreen', () => {
    it('should enter fullscreen mode using modern API', async () => {
      const store = useEditorStore.getState()
      
      await store.toggleFullscreen()
      
      expect(mockFullscreenAPI.requestFullscreen).toHaveBeenCalledOnce()
      expect(useEditorStore.getState().isFullscreen).toBe(true)
    })


    it('should support browser fullscreen API integration', async () => {
      // Test that the fullscreen API integration works
      const store = useEditorStore.getState()
      const initialState = store.isFullscreen
      
      // Toggle fullscreen (enter if currently false, exit if currently true)
      await store.toggleFullscreen()
      expect(useEditorStore.getState().isFullscreen).toBe(!initialState)
      
      // Toggle again (should return to initial state)
      await store.toggleFullscreen()
      expect(useEditorStore.getState().isFullscreen).toBe(initialState)
    })
  })

  describe('Exit Fullscreen', () => {
    beforeEach(() => {
      // Set initial fullscreen state
      useEditorStore.setState({ isFullscreen: true })
    })

    it('should exit fullscreen mode using modern API', async () => {
      const store = useEditorStore.getState()
      
      await store.toggleFullscreen()
      
      expect(mockFullscreenAPI.exitFullscreen).toHaveBeenCalledOnce()
      expect(useEditorStore.getState().isFullscreen).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle requestFullscreen rejection gracefully', async () => {
      const error = new Error('Fullscreen denied')
      
      // Reset and set up the mock to reject
      vi.clearAllMocks()
      Object.defineProperty(document, 'documentElement', {
        value: {
          requestFullscreen: vi.fn().mockRejectedValue(error)
        },
        writable: true
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const store = useEditorStore.getState()
      
      await store.toggleFullscreen()
      
      expect(consoleSpy).toHaveBeenCalledWith('Fullscreen toggle failed:', error)
      expect(useEditorStore.getState().isFullscreen).toBe(false) // State should not change on error
      
      consoleSpy.mockRestore()
    })

    it('should handle exitFullscreen rejection gracefully', async () => {
      const error = new Error('Exit fullscreen failed')
      
      // Set up document.exitFullscreen to reject
      Object.defineProperty(document, 'exitFullscreen', {
        value: vi.fn().mockRejectedValue(error),
        writable: true
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Set initial fullscreen state
      useEditorStore.setState({ isFullscreen: true })
      const store = useEditorStore.getState()
      
      await store.toggleFullscreen()
      
      expect(consoleSpy).toHaveBeenCalledWith('Fullscreen toggle failed:', error)
      expect(useEditorStore.getState().isFullscreen).toBe(true) // State should not change on error
      
      consoleSpy.mockRestore()
    })
  })

  describe('Fullscreen Change Handler', () => {
    it('should detect when browser is in fullscreen mode', () => {
      mockFullscreenAPI.fullscreenElement = document.documentElement
      
      const store = useEditorStore.getState()
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(true)
    })

    it('should detect when browser exits fullscreen mode', () => {
      // Set initial fullscreen state
      useEditorStore.setState({ isFullscreen: true })
      mockFullscreenAPI.fullscreenElement = null
      
      const store = useEditorStore.getState()
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(false)
    })

    it('should detect webkit fullscreen element', () => {
      mockFullscreenAPI.webkitFullscreenElement = document.documentElement
      
      const store = useEditorStore.getState()
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(true)
    })

    it('should detect IE/Edge fullscreen element', () => {
      mockFullscreenAPI.msFullscreenElement = document.documentElement
      
      const store = useEditorStore.getState()
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(true)
    })

    it('should detect Firefox fullscreen element', () => {
      mockFullscreenAPI.mozFullScreenElement = document.documentElement
      
      const store = useEditorStore.getState()
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(true)
    })

    it('should properly sync state when no fullscreen element is detected', () => {
      // Set initial fullscreen state
      useEditorStore.setState({ isFullscreen: true })
      
      // Ensure all fullscreen elements are null
      mockFullscreenAPI.fullscreenElement = null
      mockFullscreenAPI.webkitFullscreenElement = null
      mockFullscreenAPI.msFullscreenElement = null
      mockFullscreenAPI.mozFullScreenElement = null
      
      const store = useEditorStore.getState()
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(false)
    })
  })

  describe('State Consistency', () => {
    it('should maintain consistent state throughout fullscreen lifecycle', async () => {
      const store = useEditorStore.getState()
      
      // Start not fullscreen
      expect(useEditorStore.getState().isFullscreen).toBe(false)
      
      // Enter fullscreen
      await store.toggleFullscreen()
      expect(useEditorStore.getState().isFullscreen).toBe(true)
      
      // Exit fullscreen
      await store.toggleFullscreen()
      expect(useEditorStore.getState().isFullscreen).toBe(false)
    })

    it('should sync with browser fullscreen state changes', () => {
      const store = useEditorStore.getState()
      
      // Simulate browser entering fullscreen (e.g., F11 key)
      mockFullscreenAPI.fullscreenElement = document.documentElement
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(true)
      
      // Simulate browser exiting fullscreen (e.g., ESC key)
      mockFullscreenAPI.fullscreenElement = null
      store.handleFullscreenChange()
      
      expect(useEditorStore.getState().isFullscreen).toBe(false)
    })
  })
})