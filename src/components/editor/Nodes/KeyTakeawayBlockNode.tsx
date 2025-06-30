// ABOUTME: EVIDENS specialized key takeaway block with customizable themes and icon support

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { KeyTakeawayBlockData } from '@/types/editor';
import { cn } from '@/lib/utils';
import { UnifiedNodeResizer } from '../components/UnifiedNodeResizer';
import { 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Star,
  Zap,
  Target
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
    gradient: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20'
  },
  success: {
    border: 'border-green-400',
    background: 'bg-green-50 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-400',
    text: 'text-green-900 dark:text-green-100',
    gradient: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20'
  },
  warning: {
    border: 'border-yellow-400',
    background: 'bg-yellow-50 dark:bg-yellow-950/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
    text: 'text-yellow-900 dark:text-yellow-100',
    gradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20'
  },
  error: {
    border: 'border-red-400',
    background: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-400',
    text: 'text-red-900 dark:text-red-100',
    gradient: 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20'
  },
} as const;

export function KeyTakeawayBlockNode({ id, data, selected }: KeyTakeawayBlockNodeProps) {
  const { updateNode, canvasTheme } = useEditorStore();
  
  const handleClick = () => {
    const editorStore = useEditorStore.getState();
    editorStore.selectNode(id);
  };
  
  // Get theme configuration (default to 'info' if undefined)
  const themeConfig = THEME_CONFIGS[data.theme || 'info'];
  
  // Get icon component
  const IconComponent = data.icon && TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS] 
    ? TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS] 
    : Lightbulb;
  
  // Custom background color override
  const customBackgroundStyle = data.backgroundColor ? {
    backgroundColor: data.backgroundColor,
    backgroundImage: 'none'
  } : {};
  
  return (
    <>
      <UnifiedNodeResizer
        isVisible={selected || false}
        nodeType="keyTakeawayBlock"
      />
      
      <div
        data-node-id={id}
        onClick={handleClick}
        className={cn(
          'relative cursor-pointer transition-all duration-200 p-4 rounded-lg border-l-4',
          'min-h-[80px]',
          // Base styling
          themeConfig.border,
          !data.backgroundColor && cn('bg-gradient-to-r', themeConfig.gradient),
          // Selection state
          selected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
          // Hover state
          'hover:shadow-md hover:scale-[1.01]'
        )}
        style={customBackgroundStyle}
      >
        {/* Header with Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            themeConfig.background
          )}>
            <IconComponent 
              size={18} 
              className={themeConfig.icon}
            />
          </div>
          
          <div className="flex-1">
            <h3 className={cn(
              'font-semibold text-sm uppercase tracking-wide',
              themeConfig.text
            )}>
              Key Takeaway
            </h3>
            <div className={cn(
              'text-xs opacity-70 mt-1',
              themeConfig.text
            )}>
              {(data.theme || 'info').charAt(0).toUpperCase() + (data.theme || 'info').slice(1)} Message
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className={cn(
          'text-sm leading-relaxed font-medium',
          themeConfig.text
        )}>
          {data.content || 'Enter your key takeaway message here...'}
        </div>
        
        {/* Selection Indicator */}
        {selected && (
          <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Key Takeaway Selected
          </div>
        )}
        
        {/* Theme Indicator Badge */}
        <div className={cn(
          'absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium',
          themeConfig.background,
          themeConfig.text
        )}>
          {data.theme || 'info'}
        </div>
      </div>
    </>
  );
}