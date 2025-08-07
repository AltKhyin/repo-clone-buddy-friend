// ABOUTME: Admin component for managing page access control rules with CRUD functionality

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { usePageAccessControlQuery } from '@packages/hooks/usePageAccessQuery';
import {
  useCreatePageAccessControlMutation,
  useUpdatePageAccessControlMutation,
  useDeletePageAccessControlMutation,
} from '@packages/hooks/usePageAccessControlMutations';
import { useAuthStore } from '@/store/auth';
import { getUserAccessLevel, hasAccessLevel } from '@/lib/accessControl';
import type { PageAccessControl } from '@packages/hooks/usePageAccessQuery';

interface AccessRuleFormData {
  page_path: string;
  required_access_level: string;
  redirect_url: string;
}

const ACCESS_LEVELS = [
  { value: 'public', label: 'Público' },
  { value: 'free', label: 'Gratuito' },
  { value: 'premium', label: 'Premium' },
  { value: 'editor_admin', label: 'Editor/Admin' },
];

const ACCESS_LEVEL_COLORS = {
  public: 'default',
  free: 'secondary',
  premium: 'destructive',
  editor_admin: 'default',
} as const;

// Split into two components to avoid hook call issues
const AuthorizedPageAccessControlManager: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PageAccessControl | null>(null);
  const [formData, setFormData] = useState<AccessRuleFormData>({
    page_path: '',
    required_access_level: 'public',
    redirect_url: '/login',
  });

  // Queries and mutations - only executed for authorized users
  const { data: rulesData, isLoading, isError, error } = usePageAccessControlQuery({});
  const createMutation = useCreatePageAccessControlMutation();
  const updateMutation = useUpdatePageAccessControlMutation();
  const deleteMutation = useDeletePageAccessControlMutation();

  const rules = rulesData?.data || [];

  const handleCreateRule = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({
          page_path: '',
          required_access_level: 'public',
          redirect_url: '/login',
        });
      },
    });
  };

  const handleEditRule = (rule: PageAccessControl) => {
    setEditingRule(rule);
    setFormData({
      page_path: rule.page_path,
      required_access_level: rule.required_access_level,
      redirect_url: rule.redirect_url,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;

    updateMutation.mutate(
      {
        id: editingRule.id,
        required_access_level: formData.required_access_level,
        redirect_url: formData.redirect_url,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingRule(null);
          setFormData({
            page_path: '',
            required_access_level: 'public',
            redirect_url: '/login',
          });
        },
      }
    );
  };

  const handleDeleteRule = (id: number) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Carregando regras de acesso...
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p className="font-medium">Erro ao carregar regras de acesso</p>
            <p className="text-sm text-gray-600 mt-1">{error?.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de Acesso de Páginas</h1>
          <p className="text-gray-600">Gerenciar regras de acesso para páginas específicas</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Regra de Acesso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="page_path">Caminho da Página</Label>
                <Input
                  id="page_path"
                  value={formData.page_path}
                  onChange={e => setFormData({ ...formData, page_path: e.target.value })}
                  placeholder="/admin/dashboard"
                />
              </div>
              <div>
                <Label htmlFor="required_access_level">Nível de Acesso Necessário</Label>
                <Select
                  value={formData.required_access_level}
                  onValueChange={value =>
                    setFormData({ ...formData, required_access_level: value })
                  }
                >
                  <SelectTrigger id="required_access_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="redirect_url">URL de Redirecionamento</Label>
                <Input
                  id="redirect_url"
                  value={formData.redirect_url}
                  onChange={e => setFormData({ ...formData, redirect_url: e.target.value })}
                  placeholder="/login"
                />
              </div>
              <Button
                onClick={handleCreateRule}
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Criar Regra
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">Nenhuma regra encontrada</p>
              <p className="text-sm text-gray-400">
                Adicione uma nova regra para controlar o acesso às páginas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Página</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Redirecionamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(rule => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono">{rule.page_path}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ACCESS_LEVEL_COLORS[
                            rule.required_access_level as keyof typeof ACCESS_LEVEL_COLORS
                          ]
                        }
                      >
                        {rule.required_access_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{rule.redirect_url}</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                          aria-label="Editar regra"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" aria-label="Deletar regra">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar a regra para "{rule.page_path}"? Esta
                                ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRule(rule.id)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Regra de Acesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Caminho da Página</Label>
              <Input value={formData.page_path} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="edit_required_access_level">Nível de Acesso Necessário</Label>
              <Select
                value={formData.required_access_level}
                onValueChange={value => setFormData({ ...formData, required_access_level: value })}
              >
                <SelectTrigger id="edit_required_access_level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_redirect_url">URL de Redirecionamento</Label>
              <Input
                id="edit_redirect_url"
                value={formData.redirect_url}
                onChange={e => setFormData({ ...formData, redirect_url: e.target.value })}
                placeholder="/login"
              />
            </div>
            <Button
              onClick={handleUpdateRule}
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Atualizar Regra
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const PageAccessControlManager: React.FC = () => {
  // Auth check - prevent API calls if user doesn't have admin access
  const { user } = useAuthStore();
  const userAccessLevel = getUserAccessLevel(user);
  const hasAdminAccess = hasAccessLevel(userAccessLevel, 'editor_admin');

  // Early return for unauthorized access
  if (!hasAdminAccess) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Acesso não autorizado</p>
            <p className="text-gray-600 text-sm mt-1">
              Você não tem permissão para acessar esta funcionalidade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render authorized component
  return <AuthorizedPageAccessControlManager />;
};
