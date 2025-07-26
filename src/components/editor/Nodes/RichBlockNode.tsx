// ABOUTME: Rich Block node component with unified TipTap editor for all content types

import React, { memo, useCallback, useMemo } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useRichTextEditor } from '@/hooks/useRichTextEditor';
import { UnifiedBlockWrapper } from '@/components/editor/shared/UnifiedBlockWrapper';
import { RichBlockData } from '@/types/editor';

interface RichBlockNodeProps {
  id: string;
  data: RichBlockData;
  selected: boolean;
  // Position props for unified wrapper
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  // Interaction callbacks
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
}

export const RichBlockNode = memo<RichBlockNodeProps>(
  ({ id, data, selected, width = 600, height = 200, x = 0, y = 0, onSelect, onMove }) => {
    const { updateNode } = useEditorStore();
    const { colors } = useEditorTheme();

    // Handle content updates from TipTap
    const handleContentUpdate = useCallback(
      (nodeId: string, htmlContent: string) => {
        updateNode(nodeId, {
          data: {
            ...data,
            content: {
              ...data.content,
              htmlContent,
              // Note: TipTap JSON will be updated separately when editor changes
            },
          },
        });
      },
      [updateNode, data]
    );

    // Unified placeholder for simplified Rich Block
    const getPlaceholder = useMemo(() => {
      return 'Start typing... Use markdown shortcuts or drag & drop images and videos';
    }, []);

    // Get initial content for TipTap - prioritize tiptapJSON over htmlContent
    const getInitialContent = useMemo(() => {
      // Priority 1: Use tiptapJSON if available (for table/poll nodes)
      if (data.content.tiptapJSON) {
        return data.content.tiptapJSON;
      }

      // Priority 2: Fall back to htmlContent
      return data.content.htmlContent || '<p>Start typing...</p>';
    }, [data.content.tiptapJSON, data.content.htmlContent]);

    // Initialize enhanced rich text editor for Rich Block
    const editorInstance = useRichTextEditor({
      nodeId: id,
      initialContent: getInitialContent,
      placeholder: getPlaceholder,
      onUpdate: handleContentUpdate,
      editable: true,
      debounceMs: 1000,
    });

    // Calculate styling properties
    const paddingX = data.paddingX || 16;
    const paddingY = data.paddingY || 16;

    // Dynamic styles based on current mode and settings
    const dynamicStyles = useMemo(
      () =>
        ({
          fontSize: data.fontSize || '16px',
          textAlign: data.textAlign || 'left',
          color: data.color || colors.block.text,
          backgroundColor: data.backgroundColor || 'transparent',
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
          paddingTop: `${paddingY}px`,
          paddingBottom: `${paddingY}px`,
          borderRadius: data.borderRadius ? `${data.borderRadius}px` : '8px',
          borderWidth: data.borderWidth || 0,
          borderColor: data.borderColor || 'transparent',
          lineHeight: data.lineHeight || 1.6,
          fontFamily: data.fontFamily || 'inherit',
          fontWeight: data.fontWeight || 400,
          letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
          textTransform: data.textTransform || 'none',
          textDecoration: data.textDecoration || 'none',
          minWidth: '200px',
          minHeight: '120px',
        }) as React.CSSProperties,
      [
        data.fontSize,
        data.textAlign,
        data.color,
        colors.block.text,
        data.backgroundColor,
        paddingX,
        paddingY,
        data.borderRadius,
        data.borderWidth,
        data.borderColor,
        data.lineHeight,
        data.fontFamily,
        data.fontWeight,
        data.letterSpacing,
        data.textTransform,
        data.textDecoration,
      ]
    );

    // Content styles for UnifiedBlockWrapper
    const contentStyles = useMemo(
      () => ({
        backgroundColor: dynamicStyles.backgroundColor,
        borderRadius: dynamicStyles.borderRadius,
        borderWidth: `${dynamicStyles.borderWidth}px`,
        borderColor: dynamicStyles.borderColor,
        borderStyle: 'solid',
        padding: `${paddingY}px ${paddingX}px`,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        minHeight: '100%',
        cursor: 'text',
      }),
      [dynamicStyles, paddingX, paddingY]
    );

    // Handle block click to focus editor
    const handleBlockClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!editorInstance.editor) return;

        // Calculate if click is within content area (excluding padding)
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if click is within content area (excluding padding)
        const isWithinContentArea =
          clickX >= paddingX &&
          clickX <= rect.width - paddingX &&
          clickY >= paddingY &&
          clickY <= rect.height - paddingY;

        if (isWithinContentArea) {
          // Focus the editor
          editorInstance.editor.commands.focus();

          // If the editor is empty, position cursor at end
          if (editorInstance.editor.isEmpty) {
            editorInstance.editor.commands.focus('end');
          }
        }
      },
      [editorInstance.editor, paddingX, paddingY]
    );

    // Unified content rendering - always use TipTap editor
    const renderUnifiedContent = () => {
      return (
        <EditorContent
          editor={editorInstance.editor}
          className="rich-block-content"
          style={{
            fontSize: dynamicStyles.fontSize,
            textAlign: dynamicStyles.textAlign,
            color: dynamicStyles.color,
            lineHeight: dynamicStyles.lineHeight,
            fontFamily: dynamicStyles.fontFamily,
            fontWeight: dynamicStyles.fontWeight,
            letterSpacing: dynamicStyles.letterSpacing,
            textTransform: dynamicStyles.textTransform,
            textDecoration: dynamicStyles.textDecoration,
            minHeight: '60px',
            outline: 'none',
            border: 'none',
            width: '100%',
            flex: 1,
          }}
        />
      );
    };

    return (
      <>
        <UnifiedBlockWrapper
          id={id}
          width={width}
          height={height}
          x={x}
          y={y}
          selected={selected}
          blockType="richBlock"
          contentStyles={contentStyles}
          minDimensions={{ width: 200, height: 120 }}
          maxDimensions={{ width: 1200, height: 800 }}
          onSelect={onSelect}
          onMove={onMove}
        >
          <div
            data-node-id={id}
            data-block-id={id}
            className="w-full h-full"
            style={{
              position: 'relative',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={handleBlockClick}
          >
            {/* Main content area - unified rich text editor */}
            <div className="flex-1 w-full">{renderUnifiedContent()}</div>
          </div>
        </UnifiedBlockWrapper>
      </>
    );
  }
);

RichBlockNode.displayName = 'RichBlockNode';
