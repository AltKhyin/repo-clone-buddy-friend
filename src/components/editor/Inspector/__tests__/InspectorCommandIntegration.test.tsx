// ABOUTME: Test suite for validating inspector-command integration and UI control functionality

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Setup DOM environment
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.document = dom.window.document;
global.window = dom.window as any;
import { TableBlockInspector } from '../TableBlockInspector';
import { PollBlockInspector } from '../PollBlockInspector';
import { tableComponentRegistry } from '../../extensions/Table/tableCommands';
import { pollComponentRegistry } from '../../extensions/Poll/pollCommands';

// Mock the editor store
const mockUpdateNode = vi.fn();
const mockNodes = [
  {
    id: 'test-table-123',
    type: 'tableBlock',
    data: {
      tableId: 'test-table-123',
      headers: ['Header 1', 'Header 2'],
      rows: [
        ['Cell 1', 'Cell 2'],
        ['Cell 3', 'Cell 4'],
      ],
      styling: {
        fontSize: 14,
        cellPadding: 12,
        textAlign: 'left',
        striped: false,
        compact: false,
        backgroundColor: 'transparent',
      },
      settings: {
        showHeaders: true,
        resizable: true,
      },
    },
  },
  {
    id: 'test-poll-123',
    type: 'pollBlock',
    data: {
      pollId: 'test-poll-123',
      question: 'What is your favorite color?',
      options: [
        { id: 'opt1', text: 'Red', votes: 5 },
        { id: 'opt2', text: 'Blue', votes: 3 },
      ],
      settings: {
        allowMultiple: false,
        showResults: true,
        allowAnonymous: true,
        requireLogin: false,
      },
      metadata: {
        totalVotes: 8,
        uniqueVoters: 8,
        createdAt: '2023-01-01T00:00:00.000Z',
        lastVoteAt: '2023-01-01T12:00:00.000Z',
      },
      styling: {
        questionFontSize: 18,
        questionFontWeight: 600,
        optionFontSize: 16,
        optionPadding: 12,
        compact: false,
      },
    },
  },
];

vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => ({
    nodes: mockNodes,
    updateNode: mockUpdateNode,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the registry imports
vi.mock('../../extensions/Table/tableCommands', () => ({
  tableComponentRegistry: {
    get: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

vi.mock('../../extensions/Poll/pollCommands', () => ({
  pollComponentRegistry: {
    get: vi.fn(),
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

// Mock UI components
vi.mock('../shared/UnifiedControls', () => ({
  BackgroundControls: ({ data, onChange }: any) => (
    <div data-testid="background-controls">
      <button onClick={() => onChange({ backgroundColor: '#ff0000' })}>Change Background</button>
    </div>
  ),
  BorderControls: ({ data, onChange }: any) => (
    <div data-testid="border-controls">
      <button onClick={() => onChange({ borderWidth: 2 })}>Change Border</button>
    </div>
  ),
  SpacingControls: ({ data, onChange }: any) => (
    <div data-testid="spacing-controls">
      <button onClick={() => onChange({ padding: 16 })}>Change Spacing</button>
    </div>
  ),
}));

// Mock theme provider
vi.mock('@/components/theme/CustomThemeProvider', () => ({
  useTheme: () => ({
    theme: 'light',
  }),
}));

// Mock SafeSwitch component
vi.mock('@/components/editor/SafeSwitch', () => ({
  SafeSwitch: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked} onChange={e => onCheckedChange(e.target.checked)} />
  ),
}));

describe('Inspector-Command Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TableBlockInspector', () => {
    const mockTableComponent = {
      addColumn: vi.fn(),
      removeColumn: vi.fn(),
      addRow: vi.fn(),
      removeRow: vi.fn(),
      updateTableData: vi.fn(),
      getCurrentCellPosition: vi.fn(() => ({ row: 0, col: 0 })),
    };

    beforeEach(() => {
      vi.mocked(tableComponentRegistry.get).mockReturnValue(mockTableComponent);
    });

    it('should render table inspector with correct data', () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      expect(screen.getByText('Table Configuration')).toBeInTheDocument();
      expect(screen.getByText('2 × 2')).toBeInTheDocument(); // 2 rows × 2 columns
      expect(screen.getByText('Add Column')).toBeInTheDocument();
      expect(screen.getByText('Add Row')).toBeInTheDocument();
    });

    it('should integrate with table commands for structure operations', async () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      // Test add column command integration
      const addColumnButton = screen.getByText('Add Column');
      fireEvent.click(addColumnButton);

      expect(mockTableComponent.addColumn).toHaveBeenCalledTimes(1);
    });

    it('should integrate with table commands for row operations', async () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      // Test add row command integration
      const addRowButton = screen.getByText('Add Row');
      fireEvent.click(addRowButton);

      expect(mockTableComponent.addRow).toHaveBeenCalledTimes(1);
    });

    it('should integrate with table commands for removal operations', async () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      // Test remove column command integration
      const removeColumnButton = screen.getByText('Remove Column');
      fireEvent.click(removeColumnButton);

      expect(mockTableComponent.getCurrentCellPosition).toHaveBeenCalled();
      expect(mockTableComponent.removeColumn).toHaveBeenCalledWith(0);
    });

    it('should handle CSV export functionality', async () => {
      // Setup DOM environment for testing
      const originalCreateElement = document.createElement;
      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;

      // Mock URL.createObjectURL and related DOM APIs
      const mockCreateObjectURL = vi.fn(() => 'mock-url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockClick = vi.fn();

      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
        style: {},
      } as any;

      // Mock createElement to return our mock anchor
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'a') {
          return mockAnchor;
        }
        return originalCreateElement.call(document, tagName);
      });

      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      render(<TableBlockInspector nodeId="test-table-123" />);

      const exportButton = screen.getByText('Export as CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
      });

      // Restore original functions
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    });

    it('should handle table settings updates', () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      // Test striped rows setting
      const stripedToggle = screen.getByLabelText('Striped Rows');
      fireEvent.click(stripedToggle);

      expect(mockUpdateNode).toHaveBeenCalledWith('test-table-123', {
        data: expect.objectContaining({
          styling: expect.objectContaining({
            striped: true,
          }),
        }),
      });
    });

    it('should handle styling control integration', () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      // Test background controls integration
      const backgroundButton = screen.getByText('Change Background');
      fireEvent.click(backgroundButton);

      expect(mockUpdateNode).toHaveBeenCalledWith('test-table-123', {
        data: expect.objectContaining({
          backgroundColor: '#ff0000',
        }),
      });
    });

    it('should handle table reset functionality', () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      const resetButton = screen.getByText('Reset Table');
      fireEvent.click(resetButton);

      expect(mockTableComponent.updateTableData).toHaveBeenCalledWith({
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
      });
    });
  });

  describe('PollBlockInspector', () => {
    const mockPollComponent = {
      addOption: vi.fn(),
      removeOption: vi.fn(),
      updatePollData: vi.fn(),
      voteOnOption: vi.fn(),
      updateQuestion: vi.fn(),
      updateSettings: vi.fn(),
    };

    beforeEach(() => {
      vi.mocked(pollComponentRegistry.get).mockReturnValue(mockPollComponent);
    });

    it('should render poll inspector with correct data', () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      expect(screen.getByText('Poll Configuration')).toBeInTheDocument();
      expect(screen.getByText('2 options')).toBeInTheDocument();
      expect(screen.getByDisplayValue('What is your favorite color?')).toBeInTheDocument();
      expect(screen.getByText('Red')).toBeInTheDocument();
      expect(screen.getByText('Blue')).toBeInTheDocument();
    });

    it('should integrate with poll commands for question updates', () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      const questionTextarea = screen.getByDisplayValue('What is your favorite color?');
      fireEvent.change(questionTextarea, { target: { value: 'What is your favorite animal?' } });

      expect(mockPollComponent.updateQuestion).toHaveBeenCalledWith(
        'What is your favorite animal?'
      );
    });

    it('should handle option addition workflow', async () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      // Click add option button
      const addOptionButton = screen.getByText('Add Option');
      fireEvent.click(addOptionButton);

      // Input field should appear
      const optionInput = screen.getByPlaceholderText('Enter new option text...');
      expect(optionInput).toBeInTheDocument();

      // Type new option
      fireEvent.change(optionInput, { target: { value: 'Green' } });

      // Click add button
      const addButton = screen.getByText('Add Option');
      fireEvent.click(addButton);

      expect(mockPollComponent.addOption).toHaveBeenCalled();
    });

    it('should handle option removal with validation', () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      // Find remove button for first option (should be enabled since there are 2 options)
      const removeButtons = screen.getAllByTitle('Remove option');
      fireEvent.click(removeButtons[0]);

      expect(mockPollComponent.removeOption).toHaveBeenCalledWith('opt1');
    });

    it('should integrate with poll settings commands', () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      // Test allow multiple setting
      const multipleToggle = screen.getByLabelText('Allow Multiple Choices');
      fireEvent.click(multipleToggle);

      expect(mockPollComponent.updateSettings).toHaveBeenCalledWith({
        allowMultiple: true,
      });
    });

    it('should handle poll statistics display', () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      // Check statistics are displayed with more specific queries
      expect(screen.getByText('Options:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 options
      expect(screen.getByText('Total Votes:')).toBeInTheDocument();
      expect(screen.getByText('Unique Voters:')).toBeInTheDocument();

      // Check for the badge that shows "2 options"
      expect(screen.getByText('2 options')).toBeInTheDocument();

      // Check that poll statistics section contains the values we expect
      const statisticsSection = screen.getByText('Options:').closest('.bg-muted');
      expect(statisticsSection).toBeInTheDocument();

      // More specific checks within the statistics section
      const totalVotesRow = screen.getByText('Total Votes:').closest('div');
      expect(totalVotesRow).toHaveTextContent('Total Votes:8');

      const uniqueVotersRow = screen.getByText('Unique Voters:').closest('div');
      expect(uniqueVotersRow).toHaveTextContent('Unique Voters:8');
    });

    it('should handle vote clearing with confirmation', async () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      // Find clear votes button
      const clearVotesButton = screen.getByText('Clear All Votes');
      fireEvent.click(clearVotesButton);

      // Should show confirmation dialog
      expect(screen.getByText('This will permanently remove all 8 votes')).toBeInTheDocument();

      // Confirm clearing
      const confirmButton = screen.getByText('Clear Votes');
      fireEvent.click(confirmButton);

      expect(mockPollComponent.updatePollData).toHaveBeenCalledWith({
        options: [
          { id: 'opt1', text: 'Red', votes: 0 },
          { id: 'opt2', text: 'Blue', votes: 0 },
        ],
        metadata: expect.objectContaining({
          totalVotes: 0,
          uniqueVoters: 0,
        }),
      });
    });

    it('should handle styling updates', () => {
      render(<PollBlockInspector nodeId="test-poll-123" />);

      // Test question font size slider
      const fontSizeSlider = screen.getByRole('slider');
      fireEvent.change(fontSizeSlider, { target: { value: '24' } });

      expect(mockUpdateNode).toHaveBeenCalledWith('test-poll-123', {
        data: expect.objectContaining({
          styling: expect.objectContaining({
            questionFontSize: 24,
          }),
        }),
      });
    });
  });

  describe('Command Registry Integration', () => {
    it('should properly connect to table command registry', () => {
      const mockComponent = { addColumn: vi.fn() };
      vi.mocked(tableComponentRegistry.get).mockReturnValue(mockComponent);

      render(<TableBlockInspector nodeId="test-table-123" />);

      expect(tableComponentRegistry.get).toHaveBeenCalledWith('test-table-123');
    });

    it('should properly connect to poll command registry', () => {
      const mockComponent = { updateQuestion: vi.fn() };
      vi.mocked(pollComponentRegistry.get).mockReturnValue(mockComponent);

      render(<PollBlockInspector nodeId="test-poll-123" />);

      expect(pollComponentRegistry.get).toHaveBeenCalledWith('test-poll-123');
    });

    it('should handle missing registry entries gracefully', () => {
      vi.mocked(tableComponentRegistry.get).mockReturnValue(undefined);

      render(<TableBlockInspector nodeId="test-table-123" />);

      // Should still render without crashing
      expect(screen.getByText('Table Configuration')).toBeInTheDocument();

      // But commands shouldn't execute
      const addColumnButton = screen.getByText('Add Column');
      fireEvent.click(addColumnButton);

      // No component method should be called
      expect(vi.mocked(tableComponentRegistry.get)).toHaveBeenCalled();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should handle rapid clicking without issues', async () => {
      const mockComponent = { addColumn: vi.fn() };
      vi.mocked(tableComponentRegistry.get).mockReturnValue(mockComponent);

      render(<TableBlockInspector nodeId="test-table-123" />);

      const addColumnButton = screen.getByText('Add Column');

      // Rapid clicking
      for (let i = 0; i < 5; i++) {
        fireEvent.click(addColumnButton);
      }

      expect(mockComponent.addColumn).toHaveBeenCalledTimes(5);
    });

    it('should have proper accessibility attributes', () => {
      render(<TableBlockInspector nodeId="test-table-123" />);

      // Check for proper labels
      expect(screen.getByLabelText('Show Headers')).toBeInTheDocument();
      expect(screen.getByLabelText('Striped Rows')).toBeInTheDocument();

      // Check for proper button titles
      expect(screen.getByTitle('Add column')).toBeInTheDocument();
      expect(screen.getByTitle('Add row')).toBeInTheDocument();
    });
  });
});
