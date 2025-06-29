// ABOUTME: Inspector component for PollBlock with question editing, option management, and poll settings

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { SafeSwitch } from '@/components/editor/SafeSwitch'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  BarChart3, 
  Users,
  Eye,
  EyeOff,
  CheckSquare,
  Square
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/store/editorStore'
import { PollBlockData } from '@/types/editor'
import { generateNodeId } from '@/types/editor'

interface PollBlockInspectorProps {
  nodeId: string
  data: PollBlockData
}

export function PollBlockInspector({ nodeId, data }: PollBlockInspectorProps) {
  const { updateNode } = useEditorStore()
  const [newOptionText, setNewOptionText] = useState('')

  const updatePollData = (updates: Partial<PollBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates }
    })
  }

  const handleQuestionChange = (question: string) => {
    updatePollData({ question })
  }

  const handleAddOption = () => {
    if (!newOptionText.trim()) return

    const newOption = {
      id: generateNodeId(),
      text: newOptionText.trim(),
      votes: 0
    }

    updatePollData({
      options: [...data.options, newOption]
    })
    setNewOptionText('')
  }

  const handleUpdateOption = (optionId: string, text: string) => {
    const updatedOptions = data.options.map(option =>
      option.id === optionId ? { ...option, text } : option
    )
    updatePollData({ options: updatedOptions })
  }

  const handleDeleteOption = (optionId: string) => {
    const updatedOptions = data.options.filter(option => option.id !== optionId)
    const removedVotes = data.options.find(opt => opt.id === optionId)?.votes || 0
    updatePollData({
      options: updatedOptions,
      totalVotes: Math.max(0, data.totalVotes - removedVotes)
    })
  }

  const handleResetVotes = () => {
    const resetOptions = data.options.map(option => ({
      ...option,
      votes: 0
    }))
    updatePollData({
      options: resetOptions,
      totalVotes: 0
    })
  }

  const handleToggleAllowMultiple = (allowMultiple: boolean) => {
    updatePollData({ allowMultiple })
  }

  const handleToggleShowResults = (showResults: boolean) => {
    updatePollData({ showResults })
  }

  const totalVotes = data.totalVotes || 0
  const hasVotes = totalVotes > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-sm">Poll Block</h3>
        <Badge variant="outline" className="text-xs">
          {data.options.length} option{data.options.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Poll Question */}
      <div className="space-y-2">
        <Label htmlFor="poll-question" className="text-xs font-medium">
          Poll Question
        </Label>
        <Textarea
          id="poll-question"
          value={data.question || ''}
          onChange={(e) => handleQuestionChange(e.target.value)}
          placeholder="Enter your poll question..."
          className="min-h-[60px] text-sm"
        />
      </div>

      <Separator />

      {/* Poll Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Poll Options</Label>
          {hasVotes && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetVotes}
              className="text-xs h-7"
            >
              Reset Votes
            </Button>
          )}
        </div>

        {/* Existing Options */}
        <div className="space-y-2">
          {data.options.map((option, index) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <Input
                  value={option.text}
                  onChange={(e) => handleUpdateOption(option.id, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteOption(option.id)}
                  className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Vote display */}
              {hasVotes && (
                <div className="flex items-center gap-2 ml-5 text-xs text-gray-600">
                  <Users className="w-3 h-3" />
                  <span>{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
                  {totalVotes > 0 && (
                    <span className="text-gray-500">
                      ({Math.round((option.votes / totalVotes) * 100)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add New Option */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Plus className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <Input
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="Add new option..."
              className="text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddOption()
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              disabled={!newOptionText.trim()}
              className="px-3 h-8"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {data.options.length === 0 && (
          <div className="text-center py-4 text-xs text-gray-500 border border-dashed rounded-lg">
            No options yet. Add your first poll option above.
          </div>
        )}
      </div>

      <Separator />

      {/* Poll Settings */}
      <div className="space-y-4">
        <Label className="text-xs font-medium">Poll Settings</Label>

        {/* Allow Multiple Choice */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.allowMultiple ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            <div>
              <Label className="text-xs font-medium">Multiple Choice</Label>
              <p className="text-xs text-gray-500">
                Allow users to select multiple options
              </p>
            </div>
          </div>
          <SafeSwitch
            checked={data.allowMultiple}
            onCheckedChange={handleToggleAllowMultiple}
            aria-label="Allow multiple choice"
          />
        </div>

        {/* Show Results */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.showResults ? (
              <Eye className="w-4 h-4 text-green-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
            <div>
              <Label className="text-xs font-medium">Show Results</Label>
              <p className="text-xs text-gray-500">
                Display vote counts and percentages
              </p>
            </div>
          </div>
          <SafeSwitch
            checked={data.showResults}
            onCheckedChange={handleToggleShowResults}
            aria-label="Show poll results"
          />
        </div>
      </div>

      {/* Poll Statistics */}
      {hasVotes && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-medium">Poll Statistics</Label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Total Votes</div>
                <div className="text-lg font-bold text-blue-600">{totalVotes}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Options</div>
                <div className="text-lg font-bold text-green-600">{data.options.length}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}