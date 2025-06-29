// ABOUTME: Interactive poll block component for the Visual Composition Engine with voting functionality and results display

import React, { useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { NodeResizer } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, BarChart3, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/store/editorStore'
import { PollBlockData } from '@/types/editor'

interface PollBlockNodeData {
  id: string
  type: 'pollBlock'
  data: PollBlockData
}

export function PollBlockNode({ id, data, selected }: NodeProps<PollBlockNodeData>) {
  const { updateNode, canvasTheme } = useEditorStore()
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [isVoting, setIsVoting] = useState(false)

  const isDarkMode = canvasTheme === 'dark'
  const pollData = data.data

  const handleVote = async (optionId: string) => {
    if (isVoting) return

    setIsVoting(true)
    
    try {
      // Create a new copy of the poll data with updated votes
      const updatedOptions = pollData.options.map(option => {
        if (option.id === optionId) {
          // If multiple votes allowed, toggle; otherwise, only vote if not already voted
          const shouldAdd = pollData.allowMultiple ? !userVotes.has(optionId) : userVotes.size === 0
          const voteChange = shouldAdd ? 1 : (userVotes.has(optionId) ? -1 : 0)
          
          return {
            ...option,
            votes: Math.max(0, option.votes + voteChange)
          }
        }
        // For single-choice polls, remove votes from other options
        else if (!pollData.allowMultiple && userVotes.has(option.id)) {
          return {
            ...option,
            votes: Math.max(0, option.votes - 1)
          }
        }
        return option
      })

      const newTotalVotes = updatedOptions.reduce((sum, option) => sum + option.votes, 0)

      // Update user votes
      const newUserVotes = new Set(userVotes)
      if (pollData.allowMultiple) {
        if (newUserVotes.has(optionId)) {
          newUserVotes.delete(optionId)
        } else {
          newUserVotes.add(optionId)
        }
      } else {
        newUserVotes.clear()
        if (!userVotes.has(optionId)) {
          newUserVotes.add(optionId)
        }
      }

      setUserVotes(newUserVotes)

      // Update the node data
      updateNode(id, {
        data: {
          ...pollData,
          options: updatedOptions,
          totalVotes: newTotalVotes
        }
      })
    } catch (error) {
      console.error('Failed to vote:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const getOptionPercentage = (votes: number) => {
    if (pollData.totalVotes === 0) return 0
    return Math.round((votes / pollData.totalVotes) * 100)
  }

  const hasVoted = userVotes.size > 0

  return (
    <div
      className={cn(
        'relative min-w-[320px] max-w-[600px]',
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        isDarkMode ? 'ring-offset-gray-900' : 'ring-offset-white'
      )}
    >
      <NodeResizer 
        isVisible={selected}
        minWidth={320}
        minHeight={200}
        maxWidth={600}
        maxHeight={800}
      />
      
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !border-blue-600 !w-3 !h-3"
      />
      
      <Card className={cn(
        'w-full h-full transition-all duration-200',
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 text-gray-100' 
          : 'bg-white border-gray-200 text-gray-900',
        selected && 'shadow-lg'
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              'text-lg font-semibold',
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            )}>
              {pollData.question || 'Untitled Poll'}
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Poll
            </Badge>
          </div>
          
          {pollData.totalVotes > 0 && (
            <div className={cn(
              'flex items-center gap-2 text-sm',
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            )}>
              <Users className="w-4 h-4" />
              <span>{pollData.totalVotes} vote{pollData.totalVotes !== 1 ? 's' : ''}</span>
              {pollData.allowMultiple && (
                <Badge variant="secondary" className="text-xs">
                  Multiple choice
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {pollData.options.map((option) => {
            const percentage = getOptionPercentage(option.votes)
            const isSelected = userVotes.has(option.id)
            const showResults = pollData.showResults && hasVoted

            return (
              <div
                key={option.id}
                className={cn(
                  'relative p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                  showResults 
                    ? 'cursor-default' 
                    : 'hover:border-blue-300 active:scale-[0.98]',
                  isSelected && !showResults
                    ? isDarkMode
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-blue-50 border-blue-300'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100',
                  isVoting && 'pointer-events-none opacity-50'
                )}
                onClick={() => !showResults && handleVote(option.id)}
              >
                {/* Results background bar */}
                {showResults && percentage > 0 && (
                  <div
                    className={cn(
                      'absolute inset-0 rounded-lg transition-all duration-500',
                      isSelected
                        ? 'bg-blue-500/20'
                        : isDarkMode
                          ? 'bg-gray-600/30'
                          : 'bg-gray-200/60'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Vote indicator */}
                    <div className={cn(
                      'flex-shrink-0',
                      showResults ? 'opacity-60' : ''
                    )}>
                      {isSelected ? (
                        <CheckCircle2 className={cn(
                          'w-5 h-5',
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        )} />
                      ) : (
                        <Circle className={cn(
                          'w-5 h-5',
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        )} />
                      )}
                    </div>

                    {/* Option text */}
                    <span className={cn(
                      'font-medium',
                      isDarkMode ? 'text-gray-200' : 'text-gray-800'
                    )}>
                      {option.text}
                    </span>
                  </div>

                  {/* Results display */}
                  {showResults && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className={cn(
                        'font-semibold',
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      )}>
                        {option.votes}
                      </span>
                      <span className={cn(
                        'text-xs',
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      )}>
                        ({percentage}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Vote button for non-results view */}
          {!pollData.showResults && hasVoted && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isVoting}
              >
                {isVoting ? 'Submitting...' : `View Results (${pollData.totalVotes} votes)`}
              </Button>
            </div>
          )}

          {/* Empty state */}
          {pollData.options.length === 0 && (
            <div className={cn(
              'text-center py-8 text-sm',
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            )}>
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
  )
}