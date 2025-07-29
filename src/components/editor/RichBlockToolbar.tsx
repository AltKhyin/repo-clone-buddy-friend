// ABOUTME: Specialized toolbar for Rich Block TipTap editor with command integration and performance optimization

import React, { useCallback, useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  Plus,
  Settings,
  Type,
  Quote,
  Link,
  List,
  ListOrdered,
  Undo,
  Redo,
  Image,
  Video,
} from 'lucide-react';
// REMOVED: BarChart3 - no longer needed after poll removal
// Removed problematic performance monitoring imports
import { tableComponentRegistry } from './extensions/Table/tableCommands';
import { PLACEHOLDER_IMAGES, PLACEHOLDER_DIMENSIONS } from './shared/mediaConstants';
// REMOVED: pollComponentRegistry - polls moved to community-only features
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface RichBlockToolbarProps {
  nodeId: string;
  editor?: any; // TipTap editor instance
  className?: string;
}

export const RichBlockToolbar = React.memo(function RichBlockToolbar({
  nodeId,
  editor,
  className,
}: RichBlockToolbarProps) {
  // Simple render counter for development debugging
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;

  const { nodes } = useEditorStore();
  const node = nodes.find(n => n.id === nodeId);

  // Memoize toolbar state to prevent unnecessary re-renders
  const toolbarState = useMemo(() => {
    if (!editor) return null;

    return {
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
      isUnderline: editor.isActive('underline'),
      isStrike: editor.isActive('strike'),
      isParagraph: editor.isActive('paragraph'),
      isHeading: editor.isActive('heading'),
      isQuote: editor.isActive('blockquote'),
      isBulletList: editor.isActive('bulletList'),
      isOrderedList: editor.isActive('orderedList'),
      isLink: editor.isActive('link'),
      hasSelection: !editor.state.selection.empty,
    };
  }, [editor]);

  // Simple command handlers using React's useCallback
  const handleUndo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const handleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const handleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const handleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const handleStrikethrough = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const handleTextAlign = useCallback(
    (alignment: 'left' | 'center' | 'right' | 'justify') => {
      editor?.chain().focus().setTextAlign(alignment).run();
    },
    [editor]
  );

  const handleHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor]
  );

  const handleParagraph = useCallback(() => {
    editor?.chain().focus().setParagraph().run();
  }, [editor]);

  const handleQuote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run();
  }, [editor]);

  const handleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const handleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const handleInsertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const handleInsertImage = useCallback(() => {
    // Insert image placeholder directly into the current Rich Block using TipTap commands
    editor?.commands.setInlineImage({
      src: PLACEHOLDER_IMAGES.default,
      alt: 'Placeholder image',
      placeholder: true,
      objectFit: 'contain',
      size: 'medium',
      width: PLACEHOLDER_DIMENSIONS.image.width,
      height: PLACEHOLDER_DIMENSIONS.image.height,
    });
  }, [editor]);

  const handleInsertVideo = useCallback(() => {
    // Insert video placeholder directly into the current Rich Block using TipTap commands
    editor?.commands.setVideoEmbed({
      src: '',
      placeholder: true,
      width: PLACEHOLDER_DIMENSIONS.video.width,
      height: PLACEHOLDER_DIMENSIONS.video.height,
      objectFit: 'contain',
      size: 'medium',
      provider: 'youtube',
      allowFullscreen: true,
    });
  }, [editor]);

  // REMOVED: handleInsertPoll - polls moved to community-only features

  const handleToggleLink = useCallback(() => {
    if (toolbarState?.isLink) {
      editor?.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt('Enter URL');
      if (url) {
        editor?.chain().focus().setLink({ href: url }).run();
      }
    }
  }, [editor, toolbarState?.isLink]);

  // Get active table/poll components for additional controls
  const getActiveTableComponent = useCallback(() => {
    const selection = editor?.state.selection;
    if (!selection) return null;

    // Find table node in selection
    const tableNode = editor?.state.doc.nodeAt(selection.from);
    return tableNode?.attrs?.tableId ? tableComponentRegistry.get(tableNode.attrs.tableId) : null;
  }, [editor]);

  // REMOVED: getActivePollComponent - polls moved to community-only features

  if (!editor || !toolbarState) {
    return (
      <div className={cn('h-12 border-b bg-muted/20 flex items-center px-4', className)}>
        <div className="text-sm text-muted-foreground">Editor not ready...</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-12 border-b bg-background flex items-center gap-1 px-4 overflow-x-auto',
        className
      )}
    >
      {/* History Controls */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleUndo}
          disabled={!toolbarState.canUndo}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRedo}
          disabled={!toolbarState.canRedo}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={toolbarState.isBold ? 'default' : 'ghost'}
          onClick={handleBold}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </Button>
        <Button
          size="sm"
          variant={toolbarState.isItalic ? 'default' : 'ghost'}
          onClick={handleItalic}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </Button>
        <Button
          size="sm"
          variant={toolbarState.isUnderline ? 'default' : 'ghost'}
          onClick={handleUnderline}
          className="h-8 w-8 p-0"
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </Button>
        <Button
          size="sm"
          variant={toolbarState.isStrike ? 'default' : 'ghost'}
          onClick={handleStrikethrough}
          className="h-8 w-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Alignment */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleTextAlign('left')}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleTextAlign('center')}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleTextAlign('right')}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight size={16} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleTextAlign('justify')}
          className="h-8 w-8 p-0"
          title="Justify"
        >
          <AlignJustify size={16} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text Styles */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 flex items-center gap-1"
              title="Text Style"
            >
              <Type size={16} />
              <span className="text-xs">
                {toolbarState.isHeading ? 'H' : toolbarState.isParagraph ? 'P' : '?'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleParagraph}>Paragraph</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(1)}>Heading 1</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(2)}>Heading 2</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(3)}>Heading 3</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleHeading(4)}>Heading 4</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          variant={toolbarState.isQuote ? 'default' : 'ghost'}
          onClick={handleQuote}
          className="h-8 w-8 p-0"
          title="Quote"
        >
          <Quote size={16} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={toolbarState.isBulletList ? 'default' : 'ghost'}
          onClick={handleBulletList}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List size={16} />
        </Button>
        <Button
          size="sm"
          variant={toolbarState.isOrderedList ? 'default' : 'ghost'}
          onClick={handleOrderedList}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Insert Elements */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={toolbarState.isLink ? 'default' : 'ghost'}
          onClick={handleToggleLink}
          disabled={!toolbarState.hasSelection}
          className="h-8 w-8 p-0"
          title="Insert/Remove Link"
        >
          <Link size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleInsertImage}
          className="h-8 w-8 p-0"
          title="Insert Image"
        >
          <Image size={16} />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleInsertVideo}
          className="h-8 w-8 p-0"
          title="Insert Video"
        >
          <Video size={16} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 flex items-center gap-1"
              title="Insert Elements"
            >
              <Plus size={16} />
              <span className="text-xs">Insert</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleInsertTable}>
              <Table size={16} className="mr-2" />
              Table
            </DropdownMenuItem>
            {/* REMOVED: Poll insertion - polls moved to community-only features */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Performance badge (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <div className="flex-1" />
          <Badge variant="outline" className="text-xs">
            Render #{renderCountRef.current}
          </Badge>
        </>
      )}
    </div>
  );
});
