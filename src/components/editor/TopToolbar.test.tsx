// ABOUTME: Tests for TopToolbar ensuring Google Docs-style toolbar functionality and canvas controls

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopToolbar } from './TopToolbar'
import { useEditorStore } from '@/store/editorStore'

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}))

const mockUseEditorStore = vi.mocked(useEditorStore)

const createMockStore = (overrides = {}) => ({
  selectedNodeId: null,
  nodes: [],
  updateNode: vi.fn(),
  deleteNode: vi.fn(),
  duplicateNode: vi.fn(),
  selectNode: vi.fn(),
  currentViewport: 'desktop',
  switchViewport: vi.fn(),
  canvasTheme: 'light',
  setCanvasTheme: vi.fn(),
  showGrid: false,
  toggleGrid: vi.fn(),
  showRulers: false,
  toggleRulers: vi.fn(),
  showGuidelines: false,
  toggleGuidelines: vi.fn(),
  toggleFullscreen: vi.fn(),
  isFullscreen: false,
  guidelines: { horizontal: [], vertical: [] },
  clearGuidelines: vi.fn(),
  ...overrides
})

const createMockNode = (type: string, data: any = {}) => ({
  id: 'test-node-1',
  type,
  data
})

describe('TopToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEditorStore.mockReturnValue(createMockStore())
  })

  describe('Basic Rendering', () => {
    it('should render viewport controls', () => {
      render(<TopToolbar />)
      
      expect(screen.getByText('Desktop')).toBeInTheDocument()
      expect(screen.getByText('Mobile')).toBeInTheDocument()
    })

    it('should render canvas controls', () => {
      render(<TopToolbar />)
      
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByText('Full')).toBeInTheDocument()
      expect(screen.getByText('View')).toBeInTheDocument()
    })

    it('should show no selection message when no block is selected', () => {
      render(<TopToolbar />)
      
      expect(screen.getByText('Select a block to edit its properties')).toBeInTheDocument()
    })
  })

  describe('Viewport Controls', () => {
    it('should switch viewport when desktop is clicked', async () => {
      const switchViewport = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        currentViewport: 'mobile',
        switchViewport 
      }))
      
      render(<TopToolbar />)
      
      const desktopButton = screen.getByText('Desktop')
      await fireEvent.click(desktopButton)
      
      expect(switchViewport).toHaveBeenCalledWith('desktop')
    })

    it('should switch viewport when mobile is clicked', async () => {
      const switchViewport = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        currentViewport: 'desktop',
        switchViewport 
      }))
      
      render(<TopToolbar />)
      
      const mobileButton = screen.getByText('Mobile')
      await fireEvent.click(mobileButton)
      
      expect(switchViewport).toHaveBeenCalledWith('mobile')
    })
  })

  describe('Canvas Controls', () => {
    it('should toggle theme when theme button is clicked', async () => {
      const setCanvasTheme = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        canvasTheme: 'light',
        setCanvasTheme 
      }))
      
      render(<TopToolbar />)
      
      const themeButton = screen.getByText('Light')
      await fireEvent.click(themeButton)
      
      expect(setCanvasTheme).toHaveBeenCalledWith('dark')
    })

    it('should toggle fullscreen when fullscreen button is clicked', async () => {
      const toggleFullscreen = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ 
        isFullscreen: false,
        toggleFullscreen 
      }))
      
      render(<TopToolbar />)
      
      const fullscreenButton = screen.getByText('Full')
      await fireEvent.click(fullscreenButton)
      
      expect(toggleFullscreen).toHaveBeenCalled()
    })
  })

  describe('Block Controls', () => {
    it('should show block controls when a block is selected', () => {
      const textNode = createMockNode('textBlock', { content: 'Test text', fontSize: 16 })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [textNode]
      }))
      
      render(<TopToolbar />)
      
      expect(screen.getByText('Text Block:')).toBeInTheDocument()
      expect(screen.getByDisplayValue('16')).toBeInTheDocument() // Font size input
    })

    it('should call duplicateNode when duplicate button is clicked', async () => {
      const duplicateNode = vi.fn()
      const textNode = createMockNode('textBlock', { content: 'Test text' })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [textNode],
        duplicateNode
      }))
      
      render(<TopToolbar />)
      
      const duplicateButton = screen.getByTitle('Duplicate block')
      await fireEvent.click(duplicateButton)
      
      expect(duplicateNode).toHaveBeenCalledWith('test-node-1')
    })

    it('should call deleteNode when delete button is clicked', async () => {
      const deleteNode = vi.fn()
      const selectNode = vi.fn()
      const textNode = createMockNode('textBlock', { content: 'Test text' })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [textNode],
        deleteNode,
        selectNode
      }))
      
      render(<TopToolbar />)
      
      const deleteButton = screen.getByTitle('Delete block')
      await fireEvent.click(deleteButton)
      
      expect(deleteNode).toHaveBeenCalledWith('test-node-1')
      expect(selectNode).toHaveBeenCalledWith(null)
    })
  })

  describe('Block Type Specific Controls', () => {
    it('should render text block controls for text blocks', () => {
      const textNode = createMockNode('textBlock', { 
        content: 'Test text', 
        fontSize: 18,
        textAlign: 'center',
        fontFamily: 'serif'
      })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [textNode]
      }))
      
      render(<TopToolbar />)
      
      expect(screen.getByDisplayValue('18')).toBeInTheDocument() // Font size
      expect(screen.getByText('px')).toBeInTheDocument() // Font size unit
    })

    it('should render heading block controls for heading blocks', () => {
      const headingNode = createMockNode('headingBlock', { 
        content: 'Test heading', 
        level: 2,
        textAlign: 'left'
      })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [headingNode]
      }))
      
      render(<TopToolbar />)
      
      expect(screen.getByText('Heading Block:')).toBeInTheDocument()
      expect(screen.getByText('H2')).toBeInTheDocument() // Heading level button
    })

    it('should render image block controls for image blocks', () => {
      const imageNode = createMockNode('imageBlock', { 
        url: 'https://example.com/image.jpg',
        alt: 'Test image'
      })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [imageNode]
      }))
      
      render(<TopToolbar />)
      
      expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test image')).toBeInTheDocument()
    })

    it('should render poll block controls for poll blocks', () => {
      const pollNode = createMockNode('pollBlock', { 
        question: 'What is your favorite color?',
        options: [
          { id: 'opt1', text: 'Red', votes: 0 },
          { id: 'opt2', text: 'Blue', votes: 0 }
        ]
      })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [pollNode]
      }))
      
      render(<TopToolbar />)
      
      expect(screen.getByDisplayValue('What is your favorite color?')).toBeInTheDocument()
      expect(screen.getByText('2 options')).toBeInTheDocument()
    })
  })

  describe('Node Updates', () => {
    it('should update node data when input values change', async () => {
      const updateNode = vi.fn()
      const textNode = createMockNode('textBlock', { content: 'Test text', fontSize: 16 })
      mockUseEditorStore.mockReturnValue(createMockStore({
        selectedNodeId: 'test-node-1',
        nodes: [textNode],
        updateNode
      }))
      
      render(<TopToolbar />)
      
      const fontSizeInput = screen.getByDisplayValue('16')
      await fireEvent.change(fontSizeInput, { target: { value: '20' } })
      
      expect(updateNode).toHaveBeenCalledWith('test-node-1', {
        data: expect.objectContaining({
          fontSize: 20
        })
      })
    })
  })
})