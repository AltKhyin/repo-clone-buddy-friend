// ABOUTME: Floating inline customization toolbar for quick property adjustments without leaving canvas

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Move,
  Settings,
  X,
  Plus,
  Minus
} from 'lucide-react';

interface ToolbarPosition {
  x: number;
  y: number;
  visible: boolean;
}

interface InlineCustomizationToolbarProps {
  className?: string;
}

// Quick action configurations for different block types
const QUICK_ACTIONS = {
  textBlock: [
    { 
      group: 'alignment',
      actions: [
        { icon: AlignLeft, key: 'textAlign', value: 'left', tooltip: 'Align Left' },
        { icon: AlignCenter, key: 'textAlign', value: 'center', tooltip: 'Align Center' },
        { icon: AlignRight, key: 'textAlign', value: 'right', tooltip: 'Align Right' },
      ]
    },
    {
      group: 'typography',
      actions: [
        { icon: Bold, key: 'fontWeight', value: 700, tooltip: 'Bold' },
        { icon: Italic, key: 'fontStyle', value: 'italic', tooltip: 'Italic' },
      ]
    }
  ],
  headingBlock: [
    {
      group: 'level',
      actions: [
        { icon: () => <span className="text-xs font-bold">H1</span>, key: 'level', value: 1, tooltip: 'Heading 1' },
        { icon: () => <span className="text-xs font-bold">H2</span>, key: 'level', value: 2, tooltip: 'Heading 2' },
        { icon: () => <span className="text-xs font-bold">H3</span>, key: 'level', value: 3, tooltip: 'Heading 3' },
        { icon: () => <span className="text-xs font-bold">H4</span>, key: 'level', value: 4, tooltip: 'Heading 4' },
      ]
    },
    {
      group: 'alignment',
      actions: [
        { icon: AlignLeft, key: 'textAlign', value: 'left', tooltip: 'Align Left' },
        { icon: AlignCenter, key: 'textAlign', value: 'center', tooltip: 'Align Center' },
        { icon: AlignRight, key: 'textAlign', value: 'right', tooltip: 'Align Right' },
      ]
    }
  ],
  separatorBlock: [
    {
      group: 'style',
      actions: [
        { icon: () => <div className="w-4 h-px bg-current"></div>, key: 'style', value: 'solid', tooltip: 'Solid' },
        { icon: () => <div className="w-4 h-px border-t border-dashed border-current"></div>, key: 'style', value: 'dashed', tooltip: 'Dashed' },
        { icon: () => <div className="w-4 h-px border-t border-dotted border-current"></div>, key: 'style', value: 'dotted', tooltip: 'Dotted' },
      ]
    },
    {
      group: 'thickness',
      actions: [
        { icon: Minus, key: 'thickness', value: (current: number) => Math.max(1, current - 1), tooltip: 'Decrease Thickness' },
        { icon: Plus, key: 'thickness', value: (current: number) => Math.min(10, current + 1), tooltip: 'Increase Thickness' },
      ]
    }
  ]
};

// Common quick actions available for all blocks
const COMMON_ACTIONS = [
  { icon: Palette, tooltip: 'Colors', action: 'color-picker' },
  { icon: Move, tooltip: 'Spacing', action: 'spacing' },
  { icon: Settings, tooltip: 'More Settings', action: 'open-inspector' },
];

export function InlineCustomizationToolbar({ className }: InlineCustomizationToolbarProps) {
  const { selectedNodeId, nodes, updateNode } = useEditorStore();
  const [position, setPosition] = useState<ToolbarPosition>({ x: 0, y: 0, visible: false });
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Calculate toolbar position based on selected node
  useEffect(() => {
    if (!selectedNodeId) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    // Find the selected element in the DOM
    const selectedElement = document.querySelector(`[data-node-id="${selectedNodeId}"]`);
    if (!selectedElement) {
      setPosition(prev => ({ ...prev, visible: false }));
      return;
    }

    const rect = selectedElement.getBoundingClientRect();
    const toolbarHeight = 48; // Estimated toolbar height
    const margin = 8;

    // Position toolbar above the element, or below if there's not enough space
    let y = rect.top - toolbarHeight - margin;
    if (y < margin) {
      y = rect.bottom + margin;
    }

    // Center horizontally on the element
    let x = rect.left + (rect.width / 2);
    
    // Ensure toolbar doesn't go off screen
    const maxX = window.innerWidth - 300; // Estimated toolbar width
    x = Math.max(margin, Math.min(x, maxX));

    setPosition({ x, y, visible: true });
  }, [selectedNodeId, nodes]);

  const handleQuickAction = (key: string, value: any) => {
    if (!selectedNode) return;

    const newValue = typeof value === 'function' ? value(selectedNode.data[key]) : value;
    updateNode(selectedNodeId!, { 
      data: { ...selectedNode.data, [key]: newValue } 
    });
  };

  const handleCommonAction = (action: string) => {
    switch (action) {
      case 'color-picker':
        setActivePopover(activePopover === 'colors' ? null : 'colors');
        break;
      case 'spacing':
        setActivePopover(activePopover === 'spacing' ? null : 'spacing');
        break;
      case 'open-inspector':
        // This could trigger opening the inspector panel
        break;
    }
  };

  const renderQuickActions = () => {
    if (!selectedNode) return null;

    const actions = QUICK_ACTIONS[selectedNode.type as keyof typeof QUICK_ACTIONS];
    if (!actions) return null;

    return actions.map((group, groupIndex) => (
      <div key={groupIndex} className="flex items-center">
        {groupIndex > 0 && <Separator orientation="vertical" className="h-6" />}
        <div className="flex items-center">
          {group.actions.map((action, actionIndex) => {
            const IconComponent = action.icon;
            const isActive = selectedNode.data[action.key] === action.value;
            
            return (
              <Button
                key={actionIndex}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleQuickAction(action.key, action.value)}
                className="h-8 w-8 p-0"
                title={action.tooltip}
              >
                <IconComponent size={14} />
              </Button>
            );
          })}
        </div>
      </div>
    ));
  };

  const renderColorPicker = () => {
    if (!selectedNode) return null;

    const quickColors = [
      '#000000', '#374151', '#6b7280', '#d1d5db', '#ffffff',
      '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
      '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4'
    ];

    return (
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-5 gap-1">
          {quickColors.map((color) => (
            <Button
              key={color}
              className="h-6 w-6 p-0 border-2"
              style={{ backgroundColor: color }}
              onClick={() => {
                updateNode(selectedNodeId!, {
                  data: { ...selectedNode.data, color }
                });
                setActivePopover(null);
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedNode.data.color || '#000000'}
            onChange={(e) => {
              updateNode(selectedNodeId!, {
                data: { ...selectedNode.data, color: e.target.value }
              });
            }}
            className="w-8 h-6 rounded border"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateNode(selectedNodeId!, {
                data: { ...selectedNode.data, color: undefined }
              });
              setActivePopover(null);
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    );
  };

  if (!position.visible || !selectedNode) {
    return null;
  }

  const toolbar = (
    <div
      className={cn(
        'fixed z-50 bg-background border rounded-lg shadow-lg p-2',
        'flex items-center gap-2',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)'
      }}
    >
      {/* Quick Actions */}
      {renderQuickActions()}
      
      {/* Separator */}
      <Separator orientation="vertical" className="h-6" />
      
      {/* Common Actions */}
      <div className="flex items-center">
        {COMMON_ACTIONS.map((action, index) => (
          <Popover 
            key={index}
            open={activePopover === action.action}
            onOpenChange={(open) => setActivePopover(open ? action.action : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={action.tooltip}
                onClick={() => handleCommonAction(action.action)}
              >
                <action.icon size={14} />
              </Button>
            </PopoverTrigger>
            {action.action === 'color-picker' && (
              <PopoverContent className="w-64" align="center">
                {renderColorPicker()}
              </PopoverContent>
            )}
          </Popover>
        ))}
      </div>
      
      {/* Close Button */}
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => useEditorStore.getState().selectNode(null)}
        title="Close toolbar"
      >
        <X size={14} />
      </Button>
    </div>
  );

  // Render as portal to ensure proper z-index layering
  return createPortal(toolbar, document.body);
}