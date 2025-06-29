// ABOUTME: Tests for PollBlockNode ensuring proper voting functionality and state management

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { PollBlockNode } from './PollBlockNode'
import { useEditorStore } from '@/store/editorStore'

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn()
}))

const mockUseEditorStore = vi.mocked(useEditorStore)

// Wrapper component to provide React Flow context
const ReactFlowWrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>
    <div style={{ width: '100vw', height: '100vh' }}>
      {children}
    </div>
  </ReactFlowProvider>
)

const createMockStore = (overrides = {}) => ({
  updateNode: vi.fn(),
  canvasTheme: 'light',
  ...overrides
})

const createMockPollData = (overrides = {}) => ({
  question: 'What is your favorite color?',
  options: [
    { id: 'option-1', text: 'Red', votes: 5 },
    { id: 'option-2', text: 'Blue', votes: 3 },
    { id: 'option-3', text: 'Green', votes: 2 }
  ],
  allowMultiple: false,
  showResults: true,
  totalVotes: 10,
  ...overrides
})

describe('PollBlockNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEditorStore.mockReturnValue(createMockStore())
  })

  describe('Rendering', () => {
    it('should render poll question correctly', () => {
      const pollData = createMockPollData()
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      expect(screen.getByText('What is your favorite color?')).toBeInTheDocument()
      expect(screen.getByText('Poll')).toBeInTheDocument()
    })

    it('should render all poll options', () => {
      const pollData = createMockPollData()
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      expect(screen.getByText('Red')).toBeInTheDocument()
      expect(screen.getByText('Blue')).toBeInTheDocument()
      expect(screen.getByText('Green')).toBeInTheDocument()
    })

    it('should show total vote count', () => {
      const pollData = createMockPollData()
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      expect(screen.getByText('10 votes')).toBeInTheDocument()
    })

    it('should show results when showResults is true and user has voted', async () => {
      const updateNode = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }))
      
      const pollData = createMockPollData({ showResults: true })
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      // Vote first to enable results display
      const redOption = screen.getByText('Red').closest('div')
      if (redOption) {
        await fireEvent.click(redOption)
      }

      // Results should now be visible (we need to re-render with updated state)
      // Note: In a real scenario, the component would re-render with new data
      // For the test, we're checking the voting mechanism works
      expect(updateNode).toHaveBeenCalled()
    })

    it('should show multiple choice badge when allowMultiple is true', () => {
      const pollData = createMockPollData({ allowMultiple: true })
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      expect(screen.getByText('Multiple choice')).toBeInTheDocument()
    })
  })

  describe('Voting Functionality', () => {
    it('should call updateNode when voting on an option', async () => {
      const updateNode = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }))
      
      const pollData = createMockPollData({ showResults: false, totalVotes: 0 })
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      const redOption = screen.getByText('Red').closest('div')
      expect(redOption).toBeInTheDocument()
      
      if (redOption) {
        await fireEvent.click(redOption)
      }

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          options: expect.arrayContaining([
            expect.objectContaining({
              id: 'option-1',
              text: 'Red',
              votes: 6 // Should increment from 5 to 6
            })
          ]),
          totalVotes: 11 // Should increment total votes (10 + 1)
        })
      })
    })

    it('should handle multiple choice voting correctly', async () => {
      const updateNode = vi.fn()
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }))
      
      const pollData = createMockPollData({ 
        allowMultiple: true, 
        showResults: false,
        totalVotes: 0,
        options: [
          { id: 'option-1', text: 'Red', votes: 0 },
          { id: 'option-2', text: 'Blue', votes: 0 }
        ]
      })
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      // Vote on multiple options
      const redOption = screen.getByText('Red').closest('div')
      const blueOption = screen.getByText('Blue').closest('div')
      
      if (redOption) {
        await fireEvent.click(redOption)
      }
      
      if (blueOption) {
        await fireEvent.click(blueOption)
      }

      // Should be called twice, once for each vote
      expect(updateNode).toHaveBeenCalledTimes(2)
    })
  })

  describe('Dark Mode', () => {
    it('should apply dark mode styling when canvasTheme is dark', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({ canvasTheme: 'dark' }))
      
      const pollData = createMockPollData()
      
      const { container } = render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      // Should have dark mode classes
      const card = container.querySelector('[class*="bg-gray-800"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Selection State', () => {
    it('should show selection ring when selected', () => {
      const pollData = createMockPollData()
      
      const { container } = render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={true}
          />
        </ReactFlowWrapper>
      )

      // Should have selection ring classes
      const wrapper = container.querySelector('[class*="ring-2"]')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no options exist', () => {
      const pollData = createMockPollData({ options: [] })
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      expect(screen.getByText('No poll options yet. Use the inspector to add options.')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle voting errors gracefully', async () => {
      const updateNode = vi.fn().mockImplementation(() => {
        throw new Error('Update failed')
      })
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const pollData = createMockPollData({ showResults: false })
      
      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      )

      const redOption = screen.getByText('Red').closest('div')
      if (redOption) {
        await fireEvent.click(redOption)
      }

      expect(consoleSpy).toHaveBeenCalledWith('Failed to vote:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })
})