// ABOUTME: Comprehensive Rich Text sidebar with all Reddit-like editing features

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RichTextEditorInstance } from '../../../hooks/useRichTextEditor';
import { MarkdownShortcuts } from './MarkdownShortcuts';
import { ContentStructurePanel } from './ContentStructurePanel';
import {
  Edit3,
  ChevronDown,
  ChevronRight,
  Keyboard,
  Layout,
  Eye,
  Settings,
  Wand2,
} from 'lucide-react';

interface RichTextSidebarProps {
  editor: RichTextEditorInstance;
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

export const RichTextSidebar: React.FC<RichTextSidebarProps> = ({
  editor,
  isVisible,
  onToggle,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'structure' | 'preview'>('shortcuts');
  const [shortcutsExpanded, setShortcutsExpanded] = useState(true);
  const [structureExpanded, setStructureExpanded] = useState(true);

  if (!isVisible) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="shadow-lg bg-background h-12 w-12 p-0"
          title="Show Rich Text Tools"
        >
          <Edit3 size={16} />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed right-4 top-20 bottom-20 w-80 z-40 shadow-lg ${className}`}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Edit3 size={16} className="text-primary" />
            Rich Text Tools
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
            title="Hide Tools"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full">
        <ScrollArea className="h-full">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="shortcuts" className="text-xs">
                  <Keyboard size={12} className="mr-1" />
                  Shortcuts
                </TabsTrigger>
                <TabsTrigger value="structure" className="text-xs">
                  <Layout size={12} className="mr-1" />
                  Structure
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">
                  <Eye size={12} className="mr-1" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="shortcuts" className="mt-0">
                <Collapsible open={shortcutsExpanded} onOpenChange={setShortcutsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                      <div className="flex items-center gap-2">
                        <Wand2 size={14} />
                        <span className="text-sm font-medium">Markdown Shortcuts</span>
                      </div>
                      {shortcutsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <MarkdownShortcuts editor={editor} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="structure" className="mt-0">
                <Collapsible open={structureExpanded} onOpenChange={setStructureExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                      <div className="flex items-center gap-2">
                        <Layout size={14} />
                        <span className="text-sm font-medium">Content Structure</span>
                      </div>
                      {structureExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <ContentStructurePanel editor={editor} />
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Eye size={14} />
                      Live Preview
                    </h3>

                    <div className="min-h-[200px] p-3 bg-background border rounded text-sm">
                      {editor.editor ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: editor.editor.getHTML(),
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <div className="text-center">
                            <Eye size={24} className="mx-auto mb-2" />
                            <p>Start typing to see preview</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content statistics */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">{editor.getContentStats().words}</div>
                          <div className="text-muted-foreground">Words</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{editor.getContentStats().characters}</div>
                          <div className="text-muted-foreground">Characters</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{editor.getContentStats().paragraphs}</div>
                          <div className="text-muted-foreground">Paragraphs</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editor status */}
                  <div className="p-3 bg-muted/20 rounded text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Editor Status</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          editor.isFocused
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {editor.isFocused ? 'Focused' : 'Unfocused'}
                      </span>
                    </div>

                    <div className="space-y-1 text-muted-foreground">
                      <div>Mode: Rich Text</div>
                      <div>
                        Features: {Object.values(editor.features).filter(Boolean).length} enabled
                      </div>
                      <div>Empty: {editor.isEmpty ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {/* Feature status */}
                  <div className="p-3 bg-muted/20 rounded text-xs">
                    <div className="font-medium mb-2">Enabled Features</div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(editor.features).map(([key, enabled]) => (
                        <div key={key} className="flex items-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              enabled ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                          <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>
                            {key
                              .replace('allow', '')
                              .replace(/([A-Z])/g, ' $1')
                              .trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
