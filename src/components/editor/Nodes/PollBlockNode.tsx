// ABOUTME: WYSIWYG node component

import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  EditableField,
  useSemanticBlockStyling,
  useStyledBlockDataUpdate,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  BarChart3,
  Users,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  Edit2,
  Settings,
  cn,
  useEditorStore,
  useEditorTheme,
  PLACEHOLDERS,
} from '@/components/editor/shared';
import { CheckCircle2, Circle } from 'lucide-react';
import { PollBlockData } from '@/types/editor';
import { generateNodeId } from '@/types/editor';

interface PollBlockNodeProps {
  id: string;
  data: PollBlockData;
  selected?: boolean;
}

export const PollBlockNode = React.memo(function PollBlockNode({
  id,
  data,
  selected,
}: PollBlockNodeProps) {
  const { updateNode } = useEditorStore();
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Use unified data update hook
  const { updateData } = useStyledBlockDataUpdate(id, data);

  // Use semantic styling hook for poll-specific theming
  const { semanticColors, colors } = useSemanticBlockStyling(data, selected || false, 'poll');

  // Get unified styling
  const selectionClasses = selected ? 'ring-2 ring-blue-500' : '';
  const borderStyles = {
    borderWidth: 0,
    borderColor: colors.block.border,
  };

  const pollData = data;
  const pollColors = semanticColors;

  // Enhanced data validation and initialization with useEffect to prevent infinite loops
  const defaultPollData = React.useMemo(
    () => ({
      question: PLACEHOLDERS.POLL_QUESTION,
      options: [
        { id: 'opt-1-' + Date.now(), text: `${PLACEHOLDERS.POLL_OPTION} 1`, votes: 0 },
        { id: 'opt-2-' + Date.now(), text: `${PLACEHOLDERS.POLL_OPTION} 2`, votes: 0 },
      ],
      allowMultiple: false,
      showResults: true,
      totalVotes: 0,
    }),
    []
  );

  // Helper function to check if poll data is valid
  const isValidPollData = (data: any): boolean => {
    return data && typeof data === 'object';
  };

  // Helper function to calculate vote change
  const calculateVoteChange = (
    shouldAdd: boolean,
    userVotes: Set<string>,
    optionId: string
  ): number => {
    if (shouldAdd) return 1;
    return userVotes.has(optionId) ? -1 : 0;
  };

  // Initialize poll data if missing or invalid (using useEffect to prevent infinite loops)
  React.useEffect(() => {
    if (!hasInitialized && !isValidPollData(pollData)) {
      console.warn('PollBlockNode: Poll data is missing or invalid, initializing with defaults', {
        pollData,
        nodeId: id,
      });
      updateNode(id, { data: defaultPollData });
      setHasInitialized(true);
    }
  }, [id, pollData, hasInitialized, defaultPollData, updateNode]);

  // Use safe defaults for missing properties
  const safeQuestion = pollData?.question || defaultPollData.question;
  const safeOptions = Array.isArray(pollData?.options) ? pollData.options : defaultPollData.options;
  const safeAllowMultiple = Boolean(pollData?.allowMultiple);
  const safeShowResults = pollData?.showResults !== false; // default to true
  const safeTotalVotes = Number(pollData?.totalVotes) || 0;

  const handleVote = async (optionId: string) => {
    if (isVoting || isEditMode) return;

    setIsVoting(true);

    try {
      // Create a new copy of the poll data with updated votes
      const updatedOptions = safeOptions.map(option => {
        if (option.id === optionId) {
          // If multiple votes allowed, toggle; otherwise, only vote if not already voted
          const shouldAdd = safeAllowMultiple ? !userVotes.has(optionId) : userVotes.size === 0;
          const voteChange = calculateVoteChange(shouldAdd, userVotes, optionId);

          return {
            ...option,
            votes: Math.max(0, option.votes + voteChange),
          };
        }
        // For single-choice polls, remove votes from other options
        else if (!safeAllowMultiple && userVotes.has(option.id)) {
          return {
            ...option,
            votes: Math.max(0, option.votes - 1),
          };
        }
        return option;
      });

      const newTotalVotes = updatedOptions.reduce((sum, option) => sum + option.votes, 0);

      // Update user votes
      const newUserVotes = new Set(userVotes);
      if (safeAllowMultiple) {
        if (newUserVotes.has(optionId)) {
          newUserVotes.delete(optionId);
        } else {
          newUserVotes.add(optionId);
        }
      } else {
        newUserVotes.clear();
        if (!userVotes.has(optionId)) {
          newUserVotes.add(optionId);
        }
      }

      setUserVotes(newUserVotes);

      // Update the node data
      updateNode(id, {
        data: {
          ...pollData,
          options: updatedOptions,
          totalVotes: newTotalVotes,
        },
      });
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleOptionEdit = (optionId: string, newText: string) => {
    const updatedOptions = safeOptions.map(option =>
      option.id === optionId ? { ...option, text: newText } : option
    );
    updateData({ options: updatedOptions });
  };

  const addOption = () => {
    const newOption = {
      id: generateNodeId(),
      text: `${PLACEHOLDERS.POLL_OPTION} ${safeOptions.length + 1}`,
      votes: 0,
    };
    updateData({ options: [...safeOptions, newOption] });
  };

  const removeOption = (optionId: string) => {
    if (safeOptions.length > 1) {
      const filteredOptions = safeOptions.filter(option => option.id !== optionId);
      // Recalculate total votes
      const newTotalVotes = filteredOptions.reduce((sum, option) => sum + option.votes, 0);
      updateData({ options: filteredOptions, totalVotes: newTotalVotes });
    }
  };

  const moveOption = (optionId: string, direction: 'up' | 'down') => {
    const currentIndex = safeOptions.findIndex(option => option.id === optionId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < safeOptions.length) {
      const newOptions = [...safeOptions];
      [newOptions[currentIndex], newOptions[newIndex]] = [
        newOptions[newIndex],
        newOptions[currentIndex],
      ];
      updateData({ options: newOptions });
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const getOptionPercentage = (votes: number) => {
    if (safeTotalVotes === 0) return 0;
    return Math.round((votes / safeTotalVotes) * 100);
  };

  const hasVoted = userVotes.size > 0;

  // Dynamic styles with unified border styling
  const dynamicStyles = {
    ...borderStyles,
    minWidth: '320px',
    maxWidth: '600px',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties;

  // Poll colors from CSS custom properties

  return (
    <>
      <div
        data-block-type="pollBlock"
        className={`relative ${selectionClasses}`}
        style={{
          ...dynamicStyles,
          borderRadius: '8px',
          padding: '0',
        }}
      >
        <div data-node-id={id} className="w-full h-full">
          <Card
            className={cn('w-full h-full transition-all duration-200', selected && 'shadow-lg')}
            style={{
              backgroundColor: pollColors.background,
              borderColor: pollColors.border,
              color: pollColors.text,
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  {/* STANDARDIZED: Editable Question using unified EditableField */}
                  <EditableField
                    value={pollData?.question || ''}
                    onUpdate={question => updateData({ question })}
                    placeholder={PLACEHOLDERS.POLL_QUESTION}
                    blockId={id}
                    blockSelected={selected}
                    className="text-lg font-semibold"
                    style={{ color: pollColors.text }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Poll
                  </Badge>
                  {selected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleEditMode}
                      className="h-7 px-2"
                      title={isEditMode ? 'Exit edit mode' : 'Show edit options'}
                    >
                      {isEditMode ? (
                        <Settings className="w-3 h-3" />
                      ) : (
                        <Edit2 className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {safeTotalVotes > 0 && (
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: colors.block.textSecondary }}
                >
                  <Users className="w-4 h-4" />
                  <span>
                    {safeTotalVotes} vote{safeTotalVotes !== 1 ? 's' : ''}
                  </span>
                  {safeAllowMultiple && (
                    <Badge variant="secondary" className="text-xs">
                      Multiple choice
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Add Option Button - Always visible when selected */}
              {selected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addOption}
                  className="w-full h-10 border-dashed opacity-60 hover:opacity-100 transition-opacity"
                  title="Add new option"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              )}

              {safeOptions.map((option, index) => {
                const percentage = getOptionPercentage(option.votes);
                const isSelected = userVotes.has(option.id);
                const showResults = safeShowResults && hasVoted;

                return (
                  <div
                    key={option.id}
                    className={cn(
                      'relative p-3 rounded-lg border transition-all duration-200 group',
                      showResults || isEditMode
                        ? 'cursor-default'
                        : 'cursor-pointer hover:border-blue-300 active:scale-[0.98]',
                      isVoting && 'pointer-events-none opacity-50'
                    )}
                    style={{
                      backgroundColor:
                        isSelected && !showResults && !isEditMode
                          ? pollColors.resultBarSelected + '20' // 20% opacity for selected
                          : pollColors.optionBackground,
                      borderColor:
                        isSelected && !showResults && !isEditMode
                          ? pollColors.resultBarSelected
                          : pollColors.border,
                      borderRadius: '8px',
                    }}
                    onClick={e => {
                      // Only handle voting if not clicking on text or if results are hidden
                      if (!showResults && !isEditMode && e.target === e.currentTarget) {
                        handleVote(option.id);
                      }
                    }}
                  >
                    {/* Option Controls (edit mode) */}
                    {isEditMode && selected && (
                      <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col gap-1 bg-white dark:bg-gray-800 border rounded p-1 shadow-lg">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              moveOption(option.id, 'up');
                            }}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                            title="Move up"
                          >
                            <ChevronUp size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              removeOption(option.id);
                            }}
                            disabled={safeOptions.length <= 1}
                            className="h-6 w-6 p-0 text-red-500"
                            title="Remove option"
                          >
                            <Minus size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              moveOption(option.id, 'down');
                            }}
                            disabled={index === safeOptions.length - 1}
                            className="h-6 w-6 p-0"
                            title="Move down"
                          >
                            <ChevronDown size={12} />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Results background bar */}
                    {showResults && percentage > 0 && (
                      <div
                        className="absolute inset-0 rounded-lg transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: isSelected
                            ? pollColors.resultBar + '30' // 30% opacity for selected
                            : pollColors.resultBar + '20', // 20% opacity for unselected
                          borderRadius: '8px',
                        }}
                      />
                    )}

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Vote indicator */}
                        <div className={cn('flex-shrink-0', showResults ? 'opacity-60' : '')}>
                          {isSelected ? (
                            <CheckCircle2
                              className="w-5 h-5"
                              style={{ color: pollColors.resultBarSelected }}
                            />
                          ) : (
                            <Circle
                              className="w-5 h-5"
                              style={{ color: colors.block.textSecondary }}
                            />
                          )}
                        </div>

                        {/* STANDARDIZED: Option text using unified EditableField */}
                        <div className="flex-1">
                          <EditableField
                            value={option.text}
                            onUpdate={text => handleOptionEdit(option.id, text)}
                            placeholder={`${PLACEHOLDERS.POLL_OPTION} ${index + 1}`}
                            blockId={id}
                            blockSelected={selected}
                            className="font-medium"
                            style={{ color: pollColors.text }}
                          />
                        </div>
                      </div>

                      {/* Results display */}
                      {showResults && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold" style={{ color: pollColors.text }}>
                            {option.votes}
                          </span>
                          <span className="text-xs" style={{ color: colors.block.textSecondary }}>
                            ({percentage}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Vote button for non-results view */}
              {!safeShowResults && hasVoted && (
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" disabled={isVoting}>
                    {isVoting ? 'Submitting...' : `View Results (${safeTotalVotes} votes)`}
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {safeOptions.length === 0 && (
                <div
                  className="text-center py-8 text-sm"
                  style={{ color: colors.block.textSecondary }}
                >
                  {isEditMode && selected ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <BarChart3 className="mx-auto mb-2 w-8 h-8 text-blue-500" />
                        <p className="font-medium text-blue-600 dark:text-blue-400">
                          Add Poll Options
                        </p>
                        <p className="text-xs">
                          Click "Add Option" to create choices for your poll
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={addOption}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Option
                      </Button>
                    </div>
                  ) : (
                    'No poll options yet. Use the edit button to add options.'
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
});
