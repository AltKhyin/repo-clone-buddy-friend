// ABOUTME: Interactive poll block component for the Visual Composition Engine with voting functionality and results display

import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editorStore';
import { PollBlockData } from '@/types/editor';
import { UnifiedNodeResizer } from '../components/UnifiedNodeResizer';
import { useUnifiedBlockStyling, getSelectionIndicatorProps } from '../utils/blockStyling';
import {
  ThemedBlockWrapper,
  useThemedStyles,
  useThemedColors,
} from '@/components/editor/theme/ThemeIntegration';

interface PollBlockNodeData {
  id: string;
  type: 'pollBlock';
  data: PollBlockData;
}

export const PollBlockNode = React.memo(function PollBlockNode({
  id,
  data,
  selected,
}: NodeProps<PollBlockNodeData>) {
  const { updateNode, canvasTheme } = useEditorStore();
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [isVoting, setIsVoting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get theme-aware styles and colors
  const themedStyles = useThemedStyles('pollBlock');
  const themedColors = useThemedColors();

  // Get unified styling
  const { selectionClasses, borderStyles } = useUnifiedBlockStyling(
    'pollBlock',
    selected,
    { borderWidth: 0, borderColor: '#e5e7eb' } // Poll uses Card styling, no custom borders
  );

  const isDarkMode = canvasTheme === 'dark';
  const pollData = data;

  // Enhanced data validation and initialization with useEffect to prevent infinite loops
  const defaultPollData = {
    question: 'What is your opinion?',
    options: [
      { id: 'opt-1-' + Date.now(), text: 'Option 1', votes: 0 },
      { id: 'opt-2-' + Date.now(), text: 'Option 2', votes: 0 },
    ],
    allowMultiple: false,
    showResults: true,
    totalVotes: 0,
  };

  // Initialize poll data if missing or invalid (using useEffect to prevent infinite loops)
  React.useEffect(() => {
    if (!hasInitialized && (!pollData || typeof pollData !== 'object')) {
      console.warn('PollBlockNode: Poll data is missing or invalid, initializing with defaults', {
        pollData,
        nodeId: id,
      });
      updateNode(id, { data: defaultPollData });
      setHasInitialized(true);
    }
  }, [id, pollData, hasInitialized]); // Removed updateNode dependency to prevent potential re-runs

  // Use safe defaults for missing properties
  const safeQuestion = pollData?.question || defaultPollData.question;
  const safeOptions = Array.isArray(pollData?.options) ? pollData.options : defaultPollData.options;
  const safeAllowMultiple = Boolean(pollData?.allowMultiple);
  const safeShowResults = pollData?.showResults !== false; // default to true
  const safeTotalVotes = Number(pollData?.totalVotes) || 0;

  const handleVote = async (optionId: string) => {
    if (isVoting) return;

    setIsVoting(true);

    try {
      // Create a new copy of the poll data with updated votes
      const updatedOptions = safeOptions.map(option => {
        if (option.id === optionId) {
          // If multiple votes allowed, toggle; otherwise, only vote if not already voted
          const shouldAdd = safeAllowMultiple ? !userVotes.has(optionId) : userVotes.size === 0;
          const voteChange = shouldAdd ? 1 : userVotes.has(optionId) ? -1 : 0;

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

  const getOptionPercentage = (votes: number) => {
    if (safeTotalVotes === 0) return 0;
    return Math.round((votes / safeTotalVotes) * 100);
  };

  const hasVoted = userVotes.size > 0;
  const selectionIndicatorProps = getSelectionIndicatorProps('pollBlock');

  // Dynamic styles with unified border styling
  const dynamicStyles = {
    ...borderStyles,
    minWidth: '320px',
    maxWidth: '600px',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties;

  // Get theme-aware colors with fallbacks
  const getThemeColors = () => {
    if (!themedColors) {
      return {
        background: isDarkMode ? '#1f2937' : '#ffffff',
        border: isDarkMode ? '#374151' : '#e5e7eb',
        text: isDarkMode ? '#f3f4f6' : '#111827',
        optionBackground: themedStyles.optionBackground || (isDarkMode ? '#374151' : '#f9fafb'),
        resultBarColor: themedStyles.resultBarColor || (isDarkMode ? '#3b82f6' : '#60a5fa'),
      };
    }

    return {
      background: themedStyles.backgroundColor || themedColors.neutral['50'],
      border: themedColors.neutral['200'],
      text: themedColors.neutral['900'],
      optionBackground: themedStyles.optionBackground || themedColors.neutral['100'],
      resultBarColor: themedStyles.resultBarColor || themedColors.primary['500'],
    };
  };

  const colors = getThemeColors();

  return (
    <>
      <UnifiedNodeResizer
        isVisible={selected}
        nodeType="pollBlock"
        customConstraints={{
          minWidth: 320,
          minHeight: 200,
          maxWidth: 600,
          maxHeight: 800,
        }}
      />

      <ThemedBlockWrapper
        blockType="pollBlock"
        className={`relative ${selectionClasses}`}
        style={{
          ...dynamicStyles,
          borderRadius: themedStyles.borderRadius || '8px',
          padding: themedStyles.padding || '0',
        }}
      >
        <div data-node-id={id} className="w-full h-full">
          {/* Unified Selection indicator */}
          {selected && <div {...selectionIndicatorProps} />}

          <Handle
            type="target"
            position={Position.Top}
            className="!bg-blue-500 !border-blue-600 !w-3 !h-3"
          />

          <Card
            className={cn('w-full h-full transition-all duration-200', selected && 'shadow-lg')}
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold" style={{ color: colors.text }}>
                  {safeQuestion}
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Poll
                </Badge>
              </div>

              {safeTotalVotes > 0 && (
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  )}
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
              {safeOptions.map(option => {
                const percentage = getOptionPercentage(option.votes);
                const isSelected = userVotes.has(option.id);
                const showResults = safeShowResults && hasVoted;

                return (
                  <div
                    key={option.id}
                    className={cn(
                      'relative p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                      showResults ? 'cursor-default' : 'hover:border-blue-300 active:scale-[0.98]',
                      isVoting && 'pointer-events-none opacity-50'
                    )}
                    style={{
                      backgroundColor:
                        isSelected && !showResults
                          ? colors.resultBarColor + '20' // 20% opacity for selected
                          : colors.optionBackground,
                      borderColor:
                        isSelected && !showResults ? colors.resultBarColor : colors.border,
                      borderRadius: themedStyles.borderRadius || '8px',
                    }}
                    onClick={() => !showResults && handleVote(option.id)}
                  >
                    {/* Results background bar */}
                    {showResults && percentage > 0 && (
                      <div
                        className="absolute inset-0 rounded-lg transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: isSelected
                            ? colors.resultBarColor + '30' // 30% opacity for selected
                            : colors.resultBarColor + '20', // 20% opacity for unselected
                          borderRadius: themedStyles.borderRadius || '8px',
                        }}
                      />
                    )}

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Vote indicator */}
                        <div className={cn('flex-shrink-0', showResults ? 'opacity-60' : '')}>
                          {isSelected ? (
                            <CheckCircle2
                              className={cn(
                                'w-5 h-5',
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              )}
                            />
                          ) : (
                            <Circle
                              className={cn(
                                'w-5 h-5',
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              )}
                            />
                          )}
                        </div>

                        {/* Option text */}
                        <span className="font-medium" style={{ color: colors.text }}>
                          {option.text}
                        </span>
                      </div>

                      {/* Results display */}
                      {showResults && (
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={cn(
                              'font-semibold',
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            )}
                          >
                            {option.votes}
                          </span>
                          <span
                            className={cn(
                              'text-xs',
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            )}
                          >
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
                  className={cn(
                    'text-center py-8 text-sm',
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  )}
                >
                  No poll options yet. Use the inspector to add options.
                </div>
              )}
            </CardContent>
          </Card>

          <Handle
            type="source"
            position={Position.Bottom}
            className="!bg-blue-500 !border-blue-600 !w-3 !h-3"
          />
        </div>
      </ThemedBlockWrapper>
    </>
  );
});
