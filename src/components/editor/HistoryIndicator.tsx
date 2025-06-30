// ABOUTME: Visual history indicator with undo/redo buttons and timeline visualization

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  Undo2,
  Redo2,
  History,
  Clock,
  FileText,
  Image,
  Hash,
  Minus,
  BarChart3,
  Lightbulb,
  Quote,
} from 'lucide-react';

interface HistoryIndicatorProps {
  className?: string;
  compact?: boolean;
}

// Icon mapping for different action types
const ACTION_ICONS = {
  textBlock: FileText,
  headingBlock: Hash,
  imageBlock: Image,
  separatorBlock: Minus,
  pollBlock: BarChart3,
  keyTakeawayBlock: Lightbulb,
  referenceBlock: Quote,
  default: FileText,
};

export function HistoryIndicator({ className, compact = false }: HistoryIndicatorProps) {
  const { history, historyIndex, undo, redo, nodes } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const totalActions = history.length;
  const currentPosition = historyIndex + 1;

  // Analyze history for action types
  const getActionDescription = (historyItem: any, index: number) => {
    if (index === 0) return 'Initial state';

    const prevItem = history[index - 1];
    const currentNodes = historyItem.nodes || [];
    const prevNodes = prevItem?.nodes || [];

    // Detect what changed
    if (currentNodes.length > prevNodes.length) {
      const addedNode = currentNodes.find(
        (node: any) => !prevNodes.find((prev: any) => prev.id === node.id)
      );
      return `Added ${addedNode?.type?.replace('Block', '') || 'block'}`;
    }

    if (currentNodes.length < prevNodes.length) {
      const deletedNode = prevNodes.find(
        (node: any) => !currentNodes.find((curr: any) => curr.id === node.id)
      );
      return `Deleted ${deletedNode?.type?.replace('Block', '') || 'block'}`;
    }

    // Check for content changes
    const modifiedNode = currentNodes.find((node: any, nodeIndex: number) => {
      const prevNode = prevNodes[nodeIndex];
      return prevNode && JSON.stringify(node.data) !== JSON.stringify(prevNode.data);
    });

    if (modifiedNode) {
      return `Modified ${modifiedNode.type?.replace('Block', '') || 'block'}`;
    }

    return 'Layout change';
  };

  const getActionIcon = (historyItem: any, index: number) => {
    if (index === 0) return Clock;

    const prevItem = history[index - 1];
    const currentNodes = historyItem.nodes || [];
    const prevNodes = prevItem?.nodes || [];

    if (currentNodes.length > prevNodes.length) {
      const addedNode = currentNodes.find(
        (node: any) => !prevNodes.find((prev: any) => prev.id === node.id)
      );
      return ACTION_ICONS[addedNode?.type as keyof typeof ACTION_ICONS] || ACTION_ICONS.default;
    }

    return ACTION_ICONS.default;
  };

  const formatTimeAgo = (index: number) => {
    // Since we don't have timestamps, use relative position
    const stepsAgo = historyIndex - index;
    if (stepsAgo === 0) return 'Current';
    if (stepsAgo > 0) return `${stepsAgo} step${stepsAgo > 1 ? 's' : ''} ago`;
    return `${Math.abs(stepsAgo)} step${Math.abs(stepsAgo) > 1 ? 's' : ''} ahead`;
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </Button>

        <Badge variant="outline" className="text-xs">
          {currentPosition}/{totalActions}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Undo Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={undo}
        disabled={!canUndo}
        className="flex items-center gap-2"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={16} />
        <span className="hidden sm:inline">Undo</span>
      </Button>

      {/* Redo Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={redo}
        disabled={!canRedo}
        className="flex items-center gap-2"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={16} />
        <span className="hidden sm:inline">Redo</span>
      </Button>

      {/* History Timeline */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            title="View history timeline"
          >
            <History size={16} />
            <Badge variant="secondary" className="text-xs">
              {currentPosition}/{totalActions}
            </Badge>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <History size={16} />
              <h3 className="font-semibold text-sm">History Timeline</h3>
              <Badge variant="outline" className="ml-auto text-xs">
                {totalActions} action{totalActions !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="h-64 overflow-y-auto">
              <div className="space-y-1">
                {history.map((historyItem, index) => {
                  const ActionIcon = getActionIcon(historyItem, index);
                  const description = getActionDescription(historyItem, index);
                  const isCurrent = index === historyIndex;
                  const isAccessible = index <= historyIndex;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg border text-sm transition-colors',
                        isCurrent && 'bg-primary/10 border-primary/30',
                        !isAccessible && 'opacity-50',
                        isAccessible && !isCurrent && 'hover:bg-muted/50 cursor-pointer'
                      )}
                      onClick={() => {
                        // Jump to this point in history
                        if (isAccessible && !isCurrent) {
                          const stepsToMove = index - historyIndex;
                          if (stepsToMove > 0) {
                            for (let i = 0; i < stepsToMove; i++) redo();
                          } else {
                            for (let i = 0; i < Math.abs(stepsToMove); i++) undo();
                          }
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                          isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}
                      >
                        <ActionIcon size={14} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{description}</div>
                        <div className="text-xs text-muted-foreground">{formatTimeAgo(index)}</div>
                      </div>

                      {isCurrent && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total blocks: {nodes.length}</span>
                <span>History limit: 50 actions</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
