// ABOUTME: React component for rendering interactive polls in TipTap editor with voting and analytics

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  TrendingUp,
  Clock,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PollData, PollOption } from './PollExtension';
import { pollComponentRegistry, PollComponentMethods } from './pollCommands';

interface PollComponentProps extends NodeViewProps {
  // Inherited from NodeViewProps: node, updateAttributes, deleteNode, selected
}

interface UserVote {
  optionId: string;
  timestamp: string;
}

export const PollComponent: React.FC<PollComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [optionText, setOptionText] = useState('');
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const optionInputRef = useRef<HTMLInputElement>(null);

  // Extract poll data from node attributes using useMemo to prevent re-renders
  const pollData: PollData = useMemo(
    () => ({
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
    }),
    [
      node.attrs.question,
      node.attrs.options,
      node.attrs.settings,
      node.attrs.metadata,
      node.attrs.styling,
    ]
  );

  // Initialize default poll if empty
  useEffect(() => {
    if (!pollData.question && !pollData.options.length) {
      const defaultOptions: PollOption[] = [
        { id: `option-1-${Date.now()}`, text: 'Option 1', votes: 0 },
        { id: `option-2-${Date.now()}`, text: 'Option 2', votes: 0 },
      ];

      updateAttributes({
        question: 'What is your opinion?',
        options: defaultOptions,
        settings: pollData.settings,
        metadata: {
          ...pollData.metadata,
          createdAt: new Date().toISOString(),
        },
        styling: pollData.styling,
      });
    }
  }, [
    pollData.question,
    pollData.options.length,
    pollData.settings,
    pollData.metadata,
    pollData.styling,
    updateAttributes,
  ]);

  // Get user votes from node attributes or local state
  const currentUserVotes = (node.attrs.userVotes || userVotes) as UserVote[];

  // Update poll data helper
  const updatePollData = useCallback(
    (updates: Partial<PollData>) => {
      updateAttributes({
        ...node.attrs,
        ...updates,
      });
    },
    [node.attrs, updateAttributes]
  );

  // Question editing
  const startEditingQuestion = useCallback(() => {
    setEditingQuestion(true);
    setQuestionText(pollData.question);
    setTimeout(() => questionInputRef.current?.focus(), 0);
  }, [pollData.question]);

  const saveQuestion = useCallback(() => {
    if (questionText.trim()) {
      updatePollData({ question: questionText.trim() });
    }
    setEditingQuestion(false);
    setQuestionText('');
  }, [questionText, updatePollData]);

  const cancelEditingQuestion = useCallback(() => {
    setEditingQuestion(false);
    setQuestionText('');
  }, []);

  // Option editing
  const startEditingOption = useCallback(
    (optionId: string) => {
      const option = pollData.options.find(opt => opt.id === optionId);
      if (option) {
        setEditingOption(optionId);
        setOptionText(option.text);
        setTimeout(() => optionInputRef.current?.focus(), 0);
      }
    },
    [pollData.options]
  );

  const saveOption = useCallback(() => {
    if (editingOption && optionText.trim()) {
      const updatedOptions = pollData.options.map(option =>
        option.id === editingOption ? { ...option, text: optionText.trim() } : option
      );
      updatePollData({ options: updatedOptions });
    }
    setEditingOption(null);
    setOptionText('');
  }, [editingOption, optionText, pollData.options, updatePollData]);

  const cancelEditingOption = useCallback(() => {
    setEditingOption(null);
    setOptionText('');
  }, []);

  // Poll management
  const addOption = useCallback(() => {
    const newOption: PollOption = {
      id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: `Option ${pollData.options.length + 1}`,
      votes: 0,
    };
    updatePollData({ options: [...pollData.options, newOption] });
  }, [pollData.options, updatePollData]);

  const removeOption = useCallback(
    (optionId: string) => {
      if (pollData.options.length > 1) {
        const filteredOptions = pollData.options.filter(option => option.id !== optionId);

        // Recalculate total votes and remove user votes for deleted option
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
      }
    },
    [pollData.options, pollData.metadata, currentUserVotes, node.attrs, updateAttributes]
  );

  // Voting logic
  const handleVote = useCallback(
    async (optionId: string) => {
      if (isVoting) return;

      setIsVoting(true);

      try {
        const hasVotedForOption = currentUserVotes.some(vote => vote.optionId === optionId);
        let newUserVotes = [...currentUserVotes];
        let updatedOptions = [...pollData.options];

        if (pollData.settings.allowMultiple) {
          // Multiple choice: toggle vote
          if (hasVotedForOption) {
            // Remove vote
            newUserVotes = newUserVotes.filter(vote => vote.optionId !== optionId);
            updatedOptions = updatedOptions.map(option =>
              option.id === optionId ? { ...option, votes: Math.max(0, option.votes - 1) } : option
            );
          } else {
            // Add vote
            newUserVotes.push({ optionId, timestamp: new Date().toISOString() });
            updatedOptions = updatedOptions.map(option =>
              option.id === optionId ? { ...option, votes: option.votes + 1 } : option
            );
          }
        } else {
          // Single choice: remove previous vote and add new one
          if (hasVotedForOption) {
            // Unvote if clicking same option
            newUserVotes = [];
            updatedOptions = updatedOptions.map(option =>
              option.id === optionId ? { ...option, votes: Math.max(0, option.votes - 1) } : option
            );
          } else {
            // Remove previous votes and add new vote
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

        // Update the poll
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
    [isVoting, currentUserVotes, pollData, node.attrs, updateAttributes]
  );

  // Calculate percentages
  const getOptionPercentage = useCallback(
    (votes: number) => {
      if (pollData.metadata.totalVotes === 0) return 0;
      return Math.round((votes / pollData.metadata.totalVotes) * 100);
    },
    [pollData.metadata.totalVotes]
  );

  // Check if user has voted
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

  // Question update helper
  const updateQuestion = useCallback(
    (question: string) => {
      updatePollData({ question });
    },
    [updatePollData]
  );

  // Vote on option helper  
  const voteOnOption = useCallback(
    (optionId: string) => {
      handleVote(optionId);
    },
    [handleVote]
  );

  // Create component methods object for command integration
  const componentMethods: PollComponentMethods = useMemo(
    () => ({
      addOption,
      removeOption,
      updatePollData,
      voteOnOption,
      updateQuestion,
      updateSettings,
    }),
    [addOption, removeOption, updatePollData, voteOnOption, updateQuestion, updateSettings]
  );

  // Register component with command registry
  useEffect(() => {
    const pollId = node.attrs.pollId;
    if (pollId) {
      pollComponentRegistry.register(pollId, componentMethods);

      return () => {
        pollComponentRegistry.unregister(pollId);
      };
    }
  }, [node.attrs.pollId, componentMethods]);

  return (
    <NodeViewWrapper className="poll-wrapper">
      <div
        className={cn(
          'relative border rounded-lg overflow-hidden bg-white',
          selected ? 'ring-2 ring-blue-500 ring-offset-2' : '',
          'transition-all duration-200'
        )}
      >
        {/* Poll Header */}
        {selected && (
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
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
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
            {editingQuestion ? (
              <div className="space-y-2">
                <Textarea
                  ref={questionInputRef}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Enter your poll question..."
                  className="resize-none"
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveQuestion();
                    } else if (e.key === 'Escape') {
                      cancelEditingQuestion();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveQuestion}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditingQuestion}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'cursor-pointer p-2 rounded border-2 border-dashed border-transparent hover:border-muted-foreground/25 transition-colors',
                  selected && 'hover:border-blue-300'
                )}
                onClick={startEditingQuestion}
                style={{
                  fontSize: `${pollData.styling.questionFontSize}px`,
                  fontWeight: pollData.styling.questionFontWeight,
                  textAlign: pollData.styling.textAlign,
                }}
              >
                {pollData.question || 'Click to edit question...'}
                {selected && <Edit3 size={14} className="inline ml-2 opacity-50" />}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            {pollData.options.map((option, index) => {
              const percentage = getOptionPercentage(option.votes);
              const isSelected = getUserVoteForOption(option.id);
              const showResults = pollData.settings.showResults && hasUserVoted;

              return (
                <div
                  key={option.id}
                  className={cn(
                    'relative group border rounded-lg overflow-hidden transition-all duration-200',
                    showResults || !selected
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
                    if (!showResults && !editingOption && selected) {
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
                          ? `${pollData.styling.resultBarColor}40` // 25% opacity
                          : `${pollData.styling.resultBarColor}20`, // 12.5% opacity
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
                        {editingOption === option.id ? (
                          <Input
                            ref={optionInputRef}
                            value={optionText}
                            onChange={e => setOptionText(e.target.value)}
                            onBlur={saveOption}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                saveOption();
                              } else if (e.key === 'Escape') {
                                cancelEditingOption();
                              }
                            }}
                            className="border-0 p-0 bg-transparent focus-visible:ring-0"
                            style={{ fontSize: `${pollData.styling.optionFontSize}px` }}
                          />
                        ) : (
                          <span
                            className={cn('cursor-text', selected && 'hover:text-blue-600')}
                            style={{ fontSize: `${pollData.styling.optionFontSize}px` }}
                            onClick={e => {
                              if (selected) {
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
                    {selected && !editingOption && (
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
              {selected && (
                <Button onClick={addOption} className="bg-blue-600 hover:bg-blue-700">
                  <Plus size={16} className="mr-2" />
                  Add First Option
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Poll Selected
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this poll? This action cannot be undone and all votes
              will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteNode();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Poll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NodeViewWrapper>
  );
};
