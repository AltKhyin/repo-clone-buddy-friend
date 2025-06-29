// ABOUTME: TextBlock component with Tiptap rich text editing and deep customization options

import React, { memo, useCallback } from 'react'
import { NodeResizer } from '@xyflow/react'
import { EditorContent } from '@tiptap/react'
import { useEditorStore } from '@/store/editorStore'
import { useTiptapEditor } from '@/hooks/useTiptapEditor'
import { TiptapBubbleMenu } from '@/components/editor/TiptapBubbleMenu'

interface TextBlockNodeProps {
  id: string
  data: {
    htmlContent: string
    fontSize?: number
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    color?: string
    backgroundColor?: string
    paddingX?: number
    paddingY?: number
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    lineHeight?: number
    fontFamily?: string
    fontWeight?: number
  }
  selected: boolean
}

export const TextBlockNode = memo<TextBlockNodeProps>(({ id, data, selected }) => {
  const { updateNode, canvasTheme } = useEditorStore()

  // Handle content updates from Tiptap
  const handleContentUpdate = useCallback((nodeId: string, htmlContent: string) => {
    updateNode(nodeId, {
      data: {
        ...data,
        htmlContent
      }
    })
  }, [updateNode, data])

  // Initialize Tiptap editor for this specific node
  const editorInstance = useTiptapEditor({
    nodeId: id,
    initialContent: data.htmlContent || '<p>Type something...</p>',
    placeholder: 'Start typing your text...',
    onUpdate: handleContentUpdate,
    editable: true
  })

  // Calculate dynamic styles based on customization data
  const paddingX = data.paddingX ?? 16
  const paddingY = data.paddingY ?? 12
  const borderWidth = data.borderWidth ?? 0

  const dynamicStyles = {
    fontSize: data.fontSize ? `${data.fontSize}px` : '16px',
    textAlign: data.textAlign || 'left',
    color: data.color || 'inherit',
    backgroundColor: data.backgroundColor || 'transparent',
    paddingLeft: `${paddingX}px`,
    paddingRight: `${paddingX}px`,
    paddingTop: `${paddingY}px`,
    paddingBottom: `${paddingY}px`,
    borderRadius: data.borderRadius ? `${data.borderRadius}px` : '8px',
    borderWidth: borderWidth > 0 ? `${borderWidth}px` : '0px',
    borderColor: data.borderColor || 'rgb(229, 231, 235)',
    borderStyle: borderWidth > 0 ? 'solid' : 'none',
    lineHeight: data.lineHeight || 1.6,
    fontFamily: data.fontFamily || 'inherit',
    fontWeight: data.fontWeight || 400,
    minHeight: '80px',
    minWidth: '200px',
    transition: 'all 0.2s ease-in-out',
  } as React.CSSProperties

  return (
    <>
      {/* Node Resizer for React Flow */}
      <NodeResizer 
        isVisible={selected}
        minWidth={200}
        minHeight={80}
        maxWidth={800}
        maxHeight={600}
        handleStyle={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: 'rgb(59, 130, 246)',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      />
      
      <div
        className={`
          relative cursor-text transition-all duration-200 
          ${selected 
            ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
            : 'hover:shadow-md'
          }
        `}
        style={dynamicStyles}
        onClick={editorInstance.focusEditor}
      >
        {/* Selection indicator */}
        {selected && (
          <div className="absolute -top-8 left-0 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md z-10">
            Text Block
          </div>
        )}

        {/* Tiptap Editor Content */}
        <EditorContent 
          editor={editorInstance.editor}
          className="prose prose-sm max-w-none focus:outline-none"
          style={{
            fontFamily: dynamicStyles.fontFamily,
            fontSize: dynamicStyles.fontSize,
            color: dynamicStyles.color,
            lineHeight: dynamicStyles.lineHeight,
            fontWeight: dynamicStyles.fontWeight,
          }}
        />

        {/* Bubble Menu for Text Formatting */}
        <TiptapBubbleMenu 
          editorInstance={editorInstance}
          showHeadingControls={false}
          theme={canvasTheme}
        />

        {/* Focus indicator */}
        {editorInstance.isFocused && (
          <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-400 ring-opacity-50 rounded-lg" />
        )}
      </div>
    </>
  )
})

TextBlockNode.displayName = 'TextBlockNode'