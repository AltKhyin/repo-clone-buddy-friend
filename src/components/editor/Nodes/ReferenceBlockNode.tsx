// ABOUTME: EVIDENS specialized reference block with automatic APA formatting and citation management

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { ReferenceBlockData } from '@/types/editor';
import { cn } from '@/lib/utils';
import { UnifiedNodeResizer } from '../components/UnifiedNodeResizer';
import {
  ThemedBlockWrapper,
  useThemedStyles,
  useThemedColors,
} from '@/components/editor/theme/ThemeIntegration';

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
  const { updateNode, canvasTheme } = useEditorStore();

  // Get theme-aware styles and colors
  const themedStyles = useThemedStyles('referenceBlock');
  const themedColors = useThemedColors();

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
      <UnifiedNodeResizer isVisible={selected || false} nodeType="referenceBlock" />

      <ThemedBlockWrapper
        blockType="referenceBlock"
        data-node-id={id}
        onClick={handleClick}
        className={cn(
          'relative cursor-pointer transition-all duration-200 rounded-lg border-l-4',
          'min-h-[80px] bg-gradient-to-r',
          // Theme-based styling
          canvasTheme === 'dark'
            ? 'from-slate-800 to-slate-700 border-slate-400 text-slate-100'
            : 'from-slate-50 to-white border-slate-400 text-slate-900',
          // Selection state
          selected && 'ring-2 ring-primary ring-offset-2 shadow-lg',
          // Hover state
          'hover:shadow-md',
          // Completion state indicator
          !isComplete && 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
        )}
        style={{
          fontSize: themedStyles.fontSize || '14px',
          fontStyle: themedStyles.fontStyle || 'normal',
          backgroundColor: themedStyles.backgroundColor || undefined,
          padding: themedStyles.padding || '16px',
          borderLeft: themedStyles.borderLeft !== false ? undefined : 'none',
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
          <p
            className={cn(
              'text-sm leading-relaxed font-serif',
              canvasTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'
            )}
          >
            {formattedCitation}
          </p>

          {/* Metadata Display */}
          {isComplete && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
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
      </ThemedBlockWrapper>
    </>
  );
}
