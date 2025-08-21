// ABOUTME: Read-only Rich Block node with TipTap editor (editable=false) for perfect visual parity with editor - unified rendering architecture

import React, { memo, useMemo } from 'react';
import { EditorContent } from '@tiptap/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRichTextEditor } from '../../hooks/useRichTextEditor';
import { RichBlockData, getViewportPadding } from '@/types/editor';

interface ReadOnlyRichBlockNodeProps {
  id: string;
  data: RichBlockData;
  // Position props for positioning
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  canvasWidth: number;
  mobileCanvasWidth?: number;
  isMobilePosition?: boolean;
  scaleFactor?: number; // Scale factor for mobile canvas width adjustment
}

export const ReadOnlyRichBlockNode = memo<ReadOnlyRichBlockNodeProps>(
  ({
    id,
    data,
    width = 600,
    height = 200,
    x = 0,
    y = 0,
    canvasWidth,
    mobileCanvasWidth = 375,
    isMobilePosition = false,
    scaleFactor: providedScaleFactor,
  }) => {
    const isMobile = useIsMobile();

    // Use provided scale factor (for canvas width adjustment) or calculate based on mobile positioning
    // This is identical to DraggableBlock/PositionedBlockRenderer logic
    const scaleFactor = providedScaleFactor || 
      ((isMobile && !isMobilePosition) ? mobileCanvasWidth / canvasWidth : 1);
    
    // Apply scaling to position and dimensions - identical to editor logic
    const finalPosition = {
      x: x * scaleFactor,
      y: y * scaleFactor,
      width: width * scaleFactor,
      height: height * scaleFactor,
    };

    // Get initial content for TipTap - prioritize tiptapJSON over htmlContent (identical to editor)
    const getInitialContent = useMemo(() => {
      // Priority 1: Use tiptapJSON if available (for table/poll nodes)
      if (data.content.tiptapJSON) {
        return data.content.tiptapJSON;
      }

      // Priority 2: Fall back to htmlContent
      return data.content.htmlContent || '<p>Start typing...</p>';
    }, [data.content.tiptapJSON, data.content.htmlContent]);

    // Viewport-aware padding system with real-time responsiveness (identical to editor)
    const currentViewport = isMobile ? 'mobile' : 'desktop';
    
    // Responsive padding state that updates with viewport changes
    const responsivePadding = useMemo(() => {
      const fallbackPadding = {
        top: data.paddingTop ?? data.paddingY ?? 16,
        right: data.paddingRight ?? data.paddingX ?? 16, 
        bottom: data.paddingBottom ?? data.paddingY ?? 16,
        left: data.paddingLeft ?? data.paddingX ?? 16
      };
      
      return getViewportPadding(data, currentViewport, fallbackPadding);
    }, [isMobile, data.desktopPadding, data.mobilePadding, data.paddingTop, data.paddingRight, data.paddingBottom, data.paddingLeft, data.paddingX, data.paddingY]);
    
    const paddingTop = responsivePadding.top ?? 16;
    const paddingRight = responsivePadding.right ?? 16;
    const paddingBottom = responsivePadding.bottom ?? 16;
    const paddingLeft = responsivePadding.left ?? 16;

    // Initialize read-only rich text editor with identical configuration but editable=false
    const editorInstance = useRichTextEditor({
      nodeId: id,
      initialContent: getInitialContent,
      placeholder: '', // No placeholder for read-only mode
      onUpdate: () => {}, // No-op for read-only mode
      editable: false, // KEY DIFFERENCE: Disable editing
      debounceMs: 0, // No debouncing needed for read-only
    });

    // Dynamic styles based on current mode and settings (identical to editor)
    const dynamicStyles = useMemo(
      () =>
        ({
          fontSize: data.fontSize || '16px',
          textAlign: data.textAlign || 'left',
          color: data.color || 'hsl(var(--foreground))',
          backgroundColor: data.backgroundColor || 'transparent',
          paddingLeft: `${paddingLeft}px`,
          paddingRight: `${paddingRight}px`,
          paddingTop: `${paddingTop}px`,
          paddingBottom: `${paddingBottom}px`,
          borderRadius: data.borderRadius ? `${data.borderRadius}px` : '8px',
          borderWidth: data.borderWidth || 0,
          borderColor: data.borderColor || 'transparent',
          lineHeight: data.lineHeight || 1.6,
          fontFamily: data.fontFamily || 'inherit',
          fontWeight: data.fontWeight || 400,
          letterSpacing: data.letterSpacing ? `${data.letterSpacing}px` : '0px',
          textTransform: data.textTransform || 'none',
          textDecoration: data.textDecoration || 'none',
          minWidth: '200px',
          minHeight: '120px',
        }) as React.CSSProperties,
      [
        data.fontSize,
        data.textAlign,
        data.color,
        data.backgroundColor,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        data.borderRadius,
        data.borderWidth,
        data.borderColor,
        data.lineHeight,
        data.fontFamily,
        data.fontWeight,
        data.letterSpacing,
        data.textTransform,
        data.textDecoration,
      ]
    );

    // Unified content rendering - always use TipTap editor (identical to editor but read-only)
    const renderContent = () => {
      return (
        <div
          className="readonly-rich-block-content-wrapper"
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <EditorContent
            editor={editorInstance.editor}
            className="readonly-rich-block-content"
            style={{
              fontSize: dynamicStyles.fontSize,
              textAlign: dynamicStyles.textAlign,
              color: dynamicStyles.color,
              lineHeight: dynamicStyles.lineHeight,
              fontFamily: dynamicStyles.fontFamily,
              fontWeight: dynamicStyles.fontWeight,
              letterSpacing: dynamicStyles.letterSpacing,
              textTransform: dynamicStyles.textTransform,
              textDecoration: dynamicStyles.textDecoration,
              minHeight: '60px',
              outline: 'none',
              border: 'none',
              width: '100%',
              height: '100%',
              cursor: 'default', // Read-only cursor
            }}
          />
        </div>
      );
    };

    return (
      <div
        data-node-id={id}
        data-block-id={id}
        data-block-type="richBlock"
        data-read-only="true"
        className="absolute readonly-rich-block readonly-content"
        style={{
          // CONTAINER LAYER: Positioning only (matching UnifiedBlockWrapper containerStyles)
          position: 'absolute',
          left: `${finalPosition.x}px`,
          top: `${finalPosition.y}px`,
          width: `${finalPosition.width}px`,
          height: `${finalPosition.height}px`,
          zIndex: 1,
          padding: 0,
          margin: 0,
          border: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* CONTENT AREA LAYER: Styling (matching UnifiedBlockWrapper unifiedContentStyles) */}
        <div 
          className="unified-content-area"
          style={{
            width: '100%',
            height: '100%',
            padding: 0,
            margin: 0,
            border: 'none',
            boxSizing: 'border-box',
            position: 'relative',
            // Apply content styles (matching UnifiedBlockWrapper contentStyles)
            backgroundColor: dynamicStyles.backgroundColor,
            borderRadius: dynamicStyles.borderRadius,
            borderWidth: `${dynamicStyles.borderWidth}px`,
            borderColor: dynamicStyles.borderColor,
            borderStyle: 'solid',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            minHeight: '100%',
            overflow: 'visible', // Allow dropdown menus for tables
          }}
        >
          {/* CONTENT WRAPPER: Padding and flex layout with media constraints */}
          <div 
            className="flex-1 w-full rich-block-content-container"
            style={{
              padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
              // 🎯 MEDIA CONSTRAINT SYSTEM: Pass available width to child media elements
              '--block-content-width': `${finalPosition.width - paddingLeft - paddingRight}px`,
              '--block-max-width': `${finalPosition.width - paddingLeft - paddingRight}px`,
              // 🎯 REMOVED: CSS containment was clipping video iframes
              // contain: 'layout style',
            } as React.CSSProperties}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }
);

ReadOnlyRichBlockNode.displayName = 'ReadOnlyRichBlockNode';