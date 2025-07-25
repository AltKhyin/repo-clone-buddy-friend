// ABOUTME: Functional TipTap poll commands that properly integrate with PollComponent methods

import { Command } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { PollData, PollOption } from './PollExtension';

/**
 * Interface for poll component methods that commands can call
 */
export interface PollComponentMethods {
  addOption: () => void;
  removeOption: (optionId: string) => void;
  updatePollData: (updates: Partial<PollData>) => void;
  voteOnOption: (optionId: string) => void;
  updateQuestion: (question: string) => void;
  updateSettings: (settings: Partial<PollData['settings']>) => void;
}

/**
 * Component registry for managing poll component references
 */
class PollComponentRegistry {
  private components = new Map<string, PollComponentMethods>();

  register(nodeId: string, component: PollComponentMethods) {
    this.components.set(nodeId, component);
  }

  unregister(nodeId: string) {
    this.components.delete(nodeId);
  }

  get(nodeId: string): PollComponentMethods | undefined {
    return this.components.get(nodeId);
  }

  // Get component for current poll node at selection
  getCurrentComponent(node: Node): PollComponentMethods | undefined {
    const pollId = node.attrs.pollId;
    return pollId ? this.components.get(pollId) : undefined;
  }
}

// Global registry instance
export const pollComponentRegistry = new PollComponentRegistry();

/**
 * Helper to find the current poll node at selection
 */
const findCurrentPollNode = (state: any): Node | null => {
  const { selection } = state;
  const { $from } = selection;

  // Walk up the node tree to find a customPoll node
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === 'customPoll') {
      return node;
    }
  }

  return null;
};

/**
 * Create functional poll commands that integrate with PollComponent
 */
export const createPollCommands = () => ({
  /**
   * Add a poll option
   */
  addPollOption:
    (optionText = 'New Option'): Command =>
    ({ state, dispatch, tr }) => {
      const pollNode = findCurrentPollNode(state);
      if (!pollNode) return false;

      const component = pollComponentRegistry.getCurrentComponent(pollNode);
      if (!component) return false;

      try {
        // Call the component method to add option
        component.addOption();

        // Update the document to trigger re-render
        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to add poll option:', error);
        return false;
      }
    },

  /**
   * Remove a poll option
   */
  removePollOption:
    (optionId: string): Command =>
    ({ state, dispatch, tr }) => {
      const pollNode = findCurrentPollNode(state);
      if (!pollNode) return false;

      const component = pollComponentRegistry.getCurrentComponent(pollNode);
      if (!component) return false;

      try {
        component.removeOption(optionId);

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to remove poll option:', error);
        return false;
      }
    },

  /**
   * Vote on a poll option
   */
  voteOnPoll:
    (optionId: string, userId?: string): Command =>
    ({ state, dispatch, tr }) => {
      const pollNode = findCurrentPollNode(state);
      if (!pollNode) return false;

      const component = pollComponentRegistry.getCurrentComponent(pollNode);
      if (!component) return false;

      try {
        component.voteOnOption(optionId);

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to vote on poll:', error);
        return false;
      }
    },

  /**
   * Update poll data
   */
  updatePollData:
    (data: Partial<PollData>): Command =>
    ({ state, dispatch, tr }) => {
      const pollNode = findCurrentPollNode(state);
      if (!pollNode) return false;

      const component = pollComponentRegistry.getCurrentComponent(pollNode);
      if (!component) return false;

      try {
        component.updatePollData(data);

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to update poll data:', error);
        return false;
      }
    },

  /**
   * Update poll question
   */
  updatePollQuestion:
    (question: string): Command =>
    ({ state, dispatch, tr }) => {
      const pollNode = findCurrentPollNode(state);
      if (!pollNode) return false;

      const component = pollComponentRegistry.getCurrentComponent(pollNode);
      if (!component) return false;

      try {
        component.updateQuestion(question);

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to update poll question:', error);
        return false;
      }
    },

  /**
   * Update poll settings
   */
  updatePollSettings:
    (settings: Partial<PollData['settings']>): Command =>
    ({ state, dispatch, tr }) => {
      const pollNode = findCurrentPollNode(state);
      if (!pollNode) return false;

      const component = pollComponentRegistry.getCurrentComponent(pollNode);
      if (!component) return false;

      try {
        component.updateSettings(settings);

        if (dispatch && tr) {
          dispatch(tr.setMeta('forceUpdate', true));
        }

        return true;
      } catch (error) {
        console.error('Failed to update poll settings:', error);
        return false;
      }
    },

  /**
   * Delete the poll
   */
  deletePoll:
    (): Command =>
    ({ commands }) => {
      return commands.deleteSelection();
    },
});

/**
 * Export command creators for use in PollExtension
 */
export const pollCommands = createPollCommands();