
// ABOUTME: Main admin dashboard page with overview statistics and quick access to management modules

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export const AdminDashboard = () => {
  const { user } = useAuthStore();
  
  const stats = [
    {
      title: 'Total de Reviews',
      value: '42',
      description: 'Reviews no sistema',
      icon: FileText,
      trend: '+12% este mês'
    },
    {
      title: 'Usuários Ativos',
      value: '1,234',
      description: 'Praticantes registrados',
      icon: Users,
      trend: '+8% este mês'
    },
    {
      title: 'Posts da Comunidade',
      value: '89',
      description: 'Discussões ativas',
      icon: MessageSquare,
      trend: '+23% este mês'
    },
    {
      title: 'Engajamento',
      value: '94%',
      description: 'Taxa de retenção',
      icon: TrendingUp,
      trend: '+2% este mês'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo, {user?.user_metadata?.full_name || 'Admin'}
        </h2>
        <p className="text-gray-600">
          Visão geral do sistema e estatísticas principais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades mais utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <h3 className="font-medium">Fila de Publicação</h3>
                <p className="text-sm text-gray-600">3 reviews aguardando aprovação</p>
              </div>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <h3 className="font-medium">Moderação</h3>
                <p className="text-sm text-gray-600">2 posts reportados</p>
              </div>
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações administrativas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">Review "Análise de Performance" aprovada</p>
                  <p className="text-xs text-gray-500">há 2 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">Novo usuário registrado</p>
                  <p className="text-xs text-gray-500">há 4 horas</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">Post da comunidade moderado</p>
                  <p className="text-xs text-gray-500">há 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
