// ABOUTME: Tests for poll command integration with PollComponent

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPollCommands,
  pollComponentRegistry,
  PollComponentMethods,
} from '../pollCommands';

describe('PollCommands Integration', () => {
  let mockComponent: PollComponentMethods;
  let commands: ReturnType<typeof createPollCommands>;

  beforeEach(() => {
    // Clear registry
    pollComponentRegistry['components'].clear();

    // Create mock component
    mockComponent = {
      addOption: vi.fn(),
      removeOption: vi.fn(),
      updatePollData: vi.fn(),
      voteOnOption: vi.fn(),
      updateQuestion: vi.fn(),
      updateSettings: vi.fn(),
    };

    // Register mock component
    pollComponentRegistry.register('test-poll-1', mockComponent);

    // Create commands
    commands = createPollCommands();
  });

  describe('Component Registry', () => {
    it('should register and retrieve components correctly', () => {
      const retrievedComponent = pollComponentRegistry.get('test-poll-1');
      expect(retrievedComponent).toBe(mockComponent);
    });

    it('should unregister components correctly', () => {
      pollComponentRegistry.unregister('test-poll-1');
      const retrievedComponent = pollComponentRegistry.get('test-poll-1');
      expect(retrievedComponent).toBeUndefined();
    });
  });

  describe('Command Integration', () => {
    const mockState = {
      selection: {
        $from: {
          depth: 1,
          node: (depth: number) => ({
            type: { name: 'customPoll' },
            attrs: { 
              pollId: 'test-poll-1', 
              question: 'Test Poll?', 
              options: [
                { id: 'opt1', text: 'Option 1', votes: 0 },
                { id: 'opt2', text: 'Option 2', votes: 0 }
              ] 
            },
          }),
        },
      },
    };

    const mockDispatch = vi.fn();
    const mockTr = { setMeta: vi.fn().mockReturnThis() };

    it('should call addOption when addPollOption command is executed', () => {
      const result = commands.addPollOption('New Option')({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.addOption).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(mockTr);
    });

    it('should call removeOption when removePollOption command is executed', () => {
      const result = commands.removePollOption('opt1')({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.removeOption).toHaveBeenCalledWith('opt1');
    });

    it('should call voteOnOption when voteOnPoll command is executed', () => {
      const result = commands.voteOnPoll('opt1')({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.voteOnOption).toHaveBeenCalledWith('opt1');
    });

    it('should call updatePollData when updatePollData command is executed', () => {
      const testData = { question: 'Updated Question?' };

      const result = commands.updatePollData(testData)({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.updatePollData).toHaveBeenCalledWith(testData);
    });

    it('should call updateQuestion when updatePollQuestion command is executed', () => {
      const result = commands.updatePollQuestion('New Question?')({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.updateQuestion).toHaveBeenCalledWith('New Question?');
    });

    it('should call updateSettings when updatePollSettings command is executed', () => {
      const testSettings = { allowMultiple: true };

      const result = commands.updatePollSettings(testSettings)({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(true);
      expect(mockComponent.updateSettings).toHaveBeenCalledWith(testSettings);
    });

    it('should return false when no poll node is found', () => {
      const mockStateWithoutPoll = {
        selection: {
          $from: {
            depth: 0,
            node: () => ({ type: { name: 'paragraph' } }),
          },
        },
      };

      const result = commands.addPollOption('New Option')({
        state: mockStateWithoutPoll,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(false);
      expect(mockComponent.addOption).not.toHaveBeenCalled();
    });

    it('should return false when component is not registered', () => {
      pollComponentRegistry.unregister('test-poll-1');

      const result = commands.addPollOption('New Option')({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(false);
      expect(mockComponent.addOption).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockComponent.addOption = vi.fn(() => {
        throw new Error('Test error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = commands.addPollOption('New Option')({
        state: mockState,
        dispatch: mockDispatch,
        tr: mockTr,
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to add poll option:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('DeletePoll Command', () => {
    it('should call deleteSelection when deletePoll command is executed', () => {
      const mockCommands = {
        deleteSelection: vi.fn().mockReturnValue(true),
      };

      const result = commands.deletePoll()({
        commands: mockCommands,
      });

      expect(result).toBe(true);
      expect(mockCommands.deleteSelection).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    const mockState = {
      selection: {
        $from: {
          depth: 1,
          node: (depth: number) => ({
            type: { name: 'customPoll' },
            attrs: { pollId: 'test-poll-1' },
          }),
        },
      },
    };

    it('should handle removeOption errors gracefully', () => {
      mockComponent.removeOption = vi.fn(() => {
        throw new Error('Remove error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = commands.removePollOption('opt1')({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to remove poll option:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle vote errors gracefully', () => {
      mockComponent.voteOnOption = vi.fn(() => {
        throw new Error('Vote error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = commands.voteOnPoll('opt1')({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to vote on poll:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle updatePollData errors gracefully', () => {
      mockComponent.updatePollData = vi.fn(() => {
        throw new Error('Update error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = commands.updatePollData({ question: 'New?' })({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update poll data:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle updateQuestion errors gracefully', () => {
      mockComponent.updateQuestion = vi.fn(() => {
        throw new Error('Question error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = commands.updatePollQuestion('New Question?')({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update poll question:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle updateSettings errors gracefully', () => {
      mockComponent.updateSettings = vi.fn(() => {
        throw new Error('Settings error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = commands.updatePollSettings({ allowMultiple: true })({
        state: mockState,
        dispatch: vi.fn(),
        tr: { setMeta: vi.fn().mockReturnThis() },
      });

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update poll settings:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});