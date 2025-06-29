// ABOUTME: Bubble menu component for Tiptap rich text formatting with floating controls

import React from 'react'
import { BubbleMenu } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  List, 
  ListOrdered, 
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type
} from 'lucide-react'
import { TiptapEditorInstance } from '@/hooks/useTiptapEditor'

interface TiptapBubbleMenuProps {
  editorInstance: TiptapEditorInstance
  showHeadingControls?: boolean
  theme?: 'light' | 'dark'
}

export const TiptapBubbleMenu: React.FC<TiptapBubbleMenuProps> = ({ 
  editorInstance, 
  showHeadingControls = false,
  theme = 'light'
}) => {
  const { editor, isActive } = editorInstance

  if (!editor) return null

  const menuClasses = theme === 'dark' 
    ? "flex items-center gap-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg" 
    : "flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={{ 
        duration: 100,
        placement: 'top',
        animation: 'fade',
      }}
      className={menuClasses}
    >
      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={isActive.bold ? "default" : "ghost"}
          onClick={editorInstance.toggleBold}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </Button>

        <Button
          size="sm"
          variant={isActive.italic ? "default" : "ghost"}
          onClick={editorInstance.toggleItalic}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </Button>

        <Button
          size="sm"
          variant={isActive.strike ? "default" : "ghost"}
          onClick={editorInstance.toggleStrike}
          className="h-8 w-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </Button>

        <Button
          size="sm"
          variant={isActive.code ? "default" : "ghost"}
          onClick={editorInstance.toggleCode}
          className="h-8 w-8 p-0"
          title="Inline Code"
        >
          <Code size={14} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists and Blockquote */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={isActive.bulletList ? "default" : "ghost"}
          onClick={editorInstance.toggleBulletList}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List size={14} />
        </Button>

        <Button
          size="sm"
          variant={isActive.orderedList ? "default" : "ghost"}
          onClick={editorInstance.toggleOrderedList}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </Button>

        <Button
          size="sm"
          variant={isActive.blockquote ? "default" : "ghost"}
          onClick={editorInstance.toggleBlockquote}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote size={14} />
        </Button>
      </div>

      {/* Heading Controls (only show when enabled) */}
      {showHeadingControls && (
        <>
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={isActive.heading(1) ? "default" : "ghost"}
              onClick={() => editorInstance.setHeading(1)}
              className="h-8 w-8 p-0"
              title="Heading 1"
            >
              <Heading1 size={14} />
            </Button>

            <Button
              size="sm"
              variant={isActive.heading(2) ? "default" : "ghost"}
              onClick={() => editorInstance.setHeading(2)}
              className="h-8 w-8 p-0"
              title="Heading 2"
            >
              <Heading2 size={14} />
            </Button>

            <Button
              size="sm"
              variant={isActive.heading(3) ? "default" : "ghost"}
              onClick={() => editorInstance.setHeading(3)}
              className="h-8 w-8 p-0"
              title="Heading 3"
            >
              <Heading3 size={14} />
            </Button>

            <Button
              size="sm"
              variant={isActive.heading(4) ? "default" : "ghost"}
              onClick={() => editorInstance.setHeading(4)}
              className="h-8 w-8 p-0"
              title="Heading 4"
            >
              <Heading4 size={14} />
            </Button>

            <Button
              size="sm"
              variant={!isActive.heading(1) && !isActive.heading(2) && !isActive.heading(3) && !isActive.heading(4) ? "default" : "ghost"}
              onClick={editorInstance.setParagraph}
              className="h-8 w-8 p-0"
              title="Paragraph"
            >
              <Type size={14} />
            </Button>
          </div>
        </>
      )}
    </BubbleMenu>
  )
}