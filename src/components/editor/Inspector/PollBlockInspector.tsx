// ABOUTME: Inspector panel for PollBlock with comprehensive poll management controls and command integration

import React, { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { PollData } from '../extensions/Poll/PollExtension';
import { pollComponentRegistry } from '../extensions/Poll/pollCommands';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Minus,
  BarChart3,
  Users,
  Settings,
  Vote,
  Eye,
  EyeOff,
  RotateCcw,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackgroundControls, SpacingControls, BorderControls } from './shared/UnifiedControls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PollBlockInspectorProps {
  nodeId: string;
}

export function PollBlockInspector({ nodeId }: PollBlockInspectorProps) {
  const { nodes, updateNode } = useEditorStore();
  const { toast } = useToast();
  const [newOptionText, setNewOptionText] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);

  const node = nodes.find(n => n.id === nodeId);
  const data = node?.type === 'pollBlock' ? (node.data as PollData) : {};

  const updateData = useCallback(
    (updates: Partial<PollData>) => {
      if (node) {
        updateNode(nodeId, {
          data: { ...data, ...updates },
        });
      }
    },
    [updateNode, nodeId, data, node]
  );

  // Get poll component methods from registry
  const getPollComponent = useCallback(() => {
    const pollId = data.pollId || nodeId;
    return pollComponentRegistry.get(pollId);
  }, [data.pollId, nodeId]);

  // Poll structure operations
  const handleAddOption = useCallback(() => {
    if (!newOptionText.trim()) {
      toast({
        title: 'Invalid Option',
        description: 'Option text cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    const component = getPollComponent();
    if (component) {
      component.addOption();
      setNewOptionText('');
      setIsAddingOption(false);
      toast({
        title: 'Option Added',
        description: 'New poll option added successfully',
        duration: 2000,
      });
    }
  }, [newOptionText, getPollComponent, toast]);

  const handleRemoveOption = useCallback(
    (optionId: string) => {
      const component = getPollComponent();
      if (component && data.options && data.options.length > 1) {
        component.removeOption(optionId);
        toast({
          title: 'Option Removed',
          description: 'poll option removed successfully',
          duration: 2000,
        });
      } else {
        toast({
          title: 'Cannot Remove',
          description: 'Poll must have at least one option',
          variant: 'destructive',
        });
      }
    },
    [getPollComponent, data.options, toast]
  );

  const handleUpdateQuestion = useCallback(
    (question: string) => {
      const component = getPollComponent();
      if (component) {
        component.updateQuestion(question);
      }
    },
    [getPollComponent]
  );

  const handleUpdateSettings = useCallback(
    (settings: Partial<PollData['settings']>) => {
      const component = getPollComponent();
      if (component) {
        component.updateSettings(settings);
      }
    },
    [getPollComponent]
  );

  // Reset poll data
  const handleResetPoll = useCallback(() => {
    const component = getPollComponent();
    if (component) {
      component.updatePollData({
        question: 'What is your opinion?',
        options: [
          { id: `option-1-${Date.now()}`, text: 'Option 1', votes: 0 },
          { id: `option-2-${Date.now()}`, text: 'Option 2', votes: 0 },
        ],
        metadata: {
          totalVotes: 0,
          uniqueVoters: 0,
          createdAt: new Date().toISOString(),
        },
      });
      toast({
        title: 'Poll Reset',
        description: 'Poll has been reset to default state',
        duration: 2000,
      });
    }
  }, [getPollComponent, toast]);

  // Clear all votes
  const handleClearVotes = useCallback(() => {
    const component = getPollComponent();
    if (component && data.options) {
      const clearedOptions = data.options.map(option => ({
        ...option,
        votes: 0,
      }));

      component.updatePollData({
        options: clearedOptions,
        metadata: {
          ...data.metadata,
          totalVotes: 0,
          uniqueVoters: 0,
        },
      });

      toast({
        title: 'Votes Cleared',
        description: 'All votes have been cleared from the poll',
        duration: 2000,
      });
    }
  }, [getPollComponent, data.options, data.metadata, toast]);

  if (!node || node.type !== 'pollBlock') return null;

  const pollStats = {
    options: data.options?.length || 0,
    totalVotes: data.metadata?.totalVotes || 0,
    uniqueVoters: data.metadata?.uniqueVoters || 0,
  };

  const hasVotes = pollStats.totalVotes > 0;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Poll Configuration</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <BarChart3 size={12} />
            {pollStats.options} options
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure your poll question, options, and voting settings
        </p>
      </div>

      <Separator />

      {/* Poll Question */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Poll Question</h4>

        <div className="space-y-2">
          <Textarea
            value={data.question || ''}
            onChange={e => handleUpdateQuestion(e.target.value)}
            placeholder="Enter your poll question..."
            className="resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Make your question clear and specific for better responses
          </p>
        </div>
      </div>

      <Separator />

      {/* Poll Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Poll Options</h4>

        {/* Existing Options */}
        <div className="space-y-2">
          {data.options?.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
              <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
              <span className="flex-1 text-sm">{option.text}</span>
              {hasVotes && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users size={12} />
                  <span>{option.votes}</span>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveOption(option.id)}
                disabled={pollStats.options <= 1}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                title="Remove option"
              >
                <Minus size={12} />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Option */}
        {isAddingOption ? (
          <div className="space-y-2">
            <Input
              value={newOptionText}
              onChange={e => setNewOptionText(e.target.value)}
              placeholder="Enter new option text..."
              className="text-sm"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleAddOption();
                } else if (e.key === 'Escape') {
                  setIsAddingOption(false);
                  setNewOptionText('');
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddOption} disabled={!newOptionText.trim()}>
                Add Option
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingOption(false);
                  setNewOptionText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingOption(true)}
            className="w-full flex items-center gap-2"
          >
            <Plus size={14} />
            Add Option
          </Button>
        )}

        {/* Poll Statistics */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Options:</span>
              <span className="font-medium">{pollStats.options}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Votes:</span>
              <span className="font-medium">{pollStats.totalVotes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unique Voters:</span>
              <span className="font-medium">{pollStats.uniqueVoters}</span>
            </div>
            {data.metadata?.lastVoteAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Vote:</span>
                <span className="font-medium text-xs">
                  {new Date(data.metadata.lastVoteAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Poll Settings */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Voting Settings</h4>

        <div className="space-y-4">
          {/* Allow Multiple Choices */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="allow-multiple" className="text-sm">
                Allow Multiple Choices
              </Label>
              <p className="text-xs text-muted-foreground">Let voters select multiple options</p>
            </div>
            <Switch
              id="allow-multiple"
              checked={data.settings?.allowMultiple === true}
              onCheckedChange={checked => handleUpdateSettings({ allowMultiple: checked })}
            />
          </div>

          {/* Show Results */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="show-results" className="text-sm">
                Show Results After Voting
              </Label>
              <p className="text-xs text-muted-foreground">Display vote counts to users</p>
            </div>
            <Switch
              id="show-results"
              checked={data.settings?.showResults !== false}
              onCheckedChange={checked => handleUpdateSettings({ showResults: checked })}
            />
          </div>

          {/* Anonymous Voting */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="anonymous" className="text-sm">
                Anonymous Voting
              </Label>
              <p className="text-xs text-muted-foreground">Don't track individual voters</p>
            </div>
            <Switch
              id="anonymous"
              checked={data.settings?.allowAnonymous !== false}
              onCheckedChange={checked => handleUpdateSettings({ allowAnonymous: checked })}
            />
          </div>

          {/* Require Login */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="require-login" className="text-sm">
                Require Login to Vote
              </Label>
              <p className="text-xs text-muted-foreground">Only authenticated users can vote</p>
            </div>
            <Switch
              id="require-login"
              checked={data.settings?.requireLogin === true}
              onCheckedChange={checked => handleUpdateSettings({ requireLogin: checked })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Styling Controls */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Poll Styling</h4>

        <div className="space-y-4">
          {/* Question Font Size */}
          <div className="space-y-2">
            <Label className="text-sm">Question Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[data.styling?.questionFontSize || 18]}
                onValueChange={([value]) =>
                  updateData({
                    styling: { ...data.styling, questionFontSize: value },
                  })
                }
                min={14}
                max={32}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {data.styling?.questionFontSize || 18}px
              </span>
            </div>
          </div>

          {/* Question Font Weight */}
          <div className="space-y-2">
            <Label className="text-sm">Question Font Weight</Label>
            <Select
              value={(data.styling?.questionFontWeight || 600).toString()}
              onValueChange={value =>
                updateData({
                  styling: { ...data.styling, questionFontWeight: parseInt(value) },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semibold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Option Font Size */}
          <div className="space-y-2">
            <Label className="text-sm">Option Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[data.styling?.optionFontSize || 16]}
                onValueChange={([value]) =>
                  updateData({
                    styling: { ...data.styling, optionFontSize: value },
                  })
                }
                min={12}
                max={24}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {data.styling?.optionFontSize || 16}px
              </span>
            </div>
          </div>

          {/* Option Padding */}
          <div className="space-y-2">
            <Label className="text-sm">Option Padding</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[data.styling?.optionPadding || 12]}
                onValueChange={([value]) =>
                  updateData({
                    styling: { ...data.styling, optionPadding: value },
                  })
                }
                min={6}
                max={24}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {data.styling?.optionPadding || 12}px
              </span>
            </div>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="compact" className="text-sm">
              Compact Mode
            </Label>
            <Switch
              id="compact"
              checked={data.styling?.compact === true}
              onCheckedChange={checked =>
                updateData({
                  styling: { ...data.styling, compact: checked },
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Data Management */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Data Management</h4>

        <div className="space-y-3">
          {hasVotes && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full flex items-center gap-2 text-orange-600 hover:text-orange-700"
                >
                  <RotateCcw size={14} />
                  Clear All Votes
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Votes</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all {pollStats.totalVotes} votes from this poll.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearVotes}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear Votes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-full flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <RotateCcw size={14} />
                Reset Poll
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Poll</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the poll to its default state with 2 empty options and clear all
                  votes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetPoll}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset Poll
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator />

      {/* Border Controls */}
      <BorderControls data={data} onChange={updates => updateData(updates)} compact={false} />

      {/* Background Controls */}
      <BackgroundControls
        data={data}
        onChange={updates => updateData(updates)}
        enableImage={false}
        compact={false}
        colorKey="backgroundColor"
        defaultColor="transparent"
      />
    </div>
  );
}
