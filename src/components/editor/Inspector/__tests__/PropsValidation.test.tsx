// ABOUTME: Tests to ensure inspector components handle missing or invalid props gracefully

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the editor store with flexible return values
const mockUseEditorStore = vi.fn();
vi.mock('@/store/editorStore', () => ({
  useEditorStore: () => mockUseEditorStore(),
}));
import { PollBlockInspector } from '../PollBlockInspector';
import { HeadingBlockInspector } from '../HeadingBlockInspector';
import { TextBlockInspector } from '../TextBlockInspector';

describe('Inspector Props Validation', () => {
  describe('PollBlockInspector', () => {
    it('should handle non-existent nodeId gracefully', () => {
      // Mock store with no matching nodes
      mockUseEditorStore.mockReturnValue({
        nodes: [],
        updateNode: vi.fn(),
      });

      // Test that PollBlockInspector returns null when node doesn't exist
      const { container } = render(<PollBlockInspector nodeId="non-existent-id" />);

      // Should render nothing when node doesn't exist
      expect(container.firstChild).toBeNull();
    });

    it('should handle wrong node type gracefully', () => {
      // Mock store with a non-poll node
      mockUseEditorStore.mockReturnValue({
        nodes: [
          {
            id: 'text-node',
            type: 'textBlock',
            data: { content: 'test' },
            position: { x: 0, y: 0 },
          },
        ],
        updateNode: vi.fn(),
      });

      // Setup store with a non-poll node
      render(<PollBlockInspector nodeId="text-node" />);

      // Should not crash and should render nothing
      expect(screen.queryByText('Poll Settings')).not.toBeInTheDocument();
    });

    it('should handle undefined data properties safely', () => {
      // Mock store with a poll node that has minimal data
      mockUseEditorStore.mockReturnValue({
        nodes: [
          {
            id: 'poll-node',
            type: 'pollBlock',
            data: {}, // Minimal/empty data
            position: { x: 0, y: 0 },
          },
        ],
        updateNode: vi.fn(),
      });

      // Setup store with a poll node that has minimal data
      const { container } = render(<PollBlockInspector nodeId="poll-node" />);

      // Should not crash when data properties are undefined
      expect(container).toBeInTheDocument();

      // Should handle totalVotes being undefined without crashing
      expect(() => {
        // This should not throw an error about accessing undefined.totalVotes
        screen.getByText(/total votes/i);
      }).not.toThrow();
    });
  });

  describe('HeadingBlockInspector', () => {
    it('should handle missing node gracefully', () => {
      mockUseEditorStore.mockReturnValue({
        nodes: [],
        updateNode: vi.fn(),
      });

      const { container } = render(<HeadingBlockInspector nodeId="non-existent" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with minimal data', () => {
      mockUseEditorStore.mockReturnValue({
        nodes: [
          {
            id: 'heading-node',
            type: 'headingBlock',
            data: {}, // Empty data object
            position: { x: 0, y: 0 },
          },
        ],
        updateNode: vi.fn(),
      });

      render(<HeadingBlockInspector nodeId="heading-node" />);

      // Should not crash with empty data
      expect(screen.getByText(/heading/i)).toBeInTheDocument();
    });
  });

  describe('TextBlockInspector', () => {
    it('should handle missing node gracefully', () => {
      mockUseEditorStore.mockReturnValue({
        nodes: [],
        updateNode: vi.fn(),
      });

      const { container } = render(<TextBlockInspector nodeId="non-existent" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with minimal data', () => {
      mockUseEditorStore.mockReturnValue({
        nodes: [
          {
            id: 'text-node',
            type: 'textBlock',
            data: {}, // Empty data object
            position: { x: 0, y: 0 },
          },
        ],
        updateNode: vi.fn(),
      });

      render(<TextBlockInspector nodeId="text-node" />);

      // Should not crash with empty data
      expect(screen.getByText(/text/i)).toBeInTheDocument();
    });
  });
});
