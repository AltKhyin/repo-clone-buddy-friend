// ABOUTME: WYSIWYG node component with Tiptap integration for poll questions and options

import React, { useState, useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { Progress } from '@/components/ui/progress';
import {
  useSemanticBlockStyling,
  useStyledBlockDataUpdate,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  PLACEHOLDERS,
  UnifiedBlockWrapper,
} from '@/components/editor/shared';
import { CheckCircle2, Circle } from 'lucide-react';
import { PollBlockData } from '@/types/editor';
import { generateNodeId } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';

interface PollBlockNodeProps {
  id: string;
  data: PollBlockData;
  selected?: boolean;
  // Position props for unified wrapper
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  // Interaction callbacks
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
}

export const PollBlockNode = React.memo(function PollBlockNode({
  id,
  data,
  selected,
  width = 500,
  height = 350,
  x = 0,
  y = 0,
  onSelect,
  onMove,
}: PollBlockNodeProps) {
  const { updateNode } = useEditorStore();
  const { colors } = useEditorTheme();
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Use unified data update hook
  const { updateField } = useStyledBlockDataUpdate(id, data);

  // Use semantic styling hook for poll-specific theming
  const { colors: semanticColors } = useSemanticBlockStyling(
    data,
    selected || false,
    'poll',
    {
      defaultPaddingX: 24,
      defaultPaddingY: 20,
      minDimensions: { width: 320, height: 200 },
    }
  );

  // Handle question updates from Tiptap
  const handleQuestionUpdate = useCallback(
    (nodeId: string, htmlQuestion: string) => {
      updateNode(nodeId, {
        data: {
          ...data,
          htmlQuestion,
        },
      });
    },
    [updateNode, data]
  );

  // Handle option text updates from Tiptap
  const handleOptionUpdate = useCallback(
    (optionId: string, htmlText: string) => {
      const updatedOptions = data.options.map(option =>
        option.id === optionId ? { ...option, htmlText } : option
      );
      updateNode(id, {
        data: {
          ...data,
          options: updatedOptions,
        },
      });
    },
    [updateNode, data, id]
  );

  // Get initial content for question field
  const getInitialQuestion = () => {
    return data.htmlQuestion || '<p>Your question here</p>';
  };

  // Initialize Tiptap editor for question
  const questionEditor = useTiptapEditor({
    nodeId: `${id}-question`,
    initialContent: getInitialQuestion(),
    placeholder: PLACEHOLDERS.POLL_QUESTION,
    onUpdate: handleQuestionUpdate,
    editable: true,
    fieldConfig: { fieldType: 'multi-line' },
  });

  // Initialize Tiptap editors for each option
  const optionEditors = data.options.map(option =>
    useTiptapEditor({
      nodeId: `${id}-option-${option.id}`,
      initialContent: option.htmlText || '<p></p>',
      placeholder: `Poll option ${data.options.indexOf(option) + 1}`,
      onUpdate: (nodeId: string, htmlText: string) => handleOptionUpdate(option.id, htmlText),
      editable: true,
      fieldConfig: { fieldType: 'simple-text' },
    })
  );

  // Enhanced data validation and initialization
  const defaultPollData = React.useMemo(
    () => ({
      htmlQuestion: '<p>' + PLACEHOLDERS.POLL_QUESTION + '</p>',
      options: [
        { id: 'opt-1-' + Date.now(), htmlText: `<p>${PLACEHOLDERS.POLL_OPTION} 1</p>`, votes: 0 },
        { id: 'opt-2-' + Date.now(), htmlText: `<p>${PLACEHOLDERS.POLL_OPTION} 2</p>`, votes: 0 },
      ],
      allowMultiple: false,
      showResults: true,
      totalVotes: 0,
    }),
    []
  );

  // Helper function to check if poll data is valid
  const isValidPollData = (data: any): boolean => {
    return data && typeof data === 'object' && Array.isArray(data.options);
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

  // Initialize poll data if missing or invalid
  React.useEffect(() => {
    if (!hasInitialized && !isValidPollData(data)) {
      console.warn('PollBlockNode: Poll data is missing or invalid, initializing with defaults', {
        data,
        nodeId: id,
      });
      updateNode(id, { data: defaultPollData });
      setHasInitialized(true);
    }
  }, [id, data, hasInitialized, defaultPollData, updateNode]);

  // Use safe defaults for missing properties
  const safeQuestion = data?.htmlQuestion || defaultPollData.htmlQuestion;
  const safeOptions = Array.isArray(data?.options) ? data.options : defaultPollData.options;
  const safeAllowMultiple = Boolean(data?.allowMultiple);
  const safeShowResults = data?.showResults !== false; // default to true
  const safeTotalVotes = Number(data?.totalVotes) || 0;

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
          ...data,
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

  const addOption = () => {
    const newOption = {
      id: generateNodeId(),
      htmlText: `<p>${PLACEHOLDERS.POLL_OPTION} ${safeOptions.length + 1}</p>`,
      votes: 0,
    };
    updateField('options', [...safeOptions, newOption]);
  };

  const removeOption = (optionId: string) => {
    if (safeOptions.length > 1) {
      const filteredOptions = safeOptions.filter(option => option.id !== optionId);
      // Recalculate total votes
      const newTotalVotes = filteredOptions.reduce((sum, option) => sum + option.votes, 0);
      updateNode(id, {
        data: {
          ...data,
          options: filteredOptions,
          totalVotes: newTotalVotes,
        },
      });
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
      updateField('options', newOptions);
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

  // Typography styles for question and options (like TextBlockNode)
  const paddingX = data.paddingX ?? 24;
  const paddingY = data.paddingY ?? 20;

  const questionDynamicStyles = {
    fontSize: data.fontSize ? `${data.fontSize}px` : '18px',
    textAlign: data.textAlign || 'left',
    color: data.color || semanticColors.text,
    lineHeight: data.lineHeight || 1.5,
    fontFamily: data.fontFamily || 'inherit',
    fontWeight: data.fontWeight || 600, // Semibold for questions
    letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
    textTransform: data.textTransform || 'none',
    textDecoration: data.textDecoration || 'none',
    fontStyle: data.fontStyle || 'normal',
    width: '100%',
    cursor: 'text',
  } as React.CSSProperties;

  const optionDynamicStyles = {
    fontSize: data.fontSize ? `${data.fontSize * 0.9}px` : '16px', // Slightly smaller than question
    textAlign: data.textAlign || 'left',
    color: data.color || semanticColors.text,
    lineHeight: data.lineHeight || 1.4,
    fontFamily: data.fontFamily || 'inherit',
    fontWeight: data.fontWeight || 500, // Medium weight for options
    letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
    textTransform: data.textTransform || 'none',
    textDecoration: data.textDecoration || 'none',
    fontStyle: data.fontStyle || 'normal',
    width: '100%',
    cursor: 'text',
  } as React.CSSProperties;

  // Content styles for UnifiedBlockWrapper
  const wrapperContentStyles = {
    backgroundColor: data.backgroundColor || semanticColors.background,
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : '12px',
    borderWidth: `${data.borderWidth || 0}px`,
    borderColor: data.borderColor || semanticColors.border,
    borderStyle: 'solid',
    padding: `${paddingY}px ${paddingX}px`,
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100%',
    position: 'relative' as const,
  };

  return (
    <UnifiedBlockWrapper
      id={id}
      width={width}
      height={height}
      x={x}
      y={y}
      selected={selected}
      blockType="pollBlock"
      contentStyles={wrapperContentStyles}
      minDimensions={{ width: 320, height: 200 }}
      maxDimensions={{ width: 800, height: 600 }}
      onSelect={onSelect}
      onMove={onMove}
    >
      <div
        data-node-id={id}
        data-block-id={id}
        data-block-type="pollBlock"
        className="w-full h-full"
      >
        <Card className={cn('w-full h-full border-0 shadow-none', selected && 'ring-0')}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                {/* Question with Tiptap Integration */}
                <div className="relative">
                  <EditorContent
                    editor={questionEditor.editor}
                    className="tiptap-poll-question max-w-none focus:outline-none [&>*]:my-0 [&_p]:my-0"
                    style={questionDynamicStyles}
                  />
                  {/* Focus indicator */}
                  {questionEditor.isFocused && (
                    <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-50 rounded" />
                  )}
                </div>
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

              // Get option editor
              const optionEditor = optionEditors[index];

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
                        ? semanticColors.resultBarSelected + '20' // 20% opacity for selected
                        : semanticColors.optionBackground,
                    borderColor:
                      isSelected && !showResults && !isEditMode
                        ? semanticColors.resultBarSelected
                        : semanticColors.border,
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
                          ? semanticColors.resultBar + '30' // 30% opacity for selected
                          : semanticColors.resultBar + '20', // 20% opacity for unselected
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
                            style={{ color: semanticColors.resultBarSelected }}
                          />
                        ) : (
                          <Circle
                            className="w-5 h-5"
                            style={{ color: colors.block.textSecondary }}
                          />
                        )}
                      </div>

                      {/* Option text with Tiptap Integration */}
                      <div className="flex-1 relative">
                        {optionEditor && (
                          <>
                            <EditorContent
                              editor={optionEditor.editor}
                              className="tiptap-poll-option max-w-none focus:outline-none [&>*]:my-0 [&_p]:my-0"
                              style={optionDynamicStyles}
                              onClick={e => {
                                // Allow text content clicks to propagate for proper text selection
                                e.stopPropagation();
                              }}
                            />
                            {/* Focus indicator for option */}
                            {optionEditor.isFocused && (
                              <div className="absolute inset-0 pointer-events-none ring-1 ring-blue-400 ring-opacity-50 rounded" />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Results display */}
                    {showResults && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold" style={{ color: semanticColors.text }}>
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

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Poll Block Selected
          </div>
        )}
      </div>
    </UnifiedBlockWrapper>
  );
});