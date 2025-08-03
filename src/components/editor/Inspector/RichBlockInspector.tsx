// ABOUTME: Content-aware inspector panel for RichBlock with simple resize system integration

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  // Height adjustment state - MUST be before early return
  const [showHeightAdjustment, setShowHeightAdjustment] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Simple height adjustment - direct DOM measurement and update
  const handleAdjustHeight = useCallback(async () => {
    if (!node || !data) return;

    setIsAdjusting(true);

    try {
      // Robust DOM element query with validation
      const blockElement = document.querySelector(`[data-block-id="${CSS.escape(nodeId)}"]`) as HTMLElement;
      if (!blockElement || !document.contains(blockElement)) {
        throw new Error(`Block element not found or not attached to DOM: ${nodeId}`);
      }

      // Try multiple selector strategies for content wrapper
      let contentWrapper: HTMLElement | null = null;
      const selectors = ['.rich-block-content-wrapper', '.unified-content-area', '[data-content-boundary="true"]'];
      
      for (const selector of selectors) {
        contentWrapper = blockElement.querySelector(selector) as HTMLElement;
        if (contentWrapper && document.contains(contentWrapper)) break;
      }
      
      if (!contentWrapper) {
        throw new Error(`Content wrapper not found in block ${nodeId}. Tried selectors: ${selectors.join(', ')}`);
      }

      // Measure the actual content height with validation
      const contentRect = contentWrapper.getBoundingClientRect();
      const contentHeight = contentRect.height;
      
      if (contentHeight <= 0) {
        throw new Error(`Invalid content height: ${contentHeight}px. Element may be hidden or empty.`);
      }

      // Add padding and border spacing
      const paddingY = (data.paddingY || 16) * 2;
      const borderWidth = (data.borderWidth || 0) * 2;
      const additionalSpacing = paddingY + borderWidth + 8; // Small buffer

      // Calculate optimal height - no constraints, complete freedom
      const optimalHeight = Math.max(60, contentHeight + additionalSpacing);

      console.log('📏 Inspector: Adjusting height', {
        contentHeight,
        additionalSpacing,
        optimalHeight,
        currentHeight: node.height
      });

      // Update height directly - no constraint checking
      updateNode(nodeId, {
        height: optimalHeight,
      });

      // Brief delay to show feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error('❌ Inspector: Height adjustment failed', error);
    } finally {
      setIsAdjusting(false);
    }
  }, [nodeId, node, data, updateNode]);

  // Debounced logging to prevent spam
  const debouncedHeightLogRef = useRef<NodeJS.Timeout>();
  const debouncedHeightLog = useCallback((currentHeight: number, optimalHeight: number, difference: number) => {
    if (debouncedHeightLogRef.current) {
      clearTimeout(debouncedHeightLogRef.current);
    }
    debouncedHeightLogRef.current = setTimeout(() => {
      // Only log significant differences to reduce noise
      if (difference > 50) { // Increased threshold for logging
        console.log('📏 Inspector: Height adjustment available', {
          current: currentHeight,
          optimal: optimalHeight,
          difference
        });
      }
    }, 500); // 500ms debounce
  }, []);

  // Simple height adjustment detection - direct DOM measurement
  const shouldShowHeightAdjustment = useCallback(() => {
    if (!node || !data) return false;

    try {
      // Get current height from node
      const currentHeight = node.height || 200;
      
      // Check DOM for content measurement
      const blockElement = document.querySelector(`[data-block-id="${nodeId}"]`);
      if (!blockElement) return false;

      const contentWrapper = blockElement.querySelector('.rich-block-content-wrapper, .unified-content-area') as HTMLElement;
      if (!contentWrapper) return false;

      const contentRect = contentWrapper.getBoundingClientRect();
      const contentHeight = contentRect.height;
      const paddingY = (data.paddingY || 16) * 2;
      const borderWidth = (data.borderWidth || 0) * 2;
      const additionalSpacing = paddingY + borderWidth + 8;
      const optimalHeight = Math.max(60, contentHeight + additionalSpacing);

      // Show if there's significant height difference (>30px) - no complex constraints
      const heightDifference = Math.abs(currentHeight - optimalHeight);
      const shouldShow = heightDifference > 30;
      
      if (shouldShow) {
        debouncedHeightLog(currentHeight, optimalHeight, heightDifference);
      }
      
      return shouldShow;
    } catch (error) {
      console.warn('📏 Inspector: Height check failed', error);
      return false;
    }
  }, [node, data, nodeId, debouncedHeightLog]);

  // Check height adjustment - simple approach
  useEffect(() => {
    if (!node) return;
    
    const checkHeight = () => {
      const shouldShow = shouldShowHeightAdjustment();
      setShowHeightAdjustment(shouldShow);
    };
    
    checkHeight();

    // Recheck after DOM settles and when node data changes
    const timeout = setTimeout(checkHeight, 100);
    return () => clearTimeout(timeout);
  }, [shouldShowHeightAdjustment, node?.height, data?.paddingY, data?.borderWidth]);

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

        {/* Simple Height Adjustment Section - no constraints */}
        {showHeightAdjustment && (
          <InspectorSection title="Height Adjustment" icon={ChevronsUpDown} compact={false}>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Automatically adjust block height to fit content. Complete resize freedom.
              </div>
              
              {/* Simple debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <div>Current Height: {node?.height}px</div>
                  <div>Simple Resize: No constraints ✅</div>
                </div>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdjustHeight}
                disabled={isAdjusting}
                className="w-full justify-center"
              >
                <ChevronsUpDown 
                  size={16} 
                  className={`mr-2 ${isAdjusting ? 'animate-pulse' : ''}`} 
                />
                {isAdjusting 
                  ? 'Adjusting Height...' 
                  : 'Adjust Height to Content'
                }
              </Button>
              
              {isAdjusting && (
                <div className="text-xs text-center text-muted-foreground">
                  Measuring content and adjusting...
                </div>
              )}
            </div>
          </InspectorSection>
        )}

        {/* Simple debug info for height adjustment */}
        {process.env.NODE_ENV === 'development' && !showHeightAdjustment && (
          <InspectorSection title="Height Debug" icon={ChevronsUpDown} compact={true}>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Node: {node ? '✅' : '❌'}</div>
              <div>Data: {data ? '✅' : '❌'}</div>
              <div>Simple Resize: {resizeHandlers ? '✅' : '❌'}</div>
              {node && (
                <div>Current Size: {node.width}×{node.height}px</div>
              )}
              <div>Height adjustment hidden (difference &lt; 30px)</div>
            </div>
          </InspectorSection>
        )}
      </div>
    </div>
  );
};
