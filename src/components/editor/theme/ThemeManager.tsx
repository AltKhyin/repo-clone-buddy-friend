// ABOUTME: Theme management interface with gallery, favorites, and creation tools

import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Palette,
  Plus,
  Search,
  Filter,
  Heart,
  Clock,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit2,
  Star,
  Eye,
  MoreHorizontal,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  useThemeStore,
  useCustomThemes,
  useFavoriteThemes,
  useRecentThemes,
} from '@/store/themeStore';
import { CustomTheme, THEME_CATEGORIES } from '@/types/theme';
import { getThemePresets } from '@/components/editor/theme/themePresets';
import { ThemeEditor } from './ThemeEditor';

interface ThemeManagerProps {
  children: React.ReactNode;
  className?: string;
}

export const ThemeManager = React.memo(function ThemeManager({
  children,
  className,
}: ThemeManagerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'used'>('name');

  const {
    getAllThemes,
    searchThemes,
    getThemesByCategory,
    createTheme,
    deleteTheme,
    duplicateTheme,
    applyTheme,
    addToFavorites,
    removeFromFavorites,
    openThemeEditor,
    favoriteThemes,
    generateRandomTheme,
  } = useThemeStore();

  const customThemes = useCustomThemes();
  const favorites = useFavoriteThemes();
  const recents = useRecentThemes();

  // Get filtered and sorted themes
  const filteredThemes = useMemo(() => {
    let themes = getAllThemes();

    // Apply search filter
    if (searchQuery.trim()) {
      themes = searchThemes(searchQuery);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      themes = themes.filter(theme => theme.category === filterCategory);
    }

    // Apply sorting
    themes.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return (
            new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
          );
        case 'used':
          // Sort by usage (favorites first, then recents)
          const aIsFav = favoriteThemes.includes(a.id);
          const bIsFav = favoriteThemes.includes(b.id);
          if (aIsFav && !bIsFav) return -1;
          if (!aIsFav && bIsFav) return 1;
          return 0;
        default:
          return 0;
      }
    });

    return themes;
  }, [getAllThemes, searchThemes, searchQuery, filterCategory, sortBy, favoriteThemes]);

  // Handle theme actions
  const handleApplyTheme = useCallback(
    (theme: CustomTheme) => {
      applyTheme(theme);
      setIsOpen(false);
      toast({
        title: 'Theme Applied',
        description: `"${theme.name}" theme is now active`,
      });
    },
    [applyTheme, toast]
  );

  const handleCreateNew = useCallback(() => {
    const newTheme = createTheme('New Custom Theme');
    openThemeEditor(newTheme);
  }, [createTheme, openThemeEditor]);

  const handleGenerateRandom = useCallback(
    (category: CustomTheme['category']) => {
      const randomTheme = generateRandomTheme(category);
      openThemeEditor(randomTheme);
      toast({
        title: 'Random Theme Generated',
        description: `Generated a new ${category} theme`,
      });
    },
    [generateRandomTheme, openThemeEditor, toast]
  );

  const handleDuplicate = useCallback(
    (theme: CustomTheme) => {
      const duplicated = duplicateTheme(theme.id, `${theme.name} Copy`);
      openThemeEditor(duplicated);
      toast({
        title: 'Theme Duplicated',
        description: `Created a copy of "${theme.name}"`,
      });
    },
    [duplicateTheme, openThemeEditor, toast]
  );

  const handleDelete = useCallback(
    (theme: CustomTheme) => {
      if (theme.metadata.isDefault) {
        toast({
          title: 'Cannot Delete',
          description: 'Default themes cannot be deleted',
          variant: 'destructive',
        });
        return;
      }

      deleteTheme(theme.id);
      toast({
        title: 'Theme Deleted',
        description: `"${theme.name}" has been deleted`,
      });
    },
    [deleteTheme, toast]
  );

  const handleToggleFavorite = useCallback(
    (theme: CustomTheme) => {
      const isFavorite = favoriteThemes.includes(theme.id);
      if (isFavorite) {
        removeFromFavorites(theme.id);
        toast({
          title: 'Removed from Favorites',
          description: `"${theme.name}" removed from favorites`,
        });
      } else {
        addToFavorites(theme.id);
        toast({
          title: 'Added to Favorites',
          description: `"${theme.name}" added to favorites`,
        });
      }
    },
    [favoriteThemes, addToFavorites, removeFromFavorites, toast]
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent className={cn('max-w-5xl h-[90vh] p-0', className)}>
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Theme Manager
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Browse, create, and manage themes for your Visual Composition Engine. Apply
                  predefined themes or create custom ones with your brand colors and typography.
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-1" />
                  New Theme
                </Button>

                <Select
                  onValueChange={category =>
                    handleGenerateRandom(category as CustomTheme['category'])
                  }
                >
                  <SelectTrigger className="w-auto h-8 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                    <Wand2 className="w-4 h-4 mr-1" />
                    <span>Generate</span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(THEME_CATEGORIES).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        Random {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="all" className="h-full flex flex-col">
              <div className="px-6 py-4 border-b space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Themes</TabsTrigger>
                  <TabsTrigger value="favorites" className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    Favorites
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="custom">My Themes</TabsTrigger>
                </TabsList>

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search themes..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(THEME_CATEGORIES).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={value => setSortBy(value as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                      <SelectItem value="used">Most Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="all" className="h-full m-0">
                  <ThemeGrid
                    themes={filteredThemes}
                    favoriteThemes={favoriteThemes}
                    onApply={handleApplyTheme}
                    onEdit={openThemeEditor}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </TabsContent>

                <TabsContent value="favorites" className="h-full m-0">
                  <ThemeGrid
                    themes={favorites}
                    favoriteThemes={favoriteThemes}
                    onApply={handleApplyTheme}
                    onEdit={openThemeEditor}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </TabsContent>

                <TabsContent value="recent" className="h-full m-0">
                  <ThemeGrid
                    themes={recents}
                    favoriteThemes={favoriteThemes}
                    onApply={handleApplyTheme}
                    onEdit={openThemeEditor}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </TabsContent>

                <TabsContent value="custom" className="h-full m-0">
                  <ThemeGrid
                    themes={Object.values(customThemes)}
                    favoriteThemes={favoriteThemes}
                    onApply={handleApplyTheme}
                    onEdit={openThemeEditor}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <ThemeEditor />
    </>
  );
});

// Theme Grid Component
interface ThemeGridProps {
  themes: CustomTheme[];
  favoriteThemes: string[];
  onApply: (theme: CustomTheme) => void;
  onEdit: (theme: CustomTheme) => void;
  onDuplicate: (theme: CustomTheme) => void;
  onDelete: (theme: CustomTheme) => void;
  onToggleFavorite: (theme: CustomTheme) => void;
}

const ThemeGrid = React.memo(function ThemeGrid({
  themes,
  favoriteThemes,
  onApply,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: ThemeGridProps) {
  if (themes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <div className="text-lg font-medium mb-2">No themes found</div>
          <div className="text-sm">Try adjusting your search or filters</div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isFavorite={favoriteThemes.includes(theme.id)}
            onApply={() => onApply(theme)}
            onEdit={() => onEdit(theme)}
            onDuplicate={() => onDuplicate(theme)}
            onDelete={() => onDelete(theme)}
            onToggleFavorite={() => onToggleFavorite(theme)}
          />
        ))}
      </div>
    </ScrollArea>
  );
});

// Theme Card Component
interface ThemeCardProps {
  theme: CustomTheme;
  isFavorite: boolean;
  onApply: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const ThemeCard = React.memo(function ThemeCard({
  theme,
  isFavorite,
  onApply,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: ThemeCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card
      className="relative group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{theme.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {THEME_CATEGORIES[theme.category]?.name || theme.category}
              </Badge>
              {theme.metadata.isDefault && (
                <Badge variant="outline" className="text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
              {isFavorite && <Heart className="w-4 h-4 text-red-500 fill-current" />}
            </div>
          </div>

          {/* Actions */}
          <div
            className={cn(
              'flex items-center gap-1 transition-opacity duration-200',
              showActions ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={e => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Heart className={cn('w-4 h-4', isFavorite && 'text-red-500 fill-current')} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={e => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>

            {!theme.metadata.isDefault && (
              <Button
                size="sm"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Color Palette Preview */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Colors</div>
          <div className="grid grid-cols-8 gap-1">
            {Object.entries(theme.colors)
              .slice(0, 4)
              .map(([paletteName, palette]) =>
                Object.entries(palette)
                  .filter(([shade]) => ['200', '500'].includes(shade))
                  .map(([shade, color]) => (
                    <div
                      key={`${paletteName}-${shade}`}
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: color }}
                      title={`${paletteName}-${shade}`}
                    />
                  ))
              )}
          </div>
        </div>

        {/* Typography Preview */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Typography</div>
          <div
            className="text-sm truncate"
            style={{
              fontFamily: theme.typography.fontFamilies.primary.name,
              color: theme.colors.primary['700'],
            }}
          >
            {theme.typography.fontFamilies.primary.name}
          </div>
        </div>

        {/* Description */}
        {theme.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">{theme.description}</div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={onApply} className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
