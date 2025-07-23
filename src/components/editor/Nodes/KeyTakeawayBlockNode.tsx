// ABOUTME: WYSIWYG node component with Tiptap integration and typography support like TextBlockNode

import React, { useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { KeyTakeawayBlockData } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import {
  UnifiedBlockWrapper,
  useSemanticBlockStyling,
  useStyledBlockDataUpdate,
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
  const { colors, theme } = useEditorTheme();

  // Use unified data update hook
  const { updateField } = useStyledBlockDataUpdate(id, data);

  // Use semantic styling hook for key takeaway theming
  const { contentStyles, colors: semanticColors } = useSemanticBlockStyling(
    data,
    selected || false,
    'keytakeaway',
    {
      defaultPaddingX: 16,
      defaultPaddingY: 16,
      minDimensions: { width: 200, height: 80 },
    }
  );

  // Handle content updates from Tiptap (like TextBlockNode)
  const handleContentUpdate = useCallback(
    (nodeId: string, htmlContent: string) => {
      updateNode(nodeId, {
        data: {
          ...data,
          htmlContent,
        },
      });
    },
    [updateNode, data]
  );

  // Get initial content
  const getInitialContent = () => {
    return data.htmlContent || '<p>Enter your key takeaway...</p>';
  };

  // Initialize Tiptap editor for content
  const contentEditor = useTiptapEditor({
    nodeId: `${id}-content`,
    initialContent: getInitialContent(),
    placeholder: PLACEHOLDERS.KEY_TAKEAWAY_CONTENT,
    onUpdate: handleContentUpdate,
    editable: true,
    fieldConfig: { fieldType: 'multi-line' },
  });

  // Get theme colors using CSS custom properties (fallback to semanticColors)
  const themeColors = semanticColors;
  const fallbackConfig = THEME_CONFIGS[data.theme || 'info'];

  // Get icon component
  const IconComponent =
    data.icon && TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS]
      ? TAKEAWAY_ICONS[data.icon as keyof typeof TAKEAWAY_ICONS]
      : Lightbulb;

  // Get accent color (used for icon and border)
  const accentColor = data.borderColor || themeColors.border;

  // Calculate dynamic styles based on typography data (like TextBlockNode)
  const paddingX = data.paddingX ?? 16;
  const paddingY = data.paddingY ?? 16;

  // Typography styles for content field
  const contentDynamicStyles = {
    fontSize: data.fontSize ? `${data.fontSize}px` : '16px',
    textAlign: data.textAlign || 'left',
    color: data.color || themeColors.text,
    lineHeight: data.lineHeight || 1.6,
    fontFamily: data.fontFamily || 'inherit',
    fontWeight: data.fontWeight || 500, // Medium weight for key takeaways
    letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
    textTransform: data.textTransform || 'none',
    textDecoration: data.textDecoration || 'none',
    fontStyle: data.fontStyle || 'normal',
    width: '100%',
    height: '100%',
    minHeight: '100%',
    cursor: 'text',
  } as React.CSSProperties;

  // Content styles for UnifiedBlockWrapper
  const wrapperContentStyles = {
    backgroundColor: data.backgroundColor || themeColors.background,
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : '8px',
    borderWidth: `${data.borderWidth || 0}px`,
    borderColor: data.borderWidth ? data.borderColor || accentColor : 'transparent',
    borderStyle: 'solid',
    // Add prominent left border accent strip
    borderLeft: `4px solid ${accentColor}`,
    padding: `${paddingY}px ${paddingX}px`,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: '100%',
    cursor: 'text',
    position: 'relative' as const,
  };

  // Handle full-area click to focus editor
  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contentEditor.editor) {
      contentEditor.focusEditor();
    }
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
      contentStyles={wrapperContentStyles}
      minDimensions={{ width: 200, height: 80 }}
      maxDimensions={{ width: 800, height: 300 }}
      onSelect={onSelect}
      onMove={onMove}
    >
      <div
        data-node-id={id}
        data-block-id={id}
        data-block-type="keyTakeawayBlock"
        className="w-full h-full cursor-text"
        onClick={handleBlockClick}
      >
        {/* Primary Content with Icon - Simplified Structure */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-1">
            <IconComponent size={24} style={{ color: accentColor }} />
          </div>

          <div className="flex-1 relative">
            {/* Content with Tiptap Integration */}
            <EditorContent
              editor={contentEditor.editor}
              className="tiptap-keytakeaway-content max-w-none focus:outline-none [&>*]:my-0 [&_p]:my-0 [&>*]:leading-none [&_p]:leading-none"
              style={contentDynamicStyles}
              onClick={e => {
                // Allow text content clicks to propagate for proper text selection
                e.stopPropagation();
              }}
            />
            {/* Focus indicator */}
            {contentEditor.isFocused && (
              <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-50 rounded-lg" />
            )}
          </div>
        </div>

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
