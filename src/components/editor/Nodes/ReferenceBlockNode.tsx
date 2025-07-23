// ABOUTME: WYSIWYG node component

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import { ReferenceBlockData } from '@/types/editor';
import { cn } from '@/lib/utils';
import { EditorContent } from '@tiptap/react';

interface ReferenceBlockNodeProps {
  id: string;
  data: ReferenceBlockData;
  selected?: boolean;
}

// Utility function for automatic APA formatting
const formatAPA = (data: ReferenceBlockData): string => {
  const { authors, year, title, source, doi, url } = data;

  if (!authors || !year || !title || !source) {
    return 'Citation incomplete - please fill all required fields';
  }

  // Basic APA format: Author, A. A. (Year). Title. Source. DOI or URL
  let citation = `${authors} (${year}). ${title}. ${source}`;

  if (doi) {
    citation += `. https://doi.org/${doi}`;
  } else if (url) {
    citation += `. ${url}`;
  }

  return citation;
};

export function ReferenceBlockNode({ id, data, selected }: ReferenceBlockNodeProps) {
  const { updateNode } = useEditorStore();
  const { colors } = useEditorTheme();

  // Handle content updates from Tiptap editor
  const handleHtmlFormattedUpdate = React.useCallback(
    (nodeId: string, htmlFormatted: string) => {
      updateNode(nodeId, { 
        data: { ...data, htmlFormatted } 
      });
    },
    [updateNode, data]
  );

  // Initialize Tiptap editor for custom formatted field
  const formattedEditor = useTiptapEditor({
    nodeId: id,
    initialContent: data.htmlFormatted || '<p></p>',
    placeholder: 'Enter custom citation format...',
    onUpdate: handleHtmlFormattedUpdate,
    editable: selected, // Only editable when selected
    fieldConfig: { fieldType: 'multi-line' },
  });

  // Generate APA formatted citation (fallback to auto-format if no custom format)
  const formattedCitation = React.useMemo(() => {
    // If custom HTML formatting exists and has content, use it
    if (data.htmlFormatted && data.htmlFormatted !== '<p></p>' && data.htmlFormatted.trim() !== '<p></p>') {
      return data.htmlFormatted;
    }
    // Otherwise use legacy formatted field or auto-generate APA
    return data.formatted || formatAPA(data);
  }, [data]);

  const handleClick = () => {
    const editorStore = useEditorStore.getState();
    editorStore.selectNode(id);
  };

  // Check if citation has all required fields
  const isComplete = data.authors && data.year && data.title && data.source;

  return (
    <>
      <div
        data-block-type="referenceBlock"
        data-block-id={id}
        data-node-id={id}
        onClick={handleClick}
        className={cn(
          'relative cursor-pointer transition-all duration-200 rounded-lg border-l-4',
          'min-h-[80px]',
          // Selection state
          selected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
          // Hover state
          'hover:shadow-md',
          // Completion state indicator
          !isComplete && 'border-yellow-400'
        )}
        style={{
          fontSize: '14px',
          fontStyle: 'normal',
          backgroundColor: isComplete ? colors.block.background : colors.interactive.warning + '10',
          borderLeftColor: isComplete ? colors.block.border : colors.interactive.warning,
          color: colors.block.text,
          padding: '16px',
        }}
      >
        {/* Citation Type Indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className={cn('w-2 h-2 rounded-full', isComplete ? 'bg-green-500' : 'bg-yellow-500')}
          />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            APA Citation {!isComplete && '(Incomplete)'}
          </span>
        </div>

        {/* Formatted Citation Display */}
        <div className="space-y-2">
          {/* Show Tiptap editor when selected and using custom formatting */}
          {selected && data.htmlFormatted && data.htmlFormatted !== '<p></p>' ? (
            <div className="border border-blue-300 rounded-md p-2 bg-blue-50/50">
              <div className="text-xs text-blue-600 mb-1 font-medium">Custom Format (Editable)</div>
              <EditorContent
                editor={formattedEditor.editor}
                className="tiptap-reference-formatted prose prose-sm max-w-none focus:outline-none"
                style={{
                  fontSize: data.fontSize ? `${data.fontSize}px` : '14px',
                  fontFamily: data.fontFamily || 'serif',
                  fontWeight: data.fontWeight || 400,
                  lineHeight: data.lineHeight || 1.4,
                  color: data.color || colors.block.text,
                  textAlign: data.textAlign || 'left',
                  letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : undefined,
                  textTransform: data.textTransform || 'none',
                  textDecoration: data.textDecoration || 'none',
                  fontStyle: data.fontStyle || 'normal',
                }}
              />
            </div>
          ) : (
            /* Auto-formatted or legacy citation display */
            <div 
              className="text-sm leading-relaxed font-serif"
              style={{ 
                color: data.color || colors.block.text,
                fontSize: data.fontSize ? `${data.fontSize}px` : '14px',
                fontFamily: data.fontFamily || 'serif',
                fontWeight: data.fontWeight || 400,
                lineHeight: data.lineHeight || 1.4,
                textAlign: data.textAlign || 'left',
                letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : undefined,
                textTransform: data.textTransform || 'none',
                textDecoration: data.textDecoration || 'none',
                fontStyle: data.fontStyle || 'normal',
              }}
              dangerouslySetInnerHTML={{ 
                __html: typeof formattedCitation === 'string' 
                  ? formattedCitation 
                  : formatAPA(data)
              }}
            />
          )}

          {/* Metadata Display */}
          {isComplete && (
            <div className="pt-2 border-t" style={{ borderColor: colors.block.border }}>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Year:</span> {data.year}
                </div>
                {data.doi && (
                  <div>
                    <span className="font-medium">DOI:</span> {data.doi}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {selected && (
          <div className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded z-10">
            Reference Selected
          </div>
        )}
      </div>
    </>
  );
}
