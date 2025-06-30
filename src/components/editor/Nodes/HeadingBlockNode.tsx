// ABOUTME: HeadingBlock component with Tiptap editing, heading level control, and deep customization

import React, { memo, useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import { TiptapBubbleMenu } from '@/components/editor/TiptapBubbleMenu';
import { UnifiedNodeResizer } from '../components/UnifiedNodeResizer';
import {
  useUnifiedBlockStyling,
  getSelectionIndicatorProps,
  getThemeAwareTextColor,
} from '../utils/blockStyling';
import { ThemedBlockWrapper, useThemedStyles } from '@/components/editor/theme/ThemeIntegration';

interface HeadingBlockNodeProps {
  id: string;
  data: {
    htmlContent: string;
    level: 1 | 2 | 3 | 4;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    fontFamily?: string;
    fontWeight?: number;
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration?: 'none' | 'underline' | 'line-through';
  };
  selected: boolean;
}

export const HeadingBlockNode = memo<HeadingBlockNodeProps>(({ id, data, selected }) => {
  const { updateNode, canvasTheme } = useEditorStore();

  // Handle content updates from Tiptap
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

  // Initialize Tiptap editor for this specific node
  const editorInstance = useTiptapEditor({
    nodeId: id,
    initialContent: data.htmlContent || `<h${data.level}>Your heading here</h${data.level}>`,
    placeholder: `Type your H${data.level} heading...`,
    onUpdate: handleContentUpdate,
    editable: true,
  });

  // Get theme-aware styles
  const themedStyles = useThemedStyles('headingBlock');

  // Get default font sizes based on heading level with theme integration
  const getThemeFontSize = (level: number) => {
    if (!themedStyles.fontSize) {
      switch (level) {
        case 1:
          return '2.25rem'; // text-4xl
        case 2:
          return '1.875rem'; // text-3xl
        case 3:
          return '1.5rem'; // text-2xl
        case 4:
          return '1.25rem'; // text-xl
        default:
          return '1.125rem'; // text-lg
      }
    }
    // Use theme typography scales if available
    return themedStyles.fontSize;
  };

  // Get unified styling
  const { selectionClasses, borderStyles } = useUnifiedBlockStyling('headingBlock', selected, {
    borderWidth: data.borderWidth,
    borderColor: data.borderColor,
  });

  // Calculate dynamic styles based on customization data and theme
  const paddingX = data.paddingX ?? 12;
  const paddingY = data.paddingY ?? 8;

  const dynamicStyles = {
    fontSize: getThemeFontSize(data.level),
    textAlign: data.textAlign || 'left',
    color: data.color || getThemeAwareTextColor(canvasTheme, data.color) || themedStyles.color,
    backgroundColor: data.backgroundColor || themedStyles.backgroundColor || 'transparent',
    paddingLeft: `${paddingX}px`,
    paddingRight: `${paddingX}px`,
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : themedStyles.borderRadius || '6px',
    fontFamily: data.fontFamily || themedStyles.fontFamily || 'inherit',
    fontWeight: data.fontWeight || themedStyles.fontWeight || (data.level <= 2 ? 700 : 600),
    letterSpacing: data.letterSpacing
      ? `${data.letterSpacing}px`
      : themedStyles.letterSpacing || '0px',
    textTransform: data.textTransform || 'none',
    textDecoration: data.textDecoration || 'none',
    minHeight: '50px',
    ...borderStyles,
    minWidth: '150px',
    transition: 'all 0.2s ease-in-out',
    lineHeight: themedStyles.lineHeight || 1.3,
  } as React.CSSProperties;

  // Get heading level constraints for resizing
  const getSizeConstraints = () => {
    switch (data.level) {
      case 1:
        return { minWidth: 200, minHeight: 60, maxWidth: 800, maxHeight: 120 };
      case 2:
        return { minWidth: 180, minHeight: 55, maxWidth: 700, maxHeight: 110 };
      case 3:
        return { minWidth: 160, minHeight: 50, maxWidth: 600, maxHeight: 100 };
      case 4:
      default:
        return { minWidth: 150, minHeight: 45, maxWidth: 500, maxHeight: 90 };
    }
  };

  const constraints = getSizeConstraints();
  const selectionIndicatorProps = getSelectionIndicatorProps('headingBlock');

  return (
    <>
      {/* Unified Node Resizer */}
      <UnifiedNodeResizer
        isVisible={selected}
        nodeType="headingBlock"
        customConstraints={constraints}
      />

      <ThemedBlockWrapper
        blockType="headingBlock"
        className={`relative cursor-text ${selectionClasses}`}
        style={dynamicStyles}
      >
        <div data-node-id={id} onClick={editorInstance.focusEditor} className="w-full h-full">
          {/* Unified Selection indicator */}
          {selected && <div {...selectionIndicatorProps}>Heading {data.level}</div>}

          {/* Tiptap Editor Content */}
          <EditorContent
            editor={editorInstance.editor}
            className="prose prose-heading max-w-none focus:outline-none"
            style={{
              fontFamily: dynamicStyles.fontFamily,
              fontSize: dynamicStyles.fontSize,
              color: dynamicStyles.color,
              fontWeight: dynamicStyles.fontWeight,
              letterSpacing: dynamicStyles.letterSpacing,
              textTransform: dynamicStyles.textTransform,
              textDecoration: dynamicStyles.textDecoration,
            }}
          />

          {/* Bubble Menu for Text Formatting */}
          <TiptapBubbleMenu
            editorInstance={editorInstance}
            showHeadingControls={true}
            theme={canvasTheme}
          />

          {/* Focus indicator */}
          {editorInstance.isFocused && (
            <div className="absolute inset-0 pointer-events-none ring-2 ring-indigo-400 ring-opacity-50 rounded-lg" />
          )}

          {/* Heading level indicator */}
          <div className="absolute -right-2 -top-2 w-6 h-6 bg-indigo-100 dark:bg-indigo-900 border border-indigo-300 dark:border-indigo-700 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
            H{data.level}
          </div>
        </div>
      </ThemedBlockWrapper>
    </>
  );
});

HeadingBlockNode.displayName = 'HeadingBlockNode';
