// ABOUTME: Bulk operations panel for performing mass actions on selected users efficiently

import React, { useState } from 'react';
import { useUpdateUserMutation, useUserStatusMutation } from '../../../../packages/hooks/useUserManagementQuery';
import { useAssignRoleMutation } from '../../../../packages/hooks/useRoleManagementQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface BulkOperationsPanelProps {
  selectedUserIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

export const BulkOperationsPanel = ({ 
  selectedUserIds, 
  open, 
  onOpenChange, 
  onComplete 
}: BulkOperationsPanelProps) => {
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [progress, setProgress] = useState<BulkOperationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false
  });

  // Mutations
  const assignRoleMutation = useAssignRoleMutation();
  const userStatusMutation = useUserStatusMutation();

  // Available bulk actions
  const bulkActions = [
    { value: 'assign-role', label: 'Atribuir Papel', icon: Shield },
    { value: 'activate', label: 'Ativar Usuários', icon: UserCheck },
    { value: 'deactivate', label: 'Desativar Usuários', icon: UserX },
  ];

  // Available roles for assignment
  const availableRoles = [
    { value: 'editor', label: 'Editor' },
    { value: 'moderator', label: 'Moderador' },
  ];

  // Execute bulk operation
  const executeBulkOperation = async () => {
    if (!selectedAction) {
      toast({
        title: "Ação obrigatória",
        description: "Selecione uma ação para executar.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAction === 'assign-role' && !selectedRole) {
      toast({
        title: "Papel obrigatório",
        description: "Selecione um papel para atribuir aos usuários.",
        variant: "destructive",
      });
      return;
    }

    setProgress({
      total: selectedUserIds.length,
      completed: 0,
      failed: 0,
      inProgress: true
    });

    let completed = 0;
    let failed = 0;

    // Process each user
    for (const userId of selectedUserIds) {
      try {
        switch (selectedAction) {
          case 'assign-role':
            await assignRoleMutation.mutateAsync({
              userId,
              roleName: selectedRole
            });
            break;
          case 'activate':
            await userStatusMutation.mutateAsync({
              userId,
              action: 'reactivate'
            });
            break;
          case 'deactivate':
            await userStatusMutation.mutateAsync({
              userId,
              action: 'deactivate'
            });
            break;
        }
        completed++;
      } catch (error) {
        console.error(`Failed to process user ${userId}:`, error);
        failed++;
      }

      // Update progress
      setProgress(prev => ({
        ...prev,
        completed: completed,
        failed: failed
      }));

      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Operation completed
    setProgress(prev => ({ ...prev, inProgress: false }));

    // Show completion toast
    if (failed === 0) {
      toast({
        title: "Operação concluída",
        description: `Todos os ${completed} usuários foram processados com sucesso.`,
      });
    } else if (completed > 0) {
      toast({
        title: "Operação parcialmente concluída",
        description: `${completed} usuários processados com sucesso, ${failed} falharam.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Operação falhou",
        description: "Nenhum usuário foi processado com sucesso.",
        variant: "destructive",
      });
    }

    // Auto-close after completion
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  // Get action description
  const getActionDescription = () => {
    switch (selectedAction) {
      case 'assign-role':
        return `Atribuir o papel "${availableRoles.find(r => r.value === selectedRole)?.label}" a ${selectedUserIds.length} usuário(s)`;
      case 'activate':
        return `Ativar ${selectedUserIds.length} usuário(s)`;
      case 'deactivate':
        return `Desativar ${selectedUserIds.length} usuário(s)`;
      default:
        return '';
    }
  };

  // Calculate progress percentage
  const progressPercentage = progress.total > 0 
    ? ((progress.completed + progress.failed) / progress.total) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Operações em Massa
          </DialogTitle>
          <DialogDescription>
            Execute ações em {selectedUserIds.length} usuário(s) selecionado(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!progress.inProgress && progress.total === 0 ? (
            // Action selection
            <Tabs value="actions" className="space-y-4">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="actions">Selecionar Ação</TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ação a Executar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tipo de Operação</Label>
                      <Select value={selectedAction} onValueChange={setSelectedAction}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma ação" />
                        </SelectTrigger>
                        <SelectContent>
                          {bulkActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <SelectItem key={action.value} value={action.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {action.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedAction === 'assign-role' && (
                      <div>
                        <Label>Papel a Atribuir</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um papel" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedAction && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-blue-900">Resumo da Operação</div>
                            <div className="text-blue-700 text-sm mt-1">
                              {getActionDescription()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={progress.inProgress}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={executeBulkOperation}
                        disabled={!selectedAction || (selectedAction === 'assign-role' && !selectedRole)}
                        className="flex-1"
                      >
                        Executar Operação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            // Progress display
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {progress.inProgress ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {progress.inProgress ? 'Executando Operação...' : 'Operação Concluída'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso</span>
                    <span>
                      {progress.completed + progress.failed} de {progress.total}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {progress.completed}
                    </div>
                    <div className="text-sm text-muted-foreground">Sucesso</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {progress.failed}
                    </div>
                    <div className="text-sm text-muted-foreground">Falhas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {progress.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                {!progress.inProgress && (
                  <Button
                    onClick={onComplete}
                    className="w-full"
                  >
                    Fechar
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
