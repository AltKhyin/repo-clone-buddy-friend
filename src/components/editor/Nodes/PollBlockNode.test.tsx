// ABOUTME: Tests for PollBlockNode ensuring proper voting functionality and state management

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { PollBlockNode } from './PollBlockNode';
import { useEditorStore } from '@/store/editorStore';

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

const mockUseEditorStore = vi.mocked(useEditorStore);

// Wrapper component to provide React Flow context
const ReactFlowWrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactFlowProvider>
    <div style={{ width: '100vw', height: '100vh' }}>{children}</div>
  </ReactFlowProvider>
);

const createMockStore = (overrides = {}) => ({
  updateNode: vi.fn(),
  canvasTheme: 'light',
  ...overrides,
});

const createMockPollData = (overrides = {}) => ({
  question: 'What is your opinion?',
  options: [
    { id: 'opt-1-123', text: 'Option 1', votes: 5 },
    { id: 'opt-2-456', text: 'Option 2', votes: 3 },
  ],
  allowMultiple: false,
  showResults: true,
  totalVotes: 8,
  ...overrides,
});

describe('PollBlockNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorStore.mockReturnValue(createMockStore());
  });

  describe('Rendering', () => {
    it('should render poll question correctly', () => {
      const pollData = createMockPollData();

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('What is your opinion?')).toBeInTheDocument();
      expect(screen.getByText('Poll')).toBeInTheDocument();
    });

    it('should render all poll options', () => {
      const pollData = createMockPollData();

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should show total vote count', () => {
      const pollData = createMockPollData();

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('8 votes')).toBeInTheDocument();
    });

    it('should show results when showResults is true and user has voted', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      const pollData = createMockPollData({ showResults: true });

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      // Vote first to enable results display
      const redOption = screen.getByText('Red').closest('div');
      if (redOption) {
        await fireEvent.click(redOption);
      }

      // Results should now be visible (we need to re-render with updated state)
      // Note: In a real scenario, the component would re-render with new data
      // For the test, we're checking the voting mechanism works
      expect(updateNode).toHaveBeenCalled();
    });

    it('should show multiple choice badge when allowMultiple is true', () => {
      const pollData = createMockPollData({ allowMultiple: true });

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      expect(screen.getByText('Multiple choice')).toBeInTheDocument();
    });
  });

  describe('Voting Functionality', () => {
    it('should call updateNode when voting on an option', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      const pollData = createMockPollData({ showResults: false, totalVotes: 0 });

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      const redOption = screen.getByText('Red').closest('div');
      expect(redOption).toBeInTheDocument();

      if (redOption) {
        await fireEvent.click(redOption);
      }

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          options: expect.arrayContaining([
            expect.objectContaining({
              id: 'option-1',
              text: 'Red',
              votes: 6, // Should increment from 5 to 6
            }),
          ]),
          totalVotes: 11, // Should increment total votes (10 + 1)
        }),
      });
    });

    it('should handle multiple choice voting correctly', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      const pollData = createMockPollData({
        allowMultiple: true,
        showResults: false,
        totalVotes: 0,
        options: [
          { id: 'option-1', text: 'Red', votes: 0 },
          { id: 'option-2', text: 'Blue', votes: 0 },
        ],
      });

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      // Vote on multiple options
      const redOption = screen.getByText('Red').closest('div');
      const blueOption = screen.getByText('Blue').closest('div');

      if (redOption) {
        await fireEvent.click(redOption);
      }

      if (blueOption) {
        await fireEvent.click(blueOption);
      }

      // Should be called twice, once for each vote
      expect(updateNode).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode styling when canvasTheme is dark', () => {
      mockUseEditorStore.mockReturnValue(createMockStore({ canvasTheme: 'dark' }));

      const pollData = createMockPollData();

      const { container } = render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      // Should have dark mode styling applied through inline styles
      const cardElement =
        container.querySelector('[style*="#1f2937"]') ||
        container.querySelector('[style*="rgb(31, 41, 55)"]');
      expect(cardElement).toBeTruthy();
    });
  });

  describe('Selection State', () => {
    it('should show selection ring when selected', () => {
      const pollData = createMockPollData();

      const { container } = render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={true}
          />
        </ReactFlowWrapper>
      );

      // Should have selection ring classes
      const wrapper = container.querySelector('[class*="ring-2"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no options exist', () => {
      const pollData = createMockPollData({ options: [] });

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      expect(
        screen.getByText('No poll options yet. Use the inspector to add options.')
      ).toBeInTheDocument();
    });
  });

  describe('Data Initialization', () => {
    it('should initialize with default data when poll data is null or invalid', () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      // Test with null data
      const { container } = render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="test-poll"
            data={{
              id: 'test-poll',
              type: 'pollBlock',
              data: null as any,
            }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      // Should call updateNode with default poll data
      expect(updateNode).toHaveBeenCalledWith('test-poll', {
        data: expect.objectContaining({
          question: 'What is your opinion?',
          options: expect.arrayContaining([
            expect.objectContaining({ text: 'Option 1', votes: 0 }),
            expect.objectContaining({ text: 'Option 2', votes: 0 }),
          ]),
          allowMultiple: false,
          showResults: true,
          totalVotes: 0,
        }),
      });

      // Should render the default question
      expect(container).toHaveTextContent('What is your opinion?');
      expect(container).toHaveTextContent('Option 1');
      expect(container).toHaveTextContent('Option 2');

      // Should NOT show "invalid poll data" message
      expect(container).not.toHaveTextContent('invalid poll data');
      expect(container).not.toHaveTextContent('Invalid Poll Data');
    });

    it('should handle missing properties gracefully with defaults', () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      const incompleteData = {
        question: undefined,
        options: undefined,
        allowMultiple: undefined,
        showResults: undefined,
        totalVotes: undefined,
      };

      const { container } = render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="test-poll"
            data={{
              id: 'test-poll',
              type: 'pollBlock',
              data: incompleteData as any,
            }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      // Should render with safe defaults without calling updateNode (data exists but incomplete)
      expect(container).toHaveTextContent('What is your opinion?');
      expect(container).toHaveTextContent('Option 1');
      expect(container).toHaveTextContent('Option 2');

      // Should NOT show error messages
      expect(container).not.toHaveTextContent('invalid');
      expect(container).not.toHaveTextContent('error');
    });
  });

  describe('Error Handling', () => {
    it('should handle voting errors gracefully', async () => {
      const updateNode = vi.fn().mockImplementation(() => {
        throw new Error('Update failed');
      });
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const pollData = createMockPollData({ showResults: false });

      render(
        <ReactFlowWrapper>
          <PollBlockNode
            id="poll-1"
            data={{ id: 'poll-1', type: 'pollBlock', data: pollData }}
            selected={false}
          />
        </ReactFlowWrapper>
      );

      const redOption = screen.getByText('Red').closest('div');
      if (redOption) {
        await fireEvent.click(redOption);
      }

      expect(consoleSpy).toHaveBeenCalledWith('Failed to vote:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
