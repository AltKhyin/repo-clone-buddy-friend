// ABOUTME: WYSIWYG node component - STANDARDIZED with unified text editing framework

import React from 'react';
import { KeyTakeawayBlockData } from '@/types/editor';
import {
  UnifiedBlockWrapper,
  EditableField,
  useSemanticBlockStyling,
  useStyledBlockDataUpdate,
  useEditorStore,
  cn,
  PLACEHOLDERS,
} from '@/components/editor/shared';
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
  // Position props for unified wrapper
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  // Interaction callbacks
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
}

// Icon mapping for different takeaway types
const TAKEAWAY_ICONS = {
  lightbulb: Lightbulb,
  check: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  star: Star,
  zap: Zap,
  target: Target,
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

export function KeyTakeawayBlockNode({
  id,
  data,
  selected,
  width = 400,
  height = 150,
  x = 0,
  y = 0,
  onSelect,
  onMove,
}: KeyTakeawayBlockNodeProps) {
  const { updateNode } = useEditorStore();

  // Use unified data update hook
  const { updateField } = useStyledBlockDataUpdate(id, data);

  // Use semantic styling hook for key takeaway theming
  const { contentStyles, colors } = useSemanticBlockStyling(
    data,
    selected || false,
    'keytakeaway',
    {
      defaultPaddingX: 16,
      defaultPaddingY: 16,
      minDimensions: { width: 200, height: 80 },
    }
  );

  const handleClick = () => {
    const editorStore = useEditorStore.getState();
    editorStore.selectNode(id);
  };

  // Get theme colors using CSS custom properties (fallback to semanticColors)
  const themeColors = colors.semantic?.keytakeaway || colors.semantic?.quote || colors.block;
  const fallbackConfig = THEME_CONFIGS[data.theme || 'info'];

  // Get icon component
  const IconComponent =
    data.icon && TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS]
      ? TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS]
      : Lightbulb;

  // Get accent color (used for icon and border)
  const accentColor = data.borderColor || themeColors.border;

  // Custom styling with data properties (inner content level)
  const customStyles = {
    backgroundColor: data.backgroundColor || themeColors.background,
    borderRadius: `${data.borderRadius || 8}px`,
    padding: `${data.paddingY || 16}px ${data.paddingX || 16}px`,
    borderWidth: data.borderWidth ? `${data.borderWidth}px` : '0',
    borderColor: data.borderWidth ? data.borderColor || accentColor : 'transparent',
    borderStyle: 'solid',
    // Fix Issue #3: Add prominent left border accent strip
    borderLeft: `4px solid ${accentColor}`,
    position: 'relative' as const,
  } as React.CSSProperties;

  // Safely get title and subtitle with defaults
  const safeTitle = data.title || PLACEHOLDERS.KEY_TAKEAWAY_TITLE;
  const safeSubtitle = data.subtitle || '';
  const shouldShowMessage = safeTitle === PLACEHOLDERS.KEY_TAKEAWAY_TITLE && !safeSubtitle;

  // Override content styles with custom background handling
  const customContentStyles = {
    ...contentStyles,
    backgroundColor: 'transparent', // Fix Issue #2: Don't duplicate background color at wrapper level
    borderRadius: customStyles.borderRadius || '8px',
  };

  return (
    <UnifiedBlockWrapper
      id={id}
      width={width}
      height={height}
      x={x}
      y={y}
      selected={selected}
      blockType="keyTakeawayBlock"
      contentStyles={customContentStyles}
      minDimensions={{ width: 200, height: 80 }}
      maxDimensions={{ width: 800, height: 300 }}
      onSelect={onSelect}
      onMove={onMove}
    >
      <div
        data-node-id={id}
        data-block-type="keyTakeawayBlock"
        className={cn(
          'w-full h-full relative cursor-pointer transition-all duration-200',
          'min-h-[80px]',
          // Hover state
          'hover:shadow-md hover:scale-[1.01]'
        )}
        style={customStyles}
      >
        {/* Header with Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            <IconComponent size={20} style={{ color: accentColor }} />
          </div>

          <div className="flex-1">
            {/* STANDARDIZED: Editable Title using unified EditableField */}
            <EditableField
              value={data.title || ''}
              onUpdate={title => updateField('title', title)}
              placeholder={PLACEHOLDERS.KEY_TAKEAWAY_TITLE}
              emptyText={PLACEHOLDERS.KEY_TAKEAWAY_TITLE}
              blockId={id}
              blockSelected={selected}
              className="font-semibold text-sm uppercase tracking-wide"
              style={{ color: themeColors.text }}
            />

            {/* STANDARDIZED: Editable Subtitle using unified EditableField */}
            <EditableField
              value={data.subtitle || ''}
              onUpdate={subtitle => updateField('subtitle', subtitle)}
              placeholder={`${PLACEHOLDERS.KEY_TAKEAWAY_SUBTITLE} ${PLACEHOLDERS.OPTIONAL}`}
              emptyText={`${PLACEHOLDERS.CLICK_TO_ADD} subtitle`}
              blockId={id}
              blockSelected={selected}
              className="text-xs opacity-70 mt-1"
              style={{ color: themeColors.text }}
            />
          </div>
        </div>

        {/* STANDARDIZED: Content - Show only if title/subtitle are default */}
        {shouldShowMessage && (
          <div className="mt-2">
            <EditableField
              value={data.content || ''}
              onUpdate={content => updateField('content', content)}
              placeholder={PLACEHOLDERS.KEY_TAKEAWAY_CONTENT}
              type="textarea"
              rows={2}
              emptyText={PLACEHOLDERS.KEY_TAKEAWAY_CONTENT}
              blockId={id}
              blockSelected={selected}
              className="text-sm leading-relaxed font-medium"
              style={{ color: themeColors.text }}
            />
          </div>
        )}

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Key Takeaway Selected
          </div>
        )}
      </div>
    </UnifiedBlockWrapper>
  );
}
