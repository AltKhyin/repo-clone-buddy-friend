// ABOUTME: Inspector panel for QuoteBlock with content editing, citation management, and style customization

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useEditorStore } from '@/store/editorStore';
import { Quote, User, Palette, Type, Move, Sparkles } from 'lucide-react';
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

  // Quote style options
  const quoteStyles = [
    { value: 'default', label: 'Default Quote', description: 'Standard quote style' },
    { value: 'large-quote', label: 'Large Quote', description: 'Emphasized large text style' },
  ];

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
            value={data.content || ''}
            onChange={e => updateQuoteData({ content: e.target.value })}
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
            value={data.citation || ''}
            onChange={e => updateQuoteData({ citation: e.target.value })}
            placeholder="— Author Name, Source"
            className="h-8 text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Attribution for the quote (e.g., "— Steve Jobs, Stanford Commencement 2005")
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

        {/* Quote Style Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Quote Style</Label>
          <Select
            value={data.style || 'default'}
            onValueChange={(value: 'default' | 'large-quote') => updateQuoteData({ style: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quoteStyles.map(style => (
                <SelectItem key={style.value} value={style.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{style.label}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                borderLeftWidth: data.style === 'large-quote' ? '6px' : '4px',
              }}
            >
              <blockquote
                className={`${
                  data.style === 'large-quote' ? 'text-lg font-medium italic' : 'text-sm'
                } mb-2`}
              >
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
        enableMargins={true}
        enableBorders={true}
        enablePresets={true}
      />

      {/* Usage Tips */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Quote size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Quote Block Tips</p>
            <ul className="text-xs text-blue-600 dark:text-blue-300 mt-1 space-y-1">
              <li>• Use quotes to highlight important insights or testimonials</li>
              <li>• Add citations to provide proper attribution</li>
              <li>• Choose accent colors that match your content theme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
