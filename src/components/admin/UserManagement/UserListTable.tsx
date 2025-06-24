
// ABOUTME: Advanced user list table with filtering, pagination, and bulk operations for admin user management

import React, { useState } from 'react';
import { useUserListQuery } from '../../../../packages/hooks/useUserManagementQuery';
import { useAvailableRolesQuery } from '../../../../packages/hooks/useRoleManagementQuery';
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
  Filter, 
  MoreHorizontal, 
  Users, 
  UserCheck,
  Shield,
  Calendar,
  Award
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserDetailModal } from './UserDetailModal';
import { RoleAssignmentModal } from './RoleAssignmentModal';
import { BulkOperationsPanel } from './BulkOperationsPanel';

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
    limit: 20
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  // Fetch user data and available roles
  const { data: userListData, isLoading, error } = useUserListQuery(filters);
  const { data: rolesData } = useAvailableRolesQuery();

  // Handle search input
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1 // Reset to first page on search
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof UserManagementFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1 // Reset to first page on filter change
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

  // Handle user actions
  const handleUserAction = (userId: string, action: 'view' | 'assign-role' | 'edit') => {
    setSelectedUserId(userId);
    
    switch (action) {
      case 'view':
        setShowUserDetail(true);
        break;
      case 'assign-role':
        setShowRoleAssignment(true);
        break;
      case 'edit':
        setShowUserDetail(true);
        break;
    }
  };

  // Format user role for display
  const formatRole = (role: string) => {
    const roleVariant = role === 'admin' ? 'destructive' : 
                       role === 'editor' ? 'default' : 
                       role === 'moderator' ? 'secondary' : 'outline';
    
    const roleLabel = role === 'admin' ? 'Admin' :
                     role === 'editor' ? 'Editor' :
                     role === 'moderator' ? 'Moderador' : 'Praticante';
    
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value === 'all' ? '' : value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="practitioner">Praticante</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.subscription_tier || 'all'} onValueChange={(value) => handleFilterChange('subscription_tier', value === 'all' ? '' : value)}>
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

          {/* Bulk Operations */}
          {hasSelectedUsers && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-700">
                {selectedUserIds.length} usuário(s) selecionado(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkOperations(true)}
              >
                Operações em Massa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={userListData?.users?.length > 0 && selectedUserIds.length === userListData.users.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Pontuação</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span className="ml-2">Carregando usuários...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : userListData?.users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  userListData?.users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium">{user.full_name || 'Nome não informado'}</div>
                            <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatRole(user.role)}
                      </TableCell>
                      <TableCell>
                        {formatSubscriptionTier(user.subscription_tier)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          {user.contribution_score}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'view')}>
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'assign-role')}>
                              Gerenciar Papéis
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'edit')}>
                              Editar Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {userListData?.pagination && userListData.pagination.total > userListData.pagination.limit && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((userListData.pagination.page - 1) * userListData.pagination.limit) + 1} a{' '}
                {Math.min(userListData.pagination.page * userListData.pagination.limit, userListData.pagination.total)} de{' '}
                {userListData.pagination.total} usuários
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
                <span className="text-sm">
                  Página {userListData.pagination.page} de {Math.ceil(userListData.pagination.total / userListData.pagination.limit)}
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

      {/* Modals */}
      {selectedUserId && (
        <>
          <UserDetailModal
            userId={selectedUserId}
            open={showUserDetail}
            onOpenChange={(open) => {
              setShowUserDetail(open);
              if (!open) setSelectedUserId(null);
            }}
          />
          <RoleAssignmentModal
            userId={selectedUserId}
            open={showRoleAssignment}
            onOpenChange={(open) => {
              setShowRoleAssignment(open);
              if (!open) setSelectedUserId(null);
            }}
          />
        </>
      )}

      <BulkOperationsPanel
        selectedUserIds={selectedUserIds}
        open={showBulkOperations}
        onOpenChange={setShowBulkOperations}
        onComplete={() => {
          setSelectedUserIds([]);
          setShowBulkOperations(false);
        }}
      />
    </div>
  );
};
