// ABOUTME: Context-aware inspector factory that dynamically generates inspector sections based on block type and context

import React, { useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { NodeObject } from '@/types/editor';
import { InspectorSection } from './InspectorSection';
import { ColorControl } from './ColorControl';
import { SpacingControls } from './SpacingControls';
// Typography controls now handled by UnifiedToolbar - removed TypographyControls import
import {
  Palette,
  Move,
  Type,
  Settings,
  Eye,
  Lightbulb,
  Hash,
  Image,
  BarChart3,
  Quote,
  FileText,
  Minus,
} from 'lucide-react';

interface InspectorContext {
  blockType: string;
  blockData: any;
  selectedState: 'single' | 'multiple' | 'none';
  viewport: 'desktop' | 'mobile';
  neighborBlocks?: string[];
  contentAnalysis?: {
    hasText: boolean;
    hasMedia: boolean;
    complexity: 'simple' | 'medium' | 'complex';
  };
}

interface ContextAwareInspectorProps {
  nodeId: string;
  compact?: boolean;
}

// Block type configurations
const BLOCK_CONFIGS = {
  textBlock: {
    icon: Type,
    name: 'Text Block',
    sections: ['typography', 'colors', 'spacing'],
    typographyType: 'text' as const,
  },
  headingBlock: {
    icon: Hash,
    name: 'Heading Block',
    sections: ['typography', 'colors', 'spacing'],
    typographyType: 'heading' as const,
  },
  imageBlock: {
    icon: Image,
    name: 'Image Block',
    sections: ['media', 'spacing', 'accessibility'],
    typographyType: null,
  },
  pollBlock: {
    icon: BarChart3,
    name: 'Poll Block',
    sections: ['colors', 'spacing', 'behavior'],
    typographyType: null,
  },
  referenceBlock: {
    icon: FileText,
    name: 'Reference Block',
    sections: ['typography', 'colors', 'spacing', 'citation'],
    typographyType: 'reference' as const,
  },
  keyTakeawayBlock: {
    icon: Lightbulb,
    name: 'Key Takeaway',
    sections: ['theme', 'colors', 'spacing'],
    typographyType: null,
  },
  separatorBlock: {
    icon: Minus,
    name: 'Separator',
    sections: ['style', 'colors'],
    typographyType: null,
  },
  quoteBlock: {
    icon: Quote,
    name: 'Quote Block',
    sections: ['typography', 'colors', 'spacing'],
    typographyType: 'quote' as const,
  },
  tableBlock: {
    icon: BarChart3,
    name: 'Table Block',
    sections: ['colors', 'spacing'],
    typographyType: null,
  },
  videoEmbedBlock: {
    icon: Image,
    name: 'Video Embed',
    sections: ['spacing'],
    typographyType: null,
  },
};

export const ContextAwareInspector = React.memo(function ContextAwareInspector({
  nodeId,
  compact = false,
}: ContextAwareInspectorProps) {
  const { nodes, updateNode, currentViewport } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  const blockConfig = node ? BLOCK_CONFIGS[node.type as keyof typeof BLOCK_CONFIGS] : null;

  // Generate inspector context
  const context: InspectorContext = useMemo(() => {
    if (!node) return null;

    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    const neighborBlocks = [nodes[nodeIndex - 1]?.type, nodes[nodeIndex + 1]?.type].filter(Boolean);

    return {
      blockType: node.type,
      blockData: node.data,
      selectedState: 'single', // Could be enhanced for multi-selection
      viewport: currentViewport,
      neighborBlocks,
      contentAnalysis: {
        hasText: ['textBlock', 'headingBlock', 'quoteBlock'].includes(node.type),
        hasMedia: ['imageBlock', 'videoEmbedBlock'].includes(node.type),
        complexity: node.type === 'tableBlock' || node.type === 'pollBlock' ? 'complex' : 'simple',
      },
    };
  }, [node, nodes, nodeId, currentViewport]);

  if (!node || !blockConfig || !context) return null;

  const handleDataUpdate = (updates: Record<string, any>) => {
    updateNode(nodeId, { data: { ...node.data, ...updates } });
  };

  // Section renderers
  const renderTypographySection = () => {
    if (!blockConfig.sections.includes('typography') || !blockConfig.typographyType) return null;

    return (
      <InspectorSection title="Typography" icon={Type} compact={compact}>
        <div className="text-sm text-muted-foreground p-3 text-center">
          Typography controls are now available in the toolbar
        </div>
      </InspectorSection>
    );
  };

  const renderColorsSection = () => {
    if (!blockConfig.sections.includes('colors')) return null;

    return (
      <InspectorSection title="Colors" icon={Palette} compact={compact}>
        <div className="space-y-3">
          {/* Text color for text-based blocks */}
          {context.contentAnalysis?.hasText && (
            <ColorControl
              label="Text Color"
              value={node.data.color}
              onChange={color => handleDataUpdate({ color })}
              compact={compact}
            />
          )}

          {/* Background color for all blocks */}
          <ColorControl
            label="Background Color"
            value={node.data.backgroundColor}
            onChange={backgroundColor => handleDataUpdate({ backgroundColor })}
            allowTransparent
            compact={compact}
          />

          {/* Border color if block supports borders */}
          {Object.prototype.hasOwnProperty.call(node.data, 'borderColor') && (
            <ColorControl
              label="Border Color"
              value={node.data.borderColor}
              onChange={borderColor => handleDataUpdate({ borderColor })}
              compact={compact}
            />
          )}
        </div>
      </InspectorSection>
    );
  };

  const renderSpacingSection = () => {
    if (!blockConfig.sections.includes('spacing')) return null;

    // Define spacing fields based on block type
    const spacingFields = [
      { key: 'paddingX', label: 'Horizontal Padding', min: 0, max: 64, step: 2, unit: 'px' },
      { key: 'paddingY', label: 'Vertical Padding', min: 0, max: 64, step: 2, unit: 'px' },
    ];

    // Add border radius for blocks that support it
    if (Object.prototype.hasOwnProperty.call(node.data, 'borderRadius')) {
      spacingFields.push({
        key: 'borderRadius',
        label: 'Border Radius',
        min: 0,
        max: 32,
        step: 1,
        unit: 'px',
      });
    }

    return (
      <InspectorSection title="Spacing & Layout" icon={Move} compact={compact}>
        <SpacingControls
          data={node.data}
          onChange={handleDataUpdate}
          fields={spacingFields}
          compact={compact}
        />
      </InspectorSection>
    );
  };

  const renderContextualSections = () => {
    const sections = [];

    // Add viewport-specific sections
    if (context.viewport === 'mobile') {
      sections.push(
        <InspectorSection key="mobile" title="Mobile Optimization" icon={Eye} compact={compact}>
          <div className="text-sm text-muted-foreground">
            Mobile-specific controls will be available here.
          </div>
        </InspectorSection>
      );
    }

    // Add complexity-based sections
    if (context.contentAnalysis?.complexity === 'complex') {
      sections.push(
        <InspectorSection
          key="detailed-settings"
          title="Detailed Block Settings"
          icon={Settings}
          compact={compact}
          collapsible
          defaultCollapsed
        >
          <div className="text-sm text-muted-foreground">
            Detailed block-specific settings will be available here.
          </div>
        </InspectorSection>
      );
    }

    return sections;
  };

  return (
    <div className="space-y-4">
      {/* Block Header */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <blockConfig.icon size={16} className="text-primary" />
        <h2 className="font-semibold text-sm">{blockConfig.name}</h2>
      </div>

      {/* Core Sections */}
      {renderTypographySection()}
      {renderColorsSection()}
      {renderSpacingSection()}

      {/* Contextual Sections */}
      {renderContextualSections()}
    </div>
  );
});
