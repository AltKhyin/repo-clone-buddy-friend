// ABOUTME: Category management interface following ContentTypes pattern for community post categorization with visual customization

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { validateColorOrToken } from '@/utils/color-tokens';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useCommunitySidebarDataQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
  useToggleCategoryVisibilityMutation,
  type CommunityCategory,
} from '@packages/hooks/useCommunityManagementQuery';
import { useToast } from '@/hooks/use-toast';

interface CategoryFormData {
  name: string;
  label: string;
  description: string;
  text_color: string;
  border_color: string;
  background_color: string;
  icon_name: string;
}

const SortableRow = ({
  category,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: CommunityCategory;
  onEdit: (category: CommunityCategory) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-surface-muted">
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          style={{
            color: category.text_color,
            borderColor: category.border_color,
            backgroundColor: category.background_color,
          }}
        >
          {category.label}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">{category.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
        {category.description || 'Sem descrição'}
      </TableCell>
      <TableCell>
        <Badge variant={category.is_active ? 'default' : 'secondary'}>
          {category.is_active ? 'Ativa' : 'Inativa'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={category.is_system ? 'destructive' : 'outline'}>
          {category.is_system ? 'Sistema' : 'Personalizada'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(category.id)}
            disabled={category.is_system}
          >
            {category.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            disabled={category.is_system}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category.id)}
            disabled={category.is_system}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const CategoryFormDialog = ({
  category,
  open,
  onOpenChange,
  onSave,
}: {
  category?: CommunityCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CategoryFormData) => void;
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    label: category?.label || '',
    description: category?.description || '',
    text_color: category?.text_color || 'hsl(var(--foreground))',
    border_color: category?.border_color || 'hsl(var(--border))',
    background_color: category?.background_color || 'hsl(var(--muted))',
    icon_name: category?.icon_name || '',
  });

  const validateForm = () => {
    // Basic validation - ensure required fields are filled
    if (!formData.name.trim() || !formData.label.trim()) {
      return false;
    }

    // Validate color formats (accept both hex colors and theme tokens)
    const isValidTextColor = validateColorOrToken(formData.text_color);
    const isValidBorderColor = validateColorOrToken(formData.border_color);
    const isValidBgColor = validateColorOrToken(formData.background_color);

    return isValidTextColor && isValidBorderColor && isValidBgColor;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
  };

  const handleColorChange = (field: string, value: string) => {
    // Accept any valid color format - don't force conversions
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const presetColors = [
    { name: 'Padrão', text: 'hsl(var(--foreground))', border: 'hsl(var(--border))', bg: 'hsl(var(--muted))' },
    { name: 'Principal', text: 'hsl(var(--primary-foreground))', border: 'hsl(var(--primary))', bg: 'hsl(var(--primary))' },
    { name: 'Sucesso', text: 'hsl(var(--success))', border: 'hsl(var(--success))', bg: 'hsl(var(--success-muted))' },
    { name: 'Atenção', text: 'hsl(var(--destructive))', border: 'hsl(var(--destructive))', bg: 'hsl(var(--error-muted))' },
    { name: 'Destaque', text: 'hsl(var(--accent-foreground))', border: 'hsl(var(--accent))', bg: 'hsl(var(--accent))' },
    { name: 'Neutro', text: 'hsl(var(--muted-foreground))', border: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--card))' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            Configure os detalhes e aparência da categoria para posts da comunidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria (slug)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: discussao-geral"
                pattern="^[a-z0-9-]+$"
                title="Apenas letras minúsculas, números e hífens"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Nome de Exibição</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={e => setFormData({ ...formData, label: e.target.value })}
                placeholder="ex: Discussão Geral"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o propósito desta categoria..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Cores da Categoria</Label>

            {/* Preview */}
            <div className="p-4 border rounded-lg bg-background">
              <p className="text-sm text-muted-foreground mb-2">Prévia:</p>
              <Badge
                variant="outline"
                style={{
                  color: formData.text_color,
                  borderColor: formData.border_color,
                  backgroundColor: formData.background_color,
                }}
                className="text-sm px-3 py-1"
              >
                {formData.label || 'Categoria Exemplo'}
              </Badge>
            </div>

            {/* Color presets */}
            <div className="space-y-2">
              <Label className="text-sm">Presets de Cores</Label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map(preset => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        text_color: preset.text,
                        border_color: preset.border,
                        background_color: preset.bg,
                      })
                    }
                    className="h-auto p-2"
                  >
                    <Badge
                      variant="outline"
                      style={{
                        color: preset.text,
                        borderColor: preset.border,
                        backgroundColor: preset.bg,
                      }}
                      className="text-xs"
                    >
                      {preset.name}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom colors */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="text_color">Cor do Texto</Label>
                <UnifiedColorPicker
                  value={formData.text_color || 'hsl(var(--foreground))'}
                  onColorSelect={(color) => handleColorChange('text_color', color)}
                  mode="both"
                  variant="input"
                  label="Text Color"
                  allowClear={true}
                  customTokens={[
                    { id: 'foreground', name: 'Default Text', value: 'hsl(var(--foreground))', category: 'primary', description: 'Default text color' },
                    { id: 'primary', name: 'Primary', value: 'hsl(var(--primary))', category: 'primary', description: 'Primary brand color' },
                    { id: 'accent', name: 'Accent', value: 'hsl(var(--accent))', category: 'primary', description: 'Accent color' },
                    { id: 'muted-foreground', name: 'Muted Text', value: 'hsl(var(--muted-foreground))', category: 'neutral', description: 'Muted text color' },
                  ]}
                  placeholder="#000000"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="border_color">Cor da Borda</Label>
                <UnifiedColorPicker
                  value={formData.border_color || 'hsl(var(--border))'}
                  onColorSelect={(color) => handleColorChange('border_color', color)}
                  mode="both"
                  variant="input"
                  label="Border Color"
                  allowClear={true}
                  customTokens={[
                    { id: 'border', name: 'Default Border', value: 'hsl(var(--border))', category: 'neutral', description: 'Default border color' },
                    { id: 'accent', name: 'Accent', value: 'hsl(var(--accent))', category: 'primary', description: 'Accent border' },
                    { id: 'muted-foreground', name: 'Muted', value: 'hsl(var(--muted-foreground))', category: 'neutral', description: 'Muted border' },
                    { id: 'primary', name: 'Primary', value: 'hsl(var(--primary))', category: 'primary', description: 'Primary border' },
                  ]}
                  placeholder="#000000"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_color">Cor de Fundo</Label>
                <UnifiedColorPicker
                  value={formData.background_color || 'hsl(var(--muted))'}
                  onColorSelect={(color) => handleColorChange('background_color', color)}
                  mode="both"
                  variant="input"
                  label="Background Color"
                  allowClear={true}
                  customTokens={[
                    { id: 'background', name: 'Default Background', value: 'hsl(var(--background))', category: 'neutral', description: 'Default background color' },
                    { id: 'muted', name: 'Muted', value: 'hsl(var(--muted))', category: 'neutral', description: 'Muted background' },
                    { id: 'card', name: 'Card', value: 'hsl(var(--card))', category: 'neutral', description: 'Card background' },
                    { id: 'accent', name: 'Accent', value: 'hsl(var(--accent))', category: 'primary', description: 'Accent background' },
                    { id: 'success-muted', name: 'Success', value: 'hsl(var(--success-muted))', category: 'semantic', description: 'Success background' },
                    { id: 'error-muted', name: 'Warning', value: 'hsl(var(--error-muted))', category: 'semantic', description: 'Warning background' },
                  ]}
                  placeholder="#000000"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{category ? 'Salvar Alterações' : 'Criar Categoria'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CategoryManagement = () => {
  const { toast } = useToast();
  const { data: sidebarData, isLoading } = useCommunitySidebarDataQuery();
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();
  const reorderCategoriesMutation = useReorderCategoriesMutation();
  const toggleVisibilityMutation = useToggleCategoryVisibilityMutation();

  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CommunityCategory | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  React.useEffect(() => {
    if (sidebarData?.categories) {
      setCategories([...sidebarData.categories].sort((a, b) => a.display_order - b.display_order));
    }
  }, [sidebarData?.categories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(cat => cat.id.toString() === active.id);
      const newIndex = categories.findIndex(cat => cat.id.toString() === over.id);

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(reorderedCategories);

      // Submit reorder
      const categoryIds = reorderedCategories.map(cat => cat.id);
      reorderCategoriesMutation.mutate(categoryIds, {
        onError: () => {
          toast({
            title: 'Erro ao reordenar',
            description: 'Não foi possível reordenar as categorias.',
            variant: 'destructive',
          });
          // Revert on error
          setCategories(
            [...(sidebarData?.categories || [])].sort((a, b) => a.display_order - b.display_order)
          );
        },
      });
    }
  };

  const handleCreateCategory = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Categoria criada',
          description: 'A nova categoria foi criada com sucesso.',
        });
        setDialogOpen(false);
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao criar categoria',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleUpdateCategory = (data: CategoryFormData) => {
    if (!editingCategory) return;

    updateCategoryMutation.mutate(
      { id: editingCategory.id, data },
      {
        onSuccess: () => {
          toast({
            title: 'Categoria atualizada',
            description: 'As alterações foram salvas com sucesso.',
          });
          setDialogOpen(false);
          setEditingCategory(undefined);
        },
        onError: (error: Error) => {
          toast({
            title: 'Erro ao atualizar categoria',
            description: error.message || 'Ocorreu um erro inesperado.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDeleteCategory = (id: number) => {
    if (
      !confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')
    ) {
      return;
    }

    deleteCategoryMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: 'Categoria excluída',
          description: 'A categoria foi removida com sucesso.',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Erro ao excluir categoria',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleToggleVisibility = (id: number) => {
    toggleVisibilityMutation.mutate(id, {
      onError: (error: Error) => {
        toast({
          title: 'Erro ao alterar visibilidade',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleEdit = (category: CommunityCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(undefined);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando categorias...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Gestão de Categorias
              </CardTitle>
              <CardDescription>
                Configure categorias para organizar posts da comunidade seguindo o padrão
                ContentTypes.
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma categoria encontrada.</p>
              <p className="text-sm">
                Crie sua primeira categoria para organizar os posts da comunidade.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={categories.map(cat => cat.id.toString())}
                      strategy={verticalListSortingStrategy}
                    >
                      {categories.map(category => (
                        <SortableRow
                          key={category.id}
                          category={category}
                          onEdit={handleEdit}
                          onDelete={handleDeleteCategory}
                          onToggle={handleToggleVisibility}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </div>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* System Categories Warning */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Categorias do Sistema</p>
              <p className="text-sm text-destructive/80">
                Categorias marcadas como "Sistema" são essenciais para o funcionamento da plataforma
                e não podem ser editadas ou excluídas. Apenas categorias personalizadas podem ser
                modificadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CategoryFormDialog
        category={editingCategory}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
      />
    </div>
  );
};
