// ABOUTME: WYSIWYG node component with Tiptap integration and typography support like TextBlockNode

import React, { useCallback, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { QuoteBlockData } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import {
  UnifiedBlockWrapper,
  useSemanticBlockStyling,
  useStyledBlockDataUpdate,
  User,
  PLACEHOLDERS,
} from '@/components/editor/shared';

interface QuoteBlockNodeProps {
  id: string;
  data: QuoteBlockData;
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

export const QuoteBlockNode = React.memo(function QuoteBlockNode({
  id,
  data,
  selected,
  width = 400,
  height = 150,
  x = 0,
  y = 0,
  onSelect,
  onMove,
}: QuoteBlockNodeProps) {
  const { updateNode } = useEditorStore();
  const { colors, theme } = useEditorTheme();

  // Use unified data update hook
  const { updateField } = useStyledBlockDataUpdate(id, data);

  // Use semantic styling hook for quote-specific theming
  const { semanticStyles, contentStyles, semanticColors } = useSemanticBlockStyling(
    data,
    selected || false,
    'quote',
    {
      defaultPaddingX: 16,
      defaultPaddingY: 16,
      minDimensions: { width: 300, height: 100 },
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

  // Handle citation updates from Tiptap
  const handleCitationUpdate = useCallback(
    (nodeId: string, htmlCitation: string) => {
      updateNode(nodeId, {
        data: {
          ...data,
          htmlCitation,
        },
      });
    },
    [updateNode, data]
  );

  // Get initial content for content field
  const getInitialContent = () => {
    return data.htmlContent || '<p>Enter your quote...</p>';
  };

  // Get initial content for citation field
  const getInitialCitation = () => {
    return data.htmlCitation || '<p></p>';
  };

  // Initialize Tiptap editor for quote content
  const contentEditor = useTiptapEditor({
    nodeId: `${id}-content`,
    initialContent: getInitialContent(),
    placeholder: PLACEHOLDERS.QUOTE_TEXT,
    onUpdate: handleContentUpdate,
    editable: true,
    fieldConfig: { fieldType: 'multi-line' },
  });

  // Initialize Tiptap editor for citation 
  const citationEditor = useTiptapEditor({
    nodeId: `${id}-citation`,
    initialContent: getInitialCitation(),
    placeholder: PLACEHOLDERS.QUOTE_ATTRIBUTION,
    onUpdate: handleCitationUpdate,
    editable: true,
    fieldConfig: { fieldType: 'simple-text' },
  });

  // Calculate dynamic styles based on typography data (like TextBlockNode)
  const paddingX = data.paddingX ?? 16;
  const paddingY = data.paddingY ?? 16;

  // Typography styles for content field
  const contentDynamicStyles = {
    fontSize: data.fontSize ? `${data.fontSize}px` : '16px',
    textAlign: data.textAlign || 'left',
    color: data.color || semanticColors.text,
    lineHeight: data.lineHeight || 1.6,
    fontFamily: data.fontFamily || 'inherit',
    fontWeight: data.fontWeight || 400,
    letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
    textTransform: data.textTransform || 'none',
    textDecoration: data.textDecoration || 'none',
    fontStyle: data.fontStyle || 'normal',
    width: '100%',
    height: '100%',
    minHeight: '100%',
    cursor: 'text',
  } as React.CSSProperties;

  // Typography styles for citation field  
  const citationDynamicStyles = {
    fontSize: '14px', // Smaller for citation
    textAlign: 'left' as const,
    color: semanticColors.citation,
    lineHeight: 1.4,
    fontFamily: data.fontFamily || 'inherit',
    fontWeight: 400,
    letterSpacing: '0px',
    textTransform: 'none' as const,
    textDecoration: 'none' as const,
    fontStyle: 'normal' as const,
    width: '100%',
    cursor: 'text',
  } as React.CSSProperties;

  // Content styles for UnifiedBlockWrapper
  const wrapperContentStyles = {
    backgroundColor: data.backgroundColor || 'transparent',
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : '8px',
    borderWidth: `${data.borderWidth || 0}px`,
    borderColor: data.borderColor || semanticColors.border,
    borderStyle: 'solid',
    padding: `${paddingY}px ${paddingX}px`,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: '100%',
    cursor: 'text',
  };

  // Handle full-area click to focus content editor
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
      blockType="quoteBlock"
      contentStyles={wrapperContentStyles}
      minDimensions={{ width: 300, height: 100 }}
      maxDimensions={{ width: 700, height: 400 }}
      onSelect={onSelect}
      onMove={onMove}
    >
      <div
        data-node-id={id}
        data-block-id={id}
        data-block-type="quoteBlock"
        className="w-full h-full cursor-text"
        onClick={handleBlockClick}
      >
        {/* Main Quote Content */}
        <div className="flex gap-3">
          {/* Subtle Left Accent */}
          <div
            className="w-1 rounded-full flex-shrink-0 mt-1"
            style={{
              backgroundColor: data.borderColor || semanticColors.border,
              minHeight: '24px',
            }}
          />

          {/* Quote Text & Attribution */}
          <div className="flex-1 space-y-3">
            {/* Quote Content with Tiptap Integration */}
            <div className="relative">
              <EditorContent
                editor={contentEditor.editor}
                className="tiptap-quote-content max-w-none focus:outline-none [&>*]:my-0 [&_p]:my-0 [&>*]:leading-none [&_p]:leading-none"
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

            {/* Citation with Tiptap Integration */}
            <div className="flex items-center gap-2 mt-3">
              {data.authorImage ? (
                <img
                  src={data.authorImage}
                  alt="Author"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={e => {
                    // Fallback to User icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
                  }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${data.borderColor || semanticColors.border}20` }}
                >
                  <User
                    className="w-4 h-4"
                    style={{ color: data.borderColor || semanticColors.border }}
                  />
                </div>
              )}

              <div className="flex-1 relative">
                <EditorContent
                  editor={citationEditor.editor}
                  className="tiptap-quote-citation max-w-none focus:outline-none [&>*]:my-0 [&_p]:my-0 [&>*]:leading-none [&_p]:leading-none text-sm not-italic"
                  style={citationDynamicStyles}
                  onClick={e => {
                    // Allow text content clicks to propagate for proper text selection
                    e.stopPropagation();
                  }}
                />
                {/* Focus indicator */}
                {citationEditor.isFocused && (
                  <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-50 rounded-sm" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedBlockWrapper>
  );
});
