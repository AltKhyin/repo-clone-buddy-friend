// ABOUTME: Reddit-style markdown shortcuts and live preview for Rich Block editor

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RichTextEditorInstance } from '../../../hooks/useRichTextEditor';
import {
  Eye,
  Edit,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Hash,
  Info,
} from 'lucide-react';

interface MarkdownShortcutsProps {
  editor: RichTextEditorInstance;
  className?: string;
}

// Markdown shortcuts reference
const MARKDOWN_SHORTCUTS = [
  {
    category: 'Text Formatting',
    shortcuts: [
      { syntax: '**bold**', description: 'Bold text', icon: Bold, action: 'bold' },
      { syntax: '*italic*', description: 'Italic text', icon: Italic, action: 'italic' },
      {
        syntax: '~~strikethrough~~',
        description: 'Strikethrough text',
        icon: Strikethrough,
        action: 'strikethrough',
      },
      { syntax: '`code`', description: 'Inline code', icon: Code, action: 'code' },
    ],
  },
  {
    category: 'Structure',
    shortcuts: [
      { syntax: '# Heading 1', description: 'Large heading', icon: Hash, action: 'heading1' },
      { syntax: '## Heading 2', description: 'Medium heading', icon: Hash, action: 'heading2' },
      { syntax: '### Heading 3', description: 'Small heading', icon: Hash, action: 'heading3' },
      { syntax: '#### Heading 4', description: 'Extra small heading', icon: Hash, action: 'heading4' },
      { syntax: '##### Heading 5', description: 'Tiny heading', icon: Hash, action: 'heading5' },
      { syntax: '###### Heading 6', description: 'Minimal heading', icon: Hash, action: 'heading6' },
      { syntax: '> Quote', description: 'Block quote', icon: Quote, action: 'blockquote' },
    ],
  },
  {
    category: 'Lists',
    shortcuts: [
      { syntax: '- Item', description: 'Bullet list', icon: List, action: 'bulletList' },
      { syntax: '1. Item', description: 'Numbered list', icon: ListOrdered, action: 'orderedList' },
      { syntax: '- [ ] Task', description: 'Task list', icon: List, action: 'taskList' },
    ],
  },
  {
    category: 'Links & Code',
    shortcuts: [
      { syntax: '[text](url)', description: 'Link', icon: Link, action: 'link' },
      { syntax: '```\ncode\n```', description: 'Code block', icon: Code, action: 'codeBlock' },
    ],
  },
] as const;

export const MarkdownShortcuts: React.FC<MarkdownShortcutsProps> = ({ editor, className }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'preview'>('shortcuts');
  const [previewContent, setPreviewContent] = useState('');

  // Handle shortcut insertion
  const insertShortcut = useCallback(
    (action: string, syntax: string) => {
      if (!editor.editor) return;

      const { from, to } = editor.editor.state.selection;
      const selectedText = editor.editor.state.doc.textBetween(from, to);

      switch (action) {
        case 'bold':
          editor.toggleBold();
          break;
        case 'italic':
          editor.toggleItalic();
          break;
        case 'strikethrough':
          editor.toggleStrike();
          break;
        case 'code':
          editor.toggleCode();
          break;
        case 'heading1':
          editor.setHeading?.(1);
          break;
        case 'heading2':
          editor.setHeading?.(2);
          break;
        case 'heading3':
          editor.setHeading?.(3);
          break;
        case 'heading4':
          editor.setHeading?.(4);
          break;
        case 'heading5':
          editor.setHeading?.(5);
          break;
        case 'heading6':
          editor.setHeading?.(6);
          break;
        case 'blockquote':
          editor.toggleBlockquote();
          break;
        case 'bulletList':
          editor.toggleBulletList?.();
          break;
        case 'orderedList':
          editor.toggleOrderedList?.();
          break;
        case 'taskList':
          editor.toggleTaskList();
          break;
        case 'codeBlock':
          editor.insertCodeBlock();
          break;
        case 'link':
          if (selectedText) {
            const url = prompt('Enter URL:');
            if (url) {
              editor.insertLink(url, selectedText);
            }
          } else {
            editor.editor.commands.insertContent('[link text](https://example.com)');
          }
          break;
        default:
          // Insert raw markdown syntax
          editor.editor.commands.insertContent(syntax);
      }
    },
    [editor]
  );

  // Generate preview content
  const generatePreview = useCallback(() => {
    if (!editor.editor) return '';

    const content = editor.editor.getHTML();
    setPreviewContent(content);
    return content;
  }, [editor]);

  // Helper to render shortcut button
  const renderShortcutButton = (shortcut: any) => {
    const IconComponent = shortcut.icon;
    const isActive = (() => {
      switch (shortcut.action) {
        case 'bold':
          return editor.isActive.bold;
        case 'italic':
          return editor.isActive.italic;
        case 'strikethrough':
          return editor.isActive.strike;
        case 'code':
          return editor.isActive.code;
        case 'heading1':
          return editor.isActive.heading(1);
        case 'heading2':
          return editor.isActive.heading(2);
        case 'heading3':
          return editor.isActive.heading(3);
        case 'blockquote':
          return editor.isActive.blockquote;
        case 'bulletList':
          return editor.isActive.bulletList;
        case 'orderedList':
          return editor.isActive.orderedList;
        case 'taskList':
          return editor.isActive.taskList;
        case 'codeBlock':
          return editor.isActive.codeBlock;
        case 'link':
          return editor.isActive.link;
        default:
          return false;
      }
    })();

    return (
      <Button
        key={shortcut.action}
        variant={isActive ? 'default' : 'outline'}
        size="sm"
        onClick={() => insertShortcut(shortcut.action, shortcut.syntax)}
        className="h-auto p-3 flex flex-col items-start gap-2 text-left"
        title={shortcut.description}
      >
        <div className="flex items-center gap-2 w-full">
          <IconComponent size={16} />
          <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
            {shortcut.syntax}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{shortcut.description}</span>
      </Button>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Edit size={16} />
          Markdown Shortcuts
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shortcuts" className="text-xs">
              <Edit size={14} className="mr-1" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs" onClick={generatePreview}>
              <Eye size={14} className="mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shortcuts" className="mt-4 space-y-4">
            {MARKDOWN_SHORTCUTS.map(category => (
              <div key={category.category} className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">{category.category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {category.shortcuts.map(renderShortcutButton)}
                </div>
                {category !== MARKDOWN_SHORTCUTS[MARKDOWN_SHORTCUTS.length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}

            {/* Quick tips */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h5 className="text-sm font-medium">Quick Tips</h5>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Select text first, then click shortcuts to apply formatting</li>
                    <li>• Use Ctrl+B, Ctrl+I for bold and italic</li>
                    <li>• Type @ to mention users</li>
                    <li>• Paste URLs to auto-create links</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Live Preview</h4>
                <Button size="sm" variant="outline" onClick={generatePreview} className="text-xs">
                  Refresh
                </Button>
              </div>

              <div className="min-h-[200px] p-4 border rounded-lg bg-background">
                {previewContent ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                    <div className="text-center">
                      <Eye size={24} className="mx-auto mb-2" />
                      <p>Start typing to see preview</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content stats */}
              <div className="flex gap-2">
                <Badge variant="outline">{editor.getContentStats().words} words</Badge>
                <Badge variant="outline">{editor.getContentStats().characters} characters</Badge>
                <Badge variant="outline">{editor.getContentStats().paragraphs} paragraphs</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
