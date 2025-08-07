// ABOUTME: Comprehensive keyboard shortcuts help panel with searchable commands and categories

import React from 'react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';
import { Keyboard, Search, X, Zap } from 'lucide-react';

interface KeyboardShortcutsPanelProps {
  trigger?: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsPanel({
  trigger,
  className,
  open,
  onOpenChange,
}: KeyboardShortcutsPanelProps) {
  const { shortcutCategories, formatShortcut, shortcutsEnabled, setShortcutsEnabled } =
    useKeyboardShortcuts();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Filter shortcuts based on search and category
  const filteredCategories = React.useMemo(() => {
    return shortcutCategories
      .map(category => ({
        ...category,
        shortcuts: category.shortcuts.filter(shortcut => {
          const matchesSearch =
            searchQuery === '' ||
            shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shortcut.keys.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory;

          return matchesSearch && matchesCategory;
        }),
      }))
      .filter(category => category.shortcuts.length > 0);
  }, [shortcutCategories, searchQuery, selectedCategory]);

  const totalShortcuts = shortcutCategories.reduce(
    (total, category) => total + category.shortcuts.length,
    0
  );

  const enabledShortcuts = shortcutCategories.reduce(
    (total, category) => total + category.shortcuts.filter(s => !s.disabled).length,
    0
  );

  const defaultTrigger = (
    <Button variant="outline" size="sm" className={cn('flex items-center gap-2', className)}>
      <Keyboard size={16} />
      <span className="hidden sm:inline">Shortcuts</span>
      <Badge variant="secondary" className="text-xs">
        {enabledShortcuts}
      </Badge>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard size={20} />
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription>
                Master the editor with these keyboard shortcuts. Press ? anywhere in the editor to
                open this panel.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={shortcutsEnabled ? 'default' : 'secondary'}>
                {shortcutsEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShortcutsEnabled(!shortcutsEnabled)}
              >
                {shortcutsEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X size={12} />
              </Button>
            )}
          </div>

          <div className="flex gap-1">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {shortcutCategories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-sm font-medium">
              {enabledShortcuts} of {totalShortcuts} shortcuts active
            </span>
          </div>

          {filteredCategories.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredCategories.reduce((total, cat) => total + cat.shortcuts.length, 0)}{' '}
              shortcut
              {filteredCategories.reduce((total, cat) => total + cat.shortcuts.length, 0) !== 1
                ? 's'
                : ''}
            </div>
          )}
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No shortcuts found matching your search.
              </div>
            ) : (
              filteredCategories.map((category, categoryIndex) => (
                <div key={category.id}>
                  {categoryIndex > 0 && <Separator className="mb-6" />}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {category.shortcuts.length} shortcut
                        {category.shortcuts.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="grid gap-2">
                      {category.shortcuts.map(shortcut => (
                        <div
                          key={shortcut.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border',
                            shortcut.disabled ? 'opacity-50 bg-muted/30' : 'hover:bg-muted/50'
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{shortcut.name}</span>
                              {shortcut.disabled && (
                                <Badge variant="secondary" className="text-xs">
                                  Disabled
                                </Badge>
                              )}
                              {shortcut.global && (
                                <Badge variant="outline" className="text-xs">
                                  Global
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{shortcut.description}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, index) => (
                                <div key={index} className="flex items-center gap-1">
                                  {index > 0 && (
                                    <span className="text-muted-foreground text-xs">+</span>
                                  )}
                                  <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
                                    {formatShortcut([key])}
                                  </kbd>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Help Footer */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Press <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> to toggle this panel
            </span>
            <span>Shortcuts work globally unless noted otherwise</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
