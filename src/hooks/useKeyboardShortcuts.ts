// ABOUTME: Comprehensive keyboard shortcut system for editor operations with customizable keybindings

import React, { useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useToast } from '@/hooks/use-toast';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  category: 'editing' | 'navigation' | 'blocks' | 'formatting' | 'system';
  action: () => void;
  disabled?: boolean;
  global?: boolean; // Works even when not focused on editor
}

export interface ShortcutCategory {
  id: string;
  name: string;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts() {
  const { toast } = useToast();
  const [showShortcutsPanel, setShowShortcutsPanel] = React.useState(false);
  const {
    undo,
    redo,
    selectedNodeId,
    nodes,
    deleteNode,
    duplicateNode,
    copyNodes,
    pasteNodes,
    history,
    historyIndex,
    saveToDatabase,
    toggleFullscreen,
    toggleInspector,
    addNode,
    switchViewport,
    currentViewport,
  } = useEditorStore();

  // Track pressed keys for combination detection
  const [pressedKeys, setPressedKeys] = React.useState<Set<string>>(new Set());
  const [shortcutsEnabled, setShortcutsEnabled] = React.useState(true);

  // Helper to normalize key combinations
  const normalizeKeys = useCallback((keys: string[]): string => {
    return keys
      .map(key => key.toLowerCase())
      .sort()
      .join('+');
  }, []);

  // Check if current pressed keys match a shortcut
  const matchesShortcut = useCallback(
    (shortcut: KeyboardShortcut): boolean => {
      const shortcutKeys = new Set(shortcut.keys.map(k => k.toLowerCase()));
      const currentKeys = new Set([...pressedKeys].map(k => k.toLowerCase()));

      // Must match exactly
      if (shortcutKeys.size !== currentKeys.size) return false;

      for (const key of shortcutKeys) {
        if (!currentKeys.has(key)) return false;
      }

      return true;
    },
    [pressedKeys]
  );

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = React.useMemo(
    () => [
      // System shortcuts
      {
        id: 'undo',
        name: 'Undo',
        description: 'Undo the last action',
        keys: ['ctrl', 'z'],
        category: 'system',
        action: () => {
          undo();
          toast({
            title: 'Undone',
            description: `Reverted to previous state (${Math.max(0, historyIndex)} actions remaining)`,
            duration: 1500,
          });
        },
        disabled: historyIndex <= 0,
      },
      {
        id: 'redo',
        name: 'Redo',
        description: 'Redo the last undone action',
        keys: ['ctrl', 'y'],
        category: 'system',
        action: () => {
          redo();
          toast({
            title: 'Redone',
            description: `Restored next state (${(history?.length || 0) - historyIndex - 1} actions ahead)`,
            duration: 1500,
          });
        },
        disabled: !history || historyIndex >= history.length - 1,
      },
      {
        id: 'save',
        name: 'Save',
        description: 'Save the document',
        keys: ['ctrl', 's'],
        category: 'system',
        action: async () => {
          try {
            await saveToDatabase();
            toast({
              title: 'Saved',
              description: 'Document saved successfully',
              duration: 1500,
            });
          } catch (error) {
            toast({
              title: 'Save Failed',
              description: 'Could not save document',
              variant: 'destructive',
            });
          }
        },
      },
      {
        id: 'fullscreen',
        name: 'Toggle Fullscreen',
        description: 'Enter or exit fullscreen mode',
        keys: ['f11'],
        category: 'system',
        action: () => {
          toggleFullscreen();
        },
        global: true,
      },
      {
        id: 'inspector',
        name: 'Toggle Inspector',
        description: 'Show or hide the inspector panel',
        keys: ['ctrl', 'i'],
        category: 'system',
        action: () => {
          toggleInspector();
          toast({
            title: 'Inspector Toggled',
            description: 'Inspector panel visibility changed',
            duration: 1000,
          });
        },
      },

      // Block operations
      {
        id: 'delete',
        name: 'Delete Block',
        description: 'Delete the selected block',
        keys: ['delete'],
        category: 'editing',
        action: () => {
          if (selectedNodeId) {
            const selectedNode = nodes.find(n => n.id === selectedNodeId);
            deleteNode(selectedNodeId);
            toast({
              title: 'Block Deleted',
              description: `Deleted ${selectedNode?.type || 'block'}`,
              duration: 1500,
            });
          }
        },
        disabled: !selectedNodeId,
      },
      {
        id: 'duplicate',
        name: 'Duplicate Block',
        description: 'Duplicate the selected block',
        keys: ['ctrl', 'd'],
        category: 'editing',
        action: () => {
          if (selectedNodeId) {
            const selectedNode = nodes.find(n => n.id === selectedNodeId);
            duplicateNode(selectedNodeId);
            toast({
              title: 'Block Duplicated',
              description: `Duplicated ${selectedNode?.type || 'block'}`,
              duration: 1500,
            });
          }
        },
        disabled: !selectedNodeId,
      },
      {
        id: 'copy',
        name: 'Copy Block',
        description: 'Copy the selected block to clipboard',
        keys: ['ctrl', 'c'],
        category: 'editing',
        action: () => {
          if (selectedNodeId) {
            const selectedNode = nodes.find(n => n.id === selectedNodeId);
            copyNodes([selectedNodeId]);
            toast({
              title: 'Block Copied',
              description: `Copied ${selectedNode?.type || 'block'} to clipboard`,
              duration: 1500,
            });
          }
        },
        disabled: !selectedNodeId,
      },
      {
        id: 'paste',
        name: 'Paste Block',
        description: 'Paste block from clipboard',
        keys: ['ctrl', 'v'],
        category: 'editing',
        action: () => {
          pasteNodes();
          toast({
            title: 'Block Pasted',
            description: 'Pasted block from clipboard',
            duration: 1500,
          });
        },
      },

      // Quick block creation
      {
        id: 'add-text',
        name: 'Add Text Block',
        description: 'Add a new text block',
        keys: ['ctrl', 'shift', 't'],
        category: 'blocks',
        action: () => {
          addNode({ type: 'textBlock' });
          toast({
            title: 'Text Block Added',
            description: 'Added new text block',
            duration: 1000,
          });
        },
      },
      {
        id: 'add-heading',
        name: 'Add Heading Block',
        description: 'Add a new heading block',
        keys: ['ctrl', 'shift', 'h'],
        category: 'blocks',
        action: () => {
          addNode({ type: 'headingBlock' });
          toast({
            title: 'Heading Block Added',
            description: 'Added new heading block',
            duration: 1000,
          });
        },
      },
      {
        id: 'add-image',
        name: 'Add Image Block',
        description: 'Add a new image block',
        keys: ['ctrl', 'shift', 'i'],
        category: 'blocks',
        action: () => {
          addNode({ type: 'imageBlock' });
          toast({
            title: 'Image Block Added',
            description: 'Added new image block',
            duration: 1000,
          });
        },
      },
      {
        id: 'add-separator',
        name: 'Add Separator',
        description: 'Add a new separator block',
        keys: ['ctrl', 'shift', 's'],
        category: 'blocks',
        action: () => {
          addNode({ type: 'separatorBlock' });
          toast({
            title: 'Separator Added',
            description: 'Added new separator block',
            duration: 1000,
          });
        },
      },

      // Help
      {
        id: 'help',
        name: 'Show Help',
        description: 'Show keyboard shortcuts panel',
        keys: ['?'],
        category: 'system',
        action: () => {
          setShowShortcutsPanel(true);
        },
        global: true,
      },

      // Navigation
      {
        id: 'switch-viewport',
        name: 'Switch Viewport',
        description: 'Switch between desktop and mobile viewport',
        keys: ['ctrl', 'm'],
        category: 'navigation',
        action: () => {
          const newViewport = currentViewport === 'desktop' ? 'mobile' : 'desktop';
          switchViewport(newViewport);
          toast({
            title: 'Viewport Switched',
            description: `Switched to ${newViewport} viewport`,
            duration: 1000,
          });
        },
      },
    ],
    [
      undo,
      redo,
      selectedNodeId,
      nodes,
      deleteNode,
      duplicateNode,
      copyNodes,
      pasteNodes,
      history,
      historyIndex,
      saveToDatabase,
      toggleFullscreen,
      toggleInspector,
      addNode,
      switchViewport,
      currentViewport,
      toast,
    ]
  );

  // Group shortcuts by category
  const shortcutCategories: ShortcutCategory[] = React.useMemo(() => {
    const categories = new Map<string, ShortcutCategory>();

    shortcuts.forEach(shortcut => {
      if (!categories.has(shortcut.category)) {
        categories.set(shortcut.category, {
          id: shortcut.category,
          name: shortcut.category.charAt(0).toUpperCase() + shortcut.category.slice(1),
          shortcuts: [],
        });
      }
      categories.get(shortcut.category)!.shortcuts.push(shortcut);
    });

    return Array.from(categories.values());
  }, [shortcuts]);

  // Handle keydown events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!shortcutsEnabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      setPressedKeys(prev => new Set([...prev, key]));

      // Check for matching shortcuts
      const matchingShortcut = shortcuts.find(
        shortcut => !shortcut.disabled && matchesShortcut(shortcut)
      );

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.action();
      }
    },
    [shortcuts, shortcutsEnabled, matchesShortcut]
  );

  // Handle keyup events
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  // Handle window blur (clear pressed keys)
  const handleWindowBlur = useCallback(() => {
    setPressedKeys(new Set());
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleWindowBlur]);

  // Format shortcut display
  const formatShortcut = useCallback((keys: string[]): string => {
    return keys
      .map(key => {
        switch (key.toLowerCase()) {
          case 'ctrl':
            return '⌘';
          case 'shift':
            return '⇧';
          case 'alt':
            return '⌥';
          case 'meta':
            return '⌘';
          case 'delete':
            return '⌫';
          case 'backspace':
            return '⌫';
          case 'enter':
            return '⏎';
          case 'space':
            return '⎵';
          case 'tab':
            return '⇥';
          case 'escape':
            return '⎋';
          default:
            return key.toUpperCase();
        }
      })
      .join(' + ');
  }, []);

  // Get shortcut by ID
  const getShortcut = useCallback(
    (id: string) => {
      return shortcuts.find(s => s.id === id);
    },
    [shortcuts]
  );

  return {
    shortcuts,
    shortcutCategories,
    pressedKeys: Array.from(pressedKeys),
    shortcutsEnabled,
    setShortcutsEnabled,
    formatShortcut,
    getShortcut,
    showShortcutsPanel,
    setShowShortcutsPanel,
  };
}
