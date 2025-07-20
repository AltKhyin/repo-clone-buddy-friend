// ABOUTME: WYSIWYG node component with unified content boundaries

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import { UnifiedBlockWrapper } from '@/components/editor/shared/UnifiedBlockWrapper';
import {
  transformContent,
  needsTransformation,
  validateContentStructure,
} from '@/utils/contentTransformers';

interface TextBlockNodeProps {
  id: string;
  data: {
    htmlContent: string;
    headingLevel?: 1 | 2 | 3 | 4 | null;
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
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration?: 'none' | 'underline' | 'line-through';
  };
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

export const TextBlockNode = memo<TextBlockNodeProps>(
  ({ id, data, selected, width = 400, height = 120, x = 0, y = 0, onSelect, onMove }) => {
    const { updateNode } = useEditorStore();
    const { colors, theme } = useEditorTheme();
    const previousHeadingLevel = useRef<number | null>(data.headingLevel);

    // Handle content updates from Tiptap with heading-aware validation
    const handleContentUpdate = useCallback(
      (nodeId: string, htmlContent: string) => {
        // Validate content structure matches expected heading level
        if (!validateContentStructure(htmlContent, data.headingLevel)) {
          // Transform content to match expected structure
          const transformedContent = transformContent(
            htmlContent,
            null, // We don't know the source level, let the transformer figure it out
            data.headingLevel
          );
          htmlContent = transformedContent;
        }

        updateNode(nodeId, {
          data: {
            ...data,
            htmlContent,
          },
        });
      },
      [updateNode, data]
    );

    // Get heading-specific font size
    const getHeadingFontSize = (level: number) => {
      const sizes = { 1: '2.25rem', 2: '1.875rem', 3: '1.5rem', 4: '1.25rem' };
      return sizes[level as keyof typeof sizes] || '1rem';
    };

    // Get heading-specific font weight
    const getHeadingFontWeight = (level: number) => {
      return level <= 2 ? 700 : 600;
    };

    // Get initial content based on mode
    const getInitialContent = () => {
      if (data.headingLevel) {
        return (
          data.htmlContent || `<h${data.headingLevel}>Your heading here</h${data.headingLevel}>`
        );
      }
      return data.htmlContent || '<p>Type something...</p>';
    };

    // Get placeholder based on mode
    const getPlaceholder = () => {
      if (data.headingLevel) {
        return `Type your H${data.headingLevel} heading...`;
      }
      return 'Start typing your text...';
    };

    // Initialize Tiptap editor for this specific node
    const editorInstance = useTiptapEditor({
      nodeId: id,
      initialContent: getInitialContent(),
      placeholder: getPlaceholder(),
      onUpdate: handleContentUpdate,
      editable: true,
    });

    // Synchronize editor content when heading level changes
    useEffect(() => {
      if (!editorInstance.editor) return;

      const currentLevel = data.headingLevel;
      const previousLevel = previousHeadingLevel.current;

      // Only synchronize if heading level actually changed
      if (currentLevel !== previousLevel) {
        const currentContent = editorInstance.editor.getHTML();

        // Check if content needs transformation
        if (needsTransformation(currentContent, currentLevel)) {
          const transformedContent = transformContent(currentContent, previousLevel, currentLevel);

          // Update editor content without triggering the onUpdate callback
          editorInstance.editor.commands.setContent(transformedContent, false);
        }

        // Update the ref to track the current level
        previousHeadingLevel.current = currentLevel;
      }
    }, [data.headingLevel, editorInstance.editor]);

    // Calculate dynamic styles based on customization data and theme
    const paddingX = data.paddingX ?? 0;
    const paddingY = data.paddingY ?? 0;

    // Determine if this is a heading or text block
    const isHeading = data.headingLevel && data.headingLevel >= 1 && data.headingLevel <= 4;

    const dynamicStyles = {
      fontSize: data.fontSize
        ? `${data.fontSize}px`
        : isHeading
          ? getHeadingFontSize(data.headingLevel!)
          : '16px',
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
      lineHeight: data.lineHeight || (isHeading ? 1.2 : 1.6),
      fontFamily: data.fontFamily || 'inherit',
      fontWeight: data.fontWeight || (isHeading ? getHeadingFontWeight(data.headingLevel!) : 400),
      letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
      textTransform: data.textTransform || 'none',
      textDecoration: data.textDecoration || 'none',
      ...(paddingY > 0 && { minHeight: '80px' }), // Only apply minHeight when there's padding
      minWidth: '200px',
    } as React.CSSProperties;

    // Content styles for UnifiedBlockWrapper
    const contentStyles = {
      backgroundColor: dynamicStyles.backgroundColor,
      borderRadius: dynamicStyles.borderRadius, // Already includes 'px'
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
    };

    // Handle full-area click to focus editor
    const handleBlockClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!editorInstance.editor) return;

      // Calculate if click is within content area (excluding padding)
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Get current padding values
      const currentPaddingX = paddingX || 0;
      const currentPaddingY = paddingY || 0;

      // Check if click is within content area (excluding padding)
      const isWithinContentArea =
        clickX >= currentPaddingX &&
        clickX <= rect.width - currentPaddingX &&
        clickY >= currentPaddingY &&
        clickY <= rect.height - currentPaddingY;

      if (isWithinContentArea) {
        // Focus the editor
        editorInstance.editor.commands.focus();

        // If the editor is empty or click is in empty area, position cursor at end
        const isEmpty = editorInstance.editor.isEmpty;
        if (isEmpty) {
          editorInstance.editor.commands.focus('end');
        }
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
        blockType="textBlock"
        contentStyles={contentStyles}
        minDimensions={{ width: 100, height: 40 }}
        maxDimensions={{ width: 1200, height: 600 }}
        onSelect={onSelect}
        onMove={onMove}
      >
        <div
          data-node-id={id}
          data-block-id={id}
          className="w-full h-full cursor-text"
          style={{
            position: 'relative',
            minHeight: '100%',
          }}
          onClick={handleBlockClick}
        >
          {/* Tiptap Editor Content */}
          <EditorContent
            editor={editorInstance.editor}
            className="max-w-none focus:outline-none [&>*]:my-0 [&_p]:my-0 [&_h1]:my-0 [&_h2]:my-0 [&_h3]:my-0 [&_h4]:my-0 [&_h5]:my-0 [&_h6]:my-0 [&>*]:leading-none [&_p]:leading-none [&_h1]:leading-none [&_h2]:leading-none [&_h3]:leading-none [&_h4]:leading-none [&_h5]:leading-none [&_h6]:leading-none"
            style={{
              fontFamily: dynamicStyles.fontFamily,
              fontSize: dynamicStyles.fontSize,
              color: dynamicStyles.color,
              lineHeight: dynamicStyles.lineHeight,
              fontWeight: dynamicStyles.fontWeight,
              letterSpacing: dynamicStyles.letterSpacing,
              textTransform: dynamicStyles.textTransform,
              textDecoration: dynamicStyles.textDecoration,
              width: '100%',
              height: '100%',
              minHeight: '100%',
              cursor: 'text',
              // Ensure ProseMirror editor fills the space and accepts clicks
              ['--tw-prose-body' as any]: 'transparent',
            }}
            onClick={e => {
              // Allow text content clicks to propagate for proper text selection
              e.stopPropagation();
            }}
          />

          {/* Focus indicator */}
          {editorInstance.isFocused && (
            <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-50 rounded-lg" />
          )}
        </div>
      </UnifiedBlockWrapper>
    );
  }
);

TextBlockNode.displayName = 'TextBlockNode';
