// ABOUTME: Enhanced admin tag management page with hierarchy tools, analytics, and cleanup functionality

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tags, BarChart3, Trash2, Plus, TreePine, Activity, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTagAnalyticsQuery } from '../../packages/hooks/useTagManagementQuery';
import { TagHierarchy } from '@/components/admin/TagManagement/TagHierarchy';
import { TagAnalytics } from '@/components/admin/TagManagement/TagAnalytics';
import { TagCleanup } from '@/components/admin/TagManagement/TagCleanup';
import { StandardLayout } from '@/components/layout/StandardLayout';

const AdminTagManagement = () => {
  const { user } = useAuthStore();
  const { data: analytics, isLoading: analyticsLoading } = useTagAnalyticsQuery();

  // Quick stats for the overview cards
  const quickStats = {
    totalTags: analytics?.totalTags || 0,
    popularTags: analytics?.popularTags || 0,
    unusedTags: analytics?.unusedTags || 0,
    newThisMonth: analytics?.newThisMonth || 0,
  };

  return (
    <StandardLayout type="wide" contentClassName="space-y-6">
      {/* Header Section - Enhanced typography hierarchy */}
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-bold text-foreground mb-2 font-serif">Gestão de Tags</h2>
        <p className="text-muted-foreground text-lg">
          Organize e mantenha o sistema de tags para categorização de conteúdo.
        </p>
      </div>

      {/* Overview Statistics - Enhanced with proper tokens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total de Tags</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analyticsLoading ? '...' : quickStats.totalTags}
            </div>
            <p className="text-xs text-muted-foreground">Tags no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Tags Populares</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analyticsLoading ? '...' : quickStats.popularTags}
            </div>
            <p className="text-xs text-muted-foreground">Mais de 10 usos</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Tags Não Utilizadas
            </CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analyticsLoading ? '...' : quickStats.unusedTags}
            </div>
            <p className="text-xs text-muted-foreground">Sem conteúdo associado</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Novas Este Mês</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analyticsLoading ? '...' : quickStats.newThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">Criadas recentemente</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Interface */}
      <Tabs defaultValue="hierarchy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hierarchy" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Hierarquia
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="cleanup" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Limpeza
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="space-y-4">
          <TagHierarchy />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <TagAnalytics />
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-4">
          <TagCleanup />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-surface border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Configurações do Sistema de Tags
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Configurações globais para o comportamento das tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium text-foreground">Exportar Tags</div>
                    <div className="text-sm text-muted-foreground">
                      Baixar lista completa de tags em CSV
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium text-foreground">Importar Tags</div>
                    <div className="text-sm text-muted-foreground">Carregar tags de arquivo CSV</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium text-foreground">Sincronizar Hierarquia</div>
                    <div className="text-sm text-muted-foreground">
                      Verificar e corrigir relações de hierarquia
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium text-foreground">Recriar Índices</div>
                    <div className="text-sm text-muted-foreground">
                      Otimizar performance de busca de tags
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StandardLayout>
  );
};

export default AdminTagManagement;
