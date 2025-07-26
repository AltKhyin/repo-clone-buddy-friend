// ABOUTME: TipTap extension for interactive polls with voting, analytics, and real-time results

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PollComponent } from './PollComponent';
import { pollCommands } from './pollCommands';

export interface PollOptions {
  HTMLAttributes: Record<string, any>;
  allowAnonymousVoting: boolean;
  enableVoteTracking: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  settings: {
    allowMultiple: boolean;
    showResults: boolean;
    allowAnonymous: boolean;
    requireLogin: boolean;
    endDate?: string;
    maxVotes?: number;
  };
  metadata: {
    totalVotes: number;
    uniqueVoters: number;
    createdAt: string;
    lastVoteAt?: string;
  };
  styling: {
    questionFontSize: number;
    questionFontWeight: number;
    optionFontSize: number;
    optionPadding: number;
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    backgroundColor: string;
    selectedColor: string;
    resultBarColor: string;
    textAlign: 'left' | 'center' | 'right';
    compact: boolean;
  };
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    poll: {
      /**
       * Insert a poll
       */
      insertPoll: (options?: {
        question?: string;
        options?: string[];
        allowMultiple?: boolean;
        showResults?: boolean;
      }) => ReturnType;
      /**
       * Add a poll option
       */
      addPollOption: (optionText?: string) => ReturnType;
      /**
       * Remove a poll option
       */
      removePollOption: (optionId: string) => ReturnType;
      /**
       * Vote on a poll option
       */
      voteOnPoll: (optionId: string, userId?: string) => ReturnType;
      /**
       * Update poll data
       */
      updatePollData: (data: Partial<PollData>) => ReturnType;
      /**
       * Update poll question
       */
      updatePollQuestion: (question: string) => ReturnType;
      /**
       * Update poll settings
       */
      updatePollSettings: (settings: Partial<PollData['settings']>) => ReturnType;
      /**
       * Delete the poll
       */
      deletePoll: () => ReturnType;
    };
  }
}

export const PollExtension = Node.create<PollOptions>({
  name: 'customPoll',

  addOptions() {
    return {
      HTMLAttributes: {},
      allowAnonymousVoting: true,
      enableVoteTracking: true,
    };
  },

  group: 'block',

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      question: {
        default: '',
        parseHTML: element => {
          const data = element.getAttribute('data-poll');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.question || '';
            } catch {
              return '';
            }
          }
          return '';
        },
        renderHTML: () => null,
      },
      options: {
        default: [],
        parseHTML: element => {
          const data = element.getAttribute('data-poll');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.options || [];
            } catch {
              return [];
            }
          }
          return [];
        },
        renderHTML: () => null,
      },
      settings: {
        default: {
          allowMultiple: false,
          showResults: true,
          allowAnonymous: true,
          requireLogin: false,
        },
        parseHTML: element => {
          const data = element.getAttribute('data-poll');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.settings || {};
            } catch {
              return {};
            }
          }
          return {};
        },
        renderHTML: () => null,
      },
      metadata: {
        default: {
          totalVotes: 0,
          uniqueVoters: 0,
          createdAt: new Date().toISOString(),
        },
        parseHTML: element => {
          const data = element.getAttribute('data-poll');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.metadata || {};
            } catch {
              return {};
            }
          }
          return {};
        },
        renderHTML: () => null,
      },
      styling: {
        default: {
          questionFontSize: 18,
          questionFontWeight: 600,
          optionFontSize: 16,
          optionPadding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          backgroundColor: 'transparent',
          selectedColor: '#3b82f6',
          resultBarColor: '#60a5fa',
          textAlign: 'left',
          compact: false,
        },
        parseHTML: element => {
          const data = element.getAttribute('data-poll');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              return parsed.styling || {};
            } catch {
              return {};
            }
          }
          return {};
        },
        renderHTML: () => null,
      },
      pollId: {
        default: null,
        parseHTML: element => element.getAttribute('data-poll-id'),
        renderHTML: attributes => {
          if (!attributes.pollId) {
            return null;
          }
          return {
            'data-poll-id': attributes.pollId,
          };
        },
      },
      userVotes: {
        default: [],
        parseHTML: () => [], // User votes are session-specific, don't persist in HTML
        renderHTML: () => null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-poll"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const pollData: PollData = {
      question: node.attrs.question || '',
      options: node.attrs.options || [],
      settings: node.attrs.settings || {},
      metadata: node.attrs.metadata || {},
      styling: node.attrs.styling || {},
    };

    // Calculate percentages for fallback display
    const totalVotes = pollData.metadata.totalVotes || 0;
    const optionsWithPercentage = pollData.options.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
    }));

    // Build poll content array without conditional spreads
    const pollContentChildren: any[] = [
      [
        'h3',
        {
          style: `font-size: ${pollData.styling.questionFontSize || 18}px; font-weight: ${pollData.styling.questionFontWeight || 600}; margin: 0 0 16px 0; text-align: ${pollData.styling.textAlign || 'left'};`,
        },
        pollData.question || 'Poll Question',
      ],
      [
        'div',
        {},
        ...optionsWithPercentage.map(option => [
          'div',
          {
            style: `margin: 8px 0; padding: ${pollData.styling.optionPadding || 12}px; border: 1px solid ${pollData.styling.borderColor || '#e2e8f0'}; border-radius: ${(pollData.styling.borderRadius || 8) / 2}px; display: flex; justify-content: space-between; align-items: center; font-size: ${pollData.styling.optionFontSize || 16}px;`,
          },
          ['span', {}, option.text],
          [
            'span',
            {
              style: 'font-weight: 500; color: #64748b;',
            },
            `${option.votes} (${option.percentage}%)`,
          ],
        ]),
      ],
    ];

    // Add vote count if there are votes
    if (totalVotes > 0) {
      pollContentChildren.push([
        'div',
        {
          style: 'margin-top: 12px; font-size: 14px; color: #64748b; text-align: center;',
        },
        `Total votes: ${totalVotes}`,
      ]);
    }

    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'custom-poll',
          'data-poll': JSON.stringify(pollData),
          'data-poll-id': node.attrs.pollId,
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      // Fallback content for non-interactive contexts
      [
        'div',
        {
          style: `border: ${pollData.styling.borderWidth || 1}px solid ${pollData.styling.borderColor || '#e2e8f0'}; border-radius: ${pollData.styling.borderRadius || 8}px; padding: 16px; background-color: ${pollData.styling.backgroundColor || 'transparent'};`,
        },
        ...pollContentChildren,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PollComponent);
  },

  addCommands() {
    return {
      insertPoll:
        (options = {}) =>
        ({ commands }) => {
          const {
            question = '',
            options: pollOptions = ['Option 1', 'Option 2'],
            allowMultiple = false,
            showResults = true,
          } = options;

          // Generate unique poll ID
          const pollId = `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Create option objects with IDs
          const formattedOptions: PollOption[] = pollOptions.map((text, index) => ({
            id: `option-${index + 1}-${Date.now()}`,
            text,
            votes: 0,
          }));

          const now = new Date().toISOString();

          return commands.insertContent({
            type: this.name,
            attrs: {
              pollId,
              question: question || 'What is your opinion?',
              options: formattedOptions,
              settings: {
                allowMultiple,
                showResults,
                allowAnonymous: true,
                requireLogin: false,
              },
              metadata: {
                totalVotes: 0,
                uniqueVoters: 0,
                createdAt: now,
              },
              styling: {
                questionFontSize: 18,
                questionFontWeight: 600,
                optionFontSize: 16,
                optionPadding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                backgroundColor: 'transparent',
                selectedColor: '#3b82f6',
                resultBarColor: '#60a5fa',
                textAlign: 'left',
                compact: false,
              },
              userVotes: [],
            },
          });
        },

      // Real functional commands that integrate with PollComponent
      addPollOption: pollCommands.addPollOption,
      removePollOption: pollCommands.removePollOption,
      voteOnPoll: pollCommands.voteOnPoll,
      updatePollData: pollCommands.updatePollData,
      updatePollQuestion: pollCommands.updatePollQuestion,
      updatePollSettings: pollCommands.updatePollSettings,
      deletePoll: pollCommands.deletePoll,
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-p': () => this.editor.commands.insertPoll(),
    };
  },
});
