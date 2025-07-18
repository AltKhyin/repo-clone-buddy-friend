// ABOUTME: WYSIWYG node component

import React from 'react';
import { QuoteBlockData } from '@/types/editor';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { Quote, User } from 'lucide-react';

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
  const { updateNode } = useEditorStore();
  const { colors } = useEditorTheme();

  // Get unified styling (with null safety)
  const selectionClasses = selected ? 'ring-2 ring-blue-500' : '';
  const borderStyles = {
    borderWidth: 0,
    borderColor: data?.borderColor || colors.block.border,
  };

  const quoteData = data || {};

  // Provide defaults for missing properties
  const safeContent = quoteData.content || 'Enter your quote here...';
  const safeCitation = quoteData.citation || '';
  const safeStyle = quoteData.style || 'default';
  const safeBorderColor = quoteData.borderColor || colors.block.border;

  const handleClick = () => {
    // Focus the node when quote is clicked
    updateNode(id, {});
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow text selection within the quote
  };

  // Use theme colors from CSS custom properties
  const quoteColors = colors.semantic.quote;

  // Dynamic styles with unified border styling
  const dynamicStyles = {
    ...borderStyles,
    minWidth: '300px',
    maxWidth: '700px',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties;

  // Style configurations for different quote styles
  const getQuoteStyles = () => {
    const baseStyles = {
      backgroundColor: quoteColors.background,
      color: quoteColors.text,
      borderLeftColor: quoteColors.accent,
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
      <div
        data-block-type="quoteBlock"
        className={`relative cursor-pointer ${selectionClasses}`}
        style={{
          ...dynamicStyles,
          borderRadius: '8px',
          backgroundColor: 'transparent',
        }}
        onClick={handleClick}
      >
        <div data-node-id={id} className="w-full h-full">
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
                style={{ backgroundColor: quoteColors.accent }}
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
                    style={{ color: quoteColors.accent }}
                  />
                )}
                <p
                  className={`leading-relaxed ${safeStyle === 'large-quote' ? 'text-xl font-medium' : 'text-base'}`}
                  style={{
                    color: quoteColors.text,
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
                  style={{ borderColor: colors.block.border }}
                >
                  <User className="w-4 h-4" style={{ color: quoteColors.citation }} />
                  <cite
                    className="text-sm not-italic font-medium"
                    style={{ color: quoteColors.citation }}
                  >
                    {safeCitation}
                  </cite>
                </footer>
              )}

              {/* Empty citation placeholder */}
              {!safeCitation && selected && (
                <footer
                  className="flex items-center gap-2 pt-2 border-t border-opacity-20"
                  style={{ borderColor: colors.block.border }}
                >
                  <User className="w-4 h-4" style={{ color: quoteColors.citation }} />
                  <cite
                    className="text-sm not-italic"
                    style={{ color: colors.block.textSecondary }}
                  >
                    Add citation (optional)
                  </cite>
                </footer>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
