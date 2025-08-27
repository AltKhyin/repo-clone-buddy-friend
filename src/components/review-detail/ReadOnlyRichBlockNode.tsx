// ABOUTME: Read-only Rich Block node with TipTap editor (editable=false) for perfect visual parity with editor - unified rendering architecture

import React, { memo, useMemo } from 'react';
import { EditorContent } from '@tiptap/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRichTextEditor } from '../../hooks/useRichTextEditor';
import { RichBlockData, getViewportPadding } from '@/types/editor';
import { UnifiedBlockWrapper } from '../editor/shared/UnifiedBlockWrapper';
import { extractTypographyMarks, extractTypographyMarksFromHTML, combineTypographyStyles } from '@/utils/tiptap-mark-extraction';

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
      // 🎯 MOBILE PADDING FIX: Enhanced fallback system for review pages
      // If mobile padding is missing but we have desktop/legacy padding, intelligently adapt
      const enhancedData = { ...data };
      
      // If we're on mobile and no mobilePadding exists, create it from available padding data
      if (isMobile && !data.mobilePadding) {
        // Priority 1: Use desktop padding if available (maintains visual consistency)
        if (data.desktopPadding) {
          enhancedData.mobilePadding = { ...data.desktopPadding };
        }
        // Priority 2: Use individual padding values if available
        else if (data.paddingTop !== undefined || data.paddingLeft !== undefined || 
                 data.paddingRight !== undefined || data.paddingBottom !== undefined) {
          enhancedData.mobilePadding = {
            top: data.paddingTop ?? 16,
            right: data.paddingRight ?? 16,
            bottom: data.paddingBottom ?? 16,
            left: data.paddingLeft ?? 16
          };
        }
        // Priority 3: Use symmetric padding if available
        else if (data.paddingX !== undefined || data.paddingY !== undefined) {
          enhancedData.mobilePadding = {
            top: data.paddingY ?? 16,
            right: data.paddingX ?? 16,
            bottom: data.paddingY ?? 16,
            left: data.paddingX ?? 16
          };
        }
      }
      
      const fallbackPadding = {
        top: data.paddingTop ?? data.paddingY ?? 16,
        right: data.paddingRight ?? data.paddingX ?? 16, 
        bottom: data.paddingBottom ?? data.paddingY ?? 16,
        left: data.paddingLeft ?? data.paddingX ?? 16
      };
      
      const viewportPadding = getViewportPadding(enhancedData, currentViewport, fallbackPadding);
      
      return viewportPadding;
    }, [isMobile, data.desktopPadding, data.mobilePadding, data.paddingTop, data.paddingRight, data.paddingBottom, data.paddingLeft, data.paddingX, data.paddingY, id, currentViewport]);
    
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

    // 🎯 TYPOGRAPHY MARK EXTRACTION: Extract inline marks for proper rendering
    const inlineMarks = useMemo(() => {

      // Priority 1: Extract from TipTap JSON content (most accurate)
      if (data.content.tiptapJSON) {
        const marks = extractTypographyMarks(data.content.tiptapJSON);
        // 🔍 LINE HEIGHT INVESTIGATION: Essential log for line height debugging
        if (marks.lineHeight) {
          console.log('[ReadOnlyRichBlockNode] 🎯 LINE HEIGHT EXTRACTED from TipTap:', {
            blockId: id,
            lineHeight: marks.lineHeight,
            allMarks: marks
          });
        }
        return marks;
      }
      
      // Priority 2: Extract from HTML content (fallback)
      if (data.content.htmlContent) {
        const marks = extractTypographyMarksFromHTML(data.content.htmlContent);
        // 🔍 LINE HEIGHT INVESTIGATION: Essential log for line height debugging
        if (marks.lineHeight) {
          console.log('[ReadOnlyRichBlockNode] 🎯 LINE HEIGHT EXTRACTED from HTML:', {
            blockId: id,
            lineHeight: marks.lineHeight,
            htmlSample: data.content.htmlContent.substring(0, 100)
          });
        }
        return marks;
      }
      
      return {};
    }, [data.content.tiptapJSON, data.content.htmlContent, id]);

    // Dynamic styles based on current mode and settings (identical to editor)
    const dynamicStyles = useMemo(
      () =>
        ({
          fontSize: data.fontSize || '16px',
          textAlign: data.textAlign || 'left',
          color: data.color || 'hsl(var(--foreground))',
          backgroundColor: data.backgroundColor || 'transparent',
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

    // 🎯 UNIFIED CONTENT STYLES: Matching UnifiedBlockWrapper pattern
    const contentStyles = useMemo(
      () => ({
        backgroundColor: dynamicStyles.backgroundColor,
        borderRadius: dynamicStyles.borderRadius,
        borderWidth: `${dynamicStyles.borderWidth}px`,
        borderColor: dynamicStyles.borderColor,
        borderStyle: 'solid',
        padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        minHeight: '100%',
        cursor: 'default', // Read-only cursor
      }),
      [dynamicStyles, paddingTop, paddingRight, paddingBottom, paddingLeft]
    );

    // 🎯 ENHANCED EDITOR CONTENT STYLES: Combine block and inline typography
    const enhancedEditorStyles = useMemo(() => {
      const baseStyles = {
        textAlign: dynamicStyles.textAlign,
        lineHeight: dynamicStyles.lineHeight,
        minHeight: '60px',
        outline: 'none',
        border: 'none',
        width: '100%',
        height: '100%',
        cursor: 'default', // Read-only cursor
        // 🚫 TEXT-LEVEL PROPERTIES REMOVED: Let TipTap handle text-level formatting
        // fontSize: dynamicStyles.fontSize,              // Let TipTap render font sizes
        // fontFamily: dynamicStyles.fontFamily,          // Let TipTap render font families
        // color: dynamicStyles.color,                    // Let TipTap render text colors
        // fontWeight: dynamicStyles.fontWeight,          // Let TipTap render bold/light
        // letterSpacing: dynamicStyles.letterSpacing,    // Let TipTap render kerning
        // textTransform: dynamicStyles.textTransform,    // Let TipTap render CAPS/lowercase
        // textDecoration: dynamicStyles.textDecoration,  // Let TipTap render underline/strikethrough
      };

      // Combine with extracted inline marks (inline marks take precedence)
      const combinedStyles = combineTypographyStyles(baseStyles, inlineMarks);
      
      // 🔍 LINE HEIGHT INVESTIGATION: Essential log for line height debugging
      if (combinedStyles.lineHeight !== baseStyles.lineHeight || inlineMarks.lineHeight) {
        console.log('[ReadOnlyRichBlockNode] 🎯 LINE HEIGHT COMBINATION:', {
          blockId: id,
          blockLineHeight: data.lineHeight,
          inlineLineHeight: inlineMarks.lineHeight,
          finalLineHeight: combinedStyles.lineHeight,
          changed: combinedStyles.lineHeight !== baseStyles.lineHeight
        });
      }

      return combinedStyles;
    }, [dynamicStyles, inlineMarks, id, data.lineHeight]);

    // Unified content rendering - always use TipTap editor with enhanced typography (identical to editor but read-only)
    const renderUnifiedContent = () => {
      return (
        <div
          className="rich-block-content-wrapper rich-block-content-container"
          style={{
            width: '100%',
            flex: 1,
            position: 'relative',
            // 🎯 MEDIA CONSTRAINT SYSTEM: Pass available content width to child media elements (matching editor)
            '--block-content-width': `${(width || 600) - paddingLeft - paddingRight}px`,
            '--block-max-width': `${(width || 600) - paddingLeft - paddingRight}px`,
            // CSS containment to prevent media overflow (matching editor)
            contain: 'layout style',
          } as React.CSSProperties}
        >
          <EditorContent
            editor={editorInstance.editor}
            className="rich-block-content readonly-rich-block-content"
            style={enhancedEditorStyles}
          />
        </div>
      );
    };

    return (
      <UnifiedBlockWrapper
        id={id}
        width={finalPosition.width}
        height={finalPosition.height}
        x={finalPosition.x}
        y={finalPosition.y}
        selected={false}
        blockType="richBlock"
        contentStyles={contentStyles}
        readOnly={true}
        showResizeHandles={false}
        showDragHandle={false}
      >
        <div
          data-node-id={id}
          data-block-id={id}
          data-block-type="richBlock"
          data-read-only="true"
          className="w-full h-full readonly-rich-block readonly-content"
          style={{
            position: 'relative',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Main content area - unified rich text editor with enhanced typography */}
          <div className="flex-1 w-full">{renderUnifiedContent()}</div>
        </div>
      </UnifiedBlockWrapper>
    );
  }
);

ReadOnlyRichBlockNode.displayName = 'ReadOnlyRichBlockNode';