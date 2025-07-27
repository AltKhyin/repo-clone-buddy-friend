// ABOUTME: Rebuilt PollComponent with unified selection system - eliminates 426k+ render crisis

import React, { useState, useCallback, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  Plus,
  Minus,
  MoreVertical,
  Trash2,
  Settings,
  Vote,
  Users,
  CheckCircle2,
  Circle,
  Edit3,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PollData, PollOption } from './PollExtension';
import { useSelectionCoordination } from '@/hooks/useSelectionCoordination';
import { useToast } from '@/hooks/use-toast';

interface PollComponentProps extends NodeViewProps {
  // Inherited from NodeViewProps: node, updateAttributes, deleteNode, selected
}

interface UserVote {
  optionId: string;
  timestamp: string;
}

const POLL_LIMITS = {
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MAX_QUESTION_LENGTH: 500,
  MAX_OPTION_LENGTH: 200,
};

export const PollComponent: React.FC<PollComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { toast } = useToast();
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const optionInputRef = useRef<HTMLInputElement>(null);

  // Generate unique poll ID for coordination
  const pollId = node.attrs.pollId || `poll-${Date.now()}`;

  // Unified selection coordination
  const {
    isActive,
    handlePollQuestionClick,
    handlePollOptionClick,
    isPollQuestionSelected,
    isPollOptionSelected,
    activeContentType,
  } = useSelectionCoordination({
    blockId: `poll-block-${pollId}`,
    componentType: 'poll',
    enableContentSelection: true,
  });

  // Simple local state for editing
  const [editValue, setEditValue] = useState('');
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  // Extract poll data directly from TipTap node
  const pollData: PollData = {
    question: node.attrs.question || '',
    options: node.attrs.options || [],
    settings: {
      allowMultiple: false,
      showResults: true,
      allowAnonymous: true,
      requireLogin: false,
      ...node.attrs.settings,
    },
    metadata: {
      totalVotes: 0,
      uniqueVoters: 0,
      createdAt: new Date().toISOString(),
      ...node.attrs.metadata,
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
      ...node.attrs.styling,
    },
  };

  // Initialize default poll if empty
  React.useEffect(() => {
    if (!pollData.question && !pollData.options.length) {
      const defaultOptions: PollOption[] = [
        { id: `option-1-${Date.now()}`, text: 'Option 1', votes: 0 },
        { id: `option-2-${Date.now()}`, text: 'Option 2', votes: 0 },
      ];

      updateAttributes({
        ...node.attrs,
        question: 'What is your opinion?',
        options: defaultOptions,
        metadata: {
          totalVotes: 0,
          uniqueVoters: 0,
          createdAt: new Date().toISOString(),
        },
        pollId,
      });
    }
  }, [node.attrs, updateAttributes, pollId, pollData.question, pollData.options.length]);

  // Get user votes from node attributes or local state
  const currentUserVotes = (node.attrs.userVotes || userVotes) as UserVote[];

  // Safe update helper
  const updatePollData = useCallback(
    (updates: Partial<PollData>) => {
      try {
        updateAttributes({
          ...node.attrs,
          ...updates,
        });
      } catch (error) {
        toast({
          title: 'Update Failed',
          description: 'Failed to update poll. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [node.attrs, updateAttributes, toast]
  );

  // Question editing handlers
  const startEditingQuestion = useCallback(() => {
    setEditValue(pollData.question);
    handlePollQuestionClick(pollId, true);
    setTimeout(() => questionInputRef.current?.focus(), 0);
  }, [pollData.question, handlePollQuestionClick, pollId]);

  const finishEditingQuestion = useCallback(() => {
    if (editValue.trim()) {
      updatePollData({ question: editValue.trim() });
    }
    setEditValue('');
    handlePollQuestionClick(pollId, false);
  }, [editValue, updatePollData, handlePollQuestionClick, pollId]);

  // Option editing handlers
  const startEditingOption = useCallback(
    (optionId: string) => {
      const option = pollData.options.find(opt => opt.id === optionId);
      if (option) {
        setEditValue(option.text);
        handlePollOptionClick(pollId, optionId, true);
        setTimeout(() => optionInputRef.current?.focus(), 0);
      }
    },
    [pollData.options, handlePollOptionClick, pollId]
  );

  const finishEditingOption = useCallback(
    (optionId: string) => {
      if (editValue.trim()) {
        const updatedOptions = pollData.options.map(option =>
          option.id === optionId ? { ...option, text: editValue.trim() } : option
        );
        updatePollData({ options: updatedOptions });
      }
      setEditValue('');
      handlePollOptionClick(pollId, optionId, false);
    },
    [editValue, pollData.options, updatePollData, handlePollOptionClick, pollId]
  );

  // Poll management
  const addOption = useCallback(() => {
    if (pollData.options.length >= POLL_LIMITS.MAX_OPTIONS) {
      toast({
        title: 'Cannot Add Option',
        description: `Maximum ${POLL_LIMITS.MAX_OPTIONS} options allowed`,
        variant: 'destructive',
      });
      return;
    }

    const newOption: PollOption = {
      id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: `Option ${pollData.options.length + 1}`,
      votes: 0,
    };
    updatePollData({ options: [...pollData.options, newOption] });
  }, [pollData.options, updatePollData, toast]);

  const removeOption = useCallback(
    (optionId: string) => {
      if (pollData.options.length <= POLL_LIMITS.MIN_OPTIONS) {
        toast({
          title: 'Cannot Remove Option',
          description: `Poll must have at least ${POLL_LIMITS.MIN_OPTIONS} options`,
          variant: 'destructive',
        });
        return;
      }

      const filteredOptions = pollData.options.filter(option => option.id !== optionId);
      const newTotalVotes = filteredOptions.reduce((sum, option) => sum + option.votes, 0);
      const filteredUserVotes = currentUserVotes.filter(vote => vote.optionId !== optionId);

      updateAttributes({
        ...node.attrs,
        options: filteredOptions,
        metadata: {
          ...pollData.metadata,
          totalVotes: newTotalVotes,
        },
        userVotes: filteredUserVotes,
      });

      setUserVotes(filteredUserVotes);
    },
    [pollData.options, pollData.metadata, currentUserVotes, node.attrs, updateAttributes, toast]
  );

  // Voting logic
  const handleVote = useCallback(
    (optionId: string) => {
      if (isVoting) return;

      setIsVoting(true);

      try {
        const hasVotedForOption = currentUserVotes.some(vote => vote.optionId === optionId);
        let newUserVotes = [...currentUserVotes];
        let updatedOptions = [...pollData.options];

        if (pollData.settings.allowMultiple) {
          // Multiple choice: toggle vote
          if (hasVotedForOption) {
            newUserVotes = newUserVotes.filter(vote => vote.optionId !== optionId);
            updatedOptions = updatedOptions.map(option =>
              option.id === optionId ? { ...option, votes: Math.max(0, option.votes - 1) } : option
            );
          } else {
            newUserVotes.push({ optionId, timestamp: new Date().toISOString() });
            updatedOptions = updatedOptions.map(option =>
              option.id === optionId ? { ...option, votes: option.votes + 1 } : option
            );
          }
        } else {
          // Single choice: remove previous vote and add new one
          if (hasVotedForOption) {
            newUserVotes = [];
            updatedOptions = updatedOptions.map(option =>
              option.id === optionId ? { ...option, votes: Math.max(0, option.votes - 1) } : option
            );
          } else {
            const previousVotes = currentUserVotes.map(vote => vote.optionId);
            newUserVotes = [{ optionId, timestamp: new Date().toISOString() }];

            updatedOptions = updatedOptions.map(option => {
              if (option.id === optionId) {
                return { ...option, votes: option.votes + 1 };
              } else if (previousVotes.includes(option.id)) {
                return { ...option, votes: Math.max(0, option.votes - 1) };
              }
              return option;
            });
          }
        }

        const newTotalVotes = updatedOptions.reduce((sum, option) => sum + option.votes, 0);
        const uniqueVoters = new Set(newUserVotes.map(vote => vote.optionId)).size;

        updateAttributes({
          ...node.attrs,
          options: updatedOptions,
          metadata: {
            ...pollData.metadata,
            totalVotes: newTotalVotes,
            uniqueVoters,
            lastVoteAt: new Date().toISOString(),
          },
          userVotes: newUserVotes,
        });

        setUserVotes(newUserVotes);
      } catch (error) {
        console.error('Failed to vote:', error);
      } finally {
        setIsVoting(false);
      }
    },
    [
      isVoting,
      currentUserVotes,
      pollData.options,
      pollData.settings.allowMultiple,
      pollData.metadata,
      node.attrs,
      updateAttributes,
    ]
  );

  // Utility functions
  const getOptionPercentage = useCallback(
    (votes: number) => {
      if (pollData.metadata.totalVotes === 0) return 0;
      return Math.round((votes / pollData.metadata.totalVotes) * 100);
    },
    [pollData.metadata.totalVotes]
  );

  const hasUserVoted = currentUserVotes.length > 0;
  const getUserVoteForOption = (optionId: string) =>
    currentUserVotes.some(vote => vote.optionId === optionId);

  // Settings update
  const updateSettings = useCallback(
    (newSettings: Partial<PollData['settings']>) => {
      updatePollData({
        settings: { ...pollData.settings, ...newSettings },
      });
    },
    [pollData.settings, updatePollData]
  );

  return (
    <NodeViewWrapper className="poll-wrapper">
      <div
        className={cn(
          'relative border rounded-lg overflow-hidden bg-white',
          isActive ? 'ring-2 ring-blue-500 ring-offset-2' : '',
          'transition-all duration-200'
        )}
      >
        {/* Poll Header */}
        {isActive && (
          <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart3 size={12} />
                Poll
              </Badge>
              {pollData.metadata.totalVotes > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users size={10} />
                  {pollData.metadata.totalVotes} votes
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={addOption}
                className="h-7 px-2"
                title="Add option"
              >
                <Plus size={12} className="mr-1" />
                Option
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                    <Settings size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuCheckboxItem
                    checked={pollData.settings.allowMultiple}
                    onCheckedChange={checked => updateSettings({ allowMultiple: checked })}
                  >
                    Allow multiple choices
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={pollData.settings.showResults}
                    onCheckedChange={checked => updateSettings({ showResults: checked })}
                  >
                    Show results after voting
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={deleteNode} className="text-destructive">
                    <Trash2 size={12} className="mr-2" />
                    Delete Poll
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Poll Content */}
        <div className="p-4 space-y-4">
          {/* Question */}
          <div className="space-y-2">
            {isPollQuestionSelected(pollId) && activeContentType === 'poll_question' ? (
              <div className="space-y-2">
                <Textarea
                  ref={questionInputRef}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="Enter your poll question..."
                  className="resize-none"
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      finishEditingQuestion();
                    } else if (e.key === 'Escape') {
                      setEditValue('');
                      handlePollQuestionClick(pollId, false);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={finishEditingQuestion}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditValue('');
                      handlePollQuestionClick(pollId, false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'cursor-pointer p-2 rounded border-2 border-dashed border-transparent hover:border-muted-foreground/25 transition-colors',
                  isActive && 'hover:border-blue-300'
                )}
                onClick={() => {
                  if (isActive) {
                    handlePollQuestionClick(pollId, false);
                  }
                }}
                onDoubleClick={startEditingQuestion}
                style={{
                  fontSize: `${pollData.styling.questionFontSize}px`,
                  fontWeight: pollData.styling.questionFontWeight,
                  textAlign: pollData.styling.textAlign,
                }}
              >
                {pollData.question || 'Click to edit question...'}
                {isActive && <Edit3 size={14} className="inline ml-2 opacity-50" />}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {pollData.options.map((option, index) => {
              const percentage = getOptionPercentage(option.votes);
              const isSelected = getUserVoteForOption(option.id);
              const showResults = pollData.settings.showResults && hasUserVoted;
              const isEditingOption =
                isPollOptionSelected(pollId, option.id) && activeContentType === 'poll_option';

              return (
                <div
                  key={option.id}
                  className={cn(
                    'relative group border rounded-lg overflow-hidden transition-all duration-200',
                    showResults || !isActive
                      ? 'cursor-default'
                      : 'cursor-pointer hover:border-blue-300 active:scale-[0.98]',
                    isVoting && 'pointer-events-none opacity-50'
                  )}
                  style={{
                    borderColor:
                      isSelected && !showResults
                        ? pollData.styling.selectedColor
                        : pollData.styling.borderColor,
                    borderWidth:
                      isSelected && !showResults ? '2px' : `${pollData.styling.borderWidth}px`,
                  }}
                  onClick={e => {
                    if (!showResults && !isEditingOption && isActive) {
                      handleVote(option.id);
                    }
                  }}
                >
                  {/* Results background bar */}
                  {showResults && percentage > 0 && (
                    <div
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isSelected
                          ? `${pollData.styling.resultBarColor}40`
                          : `${pollData.styling.resultBarColor}20`,
                      }}
                    />
                  )}

                  <div
                    className="relative flex items-center justify-between"
                    style={{ padding: `${pollData.styling.optionPadding}px` }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Vote indicator */}
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckCircle2
                            size={20}
                            style={{ color: pollData.styling.selectedColor }}
                          />
                        ) : (
                          <Circle size={20} className="text-muted-foreground" />
                        )}
                      </div>

                      {/* Option text */}
                      <div className="flex-1">
                        {isEditingOption ? (
                          <Input
                            ref={optionInputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => finishEditingOption(option.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                finishEditingOption(option.id);
                              } else if (e.key === 'Escape') {
                                setEditValue('');
                                handlePollOptionClick(pollId, option.id, false);
                              }
                            }}
                            className="border-0 p-0 bg-transparent focus-visible:ring-0"
                            style={{ fontSize: `${pollData.styling.optionFontSize}px` }}
                          />
                        ) : (
                          <span
                            className={cn('cursor-text', isActive && 'hover:text-blue-600')}
                            style={{ fontSize: `${pollData.styling.optionFontSize}px` }}
                            onClick={e => {
                              if (isActive) {
                                e.stopPropagation();
                                handlePollOptionClick(pollId, option.id, false);
                              }
                            }}
                            onDoubleClick={e => {
                              if (isActive) {
                                e.stopPropagation();
                                startEditingOption(option.id);
                              }
                            }}
                          >
                            {option.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Results display */}
                    {showResults && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{option.votes}</span>
                        <span className="text-muted-foreground">({percentage}%)</span>
                      </div>
                    )}

                    {/* Option controls */}
                    {isActive && !isEditingOption && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation();
                            removeOption(option.id);
                          }}
                          disabled={pollData.options.length <= 1}
                          className="h-6 w-6 p-0 text-red-500"
                          title="Remove option"
                        >
                          <Minus size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Poll metadata */}
          {pollData.metadata.totalVotes > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{pollData.metadata.totalVotes} total votes</span>
                </div>
                {pollData.settings.allowMultiple && (
                  <Badge variant="outline" className="text-xs">
                    Multiple choice
                  </Badge>
                )}
              </div>
              {pollData.metadata.lastVoteAt && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    Last vote: {new Date(pollData.metadata.lastVoteAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {pollData.options.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No poll options yet</p>
              <p className="text-sm mb-4">Add options to start collecting votes</p>
              {isActive && (
                <Button onClick={addOption} className="bg-blue-600 hover:bg-blue-700">
                  <Plus size={16} className="mr-2" />
                  Add First Option
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {isActive && (
          <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Poll Selected
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
