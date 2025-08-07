// ABOUTME: Advanced content structure panel with nested lists, code blocks, and complex formatting

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RichTextEditorInstance } from '../../../hooks/useRichTextEditor';
import {
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Indent,
  Outdent,
  Plus,
  Hash,
  Type,
} from 'lucide-react';

interface ContentStructurePanelProps {
  editor: RichTextEditorInstance;
  className?: string;
}

// Code language options
const CODE_LANGUAGES = [
  { value: '', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'php', label: 'PHP' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'yaml', label: 'YAML' },
];

export const ContentStructurePanel: React.FC<ContentStructurePanelProps> = ({
  editor,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'code' | 'layout'>('lists');
  const [codeLanguage, setCodeLanguage] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');

  // List management functions
  const createNestedList = useCallback(
    (type: 'bullet' | 'ordered' | 'task') => {
      if (!editor.editor) return;

      switch (type) {
        case 'bullet':
          editor.toggleBulletList?.();
          break;
        case 'ordered':
          editor.toggleOrderedList?.();
          break;
        case 'task':
          editor.toggleTaskList();
          break;
      }
    },
    [editor]
  );

  const indentList = useCallback(() => {
    if (!editor.editor) return;
    // TipTap doesn't have a direct indent command, but we can simulate it
    editor.editor.commands.sinkListItem('listItem');
  }, [editor]);

  const outdentList = useCallback(() => {
    if (!editor.editor) return;
    editor.editor.commands.liftListItem('listItem');
  }, [editor]);

  // Code block management
  const insertCodeBlock = useCallback(() => {
    if (!editor.editor) return;

    editor.insertCodeBlock(codeLanguage || undefined);

    if (codeContent) {
      // Insert content after a small delay to ensure code block is created
      setTimeout(() => {
        editor.editor?.commands.insertContent(codeContent);
      }, 100);
    }

    setCodeContent('');
  }, [editor, codeLanguage, codeContent]);

  // Quote management
  const insertQuote = useCallback(() => {
    if (!editor.editor || !quoteText) return;

    let quoteContent = quoteText;
    if (quoteAuthor) {
      quoteContent += `\n\n— ${quoteAuthor}`;
    }

    editor.editor.commands.insertContent(`<blockquote><p>${quoteContent}</p></blockquote>`);
    setQuoteText('');
    setQuoteAuthor('');
  }, [editor, quoteText, quoteAuthor]);

  // Text alignment
  const setTextAlign = useCallback(
    (alignment: 'left' | 'center' | 'right') => {
      if (!editor.editor) return;

      // TipTap alignment extension would be needed for this
      // For now, we'll use a workaround with CSS classes
      const selection = editor.editor.state.selection;
      const { from, to } = selection;

      editor.editor.commands.setTextSelection({ from, to });
      // This would need custom extension to work properly
    },
    [editor]
  );

  // Heading utilities
  const insertHeadingWithText = useCallback(
    (level: 1 | 2 | 3 | 4, text: string) => {
      if (!editor.editor || !editor.features.allowHeadings) return;

      editor.editor.commands.insertContent(`<h${level}>${text}</h${level}>`);
    },
    [editor]
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <List size={16} />
          Content Structure
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lists" className="text-xs">
              Lists
            </TabsTrigger>
            <TabsTrigger value="code" className="text-xs">
              Code
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">
              Layout
            </TabsTrigger>
          </TabsList>

          {/* Lists Tab */}
          <TabsContent value="lists" className="mt-4 space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">List Types</h4>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={editor.isActive.bulletList ? 'default' : 'outline'}
                  onClick={() => createNestedList('bullet')}
                  className="justify-start h-auto p-3"
                  disabled={!editor.features.allowLists}
                >
                  <List size={16} className="mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Bullet List</div>
                    <div className="text-xs text-muted-foreground">• Unordered items</div>
                  </div>
                </Button>

                <Button
                  variant={editor.isActive.orderedList ? 'default' : 'outline'}
                  onClick={() => createNestedList('ordered')}
                  className="justify-start h-auto p-3"
                  disabled={!editor.features.allowLists}
                >
                  <ListOrdered size={16} className="mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Numbered List</div>
                    <div className="text-xs text-muted-foreground">1. Ordered items</div>
                  </div>
                </Button>

                <Button
                  variant={editor.isActive.taskList ? 'default' : 'outline'}
                  onClick={() => createNestedList('task')}
                  className="justify-start h-auto p-3"
                  disabled={!editor.features.allowLists}
                >
                  <CheckSquare size={16} className="mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Task List</div>
                    <div className="text-xs text-muted-foreground">☐ Checkable items</div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">List Controls</h4>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={indentList}
                  disabled={!editor.features.allowLists}
                  className="flex-1"
                >
                  <Indent size={14} className="mr-1" />
                  Indent
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={outdentList}
                  disabled={!editor.features.allowLists}
                  className="flex-1"
                >
                  <Outdent size={14} className="mr-1" />
                  Outdent
                </Button>
              </div>

              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                <strong>Tips:</strong> Use Tab to indent and Shift+Tab to outdent list items. Type
                "- " for bullets or "1. " for numbered lists.
              </div>
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="mt-4 space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Code Blocks</h4>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="code-language" className="text-xs">
                    Language
                  </Label>
                  <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select language..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CODE_LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="code-content" className="text-xs">
                    Code Content (Optional)
                  </Label>
                  <Textarea
                    id="code-content"
                    value={codeContent}
                    onChange={e => setCodeContent(e.target.value)}
                    placeholder="Enter code to pre-fill the block..."
                    className="mt-1 font-mono text-sm"
                    rows={4}
                  />
                </div>

                <Button onClick={insertCodeBlock} className="w-full">
                  <Code size={14} className="mr-2" />
                  Insert Code Block
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Code</h4>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => setCodeLanguage('javascript')}>
                  JavaScript
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCodeLanguage('python')}>
                  Python
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCodeLanguage('sql')}>
                  SQL
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCodeLanguage('css')}>
                  CSS
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="mt-4 space-y-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Text Alignment</h4>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => setTextAlign('left')}>
                  <AlignLeft size={14} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTextAlign('center')}>
                  <AlignCenter size={14} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTextAlign('right')}>
                  <AlignRight size={14} />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Block Quotes</h4>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="quote-text" className="text-xs">
                    Quote Text
                  </Label>
                  <Textarea
                    id="quote-text"
                    value={quoteText}
                    onChange={e => setQuoteText(e.target.value)}
                    placeholder="Enter quote text..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="quote-author" className="text-xs">
                    Author (Optional)
                  </Label>
                  <Input
                    id="quote-author"
                    value={quoteAuthor}
                    onChange={e => setQuoteAuthor(e.target.value)}
                    placeholder="Quote author..."
                    className="mt-1"
                  />
                </div>

                <Button onClick={insertQuote} disabled={!quoteText} className="w-full">
                  <Quote size={14} className="mr-2" />
                  Insert Quote
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Headings</h4>

              {editor.features.allowHeadings && (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(level => (
                    <Button
                      key={level}
                      variant={editor.isActive.heading(level) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => editor.setHeading?.(level as any)}
                      className="w-full justify-start"
                    >
                      <Hash size={14} className="mr-2" />
                      Heading {level}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={editor.setParagraph}
                    className="w-full justify-start"
                  >
                    <Type size={14} className="mr-2" />
                    Normal Text
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Content Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {editor.getContentStats().words} words
            </Badge>
            <Badge variant="outline" className="text-xs">
              {editor.getContentStats().characters} chars
            </Badge>
            <Badge variant="outline" className="text-xs">
              {editor.getContentStats().paragraphs} paragraphs
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
