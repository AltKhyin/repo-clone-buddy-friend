// ABOUTME: Role assignment and management modal for granting and revoking user roles with expiration

import React, { useState } from 'react';
import { useUserRolesQuery, useAvailableRolesQuery, useAssignRoleMutation, useRevokeRoleMutation } from '../../../../packages/hooks/useRoleManagementQuery';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Calendar,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

interface RoleAssignmentModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoleAssignmentModal = ({ userId, open, onOpenChange }: RoleAssignmentModalProps) => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [roleToRevoke, setRoleToRevoke] = useState<string | null>(null);

  // Fetch data
  const { data: userRoles, isLoading: isLoadingRoles } = useUserRolesQuery(userId);
  const { data: availableRoles, isLoading: isLoadingAvailableRoles } = useAvailableRolesQuery();
  
  // Mutations
  const assignRoleMutation = useAssignRoleMutation();
  const revokeRoleMutation = useRevokeRoleMutation();

  // Get roles that user doesn't have yet
  const assignableRoles = availableRoles?.availableRoles.filter(role => 
    !userRoles?.roles.some(userRole => userRole.role_name === role)
  ) || [];

  // Handle role assignment
  const handleAssignRole = async () => {
    if (!selectedRole) {
      toast({
        title: "Papel obrigatório",
        description: "Selecione um papel para atribuir ao usuário.",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignRoleMutation.mutateAsync({
        userId,
        roleName: selectedRole,
        expiresAt: expirationDate || undefined
      });

      toast({
        title: "Papel atribuído",
        description: `O papel "${selectedRole}" foi atribuído com sucesso.`,
      });

      // Reset form
      setSelectedRole('');
      setExpirationDate('');
    } catch (error) {
      toast({
        title: "Erro ao atribuir papel",
        description: "Ocorreu um erro ao atribuir o papel. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handle role revocation
  const handleRevokeRole = async (roleName: string) => {
    try {
      await revokeRoleMutation.mutateAsync({
        userId,
        roleName
      });

      toast({
        title: "Papel revogado",
        description: `O papel "${roleName}" foi revogado com sucesso.`,
      });

      setRoleToRevoke(null);
    } catch (error) {
      toast({
        title: "Erro ao revogar papel",
        description: "Ocorreu um erro ao revogar o papel. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Format role name for display
  const formatRoleName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: 'Administrador',
      editor: 'Editor',
      moderator: 'Moderador',
      practitioner: 'Praticante'
    };
    return roleMap[role] || role;
  };

  // Get role variant for badge
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'editor': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Papéis do Usuário
          </DialogTitle>
          <DialogDescription>
            Atribua ou revogue papéis para controlar as permissões do usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Papéis Atuais</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando papéis...
                </div>
              ) : userRoles?.roles && userRoles.roles.length > 0 ? (
                <div className="space-y-2">
                  {userRoles.roles.map((role, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={getRoleVariant(role.role_name)}>
                          {formatRoleName(role.role_name)}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Concedido em {new Date(role.granted_at).toLocaleDateString('pt-BR')}
                        </div>
                        {role.expires_at && (
                          <div className="flex items-center gap-1 text-sm text-orange-600">
                            <Calendar className="h-3 w-3" />
                            Expira em {new Date(role.expires_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                      
                      {role.role_name !== 'practitioner' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={revokeRoleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Revogação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja revogar o papel "{formatRoleName(role.role_name)}" 
                                deste usuário? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevokeRole(role.role_name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Revogar Papel
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Este usuário possui apenas o papel básico de Praticante
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assign New Role */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atribuir Novo Papel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAvailableRoles ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando papéis disponíveis...
                </div>
              ) : assignableRoles.length > 0 ? (
                <>
                  <div>
                    <Label htmlFor="role-select">Papel</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {formatRoleName(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expiration">Data de Expiração (Opcional)</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Deixe em branco para papel permanente
                    </div>
                  </div>

                  <Button 
                    onClick={handleAssignRole}
                    disabled={!selectedRole || assignRoleMutation.isPending}
                    className="w-full"
                  >
                    {assignRoleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Atribuir Papel
                  </Button>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <div>Não há papéis disponíveis para atribuição</div>
                  <div className="text-xs">O usuário já possui todos os papéis possíveis</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
