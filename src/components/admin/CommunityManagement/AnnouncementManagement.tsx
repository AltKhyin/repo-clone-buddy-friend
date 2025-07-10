// ABOUTME: Announcement management interface for creating and managing community announcements, changelog entries, and news

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Edit,
  Trash2,
  Megaphone,
  Star,
  Calendar,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  useCommunitySidebarDataQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  type CommunityAnnouncement,
} from '../../../../packages/hooks/useCommunityManagementQuery';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'announcement' | 'news' | 'changelog' | 'event';
  priority: number;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  expires_at?: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
}

const getTypeIcon = (type: string) => {
  const icons = {
    announcement: Megaphone,
    news: AlertCircle,
    changelog: CheckCircle2,
    event: Calendar,
  };
  return icons[type as keyof typeof icons] || Megaphone;
};

const getTypeColor = (type: string) => {
  const colors = {
    announcement: 'bg-accent/10 text-accent',
    news: 'bg-success-muted text-success',
    changelog: 'bg-primary/10 text-primary',
    event: 'bg-destructive/10 text-destructive',
  };
  return colors[type as keyof typeof colors] || colors.announcement;
};

const AnnouncementFormDialog = ({
  announcement,
  open,
  onOpenChange,
  onSave,
}: {
  announcement?: CommunityAnnouncement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AnnouncementFormData) => void;
}) => {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'announcement',
    priority: announcement?.priority || 0,
    is_published: announcement?.is_published || false,
    is_featured: announcement?.is_featured || false,
    published_at: announcement?.published_at || '',
    expires_at: announcement?.expires_at || '',
    image_url: announcement?.image_url || '',
    link_url: announcement?.link_url || '',
    link_text: announcement?.link_text || '',
  });

  React.useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        priority: announcement.priority,
        is_published: announcement.is_published,
        is_featured: announcement.is_featured,
        published_at: announcement.published_at || '',
        expires_at: announcement.expires_at || '',
        image_url: announcement.image_url || '',
        link_url: announcement.link_url || '',
        link_text: announcement.link_text || '',
      });
    }
  }, [announcement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-set published_at if publishing for the first time
    const finalData = {
      ...formData,
      published_at:
        formData.is_published && !formData.published_at
          ? new Date().toISOString()
          : formData.published_at || undefined,
      expires_at: formData.expires_at || undefined,
      image_url: formData.image_url || undefined,
      link_url: formData.link_url || undefined,
      link_text: formData.link_text || undefined,
    };

    onSave(finalData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{announcement ? 'Editar Anúncio' : 'Novo Anúncio'}</DialogTitle>
          <DialogDescription>
            Crie anúncios, novidades, changelog ou eventos para a comunidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do anúncio"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Anúncio</SelectItem>
                  <SelectItem value="news">Notícia</SelectItem>
                  <SelectItem value="changelog">Changelog</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="Conteúdo do anúncio..."
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade (0-5)</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={value => setFormData({ ...formData, priority: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - Baixa</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3 - Média</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 - Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={
                  formData.expires_at
                    ? new Date(formData.expires_at).toISOString().slice(0, 16)
                    : ''
                }
                onChange={e =>
                  setFormData({
                    ...formData,
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : '',
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Opções de Publicação</Label>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={checked => setFormData({ ...formData, is_published: checked })}
              />
              <Label htmlFor="is_published">Publicado</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={checked => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured">Em destaque</Label>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Mídia e Links (Opcional)</Label>

            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link_url">URL do Link</Label>
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url}
                  onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_text">Texto do Link</Label>
                <Input
                  id="link_text"
                  value={formData.link_text}
                  onChange={e => setFormData({ ...formData, link_text: e.target.value })}
                  placeholder="Saiba mais"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{announcement ? 'Salvar Alterações' : 'Criar Anúncio'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AnnouncementManagement = () => {
  const { toast } = useToast();
  const { data: sidebarData, isLoading } = useCommunitySidebarDataQuery();
  const createAnnouncementMutation = useCreateAnnouncementMutation();
  const updateAnnouncementMutation = useUpdateAnnouncementMutation();
  const deleteAnnouncementMutation = useDeleteAnnouncementMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<
    CommunityAnnouncement | undefined
  >();

  const announcements = sidebarData?.announcements || [];

  const handleCreateAnnouncement = (data: AnnouncementFormData) => {
    createAnnouncementMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Anúncio criado',
          description: 'O novo anúncio foi criado com sucesso.',
        });
        setDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao criar anúncio',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleUpdateAnnouncement = (data: AnnouncementFormData) => {
    if (!editingAnnouncement) return;

    updateAnnouncementMutation.mutate(
      { id: editingAnnouncement.id, data },
      {
        onSuccess: () => {
          toast({
            title: 'Anúncio atualizado',
            description: 'As alterações foram salvas com sucesso.',
          });
          setDialogOpen(false);
          setEditingAnnouncement(undefined);
        },
        onError: (error: any) => {
          toast({
            title: 'Erro ao atualizar anúncio',
            description: error.message || 'Ocorreu um erro inesperado.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.')) {
      return;
    }

    deleteAnnouncementMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: 'Anúncio excluído',
          description: 'O anúncio foi removido com sucesso.',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Erro ao excluir anúncio',
          description: error.message || 'Ocorreu um erro inesperado.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleEdit = (announcement: CommunityAnnouncement) => {
    setEditingAnnouncement(announcement);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingAnnouncement(undefined);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando anúncios...</div>
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
                <Megaphone className="h-5 w-5" />
                Gestão de Anúncios
              </CardTitle>
              <CardDescription>
                Crie e gerencie anúncios, notícias, changelog e eventos para a comunidade.
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Anúncio
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum anúncio encontrado.</p>
              <p className="text-sm">Crie seu primeiro anúncio para informar a comunidade.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anúncio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Publicação</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map(announcement => {
                    const TypeIcon = getTypeIcon(announcement.type);
                    const isExpired =
                      announcement.expires_at && new Date(announcement.expires_at) < new Date();

                    return (
                      <TableRow key={announcement.id} className="hover:bg-surface-muted">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{announcement.title}</span>
                              {announcement.is_featured && <Star className="h-4 w-4 text-accent" />}
                            </div>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {announcement.content}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(announcement.type)}>
                            {announcement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{announcement.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={announcement.is_published ? 'default' : 'secondary'}>
                              {announcement.is_published ? 'Publicado' : 'Rascunho'}
                            </Badge>
                            {announcement.is_featured && (
                              <Badge variant="outline" className="text-accent border-accent/30">
                                Destaque
                              </Badge>
                            )}
                            {isExpired && <Badge variant="destructive">Expirado</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {announcement.published_at ? (
                            <div className="text-sm">
                              <div>
                                {format(new Date(announcement.published_at), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })}
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(announcement.published_at), 'HH:mm', {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não publicado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {announcement.expires_at ? (
                            <div className="text-sm">
                              <div>
                                {format(new Date(announcement.expires_at), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })}
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(announcement.expires_at), 'HH:mm', {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem expiração</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(announcement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {announcement.link_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={announcement.link_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AnnouncementFormDialog
        announcement={editingAnnouncement}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
      />
    </div>
  );
};
