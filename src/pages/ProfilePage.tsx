
// ABOUTME: User profile page placeholder - future implementation per Blueprint 07.
import React from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const PerfilPage = () => {
  const { userProfile, isLoading } = useAppData();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse bg-muted h-32 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current User Info */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userProfile?.avatar_url ?? undefined} />
            <AvatarFallback>
              {userProfile?.full_name?.split(' ').map(n => n[0]).join('') ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{userProfile?.full_name ?? 'Usuário'}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{userProfile?.role ?? 'practitioner'}</Badge>
              <Badge variant="outline">{userProfile?.subscription_tier ?? 'free'} tier</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Future Profile Features */}
      <div className="border-l-4 border-primary bg-muted/50 p-6 rounded-r-lg">
        <h2 className="text-xl font-semibold mb-2">Perfil Completo em Desenvolvimento</h2>
        <p className="text-muted-foreground">
          Esta página será expandida conforme Blueprint 07 - Profile System.
        </p>
      </div>
      
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Funcionalidades Planejadas:</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Histórico de atividades e contribuições</li>
          <li>• Sistema de contribuição score detalhado</li>
          <li>• Reviews favoritos e listas personalizadas</li>
          <li>• Configurações de perfil avançadas</li>
          <li>• Estatísticas de engajamento</li>
        </ul>
      </div>
    </div>
  );
};

export default PerfilPage;
