// ABOUTME: Quote block component for the Visual Composition Engine with citation support and visual styling options

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { QuoteBlockData } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { Quote, User } from 'lucide-react';
import { UnifiedNodeResizer } from '../components/UnifiedNodeResizer';
import {
  useUnifiedBlockStyling,
  getSelectionIndicatorProps,
  getThemeAwarePlaceholderClasses,
} from '../utils/blockStyling';
import {
  ThemedBlockWrapper,
  useThemedStyles,
  useThemedColors,
} from '@/components/editor/theme/ThemeIntegration';

interface QuoteBlockNodeProps {
  id: string;
  data: QuoteBlockData;
  selected?: boolean;
}

export const QuoteBlockNode = React.memo(function QuoteBlockNode({
  id,
  data,
  selected,
}: QuoteBlockNodeProps) {
  const { updateNode, canvasTheme } = useEditorStore();

  // Get theme-aware styles and colors
  const themedStyles = useThemedStyles('quoteBlock');
  const themedColors = useThemedColors();

  // Get unified styling (with null safety)
  const { selectionClasses, borderStyles } = useUnifiedBlockStyling('quoteBlock', selected, {
    borderWidth: 0,
    borderColor: data?.borderColor || '#e5e7eb',
  });

  const isDarkMode = canvasTheme === 'dark';
  const quoteData = data || {};

  // Provide defaults for missing properties
  const safeContent = quoteData.content || 'Enter your quote here...';
  const safeCitation = quoteData.citation || '';
  const safeStyle = quoteData.style || 'default';
  const safeBorderColor = quoteData.borderColor || (isDarkMode ? '#374151' : '#e5e7eb');

  const handleClick = () => {
    // Focus the node when quote is clicked
    updateNode(id, {});
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow text selection within the quote
  };

  // Get theme-aware colors with fallbacks
  const getThemeColors = () => {
    if (!themedColors) {
      return {
        background: isDarkMode ? '#1f2937' : '#f9fafb',
        border: safeBorderColor,
        text: isDarkMode ? '#f3f4f6' : '#111827',
        citation: isDarkMode ? '#9ca3af' : '#6b7280',
        accent: isDarkMode ? '#3b82f6' : '#2563eb',
      };
    }

    return {
      background: themedStyles.backgroundColor || themedColors.neutral['50'],
      border: safeBorderColor,
      text: themedColors.neutral['900'],
      citation: themedColors.neutral['600'],
      accent: themedColors.primary['600'],
    };
  };

  const colors = getThemeColors();

  // Dynamic styles with unified border styling
  const dynamicStyles = {
    ...borderStyles,
    minWidth: '300px',
    maxWidth: '700px',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties;

  const selectionIndicatorProps = getSelectionIndicatorProps('quoteBlock');

  // Style configurations for different quote styles
  const getQuoteStyles = () => {
    const baseStyles = {
      backgroundColor: colors.background,
      color: colors.text,
      borderLeftColor: colors.accent,
    };

    if (safeStyle === 'large-quote') {
      return {
        ...baseStyles,
        fontSize: '1.25rem',
        lineHeight: '1.75rem',
        fontStyle: 'italic',
        borderLeftWidth: '6px',
        padding: '2rem',
      };
    }

    return {
      ...baseStyles,
      fontSize: '1rem',
      lineHeight: '1.5rem',
      borderLeftWidth: '4px',
      padding: '1.5rem',
    };
  };

  const quoteStyles = getQuoteStyles();

  return (
    <>
      <UnifiedNodeResizer
        isVisible={selected}
        nodeType="quoteBlock"
        customConstraints={{
          minWidth: 300,
          minHeight: 120,
          maxWidth: 700,
          maxHeight: 400,
        }}
      />

      <ThemedBlockWrapper
        blockType="quoteBlock"
        className={`relative cursor-pointer ${selectionClasses}`}
        style={{
          ...dynamicStyles,
          borderRadius: themedStyles.borderRadius || '8px',
          backgroundColor: themedStyles.backgroundColor || 'transparent',
        }}
        onClick={handleClick}
      >
        <div data-node-id={id} className="w-full h-full">
          {/* Unified Selection indicator */}
          {selected && <div {...selectionIndicatorProps} />}

          {/* Connection handles */}
          <Handle
            type="target"
            position={Position.Top}
            className="!bg-blue-500 !border-blue-600 !w-3 !h-3"
          />

          {/* Quote Content */}
          <div
            className="relative border-l-4 pl-6 pr-4 py-4 rounded-r-lg"
            style={quoteStyles}
            onClick={handleContentClick}
          >
            {/* Quote Icon */}
            <div className="absolute -left-2 top-4">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Quote className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Quote Text */}
            <div className="space-y-3">
              <blockquote className="relative">
                {safeStyle === 'large-quote' && (
                  <Quote
                    className="absolute -top-2 -left-4 w-8 h-8 opacity-20"
                    style={{ color: colors.accent }}
                  />
                )}
                <p
                  className={`leading-relaxed ${safeStyle === 'large-quote' ? 'text-xl font-medium' : 'text-base'}`}
                  style={{
                    color: colors.text,
                    fontStyle: safeStyle === 'large-quote' ? 'italic' : 'normal',
                  }}
                >
                  {safeContent}
                </p>
              </blockquote>

              {/* Citation */}
              {safeCitation && (
                <footer
                  className="flex items-center gap-2 pt-2 border-t border-opacity-20"
                  style={{ borderColor: colors.border }}
                >
                  <User className="w-4 h-4" style={{ color: colors.citation }} />
                  <cite
                    className="text-sm not-italic font-medium"
                    style={{ color: colors.citation }}
                  >
                    {safeCitation}
                  </cite>
                </footer>
              )}

              {/* Empty citation placeholder */}
              {!safeCitation && selected && (
                <footer
                  className="flex items-center gap-2 pt-2 border-t border-opacity-20"
                  style={{ borderColor: colors.border }}
                >
                  <User className="w-4 h-4" style={{ color: colors.citation }} />
                  <cite
                    className={`text-sm not-italic ${getThemeAwarePlaceholderClasses(canvasTheme)}`}
                  >
                    Add citation (optional)
                  </cite>
                </footer>
              )}
            </div>
          </div>

          <Handle
            type="source"
            position={Position.Bottom}
            className="!bg-blue-500 !border-blue-600 !w-3 !h-3"
          />
        </div>
      </ThemedBlockWrapper>
    </>
  );
});
