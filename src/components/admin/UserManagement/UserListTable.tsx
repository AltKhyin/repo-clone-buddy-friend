// ABOUTME: Unified admin user management interface with precise role/tier tracking and inline editing capabilities

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  useUnifiedUserListQuery,
  useBulkAdminOperationMutation,
  useCellUpdateMutation,
  type UnifiedUserData,
  type RoleTrackingData
} from '../../../../packages/hooks/useUserManagementQuery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Users,
  Shield,
  Calendar,
  Award,
  Plus,
  Settings,
} from 'lucide-react';
import { EditableRoleCell } from './EditableRoleCell';
import { EditableSubscriptionCell } from './EditableSubscriptionCell';
import { EditableSubscriptionTimeCell } from './EditableSubscriptionTimeCell';
import { AdditionalRolesList } from './AdditionalRolesList';
import { JWTClaimsDisplay } from './JWTClaimsDisplay';

interface UserManagementFilters {
  role?: string;
  subscription_tier?: string;
  search?: string;
  page: number;
  limit: number;
}

export const UserListTable = () => {
  const [filters, setFilters] = useState<UserManagementFilters>({
    page: 1,
    limit: 20,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [inlineEditMode, setInlineEditMode] = useState(false);

  // TanStack Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch unified user data with role tracking
  const { data: userListData, isLoading, error } = useUnifiedUserListQuery(filters);
  
  // Mutations for data updates
  const bulkAdminMutation = useBulkAdminOperationMutation();
  const cellUpdateMutation = useCellUpdateMutation();

  // Handle search input
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1, // Reset to first page on search
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof UserManagementFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle user selection for bulk operations
  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  // Handle select all users
  const handleSelectAll = (checked: boolean) => {
    if (checked && userListData?.users) {
      setSelectedUserIds(userListData.users.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  // Cell editing is now handled directly in the Select components
  // This simplifies the state management and provides immediate feedback

  // Handle bulk operations
  const handleBulkGrantAdmin = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      await bulkAdminMutation.mutateAsync({
        userIds: selectedUserIds,
        operation: 'grant_admin',
      });
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Bulk grant admin failed:', error);
    }
  };

  const handleBulkRemoveAdmin = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      await bulkAdminMutation.mutateAsync({
        userIds: selectedUserIds,
        operation: 'remove_admin',
      });
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Bulk remove admin failed:', error);
    }
  };

  // Format user role for display
  const formatRole = (role: string) => {
    const roleVariant = role === 'admin' ? 'destructive' : 'outline';
    const roleLabel = role === 'admin' ? 'Admin' : 'Praticante';
    return <Badge variant={roleVariant}>{roleLabel}</Badge>;
  };

  // Format subscription tier for display
  const formatSubscriptionTier = (tier: string) => {
    const tierVariant = tier === 'premium' ? 'default' : 'secondary';
    const tierLabel = tier === 'premium' ? 'Premium' : 'Gratuito';

    return <Badge variant={tierVariant}>{tierLabel}</Badge>;
  };

  if (error) {
    return (
      <Card className="bg-surface border-border shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Erro ao carregar usuários: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSelectedUsers = selectedUserIds.length > 0;

  return (
    <div className="space-y-6">
      {/* Filter and Search Section */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Users className="h-5 w-5" />
            Gestão de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários por nome..."
                className="pl-9"
                value={filters.search || ''}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={filters.role || 'all'}
                onValueChange={value => handleFilterChange('role', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="practitioner">Praticante</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.subscription_tier || 'all'}
                onValueChange={value =>
                  handleFilterChange('subscription_tier', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inline Editing Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="inline-edit-mode"
                checked={inlineEditMode}
                onCheckedChange={setInlineEditMode}
              />
              <label htmlFor="inline-edit-mode" className="text-sm font-medium">
                Modo de Edição Inline
              </label>
            </div>
            {inlineEditMode && (
              <div className="text-xs text-muted-foreground">
                Clique nas células de papel/plano para editar diretamente
              </div>
            )}
          </div>

          {/* Bulk Operations */}
          {hasSelectedUsers && (
            <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg border border-border">
              <span className="text-sm text-foreground">
                {selectedUserIds.length} usuário(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkGrantAdmin}
                  disabled={bulkAdminMutation.isPending}
                >
                  {bulkAdminMutation.isPending ? 'Processando...' : 'Conceder Admin'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkRemoveAdmin}
                  disabled={bulkAdminMutation.isPending}
                >
                  {bulkAdminMutation.isPending ? 'Processando...' : 'Remover Admin'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="bg-surface border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto" role="region" aria-label="Tabela de gestão de usuários com scroll horizontal">
            <Table role="table" aria-label="Tabela de gestão unificada de usuários" className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        userListData?.users?.length > 0 &&
                        selectedUserIds.length === userListData.users.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos os usuários"
                    />
                  </TableHead>
                  <TableHead className="min-w-48">Usuário</TableHead>
                  <TableHead className="min-w-32">
                    <div className="flex items-center gap-1">
                      <span>Profissão</span>
                      <span className="text-xs text-muted-foreground">(Practitioners.profession)</span>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-32">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Papel Principal
                      <span className="text-xs text-muted-foreground">(DB)</span>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-32">
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      Plano
                      <span className="text-xs text-muted-foreground">(DB)</span>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-32">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Tempo Restante
                      <span className="text-xs text-muted-foreground">(Editar)</span>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-40">
                    <div className="flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Papéis Adicionais
                      <span className="text-xs text-muted-foreground">(UserRoles)</span>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-32">
                    <div className="flex items-center gap-1">
                      <Settings className="h-4 w-4" />
                      JWT Claims
                      <span className="text-xs text-muted-foreground">(Somente leitura)</span>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-32">Atividade</TableHead>
                  <TableHead className="min-w-40">Redes Sociais</TableHead>
                  <TableHead>Pontuação</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading rows
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={11} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2 text-foreground">Carregando usuários...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : userListData?.users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  userListData?.users?.map(user => (
                    <TableRow key={user.id}>
                      {/* Selection Checkbox */}
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={checked =>
                            handleUserSelection(user.id, checked as boolean)
                          }
                          aria-label={`Selecionar usuário ${user.full_name || 'sem nome'}`}
                        />
                      </TableCell>
                      
                      {/* User Info */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.full_name || 'User'} 
                              className="h-8 w-8 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-foreground">
                              {user.full_name || 'Nome não informado'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email || 'Email não encontrado'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Profession */}
                      <TableCell>
                        <div className="text-sm">
                          {user.profession ? (
                            <span className="text-foreground">{user.profession}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Não informado</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Fonte: Practitioners.profession
                        </div>
                      </TableCell>
                      
                      {/* Primary Role Cell (Editable) */}
                      <TableCell>
                        <EditableRoleCell
                          value={user.roleTracking.primaryRole.value}
                          isEditing={inlineEditMode}
                          isPending={cellUpdateMutation.isPending}
                          onValueChange={(value) => 
                            cellUpdateMutation.mutate({
                              userId: user.id,
                              dataSource: 'primary_role',
                              newValue: value,
                            })
                          }
                        />
                      </TableCell>

                      {/* Subscription Tier Cell (Editable) */}
                      <TableCell>
                        <EditableSubscriptionCell
                          value={user.roleTracking.subscriptionTier.value}
                          isEditing={inlineEditMode}
                          isPending={cellUpdateMutation.isPending}
                          onValueChange={(value) => 
                            cellUpdateMutation.mutate({
                              userId: user.id,
                              dataSource: 'subscription_tier',
                              newValue: value,
                              currentRole: user.roleTracking.primaryRole.value,
                            })
                          }
                        />
                      </TableCell>

                      {/* Subscription Time Cell (Editable) */}
                      <TableCell>
                        <EditableSubscriptionTimeCell
                          user={{
                            id: user.id,
                            full_name: user.full_name,
                            subscription_tier: user.roleTracking.subscriptionTier.value,
                            subscription_start_date: user.subscription_start_date,
                            subscription_end_date: user.subscription_end_date,
                          }}
                          isEditing={inlineEditMode}
                          isPending={cellUpdateMutation.isPending}
                          onAdjustTime={async (userId, days) => {
                            try {
                              const { data, error } = await supabase.functions.invoke('admin-manage-users-working', {
                                body: {
                                  action: 'adjust_subscription_time',
                                  userId,
                                  adjustmentDays: days
                                }
                              });

                              if (error) throw error;
                              
                              // Refresh the user list to show updated data
                              queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                            } catch (error) {
                              console.error('Time adjustment failed:', error);
                            }
                          }}
                          onSetAbsoluteDate={async (userId, newDate) => {
                            try {
                              const { data, error } = await supabase.functions.invoke('admin-manage-users-working', {
                                body: {
                                  action: 'set_absolute_date',
                                  userId,
                                  newDate
                                }
                              });

                              if (error) throw error;
                              
                              // Refresh the user list to show updated data
                              queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                            } catch (error) {
                              console.error('Absolute date setting failed:', error);
                            }
                          }}
                        />
                      </TableCell>

                      {/* Additional Roles Cell */}
                      <TableCell>
                        <AdditionalRolesList
                          roles={user.roleTracking.additionalRoles}
                          isEditing={inlineEditMode}
                          isPending={cellUpdateMutation.isPending}
                          onRemoveRole={(roleName) => 
                            cellUpdateMutation.mutate({
                              userId: user.id,
                              dataSource: 'additional_role',
                              newValue: '',
                              additionalRoleToRemove: roleName,
                            })
                          }
                        />
                      </TableCell>

                      {/* JWT Claims Cell (Read-only) */}
                      <TableCell>
                        <JWTClaimsDisplay
                          roleClaim={user.roleTracking.jwtClaims.role}
                          subscriptionTierClaim={user.roleTracking.jwtClaims.subscriptionTier}
                        />
                      </TableCell>

                      {/* Activity Metrics */}
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Reviews:</span>
                            <span className="font-medium">{user.activityMetrics?.reviewsAuthored || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Posts:</span>
                            <span className="font-medium">{user.activityMetrics?.postsCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Votos:</span>
                            <span className="font-medium">{user.activityMetrics?.votesGiven || 0}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Social Media Links */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.socialMediaLinks?.instagram_url && (
                            <a 
                              href={user.socialMediaLinks.instagram_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-pink-100 text-pink-800 hover:bg-pink-200"
                            >
                              IG
                            </a>
                          )}
                          {user.socialMediaLinks?.linkedin_url && (
                            <a 
                              href={user.socialMediaLinks.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              LI
                            </a>
                          )}
                          {user.socialMediaLinks?.facebook_url && (
                            <a 
                              href={user.socialMediaLinks.facebook_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              FB
                            </a>
                          )}
                          {user.socialMediaLinks?.twitter_url && (
                            <a 
                              href={user.socialMediaLinks.twitter_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-100 text-sky-800 hover:bg-sky-200"
                            >
                              TW
                            </a>
                          )}
                          {user.socialMediaLinks?.youtube_url && (
                            <a 
                              href={user.socialMediaLinks.youtube_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-100 text-red-800 hover:bg-red-200"
                            >
                              YT
                            </a>
                          )}
                          {user.socialMediaLinks?.website_url && (
                            <a 
                              href={user.socialMediaLinks.website_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              WEB
                            </a>
                          )}
                          {!user.socialMediaLinks?.instagram_url && 
                           !user.socialMediaLinks?.linkedin_url && 
                           !user.socialMediaLinks?.facebook_url && 
                           !user.socialMediaLinks?.twitter_url && 
                           !user.socialMediaLinks?.youtube_url && 
                           !user.socialMediaLinks?.website_url && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Contribution Score */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-accent" />
                          {user.contribution_score}
                        </div>
                      </TableCell>

                      {/* Created At */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {userListData?.pagination &&
            userListData.pagination.total > userListData.pagination.limit && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(userListData.pagination.page - 1) * userListData.pagination.limit + 1}{' '}
                  a{' '}
                  {Math.min(
                    userListData.pagination.page * userListData.pagination.limit,
                    userListData.pagination.total
                  )}{' '}
                  de {userListData.pagination.total} usuários
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(userListData.pagination.page - 1)}
                    disabled={userListData.pagination.page <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-foreground">
                    Página {userListData.pagination.page} de{' '}
                    {Math.ceil(userListData.pagination.total / userListData.pagination.limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(userListData.pagination.page + 1)}
                    disabled={!userListData.pagination.hasMore}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Status Messages */}
      {bulkAdminMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-current" />
            <span>Processando operação em massa...</span>
          </div>
        </div>
      )}
      
      {cellUpdateMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b border-current" />
            <span>Salvando alteração...</span>
          </div>
        </div>
      )}

      {bulkAdminMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>❌ Erro na operação em massa</span>
          </div>
        </div>
      )}

      {cellUpdateMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>❌ Erro ao salvar alteração</span>
          </div>
        </div>
      )}

      {bulkAdminMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>✅ Operação em massa concluída</span>
          </div>
        </div>
      )}

      {cellUpdateMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>✅ Alteração salva com sucesso</span>
          </div>
        </div>
      )}
    </div>
  );
};
