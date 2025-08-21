// ABOUTME: Rich Block node component with unified TipTap editor for all content types

import React, { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';
import { useEditorTheme } from '../../../hooks/useEditorTheme';
import { useRichTextEditor } from '../../../hooks/useRichTextEditor';
import { useSelectionCoordination } from '../../../hooks/useSelectionCoordination';
import { useSelectionStore } from '@/store/selectionStore';
import { UnifiedBlockWrapper } from '@/components/editor/shared/UnifiedBlockWrapper';
import { useIsMobile } from '@/hooks/use-mobile';
import { RichBlockData, ContentSelectionType, getViewportPadding } from '@/types/editor';

interface RichBlockNodeProps {
  id: string;
  data: RichBlockData;
  selected: boolean;
  // Position props for unified wrapper
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  // Interaction callbacks
  onSelect?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onResize?: (dimensions: { width: number; height: number }) => void;
  onHeightAdjust?: (newHeight: number) => void;
}

export const RichBlockNode = memo<RichBlockNodeProps>(
  ({
    id,
    data,
    selected,
    width = 600,
    height = 200,
    x = 0,
    y = 0,
    onSelect,
    onMove,
    onResize,
    onHeightAdjust,
  }) => {
    const { updateNode, registerEditor, unregisterEditor } = useEditorStore();
    const { colors } = useEditorTheme();

    // Selection coordination for text content
    const { isActive, handleContentSelection, handleBlockActivation } = useSelectionCoordination({
      blockId: id,
      componentType: 'text',
      enableContentSelection: true,
    });
    
    // UNIFIED SELECTION SYSTEM: Direct integration for text selections
    const { dispatch } = useSelectionStore();

    // Handle content updates from TipTap
    const handleContentUpdate = useCallback(
      (nodeId: string, htmlContent: string) => {
        updateNode(nodeId, {
          data: {
            ...data,
            content: {
              ...data.content,
              htmlContent,
              // Note: TipTap JSON will be updated separately when editor changes
            },
          },
        });
      },
      [updateNode, data]
    );

    // Unified placeholder for simplified Rich Block
    const getPlaceholder = useMemo(() => {
      return 'Start typing... Use markdown shortcuts or drag & drop images and videos';
    }, []);

    // Get initial content for TipTap - prioritize tiptapJSON over htmlContent
    const getInitialContent = useMemo(() => {
      // Priority 1: Use tiptapJSON if available (for table/poll nodes)
      if (data.content.tiptapJSON) {
        return data.content.tiptapJSON;
      }

      // Priority 2: Fall back to htmlContent
      return data.content.htmlContent || '<p>Start typing...</p>';
    }, [data.content.tiptapJSON, data.content.htmlContent]);

    // Viewport-aware padding system with real-time responsiveness
    const isMobile = useIsMobile();
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

    // Initialize enhanced rich text editor for Rich Block
    const editorInstance = useRichTextEditor({
      nodeId: id,
      initialContent: getInitialContent,
      placeholder: getPlaceholder,
      onUpdate: handleContentUpdate,
      editable: true,
      debounceMs: 1000,
    });




    // Register/unregister editor instance for unified insertion architecture
    useEffect(() => {
      if (editorInstance.editor) {
        registerEditor(id, editorInstance.editor);
      }

      return () => {
        unregisterEditor(id);
      };
    }, [id, editorInstance.editor, registerEditor, unregisterEditor]);

    // Note: Manual resize functionality is available through the unified resize system

    // Dynamic styles based on current mode and settings
    const dynamicStyles = useMemo(
      () =>
        ({
          fontSize: data.fontSize || '16px',
          textAlign: data.textAlign || 'left',
          color: data.color || colors.block.text,
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
        colors.block.text,
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

    // Content styles for UnifiedBlockWrapper
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
        cursor: 'text',
      }),
      [dynamicStyles, paddingTop, paddingRight, paddingBottom, paddingLeft]
    );

    // Handle block click to focus editor with coordination
    const handleBlockClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!editorInstance.editor) return;

        // Calculate if click is within content area (excluding padding)
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if click is within content area (excluding padding)
        const isWithinContentArea =
          clickX >= paddingLeft &&
          clickX <= rect.width - paddingRight &&
          clickY >= paddingTop &&
          clickY <= rect.height - paddingBottom;

        if (isWithinContentArea) {
          // 🎯 UNIFIED SELECTION INTEGRATION: Route text selection directly to unified system
          // This replaces the old handleContentSelection that went through EditorStore
          dispatch({
            type: 'SELECT_TEXT',
            selection: {
              blockId: id,
              selectedText: editorInstance.editor.state.doc.textContent,
              editor: editorInstance.editor,
              range: null,
              textElement: e.currentTarget as HTMLElement,
              hasSelection: false,
            },
          });

          // Focus the editor
          editorInstance.editor.commands.focus();

          // If the editor is empty, position cursor at end
          if (editorInstance.editor.isEmpty) {
            editorInstance.editor.commands.focus('end');
          }
        } else {
          // Click outside content area just activates block
          handleBlockActivation(e);
        }
      },
      [editorInstance.editor, paddingLeft, paddingRight, paddingTop, paddingBottom, id, dispatch, handleBlockActivation]
    );

    // Unified content rendering - always use TipTap editor
    const renderUnifiedContent = () => {
      return (
        <div
          className="rich-block-content-wrapper rich-block-content-container"
          style={{
            width: '100%',
            flex: 1,
            position: 'relative',
            // 🎯 MEDIA CONSTRAINT SYSTEM: Pass available content width to child media elements (matching ReadOnlyRichBlockNode)
            '--block-content-width': `${(width || 600) - paddingLeft - paddingRight}px`,
            '--block-max-width': `${(width || 600) - paddingLeft - paddingRight}px`,
            // CSS containment to prevent media overflow
            contain: 'layout style',
          } as React.CSSProperties}
        >
          <EditorContent
            editor={editorInstance.editor}
            className="rich-block-content"
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
              flex: 1,
            }}
          />
        </div>
      );
    };

    return (
      <>
        <UnifiedBlockWrapper
          id={id}
          width={width}
          height={height}
          x={x}
          y={y}
          selected={selected || isActive}
          blockType="richBlock"
          contentStyles={contentStyles}
          minDimensions={{ width: 200, height: 120 }}
          maxDimensions={{ width: 1200, height: 800 }}
          onSelect={onSelect}
          onMove={onMove}
          onResize={onResize}
          dragSensitivity={16} // Enhanced drag area
          showDragHandle={true} // 🎯 DRAG HANDLE: Enable visible drag handle for rich blocks
        >
          <div
            data-node-id={id}
            data-block-id={id}
            className="w-full h-full"
            style={{
              position: 'relative',
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={handleBlockClick}
          >
            {/* Main content area - unified rich text editor */}
            <div className="flex-1 w-full">{renderUnifiedContent()}</div>
          </div>
        </UnifiedBlockWrapper>
      </>
    );
  }
);

RichBlockNode.displayName = 'RichBlockNode';
