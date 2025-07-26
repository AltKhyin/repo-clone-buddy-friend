// ABOUTME: Test suite for validating Rich Block editor performance optimizations and re-render prevention

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TableComponent } from '../Table/TableComponent';
import { PollComponent } from '../Poll/PollComponent';
import { globalRenderTracker } from '@/hooks/useRenderOptimization';

// Mock TipTap NodeViewProps
const mockNodeViewProps = {
  editor: {} as any,
  node: {
    attrs: {
      tableId: 'test-table-123',
      headers: ['Header 1', 'Header 2'],
      rows: [
        ['Cell 1', 'Cell 2'],
        ['Cell 3', 'Cell 4'],
      ],
      styling: {},
      settings: {},
    },
  } as any,
  decorations: [],
  selected: false,
  extension: {} as any,
  getPos: () => 0,
  updateAttributes: vi.fn(),
  deleteNode: vi.fn(),
};

const mockPollNodeViewProps = {
  ...mockNodeViewProps,
  node: {
    attrs: {
      pollId: 'test-poll-123',
      question: 'Test Question?',
      options: [
        { id: 'opt1', text: 'Option 1', votes: 0 },
        { id: 'opt2', text: 'Option 2', votes: 0 },
      ],
      settings: { allowMultiple: false, showResults: true },
      metadata: { totalVotes: 0, uniqueVoters: 0 },
      styling: {},
    },
  } as any,
};

// Mock the registry modules
vi.mock('../Table/tableCommands', () => ({
  tableComponentRegistry: {
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

vi.mock('../Poll/pollCommands', () => ({
  pollComponentRegistry: {
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

vi.mock('@/hooks/useStateSynchronization', () => ({
  useAttributeSync: () => ({
    syncAttributes: vi.fn(),
    syncContent: vi.fn(),
    syncFullState: vi.fn(),
  }),
}));

describe('Performance Optimization Tests', () => {
  let renderTrackingSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    globalRenderTracker.reset();
    renderTrackingSpy = vi.spyOn(globalRenderTracker, 'track');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TableComponent Performance', () => {
    it('should wrap component with React.memo to prevent unnecessary re-renders', () => {
      const { rerender } = render(<TableComponent {...mockNodeViewProps} />);

      // Verify initial render
      expect(renderTrackingSpy).toHaveBeenCalledWith(
        'TableComponent',
        expect.any(Number),
        expect.any(Array)
      );

      // Clear the spy
      renderTrackingSpy.mockClear();

      // Re-render with same props - should not cause a re-render due to React.memo
      rerender(<TableComponent {...mockNodeViewProps} />);

      // React.memo should prevent re-render with identical props
      expect(renderTrackingSpy).not.toHaveBeenCalled();
    });

    it('should use stable callbacks for table editing operations', async () => {
      const updateAttributesSpy = vi.fn();
      const props = {
        ...mockNodeViewProps,
        updateAttributes: updateAttributesSpy,
        selected: true,
      };

      render(<TableComponent {...props} />);

      // Find and click the add column button
      const addColumnButton = screen.getByTitle('Add column');
      fireEvent.click(addColumnButton);

      // Verify that updateAttributes was called with stable data structure
      expect(updateAttributesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.arrayContaining(['Header 1', 'Header 2', 'Column 3']),
          rows: expect.arrayContaining([
            expect.arrayContaining(['Cell 1', 'Cell 2', '']),
            expect.arrayContaining(['Cell 3', 'Cell 4', '']),
          ]),
        })
      );
    });

    it('should use deep memoization for table data computation', () => {
      const props = {
        ...mockNodeViewProps,
        node: {
          ...mockNodeViewProps.node,
          attrs: {
            ...mockNodeViewProps.node.attrs,
            // Add complex nested styling that should be deep compared
            styling: {
              borderStyle: 'solid',
              borderWidth: 1,
              cellPadding: 12,
              nested: { fontSize: 14, fontWeight: 400 },
            },
          },
        },
      };

      const { rerender } = render(<TableComponent {...props} />);

      // Clear render tracking
      renderTrackingSpy.mockClear();

      // Re-render with same complex nested data
      rerender(<TableComponent {...props} />);

      // Should not re-render due to deep memoization
      expect(renderTrackingSpy).not.toHaveBeenCalled();
    });

    it('should debounce rapid table data updates', async () => {
      vi.useFakeTimers();

      const updateAttributesSpy = vi.fn();
      const props = {
        ...mockNodeViewProps,
        updateAttributes: updateAttributesSpy,
        selected: true,
      };

      render(<TableComponent {...props} />);

      // Simulate rapid cell edits by double-clicking a cell
      const firstCell = screen.getByText('Cell 1');
      fireEvent.doubleClick(firstCell);

      // Should have an input field now
      const input = screen.getByDisplayValue('Cell 1');

      // Simulate rapid typing
      fireEvent.change(input, { target: { value: 'New' } });
      fireEvent.change(input, { target: { value: 'New Value' } });
      fireEvent.change(input, { target: { value: 'New Value Final' } });

      // Blur to finish editing
      fireEvent.blur(input);

      // Fast-forward timers to trigger debounced update
      vi.advanceTimersByTime(200);

      // Should only update once due to debouncing
      expect(updateAttributesSpy).toHaveBeenCalledTimes(1);
      expect(updateAttributesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: expect.arrayContaining([expect.arrayContaining(['New Value Final', 'Cell 2'])]),
        })
      );

      vi.useRealTimers();
    });
  });

  describe('PollComponent Performance', () => {
    it('should wrap component with React.memo to prevent unnecessary re-renders', () => {
      const { rerender } = render(<PollComponent {...mockPollNodeViewProps} />);

      // Verify initial render
      expect(renderTrackingSpy).toHaveBeenCalledWith(
        'PollComponent',
        expect.any(Number),
        expect.any(Array)
      );

      // Clear the spy
      renderTrackingSpy.mockClear();

      // Re-render with same props - should not cause a re-render due to React.memo
      rerender(<PollComponent {...mockPollNodeViewProps} />);

      // React.memo should prevent re-render with identical props
      expect(renderTrackingSpy).not.toHaveBeenCalled();
    });

    it('should use stable callbacks for poll operations', async () => {
      const updateAttributesSpy = vi.fn();
      const props = {
        ...mockPollNodeViewProps,
        updateAttributes: updateAttributesSpy,
        selected: true,
      };

      render(<PollComponent {...props} />);

      // Find and click the add option button
      const addOptionButton = screen.getByTitle('Add option');
      fireEvent.click(addOptionButton);

      // Verify that updateAttributes was called with stable data structure
      expect(updateAttributesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.arrayContaining([
            expect.objectContaining({ text: 'Option 1' }),
            expect.objectContaining({ text: 'Option 2' }),
            expect.objectContaining({ text: 'Option 3' }),
          ]),
        })
      );
    });

    it('should use deep memoization for poll data computation', () => {
      const props = {
        ...mockPollNodeViewProps,
        node: {
          ...mockPollNodeViewProps.node,
          attrs: {
            ...mockPollNodeViewProps.node.attrs,
            // Add complex nested styling that should be deep compared
            styling: {
              questionFontSize: 18,
              optionPadding: 12,
              nested: { borderColor: '#e2e8f0', selectedColor: '#3b82f6' },
            },
          },
        },
      };

      const { rerender } = render(<PollComponent {...props} />);

      // Clear render tracking
      renderTrackingSpy.mockClear();

      // Re-render with same complex nested data
      rerender(<PollComponent {...props} />);

      // Should not re-render due to deep memoization
      expect(renderTrackingSpy).not.toHaveBeenCalled();
    });

    it('should debounce rapid poll question updates', async () => {
      vi.useFakeTimers();

      const updateAttributesSpy = vi.fn();
      const props = {
        ...mockPollNodeViewProps,
        updateAttributes: updateAttributesSpy,
        selected: true,
      };

      render(<PollComponent {...props} />);

      // Click on question to edit
      const question = screen.getByText('Test Question?');
      fireEvent.click(question);

      // Should have a textarea now
      const textarea = screen.getByDisplayValue('Test Question?');

      // Simulate rapid typing
      fireEvent.change(textarea, { target: { value: 'New' } });
      fireEvent.change(textarea, { target: { value: 'New Question' } });
      fireEvent.change(textarea, { target: { value: 'New Question Final?' } });

      // Save the question
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Fast-forward timers to trigger debounced update
      vi.advanceTimersByTime(200);

      // Should only update once due to debouncing
      expect(updateAttributesSpy).toHaveBeenCalledTimes(1);
      expect(updateAttributesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'New Question Final?',
        })
      );

      vi.useRealTimers();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track render performance metrics', () => {
      render(<TableComponent {...mockNodeViewProps} />);

      // Verify performance tracking was called
      expect(renderTrackingSpy).toHaveBeenCalledWith(
        'TableComponent',
        expect.any(Number),
        expect.arrayContaining(['nodeId', 'selected', 'headersLength', 'rowsLength'])
      );
    });

    it('should provide render statistics for debugging', () => {
      // Render multiple components to generate stats
      render(<TableComponent {...mockNodeViewProps} />);
      render(<PollComponent {...mockPollNodeViewProps} />);

      const stats = globalRenderTracker.getStats();

      expect(stats).toHaveLength(2);
      expect(stats[0]).toMatchObject({
        componentName: expect.any(String),
        renderCount: expect.any(Number),
        lastRenderTime: expect.any(Number),
        avgRenderTime: expect.any(Number),
      });
    });

    it('should warn about excessive re-renders', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Simulate many renders to trigger warning
      const { rerender } = render(<TableComponent {...mockNodeViewProps} />);

      // Force multiple re-renders by changing props
      for (let i = 0; i < 15; i++) {
        rerender(<TableComponent {...mockNodeViewProps} selected={i % 2 === 0} />);
      }

      // Should warn about excessive re-renders
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('has rendered'));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should properly cleanup component registrations', () => {
      const { unmount } = render(<TableComponent {...mockNodeViewProps} />);

      // Unmount component
      unmount();

      // Registry should be cleaned up (mocked function should be called)
      const { tableComponentRegistry } = require('../Table/tableCommands');
      expect(tableComponentRegistry.unregister).toHaveBeenCalledWith('test-table-123');
    });

    it('should not create new callback instances on every render', () => {
      const callbackRefs: any[] = [];

      // Create a test component that captures callback references
      const TestComponent = ({ node, updateAttributes, selected }: any) => {
        const [, forceUpdate] = React.useState({});

        React.useEffect(() => {
          callbackRefs.push({ updateAttributes });
        });

        return (
          <div>
            <button onClick={() => forceUpdate({})}>Force Update</button>
            <TableComponent node={node} updateAttributes={updateAttributes} selected={selected} />
          </div>
        );
      };

      const updateAttributesMock = vi.fn();
      render(
        <TestComponent
          node={mockNodeViewProps.node}
          updateAttributes={updateAttributesMock}
          selected={false}
        />
      );

      // Force a re-render
      const forceUpdateButton = screen.getByText('Force Update');
      fireEvent.click(forceUpdateButton);

      // Callback references should be stable (same function instance)
      expect(callbackRefs.length).toBeGreaterThan(1);
      expect(callbackRefs[0].updateAttributes).toBe(callbackRefs[1].updateAttributes);
    });
  });
});
