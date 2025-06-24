// ABOUTME: Detailed user management modal with comprehensive user information and editing capabilities

import React, { useState } from 'react';
import { useUserDetailQuery, useUpdateUserMutation } from '../../../../packages/hooks/useUserManagementQuery';
import { useUserRolesQuery } from '../../../../packages/hooks/useRoleManagementQuery';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Shield, 
  Calendar, 
  Award, 
  Settings,
  Save,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserDetailModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailModal = ({ userId, open, onOpenChange }: UserDetailModalProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    profession_flair: '',
    display_hover_card: true
  });

  // Fetch user data and roles
  const { data: userDetail, isLoading: isLoadingUser, error } = useUserDetailQuery(userId);
  const { data: userRoles, isLoading: isLoadingRoles } = useUserRolesQuery(userId);
  const updateUserMutation = useUpdateUserMutation();

  // Initialize edit form when user data loads
  React.useEffect(() => {
    if (userDetail && !isEditing) {
      setEditForm({
        full_name: userDetail.full_name || '',
        profession_flair: userDetail.profession_flair || '',
        display_hover_card: userDetail.display_hover_card
      });
    }
  }, [userDetail, isEditing]);

  // Handle form submission
  const handleSave = async () => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        userData: editForm
      });
      
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram salvas com sucesso.",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao atualizar o usuário. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof typeof editForm, value: string | boolean) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              Não foi possível carregar os dados do usuário: {error.message}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
          <DialogDescription>
            Visualize e edite as informações detalhadas do usuário
          </DialogDescription>
        </DialogHeader>

        {isLoadingUser ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando dados do usuário...</span>
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="roles">Papéis</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Informações do Perfil
                  </CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                          disabled={updateUserMutation.isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updateUserMutation.isPending}
                        >
                          {updateUserMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Editar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nome Completo</Label>
                      {isEditing ? (
                        <Input
                          id="full_name"
                          value={editForm.full_name}
                          onChange={(e) => handleFieldChange('full_name', e.target.value)}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{userDetail?.full_name || 'Não informado'}</div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="profession_flair">Profissão</Label>
                      {isEditing ? (
                        <Input
                          id="profession_flair"
                          value={editForm.profession_flair}
                          onChange={(e) => handleFieldChange('profession_flair', e.target.value)}
                          placeholder="Ex: Médico, Enfermeiro..."
                        />
                      ) : (
                        <div className="mt-1 text-sm">
                          {userDetail?.profession_flair || 'Não informado'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Papel Principal</Label>
                      <div className="mt-1">
                        <Badge variant={userDetail?.role === 'admin' ? 'destructive' : 'default'}>
                          {userDetail?.role === 'admin' ? 'Admin' :
                           userDetail?.role === 'editor' ? 'Editor' :
                           userDetail?.role === 'moderator' ? 'Moderador' : 'Praticante'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Assinatura</Label>
                      <div className="mt-1">
                        <Badge variant={userDetail?.subscription_tier === 'premium' ? 'default' : 'secondary'}>
                          {userDetail?.subscription_tier === 'premium' ? 'Premium' : 'Gratuito'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="display_hover_card">Exibir cartão de perfil ao passar o mouse</Label>
                    {isEditing ? (
                      <Switch
                        id="display_hover_card"
                        checked={editForm.display_hover_card}
                        onCheckedChange={(checked) => handleFieldChange('display_hover_card', checked)}
                      />
                    ) : (
                      <div className="text-sm">
                        {userDetail?.display_hover_card ? 'Sim' : 'Não'}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Pontuação de Contribuição</div>
                        <div className="text-2xl font-bold">{userDetail?.contribution_score || 0}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Membro desde</div>
                        <div className="text-sm text-muted-foreground">
                          {userDetail?.created_at ? 
                            new Date(userDetail.created_at).toLocaleDateString('pt-BR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 
                            'Data não disponível'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Papéis do Usuário
                  </CardTitle>
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
                            <Badge variant={role.role_name === 'admin' ? 'destructive' : 'default'}>
                              {role.role_name === 'admin' ? 'Admin' :
                               role.role_name === 'editor' ? 'Editor' :
                               role.role_name === 'moderator' ? 'Moderador' : 'Praticante'}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              Concedido em {new Date(role.granted_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          {role.expires_at && (
                            <div className="text-sm text-orange-600">
                              Expira em {new Date(role.expires_at).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhum papel adicional atribuído
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-muted-foreground">
                    Funcionalidade de atividade será implementada em versões futuras
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
