// ABOUTME: Content-aware inspector panel for RichBlock with simple resize system integration

import React, { useCallback, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEditorStore, useContentSelection } from '@/store/editorStore';
import { RichBlockData, ContentSelectionType } from '@/types/editor';
import { InspectorSection } from './shared/InspectorSection';
import { ColorControl } from './shared/ColorControl';
import { VisualPaddingEditor } from './shared/VisualPaddingEditor';
import { BorderControls } from './shared/BorderControls';
import { MediaTransformSection } from './sections/MediaTransformSection';
import { SavePresetDialog } from '../SavePresetDialog';
import { useSimpleResize } from '@/components/editor/unified-resize';
import {
  Edit3,
  Palette,
  Move,
  Square,
  Table,
  BarChart3,
  Plus,
  Minus,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bookmark,
} from 'lucide-react';

interface RichBlockInspectorProps {
  nodeId: string;
}

export const RichBlockInspector: React.FC<RichBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore();
  const contentSelection = useContentSelection();
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);

  const node = nodes.find(n => n.id === nodeId);
  const data = node?.type === 'richBlock' ? (node.data as RichBlockData) : null;

  // Get current content selection type for context-aware controls
  const currentSelectionType =
    contentSelection?.blockId === nodeId ? contentSelection.type : 'none';

  // Simple resize system integration - no constraints
  const resizeHandlers = useSimpleResize({
    nodeId,
    onUpdate: useCallback((position) => {
      if (position.height !== undefined) {
        updateNode(nodeId, {
          height: position.height,
        });
        console.log('📏 Inspector: Height adjusted to', position.height, 'px');
      }
    }, [nodeId, updateNode]),
  });






  // Early return after ALL hooks are called
  if (!node || node.type !== 'richBlock' || !data) return null;

  const updateNodeData = (updates: Partial<RichBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Render media-specific controls when media is selected (streamlined)
  const renderMediaControls = () => {
    if (currentSelectionType === ContentSelectionType.INLINE_IMAGE) {
      const isImagePlaceholder = contentSelection?.data?.mediaNode?.attrs?.placeholder;
      return (
        <MediaTransformSection
          nodeType="inlineImage"
          currentFit={contentSelection?.data?.mediaNode?.attrs?.objectFit || 'contain'}
          currentSize={contentSelection?.data?.mediaNode?.attrs?.size || 'medium'}
          isPlaceholder={isImagePlaceholder}
          onFitChange={fit => {
            contentSelection?.data?.mediaNode?.updateAttributes?.({ objectFit: fit });
          }}
          onSizeChange={size => {
            contentSelection?.data?.mediaNode?.updateAttributes?.({ size });
          }}
          onConfigurePlaceholder={async config => {
            setTimeout(() => {
              if (config.file) {
                contentSelection?.data?.mediaNode?.updateAttributes?.({
                  src: URL.createObjectURL(config.file),
                  alt: config.alt || config.file.name,
                  uploading: true,
                  placeholder: false,
                  error: null,
                });
                setTimeout(() => {
                  contentSelection?.data?.mediaNode?.updateAttributes?.({
                    uploading: false,
                  });
                }, 1500);
              } else if (config.src) {
                const imageUrlRegex = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                if (imageUrlRegex.test(config.src)) {
                  contentSelection?.data?.mediaNode?.updateAttributes?.({
                    src: config.src,
                    alt: config.alt || 'Image',
                    placeholder: false,
                    error: null,
                  });
                } else {
                  contentSelection?.data?.mediaNode?.updateAttributes?.({
                    error: 'Please enter a valid image URL',
                  });
                }
              }
            }, 0);
          }}
        />
      );
    }

    if (currentSelectionType === ContentSelectionType.VIDEO_EMBED) {
      const isVideoPlaceholder = contentSelection?.data?.mediaNode?.attrs?.placeholder;
      return (
        <MediaTransformSection
          nodeType="videoEmbed"
          currentFit={contentSelection?.data?.mediaNode?.attrs?.objectFit || 'contain'}
          currentSize={contentSelection?.data?.mediaNode?.attrs?.size || 'medium'}
          isPlaceholder={isVideoPlaceholder}
          onFitChange={fit => {
            contentSelection?.data?.mediaNode?.updateAttributes?.({ objectFit: fit });
          }}
          onSizeChange={size => {
            contentSelection?.data?.mediaNode?.updateAttributes?.({ size });
          }}
          onConfigurePlaceholder={config => {
            setTimeout(() => {
              if (config.src) {
                const { VideoUtils } = require('@/components/editor/extensions/VideoEmbed');
                const videoData = VideoUtils.parseVideoUrl(config.src);
                if (videoData) {
                  contentSelection?.data?.mediaNode?.updateAttributes?.({
                    ...videoData,
                    placeholder: false,
                    error: null,
                  });
                } else {
                  contentSelection?.data?.mediaNode?.updateAttributes?.({
                    error: 'Invalid video URL format',
                  });
                }
              }
            }, 0);
          }}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Minimal header - only show selection status when relevant */}
      {currentSelectionType !== 'none' && (
        <div className="text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded">
          {currentSelectionType.replace('_', ' ')} selected
        </div>
      )}

      {/* Media controls when media is selected */}
      {renderMediaControls()}
      {renderMediaControls() && <Separator />}

      {/* Consolidated controls without titles - intuitive grouping */}
      <div className="space-y-4">
        {/* Background color control */}
        <ColorControl
          label="Background"
          value={data.backgroundColor}
          onChange={backgroundColor => updateNodeData({ backgroundColor })}
          allowTransparent
          compact={false}
        />

        {/* Visual Padding Editor - Smart 4-direction interface */}
        <VisualPaddingEditor
          data={data}
          onChange={updateNodeData}
        />

        {/* Consolidated border controls - all border properties together */}
        <div className="space-y-3">
          <ColorControl
            label="Border Color"
            value={data.borderColor}
            onChange={borderColor => updateNodeData({ borderColor })}
            compact={false}
          />
          
          <BorderControls
            data={data}
            onChange={updateNodeData}
            enableToggle={true}
            enableStyle={false}
            enableRadius={true}
            compact={false}
            widthKey="borderWidth"
            colorKey="borderColor"
            radiusKey="borderRadius"
            defaultWidth={1}
            defaultColor="#e5e7eb"
            defaultRadius={8}
            maxWidth={8}
            maxRadius={32}
          />
        </div>

        {/* Save Block Button */}
        <Separator />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSavePresetDialogOpen(true)}
          className="w-full justify-start"
        >
          <Bookmark size={16} className="mr-2" />
          Save Block
        </Button>

      </div>

      {/* Save Preset Dialog */}
      <SavePresetDialog
        open={savePresetDialogOpen}
        onOpenChange={setSavePresetDialogOpen}
        blockType={node?.type || 'richBlock'}
        blockData={data}
        onPresetSaved={() => {
          setSavePresetDialogOpen(false);
        }}
      />
    </div>
  );
};
