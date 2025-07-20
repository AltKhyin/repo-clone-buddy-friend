// ABOUTME: WYSIWYG node component

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { ReferenceBlockData } from '@/types/editor';
import { cn } from '@/lib/utils';

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

  // Generate APA formatted citation
  const formattedCitation = React.useMemo(() => {
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
          <p className="text-sm leading-relaxed font-serif" style={{ color: colors.block.text }}>
            {formattedCitation}
          </p>

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
