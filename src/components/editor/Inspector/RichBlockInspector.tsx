// ABOUTME: Content-aware inspector panel for RichBlock with dynamic controls based on TipTap selection

import React, { useState, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditorStore, useContentSelection } from '@/store/editorStore';
import { RichBlockData, ContentSelectionType } from '@/types/editor';
import { InspectorSection } from './shared/InspectorSection';
import { ColorControl } from './shared/ColorControl';
import { SpacingControls } from './shared/SpacingControls';
import { BorderControls } from './shared/BorderControls';
import { MediaTransformSection } from './sections/MediaTransformSection';
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
  ChevronsUpDown,
} from 'lucide-react';

interface RichBlockInspectorProps {
  nodeId: string;
}

export const RichBlockInspector: React.FC<RichBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore();
  const contentSelection = useContentSelection();

  const node = nodes.find(n => n.id === nodeId);
  const data = node?.type === 'richBlock' ? (node.data as RichBlockData) : null;

  // CRITICAL FIX P3: Use unified selection system instead of separate TipTap editor
  const currentSelectionType =
    contentSelection?.blockId === nodeId ? contentSelection.type : 'none';

  // Height adjustment state - MUST be before early return
  const [showHeightAdjustment, setShowHeightAdjustment] = useState(false);

  // Height adjustment functionality - MUST be before early return
  const handleAdjustHeight = useCallback(() => {
    if (!node || !data) return;

    // Find the block element in the DOM
    const blockElement = document.querySelector(`[data-block-id="${nodeId}"]`);
    if (!blockElement) return;

    // Find the content wrapper with the measurement ref
    const contentWrapper = blockElement.querySelector('.rich-block-content-wrapper') as HTMLElement;
    if (!contentWrapper) return;

    // Calculate optimal height based on content
    const paddingY = data.paddingY || 16;
    const borderWidth = data.borderWidth || 0;
    const minHeight = 120;
    const maxHeight = 800;

    // Measure actual content height
    const contentRect = contentWrapper.getBoundingClientRect();
    const contentHeight = contentRect.height;

    // Calculate additional spacing
    const additionalSpacing = paddingY * 2 + borderWidth * 2;

    // Calculate optimal height with constraints
    const optimalHeight = Math.max(
      minHeight,
      Math.min(maxHeight, contentHeight + additionalSpacing)
    );

    // Update the node height
    updateNode(nodeId, {
      height: optimalHeight,
    });
  }, [nodeId, node, data, updateNode]);

  // Check if height adjustment is beneficial - MUST be before early return
  const shouldShowHeightAdjustment = useCallback(() => {
    if (!node || !data) return false;

    const blockElement = document.querySelector(`[data-block-id="${nodeId}"]`);
    if (!blockElement) return false;

    const contentWrapper = blockElement.querySelector('.rich-block-content-wrapper') as HTMLElement;
    if (!contentWrapper) return false;

    const currentHeight = node.height || 200;
    const contentRect = contentWrapper.getBoundingClientRect();
    const contentHeight = contentRect.height;
    const paddingY = data.paddingY || 16;
    const borderWidth = data.borderWidth || 0;
    const additionalSpacing = paddingY * 2 + borderWidth * 2;
    const optimalHeight = contentHeight + additionalSpacing;

    // Show if content is overflowing or if there's significant height waste (>50px)
    const heightDifference = Math.abs(currentHeight - optimalHeight);
    return heightDifference > 50;
  }, [node, data, nodeId]);

  // Check height adjustment on mount and when data changes - MUST be before early return
  useEffect(() => {
    const checkHeight = () => setShowHeightAdjustment(shouldShowHeightAdjustment());
    checkHeight();

    // Recheck after a brief delay to allow DOM to settle
    const timeout = setTimeout(checkHeight, 100);
    return () => clearTimeout(timeout);
  }, [shouldShowHeightAdjustment, data?.paddingY, data?.borderWidth]);

  // Early return after ALL hooks are called
  if (!node || node.type !== 'richBlock' || !data) return null;

  const updateNodeData = (updates: Partial<RichBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Render content-aware controls based on unified selection system
  const renderContentAwareControls = () => {
    switch (currentSelectionType) {
      case ContentSelectionType.TABLE_CELL:
        return (
          <InspectorSection title="Table Controls" icon={Table} compact={false}>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Table cell is selected. Use the table controls in the editor.
              </div>
            </div>
          </InspectorSection>
        );

      case 'poll_option':
      case 'poll_question':
        return (
          <InspectorSection title="Poll Controls" icon={BarChart3} compact={false}>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Poll {currentSelectionType === 'poll_question' ? 'question' : 'option'} is selected.
                Use the poll controls in the editor.
              </div>
            </div>
          </InspectorSection>
        );

      case ContentSelectionType.TEXT:
        return (
          <InspectorSection title="Text Selection" icon={Edit3} compact={false}>
            <div className="text-sm text-muted-foreground">
              Text formatting controls are available in the toolbar above.
            </div>
          </InspectorSection>
        );

      case ContentSelectionType.INLINE_IMAGE:
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
              // CRITICAL FIX: Defer all TipTap updates to prevent input focus loss
              // Use setTimeout to batch updates after current render cycle
              setTimeout(() => {
                if (config.file) {
                  // Handle file upload - convert to URL and update in single operation
                  contentSelection?.data?.mediaNode?.updateAttributes?.({
                    src: URL.createObjectURL(config.file),
                    alt: config.alt || config.file.name,
                    uploading: true,
                    placeholder: false,
                    error: null,
                  });

                  // Simulate upload completion after brief delay
                  setTimeout(() => {
                    contentSelection?.data?.mediaNode?.updateAttributes?.({
                      uploading: false,
                    });
                  }, 1500);
                } else if (config.src) {
                  // Handle URL input - validate and update in single operation
                  const imageUrlRegex = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                  if (imageUrlRegex.test(config.src)) {
                    contentSelection?.data?.mediaNode?.updateAttributes?.({
                      src: config.src,
                      alt: config.alt || 'Image',
                      placeholder: false,
                      error: null,
                    });
                  } else {
                    // Show error for non-image URLs
                    contentSelection?.data?.mediaNode?.updateAttributes?.({
                      error: 'Please enter a valid image URL',
                    });
                  }
                }
              }, 0); // Defer to next tick to preserve input focus
            }}
          />
        );

      case ContentSelectionType.VIDEO_EMBED:
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
              // CRITICAL FIX: Defer all TipTap updates to prevent input focus loss
              // Use setTimeout to batch updates after current render cycle
              setTimeout(() => {
                if (config.src) {
                  // Parse video URL using VideoUtils
                  const { VideoUtils } = require('@/components/editor/extensions/VideoEmbed');
                  const videoData = VideoUtils.parseVideoUrl(config.src);

                  if (videoData) {
                    contentSelection?.data?.mediaNode?.updateAttributes?.({
                      ...videoData,
                      placeholder: false,
                      error: null,
                    });
                  } else {
                    // Show error for invalid URL but keep as placeholder
                    contentSelection?.data?.mediaNode?.updateAttributes?.({
                      error: 'Invalid video URL format',
                    });
                  }
                }
              }, 0); // Defer to next tick to preserve input focus
            }}
          />
        );

      default:
        return (
          <div className="text-sm text-muted-foreground text-center py-4">
            Select content within the editor to see specific controls
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Edit3 size={16} className="text-primary" />
        <h3 className="font-medium">Rich Block</h3>
        {currentSelectionType !== 'none' && (
          <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
            {currentSelectionType.replace('_', ' ')} selected
          </span>
        )}
      </div>

      <Separator />

      {/* Content-Aware Controls */}
      <div className="space-y-4">
        {renderContentAwareControls()}

        <Separator />

        {/* Always-Available Block-Level Controls */}
        <InspectorSection title="Block Styling" icon={Palette} compact={false}>
          <div className="space-y-3">
            <ColorControl
              label="Background Color"
              value={data.backgroundColor}
              onChange={backgroundColor => updateNodeData({ backgroundColor })}
              allowTransparent
              compact={false}
            />

            <ColorControl
              label="Border Color"
              value={data.borderColor}
              onChange={borderColor => updateNodeData({ borderColor })}
              compact={false}
            />
          </div>
        </InspectorSection>

        {/* Spacing Section */}
        <InspectorSection title="Spacing & Layout" icon={Move} compact={false}>
          <SpacingControls
            data={data}
            onChange={updateNodeData}
            fields={[
              {
                key: 'paddingX',
                label: 'Horizontal Padding',
                min: 0,
                max: 80,
                step: 2,
                unit: 'px',
                category: 'padding',
              },
              {
                key: 'paddingY',
                label: 'Vertical Padding',
                min: 0,
                max: 80,
                step: 2,
                unit: 'px',
                category: 'padding',
              },
            ]}
            compact={false}
            enablePresets={true}
            enableBorders={false}
            showDetailedControls={false}
          />
        </InspectorSection>

        {/* Border Section */}
        <InspectorSection title="Border & Corners" icon={Square} compact={false}>
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
        </InspectorSection>

        {/* Height Adjustment Section - only show when beneficial */}
        {showHeightAdjustment && (
          <InspectorSection title="Height Adjustment" icon={ChevronsUpDown} compact={false}>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Automatically adjust block height to fit content without hiding text.
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdjustHeight}
                className="w-full justify-center"
              >
                <ChevronsUpDown size={16} className="mr-2" />
                Adjust Height to Content
              </Button>
            </div>
          </InspectorSection>
        )}
      </div>
    </div>
  );
};
