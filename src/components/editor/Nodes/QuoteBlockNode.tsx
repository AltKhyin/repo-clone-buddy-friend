// ABOUTME: WYSIWYG node component - STANDARDIZED with unified text editing framework

import React from 'react';
import { QuoteBlockData } from '@/types/editor';
import {
  UnifiedBlockWrapper,
  EditableField,
  useSemanticBlockStyling,
  useStyledBlockDataUpdate,
  useEditorStore,
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

  const handleClick = () => {
    // Focus the node when quote is clicked
    updateNode(id, {});
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
      contentStyles={contentStyles}
      minDimensions={{ width: 300, height: 100 }}
      maxDimensions={{ width: 700, height: 400 }}
      onSelect={onSelect}
      onMove={onMove}
    >
      <div
        data-node-id={id}
        data-block-id={id}
        data-block-type="quoteBlock"
        className="w-full h-full"
      >
        {/* Conversational Quote Content */}
        <div className="w-full h-full">
          {/* Main Quote Content */}
          <div className="flex gap-3 p-4">
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
              {/* STANDARDIZED: Editable Message Content using unified EditableField */}
              <div className="relative">
                <EditableField
                  value={data.content || ''}
                  onUpdate={content => updateField('content', content)}
                  placeholder={PLACEHOLDERS.QUOTE_TEXT}
                  type="textarea"
                  autoResize
                  emptyText={`${PLACEHOLDERS.CLICK_TO_ADD} quote content`}
                  blockId={id}
                  blockSelected={selected}
                  className="text-base leading-relaxed"
                  style={{
                    color: semanticColors.text,
                    fontWeight: 400, // Normal weight for conversational feel
                    fontStyle: 'normal', // Remove italic for better readability
                  }}
                />
              </div>

              {/* STANDARDIZED: Editable Author Attribution using unified EditableField */}
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

                <EditableField
                  value={data.citation || ''}
                  onUpdate={citation => updateField('citation', citation)}
                  placeholder={PLACEHOLDERS.QUOTE_ATTRIBUTION}
                  emptyText={`${PLACEHOLDERS.QUOTE_ATTRIBUTION} ${PLACEHOLDERS.OPTIONAL}`}
                  blockId={id}
                  blockSelected={selected}
                  className="text-sm not-italic flex-1"
                  style={{ color: semanticColors.citation }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedBlockWrapper>
  );
});
