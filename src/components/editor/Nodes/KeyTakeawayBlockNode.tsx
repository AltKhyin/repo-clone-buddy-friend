// ABOUTME: WYSIWYG node component

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { KeyTakeawayBlockData } from '@/types/editor';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Star,
  Zap,
  Target,
} from 'lucide-react';

interface KeyTakeawayBlockNodeProps {
  id: string;
  data: KeyTakeawayBlockData;
  selected?: boolean;
}

// Icon mapping for different takeaway types
const TAKEAWAY_ICONS = {
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Star,
  Zap,
  Target,
  TrendingUp: Target, // fallback for TrendingUp
} as const;

// Enhanced theme configurations
const THEME_CONFIGS = {
  info: {
    border: 'border-blue-400',
    background: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-900 dark:text-blue-100',
    gradient: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20',
  },
  success: {
    border: 'border-green-400',
    background: 'bg-green-50 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-900 dark:text-green-100',
    gradient: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20',
  },
  warning: {
    border: 'border-yellow-400',
    background: 'bg-yellow-50 dark:bg-yellow-950/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-900 dark:text-yellow-100',
    gradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20',
  },
  error: {
    border: 'border-red-400',
    background: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-900 dark:text-red-100',
    gradient: 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20',
  },
} as const;

export function KeyTakeawayBlockNode({ id, data, selected }: KeyTakeawayBlockNodeProps) {
  const { updateNode } = useEditorStore();
  const { getTakeawayColors } = useEditorTheme();

  const handleClick = () => {
    const editorStore = useEditorStore.getState();
    editorStore.selectNode(id);
  };

  // Get theme colors using CSS custom properties
  const themeColors = getTakeawayColors(data.theme || 'info');
  const fallbackConfig = THEME_CONFIGS[data.theme || 'info'];

  // Get icon component
  const IconComponent =
    data.icon && TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS]
      ? TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS]
      : Lightbulb;

  // Custom background color override
  const customBackgroundStyle = data.backgroundColor
    ? {
        backgroundColor: data.backgroundColor,
        backgroundImage: 'none',
      }
    : {
        backgroundColor: themeColors.background,
        borderLeftColor: themeColors.border,
        backgroundImage: 'none',
      };

  return (
    <>
      <div
        data-block-type="keyTakeawayBlock"
        className={cn(
          'relative cursor-pointer transition-all duration-200 p-4 rounded-lg border-l-4',
          'min-h-[80px]',
          // Base styling - use fallback config if no theme colors
          // Selection state
          selected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
          // Hover state
          'hover:shadow-md hover:scale-[1.01]'
        )}
        style={customBackgroundStyle}
      >
        <div data-node-id={id} onClick={handleClick} className="w-full h-full">
          {/* Header with Icon and Title */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="flex-shrink-0 p-2 rounded-lg"
              style={{
                backgroundColor: themeColors.background,
                opacity: 0.8,
              }}
            >
              <IconComponent size={18} style={{ color: themeColors.text }} />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-sm uppercase tracking-wide">Key Takeaway</h3>
              <div className="text-xs opacity-70 mt-1">
                {(data.theme || 'info').charAt(0).toUpperCase() + (data.theme || 'info').slice(1)}{' '}
                Message
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-sm leading-relaxed font-medium" style={{ color: themeColors.text }}>
            {data.content || 'Enter your key takeaway message here...'}
          </div>

          {/* Selection Indicator */}
          {selected && (
            <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
              Key Takeaway Selected
            </div>
          )}

          {/* Theme Indicator Badge */}
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: themeColors.background,
              color: themeColors.text,
            }}
          >
            {data.theme || 'info'}
          </div>
        </div>
      </div>
    </>
  );
}
