// ABOUTME: WYSIWYG node component

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
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
}

export const TextBlockNode = memo<TextBlockNodeProps>(({ id, data, selected }) => {
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
      return data.htmlContent || `<h${data.headingLevel}>Your heading here</h${data.headingLevel}>`;
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

  // Get unified styling
  const selectionClasses = selected ? 'ring-2 ring-blue-500' : '';
  const borderStyles = {
    borderWidth: data.borderWidth || 0,
    borderColor: data.borderColor || '#e5e7eb',
  };

  // Get theme-aware styles

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
    lineHeight: data.lineHeight || (isHeading ? 1.2 : 1.6),
    fontFamily: data.fontFamily || 'inherit',
    fontWeight: data.fontWeight || (isHeading ? getHeadingFontWeight(data.headingLevel!) : 400),
    letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
    textTransform: data.textTransform || 'none',
    textDecoration: data.textDecoration || 'none',
    ...(paddingY > 0 && { minHeight: '80px' }), // Only apply minHeight when there's padding
    minWidth: '200px',
    ...borderStyles,
  } as React.CSSProperties;

  const selectionIndicatorProps = {
    className:
      'absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10',
    children: isHeading ? 'Heading Block Selected' : 'Text Block Selected',
  };

  return (
    <>
      <div
        data-block-type="textBlock"
        className={`relative cursor-text ${selectionClasses}`}
        style={dynamicStyles}
      >
        <div data-node-id={id} onClick={editorInstance.focusEditor} className="w-full h-full">
          {/* Selection indicator */}
          {selected && <div {...selectionIndicatorProps} />}

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
            }}
          />

          {/* Focus indicator */}
          {editorInstance.isFocused && (
            <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-50 rounded-lg" />
          )}
        </div>
      </div>
    </>
  );
});

TextBlockNode.displayName = 'TextBlockNode';
