// ABOUTME: TextBlock component with Tiptap rich text editing and deep customization options

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

interface TextBlockNodeProps {
  id: string;
  data: {
    htmlContent: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    backgroundColor?: string;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    lineHeight?: number;
    fontFamily?: string;
    fontWeight?: number;
  };
  selected: boolean;
}

export const TextBlockNode = memo<TextBlockNodeProps>(({ id, data, selected }) => {
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
    initialContent: data.htmlContent || '<p>Type something...</p>',
    placeholder: 'Start typing your text...',
    onUpdate: handleContentUpdate,
    editable: true,
  });

  // Get unified styling
  const { selectionClasses, borderStyles } = useUnifiedBlockStyling('textBlock', selected, {
    borderWidth: data.borderWidth,
    borderColor: data.borderColor,
  });

  // Get theme-aware styles
  const themedStyles = useThemedStyles('textBlock');

  // Calculate dynamic styles based on customization data and theme
  const paddingX = data.paddingX ?? 16;
  const paddingY = data.paddingY ?? 12;

  const dynamicStyles = {
    fontSize: data.fontSize ? `${data.fontSize}px` : themedStyles.fontSize || '16px',
    textAlign: data.textAlign || 'left',
    color: data.color || getThemeAwareTextColor(canvasTheme, data.color) || themedStyles.color,
    backgroundColor: data.backgroundColor || themedStyles.backgroundColor || 'transparent',
    paddingLeft: `${paddingX}px`,
    paddingRight: `${paddingX}px`,
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : themedStyles.borderRadius || '8px',
    lineHeight: data.lineHeight || themedStyles.lineHeight || 1.6,
    fontFamily: data.fontFamily || themedStyles.fontFamily || 'inherit',
    fontWeight: data.fontWeight || themedStyles.fontWeight || 400,
    minHeight: '80px',
    minWidth: '200px',
    ...borderStyles,
  } as React.CSSProperties;

  const selectionIndicatorProps = getSelectionIndicatorProps('textBlock');

  return (
    <>
      {/* Unified Node Resizer */}
      <UnifiedNodeResizer isVisible={selected} nodeType="textBlock" />

      <ThemedBlockWrapper
        blockType="textBlock"
        className={`relative cursor-text ${selectionClasses}`}
        style={dynamicStyles}
      >
        <div data-node-id={id} onClick={editorInstance.focusEditor} className="w-full h-full">
          {/* Unified Selection indicator */}
          {selected && <div {...selectionIndicatorProps} />}

          {/* Tiptap Editor Content */}
          <EditorContent
            editor={editorInstance.editor}
            className="prose prose-sm max-w-none focus:outline-none"
            style={{
              fontFamily: dynamicStyles.fontFamily,
              fontSize: dynamicStyles.fontSize,
              color: dynamicStyles.color,
              lineHeight: dynamicStyles.lineHeight,
              fontWeight: dynamicStyles.fontWeight,
            }}
          />

          {/* Bubble Menu for Text Formatting */}
          <TiptapBubbleMenu
            editorInstance={editorInstance}
            showHeadingControls={false}
            theme={canvasTheme}
          />

          {/* Focus indicator */}
          {editorInstance.isFocused && (
            <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-50 rounded-lg" />
          )}
        </div>
      </ThemedBlockWrapper>
    </>
  );
});

TextBlockNode.displayName = 'TextBlockNode';
