// ABOUTME: Modal preview system for viewing content without leaving the editor with multiple viewport sizes

import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';
import {
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  Share,
} from 'lucide-react';

interface ModalPreviewProps {
  trigger?: React.ReactNode;
  className?: string;
}

interface PreviewViewport {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  width: number;
  height: number;
  description: string;
}

const PREVIEW_VIEWPORTS: PreviewViewport[] = [
  {
    id: 'mobile',
    name: 'Mobile',
    icon: Smartphone,
    width: 375,
    height: 667,
    description: 'iPhone SE / Small mobile',
  },
  {
    id: 'tablet',
    name: 'Tablet',
    icon: Tablet,
    width: 768,
    height: 1024,
    description: 'iPad / Standard tablet',
  },
  {
    id: 'desktop',
    name: 'Desktop',
    icon: Monitor,
    width: 1200,
    height: 800,
    description: 'Standard desktop view',
  },
  {
    id: 'full',
    name: 'Full',
    icon: Maximize2,
    width: -1, // Full width
    height: -1, // Full height
    description: 'Full modal width',
  },
];

export function ModalPreview({ trigger, className }: ModalPreviewProps) {
  const { nodes, layouts, currentViewport, canvasTheme } = useEditorStore();
  const [selectedViewport, setSelectedViewport] = React.useState<string>('desktop');
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const currentPreviewViewport =
    PREVIEW_VIEWPORTS.find(v => v.id === selectedViewport) || PREVIEW_VIEWPORTS[2];
  const hasContent = nodes.length > 0;

  // Render block content based on type
  const renderBlockContent = (node: any) => {
    const commonClasses = cn('rounded-lg transition-all duration-200', 'border border-transparent');

    switch (node.type) {
      case 'textBlock':
        return (
          <div
            className={cn(commonClasses, 'p-4')}
            style={{
              fontSize: node.data.fontSize ? `${node.data.fontSize}px` : '16px',
              textAlign: node.data.textAlign || 'left',
              color: node.data.color || (canvasTheme === 'dark' ? '#ffffff' : '#000000'),
              backgroundColor: node.data.backgroundColor || 'transparent',
              borderRadius: node.data.borderRadius ? `${node.data.borderRadius}px` : '8px',
            }}
            dangerouslySetInnerHTML={{ __html: node.data.htmlContent || '<p>Empty text block</p>' }}
          />
        );

      case 'headingBlock':
        const HeadingTag = `h${node.data.level || 1}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            className={cn(commonClasses, 'p-3')}
            style={{
              textAlign: node.data.textAlign || 'left',
              color: node.data.color || (canvasTheme === 'dark' ? '#ffffff' : '#000000'),
              backgroundColor: node.data.backgroundColor || 'transparent',
              borderRadius: node.data.borderRadius ? `${node.data.borderRadius}px` : '6px',
              fontWeight: node.data.fontWeight || (node.data.level <= 2 ? 700 : 600),
            }}
            dangerouslySetInnerHTML={{ __html: node.data.htmlContent || 'Heading' }}
          />
        );

      case 'imageBlock':
        return (
          <div className={cn(commonClasses, 'overflow-hidden')}>
            {node.data.src ? (
              <img
                src={node.data.src}
                alt={node.data.alt || ''}
                className="w-full h-auto"
                style={{
                  borderRadius: node.data.borderRadius ? `${node.data.borderRadius}px` : '8px',
                }}
              />
            ) : (
              <div className="w-full h-48 bg-muted flex items-center justify-center rounded-lg">
                <span className="text-muted-foreground">No image selected</span>
              </div>
            )}
            {node.data.caption && (
              <p className="text-sm text-muted-foreground mt-2 px-2">{node.data.caption}</p>
            )}
          </div>
        );

      case 'separatorBlock':
        return (
          <div className="py-4 flex items-center justify-center">
            <div
              className="border-t transition-all duration-200"
              style={{
                width:
                  node.data.width === 'full' ? '100%' : node.data.width === 'half' ? '50%' : '25%',
                borderTopWidth: `${node.data.thickness || 1}px`,
                borderColor: node.data.color || (canvasTheme === 'dark' ? '#374151' : '#d1d5db'),
                borderStyle: node.data.style || 'solid',
              }}
            />
          </div>
        );

      case 'keyTakeawayBlock':
        const themeColors = {
          info: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            border: 'border-blue-400',
            text: 'text-blue-900 dark:text-blue-100',
          },
          success: {
            bg: 'bg-green-50 dark:bg-green-950/30',
            border: 'border-green-400',
            text: 'text-green-900 dark:text-green-100',
          },
          warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-950/30',
            border: 'border-yellow-400',
            text: 'text-yellow-900 dark:text-yellow-100',
          },
          error: {
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-400',
            text: 'text-red-900 dark:text-red-100',
          },
        };
        const theme = themeColors[node.data.theme as keyof typeof themeColors] || themeColors.info;

        return (
          <div
            className={cn(
              commonClasses,
              'p-4 border-l-4 rounded-lg',
              theme.bg,
              theme.border,
              theme.text
            )}
          >
            <div className="font-semibold text-sm uppercase tracking-wide mb-2">Key Takeaway</div>
            <div className="text-sm leading-relaxed">
              {node.data.content || 'Enter your key takeaway message here...'}
            </div>
          </div>
        );

      default:
        return (
          <div className={cn(commonClasses, 'p-4 bg-muted')}>
            <div className="text-sm text-muted-foreground">
              {node.type} - Preview not implemented
            </div>
          </div>
        );
    }
  };

  // Get layout for current preview viewport
  const getLayoutForViewport = () => {
    if (selectedViewport === 'mobile' || selectedViewport === 'tablet') {
      return layouts.mobile.items;
    }
    return layouts.desktop.items;
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={cn('flex items-center gap-2', className)}
      disabled={!hasContent}
    >
      <Eye size={16} />
      <span className="hidden sm:inline">Preview</span>
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent
        className={cn('max-w-7xl max-h-[90vh] flex flex-col', isFullscreen && 'w-[95vw] h-[95vh]')}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Eye size={20} />
                Content Preview
              </DialogTitle>
              <DialogDescription>
                Preview your content as it would appear to readers
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {nodes.length} block{nodes.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Viewport Controls */}
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Viewport:</span>
            <div className="flex bg-muted rounded-lg p-1">
              {PREVIEW_VIEWPORTS.map(viewport => {
                const IconComponent = viewport.icon;
                return (
                  <Button
                    key={viewport.id}
                    variant={selectedViewport === viewport.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedViewport(viewport.id)}
                    className="text-xs px-3 h-8"
                    title={viewport.description}
                  >
                    <IconComponent size={14} className="mr-1.5" />
                    {viewport.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="text-sm text-muted-foreground">
            {currentPreviewViewport.width > 0 && currentPreviewViewport.height > 0 && (
              <>
                Size: {currentPreviewViewport.width} × {currentPreviewViewport.height}px
              </>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {!hasContent ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <Eye size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No Content to Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Add some blocks to your editor to see a preview here.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex justify-center overflow-auto">
              <div
                className={cn(
                  'w-full max-w-none mx-auto',
                  canvasTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'
                )}
                style={{
                  width:
                    currentPreviewViewport.width > 0 ? `${currentPreviewViewport.width}px` : '100%',
                  minHeight:
                    currentPreviewViewport.height > 0
                      ? `${currentPreviewViewport.height}px`
                      : 'auto',
                }}
              >
                <div className="h-full overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Render blocks in layout order */}
                    {getLayoutForViewport()
                      .sort((a, b) => a.y - b.y || a.x - b.x)
                      .map(layoutItem => {
                        const node = nodes.find(n => n.id === layoutItem.nodeId);
                        if (!node) return null;

                        return (
                          <div key={node.id} className="w-full">
                            {renderBlockContent(node)}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {hasContent && (
          <div className="border-t pt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Viewing in {currentPreviewViewport.name.toLowerCase()} mode
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share size={16} className="mr-2" />
                Share Preview
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink size={16} className="mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
