// ABOUTME: Advanced theme editor component with live preview and comprehensive customization controls

import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Palette,
  Type,
  Layout,
  Eye,
  Save,
  X,
  Download,
  Upload,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useThemeStore, useThemeEditor } from '@/store/themeStore';
import { CustomTheme, ColorPalette, THEME_CATEGORIES } from '@/types/theme';
import { ColorGenerator, ThemeValidator } from '@/components/editor/theme/themeEngine';

interface ThemeEditorProps {
  className?: string;
}

export const ThemeEditor = React.memo(function ThemeEditor({ className }: ThemeEditorProps) {
  const { toast } = useToast();
  const { isOpen, editingTheme, changes, errors } = useThemeEditor();
  const {
    closeThemeEditor,
    updateEditorChanges,
    saveEditorChanges,
    resetEditorChanges,
    exportTheme,
    applyTheme,
  } = useThemeStore();

  const [previewMode, setPreviewMode] = useState<'live' | 'static'>('live');
  const [activeColorPalette, setActiveColorPalette] = useState<string>('primary');

  // Current theme with changes applied
  const currentTheme = useMemo(() => {
    if (!editingTheme) return null;
    return { ...editingTheme, ...changes } as CustomTheme;
  }, [editingTheme, changes]);

  // Handle color palette updates
  const updateColorPalette = useCallback(
    (paletteName: string, shade: string, color: string) => {
      if (!currentTheme) return;

      updateEditorChanges({
        colors: {
          ...currentTheme.colors,
          [paletteName]: {
            ...currentTheme.colors[paletteName as keyof typeof currentTheme.colors],
            [shade]: color,
          },
        },
      });
    },
    [currentTheme, updateEditorChanges]
  );

  // Generate palette from base color
  const generatePaletteFromBase = useCallback(
    (paletteName: string, baseColor: string) => {
      const generatedPalette = ColorGenerator.generateAccessiblePalette(baseColor);

      updateEditorChanges({
        colors: {
          ...currentTheme?.colors,
          [paletteName]: generatedPalette,
        },
      });

      toast({
        title: 'Palette Generated',
        description: `Generated accessible color palette for ${paletteName}`,
      });
    },
    [currentTheme, updateEditorChanges, toast]
  );

  // Handle theme export
  const handleExport = useCallback(
    (format: 'json' | 'css') => {
      if (!currentTheme) return;

      const exportData = exportTheme(currentTheme.id, format);

      // Create download
      const blob = new Blob([exportData], {
        type: format === 'json' ? 'application/json' : 'text/css',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTheme.name}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Theme Exported',
        description: `Theme exported as ${format.toUpperCase()} file`,
      });
    },
    [currentTheme, exportTheme, toast]
  );

  // Apply theme for preview
  const handlePreview = useCallback(() => {
    if (!currentTheme) return;
    applyTheme(currentTheme);
    toast({
      title: 'Theme Applied',
      description: 'Theme applied for preview',
    });
  }, [currentTheme, applyTheme, toast]);

  if (!isOpen || !editingTheme) return null;

  return (
    <Dialog open={isOpen} onOpenChange={closeThemeEditor}>
      <DialogContent className={cn('max-w-6xl h-[90vh] p-0', className)}>
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme Editor: {editingTheme.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Customize colors, typography, layout, and block styles. Changes are shown in
                real-time in the preview panel.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {errors.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.length} Error{errors.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-1" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('css')}>
                <Download className="w-4 h-4 mr-1" />
                CSS
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={saveEditorChanges}
                disabled={errors.some(e => e.severity === 'error')}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className="w-1/2 border-r overflow-hidden">
            <Tabs defaultValue="colors" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
                <TabsTrigger value="colors" className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  Typography
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex items-center gap-1">
                  <Layout className="w-4 h-4" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="blocks" className="flex items-center gap-1">
                  <Layout className="w-4 h-4" />
                  Blocks
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="colors" className="h-full m-0 p-0">
                  <ColorPaletteEditor
                    theme={currentTheme}
                    activeColorPalette={activeColorPalette}
                    setActiveColorPalette={setActiveColorPalette}
                    onColorChange={updateColorPalette}
                    onGeneratePalette={generatePaletteFromBase}
                  />
                </TabsContent>

                <TabsContent value="typography" className="h-full m-0 p-0">
                  <TypographyEditor theme={currentTheme} onChange={updateEditorChanges} />
                </TabsContent>

                <TabsContent value="layout" className="h-full m-0 p-0">
                  <LayoutEditor theme={currentTheme} onChange={updateEditorChanges} />
                </TabsContent>

                <TabsContent value="blocks" className="h-full m-0 p-0">
                  <BlockStylesEditor theme={currentTheme} onChange={updateEditorChanges} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          <div className="w-1/2 overflow-hidden">
            <ThemePreview
              theme={currentTheme}
              previewMode={previewMode}
              onPreviewModeChange={setPreviewMode}
            />
          </div>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="border-t bg-muted/30 p-4">
            <div className="text-sm font-medium text-destructive mb-2">
              Theme Validation Issues:
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="font-mono text-muted-foreground">{error.field}:</span>
                  <span>{error.message}</span>
                  {error.suggestion && (
                    <span className="text-muted-foreground">- {error.suggestion}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

// Color Palette Editor Component
interface ColorPaletteEditorProps {
  theme: CustomTheme | null;
  activeColorPalette: string;
  setActiveColorPalette: (palette: string) => void;
  onColorChange: (paletteName: string, shade: string, color: string) => void;
  onGeneratePalette: (paletteName: string, baseColor: string) => void;
}

const ColorPaletteEditor = React.memo(function ColorPaletteEditor({
  theme,
  activeColorPalette,
  setActiveColorPalette,
  onColorChange,
  onGeneratePalette,
}: ColorPaletteEditorProps) {
  if (!theme) return null;

  const colorPalettes = Object.keys(theme.colors);
  const activePalette = theme.colors[activeColorPalette as keyof typeof theme.colors];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Palette Selector */}
        <div className="space-y-2">
          <Label>Color Palette</Label>
          <Select value={activeColorPalette} onValueChange={setActiveColorPalette}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorPalettes.map(palette => (
                <SelectItem key={palette} value={palette}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor: theme.colors[palette as keyof typeof theme.colors]['500'],
                      }}
                    />
                    {palette.charAt(0).toUpperCase() + palette.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Generate */}
        <div className="space-y-2">
          <Label>Quick Generate</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              className="w-12 h-9 p-1 border rounded"
              onChange={e => onGeneratePalette(activeColorPalette, e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGeneratePalette(activeColorPalette, activePalette['500'])}
            >
              <Wand2 className="w-4 h-4 mr-1" />
              Regenerate
            </Button>
          </div>
        </div>

        <Separator />

        {/* Color Shades */}
        <div className="space-y-3">
          <Label>Color Shades</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(activePalette).map(([shade, color]) => (
              <div key={shade} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono">{shade}</span>
                  <span className="text-muted-foreground">{color}</span>
                </div>
                <div className="flex gap-1">
                  <input
                    type="color"
                    value={color}
                    onChange={e => onColorChange(activeColorPalette, shade, e.target.value)}
                    className="w-8 h-8 border rounded cursor-pointer"
                  />
                  <div className="flex-1 h-8 rounded border" style={{ backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Typography Editor Component
interface TypographyEditorProps {
  theme: CustomTheme | null;
  onChange: (changes: Partial<CustomTheme>) => void;
}

const TypographyEditor = React.memo(function TypographyEditor({
  theme,
  onChange,
}: TypographyEditorProps) {
  if (!theme) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="text-sm font-medium">Typography System</div>

        {/* Font Families */}
        <div className="space-y-3">
          <Label>Font Families</Label>
          {Object.entries(theme.typography.fontFamilies).map(([familyName, family]) => (
            <div key={familyName} className="space-y-2 p-3 border rounded">
              <div className="font-medium text-sm capitalize">{familyName}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font Name</Label>
                  <Input
                    value={family.name}
                    onChange={e =>
                      onChange({
                        typography: {
                          ...theme.typography,
                          fontFamilies: {
                            ...theme.typography.fontFamilies,
                            [familyName]: {
                              ...family,
                              name: e.target.value,
                            },
                          },
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Fallback</Label>
                  <Input
                    value={family.fallback.join(', ')}
                    onChange={e =>
                      onChange({
                        typography: {
                          ...theme.typography,
                          fontFamilies: {
                            ...theme.typography.fontFamilies,
                            [familyName]: {
                              ...family,
                              fallback: e.target.value.split(',').map(f => f.trim()),
                            },
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground" style={{ fontFamily: family.name }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Layout Editor Component
interface LayoutEditorProps {
  theme: CustomTheme | null;
  onChange: (changes: Partial<CustomTheme>) => void;
}

const LayoutEditor = React.memo(function LayoutEditor({ theme, onChange }: LayoutEditorProps) {
  if (!theme) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="text-sm font-medium">Layout System</div>

        {/* Spacing Scale */}
        <div className="space-y-3">
          <Label>Spacing Scale</Label>
          {Object.entries(theme.layout.spacing).map(([sizeName, size]) => (
            <div key={sizeName} className="flex items-center gap-3">
              <div className="w-12 text-xs font-mono">{sizeName}</div>
              <Input
                value={size}
                onChange={e =>
                  onChange({
                    layout: {
                      ...theme.layout,
                      spacing: {
                        ...theme.layout.spacing,
                        [sizeName]: e.target.value,
                      },
                    },
                  })
                }
                className="flex-1"
              />
              <div
                className="w-8 h-8 bg-primary/20 border border-primary rounded"
                style={{ width: size, height: size, minWidth: '8px', minHeight: '8px' }}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Border Radius */}
        <div className="space-y-3">
          <Label>Border Radius</Label>
          {Object.entries(theme.layout.borderRadius).map(([radiusName, radius]) => (
            <div key={radiusName} className="flex items-center gap-3">
              <div className="w-12 text-xs font-mono">{radiusName}</div>
              <Input
                value={radius}
                onChange={e =>
                  onChange({
                    layout: {
                      ...theme.layout,
                      borderRadius: {
                        ...theme.layout.borderRadius,
                        [radiusName]: e.target.value,
                      },
                    },
                  })
                }
                className="flex-1"
              />
              <div
                className="w-8 h-8 bg-primary/20 border border-primary"
                style={{ borderRadius: radius }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Block Styles Editor Component
interface BlockStylesEditorProps {
  theme: CustomTheme | null;
  onChange: (changes: Partial<CustomTheme>) => void;
}

const BlockStylesEditor = React.memo(function BlockStylesEditor({
  theme,
  onChange,
}: BlockStylesEditorProps) {
  if (!theme) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="text-sm font-medium">Block Styles</div>

        {Object.entries(theme.blockStyles).map(([blockType, styles]) => (
          <div key={blockType} className="space-y-2 p-3 border rounded">
            <div className="font-medium text-sm capitalize">
              {blockType.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(styles).map(([styleName, styleValue]) => (
                <div key={styleName} className="space-y-1">
                  <Label className="text-xs capitalize">
                    {styleName.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  {typeof styleValue === 'string' ? (
                    <Input
                      value={styleValue}
                      onChange={e =>
                        onChange({
                          blockStyles: {
                            ...theme.blockStyles,
                            [blockType]: {
                              ...styles,
                              [styleName]: e.target.value,
                            },
                          },
                        })
                      }
                      className="h-7"
                    />
                  ) : typeof styleValue === 'number' ? (
                    <Input
                      type="number"
                      value={styleValue}
                      onChange={e =>
                        onChange({
                          blockStyles: {
                            ...theme.blockStyles,
                            [blockType]: {
                              ...styles,
                              [styleName]: parseFloat(e.target.value),
                            },
                          },
                        })
                      }
                      className="h-7"
                    />
                  ) : typeof styleValue === 'boolean' ? (
                    <Select
                      value={styleValue.toString()}
                      onValueChange={value =>
                        onChange({
                          blockStyles: {
                            ...theme.blockStyles,
                            [blockType]: {
                              ...styles,
                              [styleName]: value === 'true',
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {JSON.stringify(styleValue)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Theme Preview Component
interface ThemePreviewProps {
  theme: CustomTheme | null;
  previewMode: 'live' | 'static';
  onPreviewModeChange: (mode: 'live' | 'static') => void;
}

const ThemePreview = React.memo(function ThemePreview({
  theme,
  previewMode,
  onPreviewModeChange,
}: ThemePreviewProps) {
  if (!theme) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Live Preview</div>
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode === 'static' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPreviewModeChange('static')}
            >
              Static
            </Button>
            <Button
              variant={previewMode === 'live' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPreviewModeChange('live')}
            >
              Live
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Color Palette Preview */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Color Palettes</div>
            {Object.entries(theme.colors).map(([paletteName, palette]) => (
              <div key={paletteName} className="space-y-1">
                <div className="text-xs font-medium capitalize">{paletteName}</div>
                <div className="flex gap-1">
                  {Object.entries(palette).map(([shade, color]) => (
                    <div
                      key={shade}
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: color }}
                      title={`${paletteName}-${shade}: ${color}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Typography Preview */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Typography</div>
            <div className="space-y-2">
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: theme.typography.fontFamilies.primary.name,
                  color: theme.colors.primary['900'],
                }}
              >
                Heading Example
              </div>
              <div
                className="text-base"
                style={{
                  fontFamily: theme.typography.fontFamilies.secondary.name,
                  color: theme.colors.neutral['700'],
                  lineHeight: theme.blockStyles.textBlock.lineHeight,
                }}
              >
                This is a sample paragraph text to demonstrate how the typography will look with the
                current theme settings. It shows font family, sizing, and color choices.
              </div>
              <div
                className="text-sm font-mono"
                style={{
                  fontFamily: theme.typography.fontFamilies.monospace.name,
                  color: theme.colors.neutral['600'],
                  backgroundColor: theme.colors.neutral['50'],
                  padding: '0.5rem',
                  borderRadius: theme.layout.borderRadius.md,
                }}
              >
                Code example with monospace font
              </div>
            </div>
          </div>

          <Separator />

          {/* Component Preview */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Components</div>
            <div className="space-y-3">
              {/* Key Takeaway Preview */}
              <div
                className="p-4 border-l-4 rounded"
                style={{
                  borderLeftColor: theme.colors.primary['500'],
                  backgroundColor: theme.colors.primary['50'],
                  borderRadius: theme.layout.borderRadius.lg,
                  padding: theme.layout.spacing.lg,
                }}
              >
                <div className="text-sm font-medium" style={{ color: theme.colors.primary['900'] }}>
                  Key Takeaway Block
                </div>
                <div className="text-sm mt-1" style={{ color: theme.colors.primary['700'] }}>
                  This shows how themed blocks will appear
                </div>
              </div>

              {/* Button Preview */}
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium rounded transition-colors"
                  style={{
                    backgroundColor: theme.colors.primary['500'],
                    color: 'white',
                    borderRadius: theme.layout.borderRadius.md,
                  }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium rounded border transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: theme.colors.primary['600'],
                    borderColor: theme.colors.primary['300'],
                    borderRadius: theme.layout.borderRadius.md,
                  }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
