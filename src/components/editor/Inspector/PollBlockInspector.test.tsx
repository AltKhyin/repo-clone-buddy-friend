// ABOUTME: Tests for PollBlockInspector ensuring proper poll editing and management functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PollBlockInspector } from './PollBlockInspector';
import { useEditorStore } from '@/store/editorStore';
import { generateNodeId } from '@/types/editor';

// Mock the editor store
vi.mock('@/store/editorStore', () => ({
  useEditorStore: vi.fn(),
}));

// Mock generateNodeId
vi.mock('@/types/editor', () => ({
  generateNodeId: vi.fn(),
}));

const mockUseEditorStore = vi.mocked(useEditorStore);
const mockGenerateNodeId = vi.mocked(generateNodeId);

const createMockPollData = (overrides = {}) => ({
  question: 'What is your favorite color?',
  options: [
    { id: 'option-1', text: 'Red', votes: 5 },
    { id: 'option-2', text: 'Blue', votes: 3 },
  ],
  allowMultiple: false,
  showResults: true,
  totalVotes: 8,
  ...overrides,
});

const createMockStore = (overrides = {}) => {
  const defaultNodes = [
    {
      id: 'poll-1',
      type: 'pollBlock',
      data: createMockPollData(),
    },
  ];

  return {
    nodes: defaultNodes,
    updateNode: vi.fn(),
    ...overrides,
  };
};

describe('PollBlockInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEditorStore.mockReturnValue(createMockStore());
    mockGenerateNodeId.mockReturnValue('new-option-id');
  });

  describe('Rendering', () => {
    it('should render poll question editor', () => {
      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.getByDisplayValue('What is your favorite color?')).toBeInTheDocument();
      expect(screen.getByText('Poll Question')).toBeInTheDocument();
    });

    it('should render all existing poll options', () => {
      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.getByDisplayValue('Red')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Blue')).toBeInTheDocument();
    });

    it('should show option count badge', () => {
      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.getByText('2 options')).toBeInTheDocument();
    });

    it('should show poll settings switches', () => {
      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
      expect(screen.getByText('Show Results')).toBeInTheDocument();
    });
  });

  describe('Question Editing', () => {
    it('should update question when changed', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      render(<PollBlockInspector nodeId="poll-1" />);

      const questionInput = screen.getByDisplayValue('What is your favorite color?');
      await fireEvent.change(questionInput, { target: { value: 'What is your favorite animal?' } });

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          question: 'What is your favorite animal?',
        }),
      });
    });
  });

  describe('Option Management', () => {
    it('should add new option when Add button is clicked', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      render(<PollBlockInspector nodeId="poll-1" />);

      const newOptionInput = screen.getByPlaceholderText('Add new option...');
      const addButton = screen.getByText('Add');

      await fireEvent.change(newOptionInput, { target: { value: 'Green' } });
      await fireEvent.click(addButton);

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          options: expect.arrayContaining([
            { id: 'option-1', text: 'Red', votes: 5 },
            { id: 'option-2', text: 'Blue', votes: 3 },
            { id: 'new-option-id', text: 'Green', votes: 0 },
          ]),
        }),
      });
    });

    it('should add option when Enter key is pressed', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      render(<PollBlockInspector nodeId="poll-1" />);

      const newOptionInput = screen.getByPlaceholderText('Add new option...');
      await fireEvent.change(newOptionInput, { target: { value: 'Yellow' } });
      await fireEvent.keyPress(newOptionInput, { key: 'Enter', charCode: 13 });

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          options: expect.arrayContaining([{ id: 'new-option-id', text: 'Yellow', votes: 0 }]),
        }),
      });
    });

    it('should not add empty option', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      render(<PollBlockInspector nodeId="poll-1" />);

      const addButton = screen.getByText('Add');
      await fireEvent.click(addButton);

      expect(updateNode).not.toHaveBeenCalled();
    });

    it('should update existing option text', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      render(<PollBlockInspector nodeId="poll-1" />);

      const redOption = screen.getByDisplayValue('Red');
      await fireEvent.change(redOption, { target: { value: 'Crimson' } });

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          options: expect.arrayContaining([
            { id: 'option-1', text: 'Crimson', votes: 5 },
            { id: 'option-2', text: 'Blue', votes: 3 },
          ]),
        }),
      });
    });

    it('should delete option when delete button is clicked', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      render(<PollBlockInspector nodeId="poll-1" />);

      const deleteButtons = screen.getAllByRole('button');
      const redDeleteButton = deleteButtons.find(button =>
        button.closest('div')?.querySelector('input[value="Red"]')
      );

      expect(redDeleteButton).toBeInTheDocument();
      if (redDeleteButton) {
        await fireEvent.click(redDeleteButton);
      }

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          options: [{ id: 'option-2', text: 'Blue', votes: 3 }],
          totalVotes: 3, // Should subtract deleted option's votes
        }),
      });
    });
  });

  describe('Settings Management', () => {
    it('should toggle multiple choice setting', async () => {
      const updateNode = vi.fn();
      const mockStoreData = createMockStore({
        updateNode,
        nodes: [
          {
            id: 'poll-1',
            type: 'pollBlock',
            data: createMockPollData({ allowMultiple: false }),
          },
        ],
      });
      mockUseEditorStore.mockReturnValue(mockStoreData);

      render(<PollBlockInspector nodeId="poll-1" />);

      const multipleChoiceSwitch = screen.getByLabelText('Allow multiple choice');
      await fireEvent.click(multipleChoiceSwitch);

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          allowMultiple: true,
        }),
      });
    });

    it('should toggle show results setting', async () => {
      const updateNode = vi.fn();
      const mockStoreData = createMockStore({
        updateNode,
        nodes: [
          {
            id: 'poll-1',
            type: 'pollBlock',
            data: createMockPollData({ showResults: true }),
          },
        ],
      });
      mockUseEditorStore.mockReturnValue(mockStoreData);

      render(<PollBlockInspector nodeId="poll-1" />);

      const showResultsSwitch = screen.getByLabelText('Show poll results');
      await fireEvent.click(showResultsSwitch);

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          showResults: false,
        }),
      });
    });
  });

  describe('Vote Management', () => {
    it('should show vote counts for options', () => {
      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.getByText('5 votes')).toBeInTheDocument();
      expect(screen.getByText('3 votes')).toBeInTheDocument();
    });

    it('should show vote percentages', () => {
      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.getByText('(63%)')).toBeInTheDocument(); // 5/8 = 62.5% rounds to 63%
      expect(screen.getByText('(38%)')).toBeInTheDocument(); // 3/8 = 37.5% rounds to 38%
    });

    it('should reset all votes when Reset Votes is clicked', async () => {
      const updateNode = vi.fn();
      mockUseEditorStore.mockReturnValue(createMockStore({ updateNode }));

      render(<PollBlockInspector nodeId="poll-1" />);

      const resetButton = screen.getByText('Reset Votes');
      await fireEvent.click(resetButton);

      expect(updateNode).toHaveBeenCalledWith('poll-1', {
        data: expect.objectContaining({
          options: [
            { id: 'option-1', text: 'Red', votes: 0 },
            { id: 'option-2', text: 'Blue', votes: 0 },
          ],
          totalVotes: 0,
        }),
      });
    });
  });

  describe('Statistics Display', () => {
    it('should show poll statistics when there are votes', () => {
      const mockStoreData = createMockStore({
        nodes: [
          {
            id: 'poll-1',
            type: 'pollBlock',
            data: createMockPollData({ totalVotes: 10 }),
          },
        ],
      });
      mockUseEditorStore.mockReturnValue(mockStoreData);

      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.getByText('Poll Statistics')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // Total votes
      expect(screen.getByText('2')).toBeInTheDocument(); // Number of options
    });

    it('should not show statistics when there are no votes', () => {
      const mockStoreData = createMockStore({
        nodes: [
          {
            id: 'poll-1',
            type: 'pollBlock',
            data: createMockPollData({ totalVotes: 0 }),
          },
        ],
      });
      mockUseEditorStore.mockReturnValue(mockStoreData);

      render(<PollBlockInspector nodeId="poll-1" />);

      expect(screen.queryByText('Poll Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no options exist', () => {
      const mockStoreData = createMockStore({
        nodes: [
          {
            id: 'poll-1',
            type: 'pollBlock',
            data: createMockPollData({ options: [] }),
          },
        ],
      });
      mockUseEditorStore.mockReturnValue(mockStoreData);

      render(<PollBlockInspector nodeId="poll-1" />);

      expect(
        screen.getByText('No options yet. Add your first poll option above.')
      ).toBeInTheDocument();
    });
  });
});
