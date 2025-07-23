// ABOUTME: Inspector panel for QuoteBlock with content editing, citation management, and style customization

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useEditorStore } from '@/store/editorStore';
import { Quote, User, Palette, Sparkles, Type } from 'lucide-react';
import { QuoteBlockData } from '@/types/editor';
import { SpacingControls } from '@/components/editor/Inspector/shared/SpacingControls';

interface QuoteBlockInspectorProps {
  nodeId: string;
}

export const QuoteBlockInspector: React.FC<QuoteBlockInspectorProps> = ({ nodeId }) => {
  const { nodes, updateNode } = useEditorStore();

  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'quoteBlock') return null;

  const data = node.data as QuoteBlockData;

  const updateQuoteData = (updates: Partial<QuoteBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Helper functions to convert between HTML and plain text for inspector editing
  const htmlToText = (html: string): string => {
    if (!html || html === '<p></p>' || html === '<p><br></p>') return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p><p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  const textToHtml = (text: string): string => {
    if (!text || text.trim() === '') return '<p></p>';
    return `<p>${text.replace(/\n/g, '<br>')}</p>`;
  };

  // Get text values for inspector editing
  const contentText = htmlToText(data.htmlContent || '');
  const citationText = htmlToText(data.htmlCitation || '');

  // Handle content updates with HTML conversion
  const handleContentUpdate = (text: string) => {
    const htmlContent = textToHtml(text);
    updateQuoteData({ htmlContent });
  };

  const handleCitationUpdate = (text: string) => {
    const htmlCitation = textToHtml(text);
    updateQuoteData({ htmlCitation });
  };

  // Predefined border colors
  const borderColors = [
    { value: '#3b82f6', label: 'Blue', color: '#3b82f6' },
    { value: '#10b981', label: 'Green', color: '#10b981' },
    { value: '#f59e0b', label: 'Orange', color: '#f59e0b' },
    { value: '#ef4444', label: 'Red', color: '#ef4444' },
    { value: '#8b5cf6', label: 'Purple', color: '#8b5cf6' },
    { value: '#6b7280', label: 'Gray', color: '#6b7280' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Quote size={16} />
        <h3 className="font-medium">Quote Block</h3>
      </div>

      <Separator />

      {/* Quote Content Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Type size={14} />
          Quote Content
        </h4>

        {/* Quote Text */}
        <div className="space-y-2">
          <Label htmlFor="quote-content" className="text-xs">
            Quote Text
          </Label>
          <Textarea
            id="quote-content"
            value={contentText}
            onChange={e => handleContentUpdate(e.target.value)}
            placeholder="Enter the quote text here..."
            className="min-h-[100px] text-sm"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            The main content of your quote. This will be the highlighted text.
          </p>
        </div>

        {/* Citation */}
        <div className="space-y-2">
          <Label htmlFor="quote-citation" className="text-xs">
            Citation (Optional)
          </Label>
          <Input
            id="quote-citation"
            value={citationText}
            onChange={e => handleCitationUpdate(e.target.value)}
            placeholder="— Author Name, Source"
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Attribution for the quote (e.g., "— Steve Jobs, Stanford Commencement 2005")
          </p>
        </div>

        {/* Author Image */}
        <div className="space-y-2">
          <Label htmlFor="quote-author-image" className="text-xs">
            Author Image (Optional)
          </Label>
          <Input
            id="quote-author-image"
            value={data.authorImage || ''}
            onChange={e => updateQuoteData({ authorImage: e.target.value })}
            placeholder="Enter image URL or leave empty for default"
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            URL to author's image. If empty, uses block creator's profile image.
          </p>
        </div>
      </div>

      <Separator />

      {/* Style Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Sparkles size={14} />
          Quote Style
        </h4>

        {/* Quote Style Info */}
        <div className="space-y-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Quote blocks now use a unified design optimized for readability and visual
              consistency.
            </p>
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="color"
              value={data.backgroundColor || '#ffffff'}
              onChange={e => updateQuoteData({ backgroundColor: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.backgroundColor || 'transparent'}
              onChange={e => updateQuoteData({ backgroundColor: e.target.value })}
              placeholder="transparent"
              className="flex-1 h-8 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuoteData({ backgroundColor: 'transparent' })}
              className="px-2 h-8 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Border Color */}
        <div className="space-y-2">
          <Label className="text-xs">Accent Color</Label>
          <div className="grid grid-cols-6 gap-2">
            {borderColors.map(colorOption => (
              <button
                key={colorOption.value}
                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                  data.borderColor === colorOption.value
                    ? 'border-foreground shadow-md'
                    : 'border-border'
                }`}
                style={{ backgroundColor: colorOption.color }}
                onClick={() => updateQuoteData({ borderColor: colorOption.value })}
                title={colorOption.label}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="color"
              value={data.borderColor || '#3b82f6'}
              onChange={e => updateQuoteData({ borderColor: e.target.value })}
              className="w-12 h-8 p-1 border rounded"
            />
            <Input
              type="text"
              value={data.borderColor || '#3b82f6'}
              onChange={e => updateQuoteData({ borderColor: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Preview Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Palette size={14} />
          Preview
        </h4>

        <Card className="p-0">
          <CardContent className="p-4">
            <div
              className="border-l-4 pl-4"
              style={{
                borderLeftColor: data.borderColor || '#3b82f6',
                borderLeftWidth: '4px',
              }}
            >
              <blockquote className="text-sm mb-2">
                {data.content || 'Enter your quote text to see preview...'}
              </blockquote>
              {data.citation && (
                <footer className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                  <User className="w-3 h-3" />
                  <cite className="not-italic">{data.citation}</cite>
                </footer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spacing Controls */}
      <Separator />
      <SpacingControls
        data={data}
        onChange={updateQuoteData}
        compact={true}
        enableBorders={true}
        enablePresets={true}
      />
    </div>
  );
};
