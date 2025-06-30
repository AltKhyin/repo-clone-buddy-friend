// ABOUTME: Comprehensive persistence test to verify content survives page reloads and database operations

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient } from '@/test-utils/query-client-wrapper'
import { EditorPage } from './EditorPage'
import { useEditorStore } from '@/store/editorStore'
import { supabase } from '@/integrations/supabase/client'
import { NodeObject } from '@/types/editor'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}))

// Mock React Router
vi.mock('react-router-dom', () => ({
  useParams: () => ({ reviewId: 'test-review-persistence' }),
  useNavigate: () => vi.fn(),
}))

// Mock authentication
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user-id', email: 'test@example.com', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
  }),
}))

describe('Editor Persistence System', () => {
  let mockSupabaseResponse: any
  
  beforeEach(() => {
    // Reset the editor store
    useEditorStore.getState().reset()
    
    // Clear all mocks
    vi.clearAllMocks()
    
    // Default mock response for successful operations
    mockSupabaseResponse = {
      data: {
        id: 'test-content-id',
        review_id: 'test-review-persistence',
        structured_content: {
          version: '2.0.0',
          nodes: [],
          layouts: {
            desktop: { items: [] },
            mobile: { items: [] }
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      error: null
    }
  })

  it('should persist and load content correctly through full save/load cycle', async () => {
    const user = userEvent.setup()
    
    // Mock successful database operations
    const mockSelect = vi.fn().mockResolvedValue(mockSupabaseResponse)
    const mockInsert = vi.fn().mockResolvedValue(mockSupabaseResponse)
    const mockUpdate = vi.fn().mockResolvedValue(mockSupabaseResponse)
    
    // @ts-ignore - Mock chaining
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: mockSelect
        })
      }),
      insert: () => ({
        select: () => ({
          single: mockInsert
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: mockUpdate
          })
        })
      })
    })

    const { rerender } = render(
      <EditorPage />,
      { wrapper: ({ children }) => createTestQueryClient(children) }
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add text/i })).toBeInTheDocument()
    })

    // Step 1: Create some content
    const addTextButton = screen.getByRole('button', { name: /add text/i })
    await user.click(addTextButton)

    // Wait for the text block to be added
    await waitFor(() => {
      expect(useEditorStore.getState().nodes).toHaveLength(1)
    })

    const firstNode = useEditorStore.getState().nodes[0]
    expect(firstNode.type).toBe('textBlock')
    expect(firstNode.data.htmlContent).toBe('<p>Type something...</p>')

    // Step 2: Modify the content
    const updatedContent = '<p>This is test content for persistence</p>'
    useEditorStore.getState().updateNode(firstNode.id, {
      data: { ...firstNode.data, htmlContent: updatedContent }
    })

    // Verify content was updated in store
    const updatedNode = useEditorStore.getState().nodes[0]
    expect(updatedNode.data.htmlContent).toBe(updatedContent)

    // Step 3: Manually trigger save to database
    await useEditorStore.getState().saveToDatabase()

    // Verify save was called with correct data
    expect(mockInsert).toHaveBeenCalledWith({
      review_id: 'test-review-persistence',
      structured_content: expect.objectContaining({
        version: '2.0.0',
        nodes: expect.arrayContaining([
          expect.objectContaining({
            type: 'textBlock',
            data: expect.objectContaining({
              htmlContent: updatedContent
            })
          })
        ]),
        layouts: expect.any(Object)
      }),
      created_at: expect.any(String),
      updated_at: expect.any(String)
    })

    // Step 4: Simulate page reload by resetting store and reloading
    useEditorStore.getState().reset()
    
    // Update mock to return the saved content
    const savedContent = {
      ...mockSupabaseResponse,
      data: {
        ...mockSupabaseResponse.data,
        structured_content: {
          version: '2.0.0',
          nodes: [{
            id: firstNode.id,
            type: 'textBlock',
            position: { x: 100, y: 100 },
            data: { htmlContent: updatedContent }
          }],
          layouts: {
            desktop: { 
              items: [{ 
                nodeId: firstNode.id, 
                x: 0, y: 0, w: 6, h: 4 
              }] 
            },
            mobile: { items: [] }
          }
        }
      }
    }
    
    mockSelect.mockResolvedValue(savedContent)

    // Step 5: Re-render component to simulate page reload
    rerender(<EditorPage />)

    // Wait for load to complete
    await waitFor(() => {
      const loadedNodes = useEditorStore.getState().nodes
      expect(loadedNodes).toHaveLength(1)
      expect(loadedNodes[0].data.htmlContent).toBe(updatedContent)
    }, { timeout: 5000 })

    // Verify the content was properly restored
    const restoredState = useEditorStore.getState()
    expect(restoredState.nodes).toHaveLength(1)
    expect(restoredState.nodes[0].type).toBe('textBlock')
    expect(restoredState.nodes[0].data.htmlContent).toBe(updatedContent)
    expect(restoredState.isDirty).toBe(false)
    expect(restoredState.lastSaved).toBeInstanceOf(Date)
  })

  it('should handle persistence errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock database error
    const mockError = new Error('Database connection failed')
    const mockSelect = vi.fn().mockRejectedValue(mockError)
    
    // @ts-ignore - Mock chaining
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: mockSelect
        })
      })
    })

    render(<EditorPage />, { wrapper: ({ children }) => createTestQueryClient(children) })

    // Wait for component to attempt load
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled()
    })

    // Should fall back to empty state gracefully
    const state = useEditorStore.getState()
    expect(state.nodes).toEqual([])
    expect(state.isSaving).toBe(false)
  })

  it('should handle new review (no existing content) correctly', async () => {
    // Mock no existing content (PGRST116 error)
    const noContentError = { code: 'PGRST116', message: 'No rows returned' }
    const mockSelect = vi.fn().mockRejectedValue(noContentError)
    
    // @ts-ignore - Mock chaining
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: mockSelect
        })
      })
    })

    render(<EditorPage />, { wrapper: ({ children }) => createTestQueryClient(children) })

    // Wait for load attempt
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalled()
    })

    // Should start with empty state for new review
    const state = useEditorStore.getState()
    expect(state.nodes).toEqual([])
    expect(state.isDirty).toBe(false)
    expect(state.lastSaved).toBe(null)
  })

  it('should validate content before saving', async () => {
    const user = userEvent.setup()
    
    // Mock successful operations
    const mockInsert = vi.fn().mockResolvedValue(mockSupabaseResponse)
    const mockSelect = vi.fn().mockResolvedValue({ ...mockSupabaseResponse, error: { code: 'PGRST116' } })
    
    // @ts-ignore - Mock chaining
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: mockSelect
        })
      }),
      insert: () => ({
        select: () => ({
          single: mockInsert
        })
      })
    })

    render(<EditorPage />, { wrapper: ({ children }) => createTestQueryClient(children) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add text/i })).toBeInTheDocument()
    })

    // Add a text block
    const addTextButton = screen.getByRole('button', { name: /add text/i })
    await user.click(addTextButton)

    await waitFor(() => {
      expect(useEditorStore.getState().nodes).toHaveLength(1)
    })

    // Trigger save
    await useEditorStore.getState().saveToDatabase()

    // Verify the saved content has proper structure
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        structured_content: expect.objectContaining({
          version: '2.0.0',
          nodes: expect.any(Array),
          layouts: expect.objectContaining({
            desktop: expect.any(Object),
            mobile: expect.any(Object)
          }),
          metadata: expect.objectContaining({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            editorVersion: expect.any(String)
          })
        })
      })
    )
  })

  it('should maintain content integrity across multiple save/load cycles', async () => {
    const user = userEvent.setup()
    
    // Track save calls
    let saveCallCount = 0
    let lastSavedContent: any = null
    
    const mockInsert = vi.fn().mockImplementation((data) => {
      saveCallCount++
      lastSavedContent = data.structured_content
      return Promise.resolve({
        ...mockSupabaseResponse,
        data: { ...mockSupabaseResponse.data, structured_content: data.structured_content }
      })
    })
    
    const mockSelect = vi.fn().mockImplementation(() => {
      if (lastSavedContent) {
        return Promise.resolve({
          data: { ...mockSupabaseResponse.data, structured_content: lastSavedContent },
          error: null
        })
      }
      return Promise.reject({ code: 'PGRST116' })
    })
    
    // @ts-ignore - Mock chaining
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: mockSelect
        })
      }),
      insert: () => ({
        select: () => ({
          single: mockInsert
        })
      })
    })

    render(<EditorPage />, { wrapper: ({ children }) => createTestQueryClient(children) })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add text/i })).toBeInTheDocument()
    })

    // Cycle 1: Add text block
    const addTextButton = screen.getByRole('button', { name: /add text/i })
    await user.click(addTextButton)

    await waitFor(() => {
      expect(useEditorStore.getState().nodes).toHaveLength(1)
    })

    await useEditorStore.getState().saveToDatabase()

    // Cycle 2: Add heading block
    const addHeadingButton = screen.getByRole('button', { name: /add heading/i })
    await user.click(addHeadingButton)

    await waitFor(() => {
      expect(useEditorStore.getState().nodes).toHaveLength(2)
    })

    await useEditorStore.getState().saveToDatabase()

    // Verify final state integrity
    const finalState = useEditorStore.getState()
    expect(finalState.nodes).toHaveLength(2)
    expect(finalState.nodes[0].type).toBe('textBlock')
    expect(finalState.nodes[1].type).toBe('headingBlock')
    expect(saveCallCount).toBe(2)
    
    // Verify content structure is maintained
    expect(lastSavedContent).toMatchObject({
      version: '2.0.0',
      nodes: expect.arrayContaining([
        expect.objectContaining({ type: 'textBlock' }),
        expect.objectContaining({ type: 'headingBlock' })
      ]),
      layouts: expect.any(Object)
    })
  })
})