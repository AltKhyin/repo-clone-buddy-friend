// ABOUTME: Sidebar section management interface for configuring and reordering community sidebar sections with drag-and-drop functionality

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Layout,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  Settings,
  Info,
  Users,
  Link,
  FileText,
  ShieldCheck,
  Folder,
  Megaphone,
  Puzzle,
  Plus,
  Trash2,
} from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useAdminCommunitySidebarDataQuery,
  useUpdateSidebarSectionMutation,
  useReorderSidebarSectionsMutation,
  useToggleSidebarSectionVisibilityMutation,
  useCreateSidebarSectionMutation,
  useDeleteSidebarSectionMutation,
  type CommunitySidebarSection,
} from '../../../../packages/hooks/useCommunityManagementQuery';
import { useToast } from '../../../hooks/use-toast';

const getSectionIcon = (sectionType: string) => {
  const icons = {
    about: Info,
    links: Link,
    rules: FileText,
    moderators: ShieldCheck,
    categories: Folder,
    announcements: Megaphone,
    custom: Puzzle,
  };
  return icons[sectionType as keyof typeof icons] || Settings;
};

const getSectionDescription = (sectionType: string) => {
  const descriptions = {
    about: 'Informações sobre a comunidade, contador de membros e usuários online',
    links: 'Links úteis e recursos externos para a comunidade',
    rules: 'Regras e diretrizes da comunidade',
    moderators: 'Lista de moderadores e administradores',
    categories: 'Filtros de categoria para posts da comunidade',
    announcements: 'Novidades, changelog e anúncios importantes',
    custom: 'Seção personalizada com conteúdo flexível',
  };
  return descriptions[sectionType as keyof typeof descriptions] || 'Seção customizada';
};

const SortableRow = ({
  section,
  onEdit,
  onToggle,
  onDelete,
}: {
  section: CommunitySidebarSection;
  onEdit: (section: CommunitySidebarSection) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const SectionIcon = getSectionIcon(section.section_type);

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-surface-muted">
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <SectionIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{section.title}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {section.section_type}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
        {getSectionDescription(section.section_type)}
      </TableCell>
      <TableCell>
        <Badge variant={section.is_visible ? 'default' : 'secondary'}>
          {section.is_visible ? 'Visível' : 'Oculta'}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={section.is_system ? 'destructive' : 'outline'}>
          {section.is_system ? 'Sistema' : 'Personalizada'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(section.id)}
            disabled={section.is_system && section.section_type === 'about'} // About section always visible
          >
            {section.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(section)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(section.id)}
            disabled={section.is_system}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const CreateSectionDialog = ({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { section_type: string; title: string; content: any }) => void;
}) => {
  const [sectionType, setSectionType] = useState('custom');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('{}');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedContent = JSON.parse(content);
      onSave({ section_type: sectionType, title, content: parsedContent });
    } catch (error) {
      alert('Conteúdo JSON inválido. Verifique a sintaxe.');
    }
  };

  const getDefaultContent = (type: string) => {
    const defaults = {
      about: { description: 'Descrição da comunidade', member_count_enabled: true },
      links: { links: [] },
      rules: { rules: [] },
      moderators: { show_moderators: true, show_contact_button: true },
      categories: { show_all_categories: true, show_post_count: true },
      announcements: { show_recent_announcements: true, max_items: 3 },
      custom: {},
    };
    return JSON.stringify(defaults[type as keyof typeof defaults] || {}, null, 2);
  };

  React.useEffect(() => {
    setContent(getDefaultContent(sectionType));
  }, [sectionType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Nova Seção
          </DialogTitle>
          <DialogDescription>
            Crie uma nova seção personalizada para a sidebar da comunidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="section-type">Tipo da Seção</Label>
            <Select value={sectionType} onValueChange={setSectionType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo da seção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Personalizada</SelectItem>
                <SelectItem value="links">Links Úteis</SelectItem>
                <SelectItem value="rules">Regras</SelectItem>
                <SelectItem value="announcements">Anúncios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título da Seção</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome que aparecerá na sidebar"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Configuração (JSON)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Configuração em formato JSON"
              rows={8}
              className="font-mono text-sm"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Seção</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SectionConfigDialog = ({
  section,
  open,
  onOpenChange,
  onSave,
}: {
  section?: CommunitySidebarSection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}) => {
  const [title, setTitle] = useState(section?.title || '');
  const [content, setContent] = useState(
    section?.content ? JSON.stringify(section.content, null, 2) : '{}'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedContent = JSON.parse(content);
      onSave({ title, content: parsedContent });
    } catch (error) {
      alert('Conteúdo JSON inválido. Verifique a sintaxe.');
    }
  };

  const getContentSchema = (sectionType: string) => {
    const schemas = {
      about: {
        description: 'Comunidade de profissionais da saúde',
        member_count_enabled: true,
        online_users_enabled: true,
      },
      links: {
        links: [
          {
            title: 'Diretrizes Clínicas',
            url: '/diretrizes',
            description: 'Acesso às principais diretrizes',
          },
        ],
      },
      rules: {
        rules: [
          'Mantenha o respeito profissional',
          'Compartilhe apenas conteúdo baseado em evidências',
        ],
      },
      moderators: {
        show_moderators: true,
        show_contact_button: true,
      },
      categories: {
        show_all_categories: true,
        show_post_count: true,
      },
      announcements: {
        show_recent_announcements: true,
        max_items: 3,
      },
    };
    return schemas[sectionType as keyof typeof schemas] || {};
  };

  React.useEffect(() => {
    if (section) {
      setTitle(section.title);
      setContent(JSON.stringify(section.content, null, 2));
    }
  }, [section]);

  if (!section) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {React.createElement(getSectionIcon(section.section_type), { className: 'h-5 w-5' })}
            Configurar Seção: {section.title}
          </DialogTitle>
          <DialogDescription>{getSectionDescription(section.section_type)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Seção</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título que aparecerá na sidebar"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Configuração (JSON)</Label>
            <div className="space-y-2">
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Configuração em formato JSON"
                rows={12}
                className="font-mono text-sm"
                required
              />
              <div className="text-xs text-muted-foreground">
                <details className="space-y-2">
                  <summary className="cursor-pointer font-medium">
                    Ver esquema de exemplo para {section.section_type}
                  </summary>
                  <pre className="bg-surface-muted p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(getContentSchema(section.section_type), null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Configuração</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const SidebarSectionManagement = () => {
  const { toast } = useToast();
  const { data: sidebarData, isLoading } = useAdminCommunitySidebarDataQuery();
  const updateSectionMutation = useUpdateSidebarSectionMutation();
  const reorderSectionsMutation = useReorderSidebarSectionsMutation();
  const toggleVisibilityMutation = useToggleSidebarSectionVisibilityMutation();
  const createSectionMutation = useCreateSidebarSectionMutation();
  const deleteSectionMutation = useDeleteSidebarSectionMutation();

  const [sections, setSections] = useState<CommunitySidebarSection[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CommunitySidebarSection | undefined>();
  const [deletingSection, setDeletingSection] = useState<CommunitySidebarSection | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  React.useEffect(() => {
    if (sidebarData?.sections) {
      setSections([...sidebarData.sections].sort((a, b) => a.display_order - b.display_order));
    }
  }, [sidebarData?.sections]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(section => section.id === active.id);
      const newIndex = sections.findIndex(section => section.id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex);
      setSections(reorderedSections);

      // Submit reorder
      const sectionIds = reorderedSections.map(section => section.id);
      reorderSectionsMutation.mutate(sectionIds, {
        onError: () => {
          toast({
            title: 'Erro ao reordenar',
            description: 'Não foi possível reordenar as seções.',
            variant: 'destructive',
          });
          // Revert on error
          setSections(
            [...(sidebarData?.sections || [])].sort((a, b) => a.display_order - b.display_order)
          );
        },
      });
    }
  };

  const handleUpdateSection = (data: { title: string; content: any }) => {
    if (!editingSection) return;

    updateSectionMutation.mutate(
      { id: editingSection.id, data },
      {
        onSuccess: () => {
          toast({
            title: 'Seção atualizada',
            description: 'As configurações foram salvas com sucesso.',
          });
          setDialogOpen(false);
          setEditingSection(undefined);
        },
        onError: (error: any) => {
          toast({
            title: 'Erro ao atualizar seção',
            description: error.message || 'Ocorreu um erro inesperado.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleToggleVisibility = (id: string) => {
    toggleVisibilityMutation.mutate(id, {
      onError: (error: any) => {
        toast({
          title: 'Erro ao alterar visibilidade',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleEdit = (section: CommunitySidebarSection) => {
    setEditingSection(section);
    setDialogOpen(true);
  };

  const handleCreateSection = (data: { section_type: string; title: string; content: any }) => {
    const maxDisplayOrder = Math.max(...sections.map(s => s.display_order), 0);

    createSectionMutation.mutate(
      {
        section_type: data.section_type as any,
        title: data.title,
        content: data.content,
        display_order: maxDisplayOrder + 1,
        is_visible: true,
        is_system: false,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Seção criada',
            description: 'A nova seção foi criada com sucesso.',
          });
          setCreateDialogOpen(false);
        },
        onError: (error: any) => {
          toast({
            title: 'Erro ao criar seção',
            description: error.message || 'Ocorreu um erro inesperado.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setDeletingSection(section);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingSection) return;

    deleteSectionMutation.mutate(deletingSection.id, {
      onSuccess: () => {
        toast({
          title: 'Seção excluída',
          description: 'A seção foi removida com sucesso.',
        });
        setDeleteDialogOpen(false);
        setDeletingSection(undefined);
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao excluir seção',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando seções...</div>
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
                <Layout className="h-5 w-5" />
                Gestão de Seções da Sidebar
              </CardTitle>
              <CardDescription>
                Configure a ordem e visibilidade das seções da sidebar da comunidade. Arraste as
                seções para reordená-las e use os controles para configurar cada seção.
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Nova Seção
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma seção encontrada.</p>
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
                      <TableHead>Seção</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={sections.map(section => section.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sections.map(section => (
                        <SortableRow
                          key={section.id}
                          section={section}
                          onEdit={handleEdit}
                          onToggle={handleToggleVisibility}
                          onDelete={handleDelete}
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

      <CreateSectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreateSection}
      />

      <SectionConfigDialog
        section={editingSection}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleUpdateSection}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir a seção "{deletingSection?.title}"? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSectionMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteSectionMutation.isPending}
            >
              {deleteSectionMutation.isPending ? 'Excluindo...' : 'Excluir Seção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
