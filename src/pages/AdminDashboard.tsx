// ABOUTME: Main admin dashboard page with overview statistics and quick access to management modules

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AdminDashboardContent = () => {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Total de Reviews',
      value: '42',
      description: 'Reviews no sistema',
      icon: FileText,
      trend: '+12% este mês',
      trendUp: true,
    },
    {
      title: 'Usuários Ativos',
      value: '1,234',
      description: 'Praticantes registrados',
      icon: Users,
      trend: '+8% este mês',
      trendUp: true,
    },
    {
      title: 'Posts da Comunidade',
      value: '89',
      description: 'Discussões ativas',
      icon: MessageSquare,
      trend: '+23% este mês',
      trendUp: true,
    },
    {
      title: 'Engajamento',
      value: '94%',
      description: 'Taxa de retenção',
      icon: TrendingUp,
      trend: '+2% este mês',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header - Enhanced typography hierarchy */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground font-serif">
          Bem-vindo, {user?.user_metadata?.full_name || 'Admin'}
        </h2>
        <p className="text-secondary text-lg">Visão geral do sistema e estatísticas principais</p>
      </div>

      {/* Stats Grid - Enhanced with proper tokens and spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map(stat => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="bg-surface border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <p className="text-sm text-secondary mb-2">{stat.description}</p>
                <p
                  className={`text-sm font-medium ${stat.trendUp ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}
                >
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lower Section - Enhanced cards with proper styling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-surface border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Ações Rápidas</CardTitle>
            <CardDescription className="text-muted-foreground">
              Acesso rápido às funcionalidades mais utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-muted cursor-pointer transition-colors">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Fila de Publicação</h3>
                <p className="text-sm text-secondary">3 reviews aguardando aprovação</p>
              </div>
              <FileText className="h-5 w-5 text-secondary" />
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-muted cursor-pointer transition-colors">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Moderação</h3>
                <p className="text-sm text-secondary">2 posts reportados</p>
              </div>
              <MessageSquare className="h-5 w-5 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Atividade Recente
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Últimas ações administrativas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Review "Análise de Performance" aprovada
                  </p>
                  <p className="text-xs text-secondary">há 2 horas</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Novo usuário registrado</p>
                  <p className="text-xs text-secondary">há 4 horas</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-yellow-500 dark:bg-yellow-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Post da comunidade moderado</p>
                  <p className="text-xs text-secondary">há 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  return (
    <ErrorBoundary
      tier="page"
      context="dashboard administrativo"
      showHomeButton={true}
      showBackButton={true}
    >
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}

export { AdminDashboard };
