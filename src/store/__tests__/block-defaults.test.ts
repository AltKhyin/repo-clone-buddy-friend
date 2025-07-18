// ABOUTME: Tests for block creation defaults ensuring new blocks are created with canvas-wide (800px) width

import { describe, it, expect } from 'vitest';
import { useEditorStore } from '../editorStore';

describe('Block Creation Defaults', () => {
  it('should create new blocks with full canvas width (800px)', () => {
    // Reset store to clean state
    useEditorStore.getState().reset();

    // Add a new block
    useEditorStore.getState().addNode({
      type: 'textBlock',
    });

    // Get the updated state
    const state = useEditorStore.getState();
    const blocks = state.nodes;
    expect(blocks).toHaveLength(1);

    const blockId = blocks[0].id;
    const position = state.positions[blockId];

    // Verify the block has full canvas width
    expect(position).toBeDefined();
    expect(position.width).toBe(800); // Full canvas width
    expect(position.x).toBe(0); // Starts at canvas edge
    expect(position.height).toBe(120); // Default height
  });

  it('should position new blocks without overlap when multiple blocks exist', () => {
    // Reset store to clean state
    useEditorStore.getState().reset();

    // Add first block
    useEditorStore.getState().addNode({ type: 'textBlock' });

    // Add second block (text block with heading level)
    useEditorStore.getState().addNode({ type: 'textBlock', data: { headingLevel: 1 } });

    const state = useEditorStore.getState();
    const blocks = state.nodes;
    expect(blocks).toHaveLength(2);

    const firstPosition = state.positions[blocks[0].id];
    const secondPosition = state.positions[blocks[1].id];

    // Both blocks should have full width
    expect(firstPosition.width).toBe(800);
    expect(secondPosition.width).toBe(800);

    // Both blocks should start at x=0
    expect(firstPosition.x).toBe(0);
    expect(secondPosition.x).toBe(0);

    // Second block should be positioned below the first
    expect(secondPosition.y).toBeGreaterThan(firstPosition.y + firstPosition.height);
  });

  it('should create blocks with correct spacing between them', () => {
    // Reset store to clean state
    useEditorStore.getState().reset();

    // Add three blocks
    useEditorStore.getState().addNode({ type: 'textBlock' });
    useEditorStore.getState().addNode({ type: 'imageBlock' });
    useEditorStore.getState().addNode({ type: 'textBlock', data: { headingLevel: 2 } });

    const state = useEditorStore.getState();
    const blocks = state.nodes;
    const positions = blocks.map(block => state.positions[block.id]);

    // Sort positions by Y coordinate
    positions.sort((a, b) => a.y - b.y);

    // Check spacing between first and second block
    const spacingBetween1and2 = positions[1].y - (positions[0].y + positions[0].height);
    expect(spacingBetween1and2).toBe(20); // Default spacing

    // Check spacing between second and third block
    const spacingBetween2and3 = positions[2].y - (positions[1].y + positions[1].height);
    expect(spacingBetween2and3).toBe(20); // Default spacing
  });

  it('should maintain canvas boundaries for full-width blocks', () => {
    // Reset store to clean state
    useEditorStore.getState().reset();

    // Add a block
    useEditorStore.getState().addNode({ type: 'textBlock' });

    const state = useEditorStore.getState();
    const block = state.nodes[0];
    const position = state.positions[block.id];

    // Block should fit within canvas boundaries
    expect(position.x).toBe(0); // Starts at left edge
    expect(position.x + position.width).toBe(800); // Ends at right edge (canvas width)

    // Should not exceed canvas width
    expect(position.x + position.width).toBeLessThanOrEqual(800);
  });
});
