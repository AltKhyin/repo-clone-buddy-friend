// ABOUTME: Inspector panel for ReferenceBlock with comprehensive APA citation form and real-time preview

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { ReferenceBlockData } from '@/types/editor';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackgroundControls, SpacingControls, BorderControls } from './shared/UnifiedControls';
import { FONT_FAMILIES, FONT_WEIGHTS } from '../shared/typography-system';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReferenceBlockInspectorProps {
  nodeId: string;
}

// APA formatting utility (same as in the node component)
const formatAPA = (data: ReferenceBlockData): string => {
  const { authors, year, title, source, doi, url } = data;

  if (!authors || !year || !title || !source) {
    return 'Citation incomplete - please fill all required fields';
  }

  let citation = `${authors} (${year}). ${title}. ${source}`;

  if (doi) {
    citation += `. https://doi.org/${doi}`;
  } else if (url) {
    citation += `. ${url}`;
  }

  return citation;
};

export function ReferenceBlockInspector({ nodeId }: ReferenceBlockInspectorProps) {
  const { nodes, updateNode } = useEditorStore();
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const node = nodes.find(n => n.id === nodeId);

  // Generate live APA preview
  const formattedCitation = React.useMemo(() => {
    if (!node || node.type !== 'referenceBlock') return '';
    const data = node.data as ReferenceBlockData;
    return formatAPA(data);
  }, [node]);

  if (!node || node.type !== 'referenceBlock') return null;

  const data = node.data as ReferenceBlockData;

  const updateData = (updates: Partial<ReferenceBlockData>) => {
    updateNode(nodeId, {
      data: { ...data, ...updates },
    });
  };

  // Check completion status
  const isComplete = data.authors && data.year && data.title && data.source;
  const missingFields = [];
  if (!data.authors) missingFields.push('Authors');
  if (!data.year) missingFields.push('Year');
  if (!data.title) missingFields.push('Title');
  if (!data.source) missingFields.push('Source');

  // Copy citation to clipboard
  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(formattedCitation);
      setCopied(true);
      toast({
        title: 'Citation copied!',
        description: 'APA citation copied to clipboard',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy citation to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Auto-generate formatted citation
  const handleRefreshFormatting = () => {
    const newFormatted = formatAPA(data);
    updateData({ formatted: newFormatted });
    toast({
      title: 'Citation refreshed',
      description: 'APA formatting has been updated',
      duration: 2000,
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reference Citation</h3>
          <Badge variant={isComplete ? 'default' : 'secondary'}>
            {isComplete ? 'Complete' : 'Incomplete'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Create an APA-formatted academic citation</p>
      </div>

      <Separator />

      {/* Required Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Required Fields</h4>

        <div className="space-y-2">
          <Label htmlFor="authors">Authors *</Label>
          <Input
            id="authors"
            value={data.authors || ''}
            onChange={e => updateData({ authors: e.target.value })}
            placeholder="Last, F. M., & Author, S."
            className={!data.authors ? 'border-yellow-400' : ''}
          />
          <p className="text-xs text-muted-foreground">
            Format: Last, F. M., & Second, A. Use "&" before final author
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Publication Year *</Label>
          <Input
            id="year"
            type="number"
            min="1800"
            max="2100"
            value={data.year || ''}
            onChange={e => updateData({ year: parseInt(e.target.value) || 0 })}
            placeholder="2024"
            className={!data.year ? 'border-yellow-400' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={data.title || ''}
            onChange={e => updateData({ title: e.target.value })}
            placeholder="Article or book title"
            className={!data.title ? 'border-yellow-400' : ''}
          />
          <p className="text-xs text-muted-foreground">
            Use sentence case (only first word and proper nouns capitalized)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Source *</Label>
          <Input
            id="source"
            value={data.source || ''}
            onChange={e => updateData({ source: e.target.value })}
            placeholder="Journal Name or Publisher"
            className={!data.source ? 'border-yellow-400' : ''}
          />
          <p className="text-xs text-muted-foreground">
            Journal name (in italics) or book publisher
          </p>
        </div>
      </div>

      <Separator />

      {/* Optional Fields */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Optional Fields</h4>

        <div className="space-y-2">
          <Label htmlFor="doi">DOI</Label>
          <Input
            id="doi"
            value={data.doi || ''}
            onChange={e => updateData({ doi: e.target.value })}
            placeholder="10.1234/example.doi"
          />
          <p className="text-xs text-muted-foreground">
            Digital Object Identifier (preferred over URL)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={data.url || ''}
            onChange={e => updateData({ url: e.target.value })}
            placeholder="https://example.com/article"
          />
          <p className="text-xs text-muted-foreground">Only include if no DOI is available</p>
        </div>
      </div>

      <Separator />

      {/* Citation Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">APA Citation Preview</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshFormatting}
              className="h-8 px-2"
            >
              <RefreshCw size={12} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCitation}
              className="h-8 px-2"
              disabled={!isComplete}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </Button>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p
            className="text-sm font-serif leading-relaxed"
            style={{
              fontFamily: data.fontFamily || 'serif',
              fontSize: data.fontSize ? `${data.fontSize}px` : '14px',
              fontWeight: data.fontWeight || 400,
              lineHeight: data.lineHeight || 1.4,
              color: data.color || 'inherit',
              padding: data.paddingY ? `${data.paddingY}px ${data.paddingX || 0}px` : undefined,
              backgroundColor: data.backgroundColor || undefined,
              border: data.borderWidth
                ? `${data.borderWidth}px ${data.borderStyle || 'solid'} ${data.borderColor || '#ccc'}`
                : undefined,
              borderRadius: data.borderRadius ? `${data.borderRadius}px` : undefined,
            }}
          >
            {formattedCitation}
          </p>
        </div>

        {!isComplete && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">Missing fields:</span> {missingFields.join(', ')}
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Custom Formatting Override */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Custom Formatting (Optional)</h4>
        <div className="space-y-2">
          <Label htmlFor="formatted">Override Formatted Citation</Label>
          <Textarea
            id="formatted"
            value={data.formatted || ''}
            onChange={e => updateData({ formatted: e.target.value })}
            placeholder="Enter custom citation format if needed..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use automatic APA formatting
          </p>
        </div>
      </div>

      <Separator />

      {/* Typography Controls */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Typography & Styling</h4>

        <div className="space-y-4">
          {/* Font Family */}
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={data.fontFamily || 'inherit'}
              onValueChange={value => updateData({ fontFamily: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(font => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size & Weight Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Font Size</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={data.fontSize || 14}
                  onChange={e => updateData({ fontSize: parseInt(e.target.value) || 14 })}
                  className="flex-1"
                  min={8}
                  max={24}
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={(data.fontWeight || 400).toString()}
                onValueChange={value => updateData({ fontWeight: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map(weight => (
                    <SelectItem key={weight.value} value={weight.value.toString()}>
                      <span style={{ fontWeight: weight.value }}>{weight.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Height & Color Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Line Height</Label>
              <Input
                type="number"
                value={data.lineHeight || 1.4}
                onChange={e => updateData({ lineHeight: parseFloat(e.target.value) || 1.4 })}
                min={1.0}
                max={2.5}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={data.color || '#000000'}
                  onChange={e => updateData({ color: e.target.value })}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <button
                  onClick={() => updateData({ color: '' })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Container Styling */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Container Styling</h4>

        {/* Spacing Controls */}
        <SpacingControls
          data={data}
          onChange={updates => updateData(updates)}
          enableMargin={true}
          compact={false}
        />

        {/* Border Controls */}
        <BorderControls data={data} onChange={updates => updateData(updates)} compact={false} />

        {/* Background Controls */}
        <BackgroundControls
          data={data}
          onChange={updates => updateData(updates)}
          enableImage={false}
          compact={false}
          colorKey="backgroundColor"
          defaultColor="transparent"
        />
      </div>
    </div>
  );
}
