
// ABOUTME: Enhanced admin tag management page with hierarchy tools, analytics, and cleanup functionality

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tags, 
  BarChart3, 
  Trash2, 
  Plus, 
  TreePine,
  Activity,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTagAnalyticsQuery } from '../../packages/hooks/useTagManagementQuery';
import { TagHierarchy } from '@/components/admin/TagManagement/TagHierarchy';
import { TagAnalytics } from '@/components/admin/TagManagement/TagAnalytics';
import { TagCleanup } from '@/components/admin/TagManagement/TagCleanup';

const AdminTagManagement = () => {
  const { user } = useAuthStore();
  const { data: analytics, isLoading: analyticsLoading } = useTagAnalyticsQuery();

  // Quick stats for the overview cards
  const quickStats = {
    totalTags: analytics?.totalTags || 0,
    popularTags: analytics?.popularTags || 0,
    unusedTags: analytics?.unusedTags || 0,
    newThisMonth: analytics?.newThisMonth || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Gestão de Tags
        </h2>
        <p className="text-gray-600">
          Organize e mantenha o sistema de tags para categorização de conteúdo.
        </p>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tags</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : quickStats.totalTags}
            </div>
            <p className="text-xs text-muted-foreground">
              Tags no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags Populares</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : quickStats.popularTags}
            </div>
            <p className="text-xs text-muted-foreground">
              Mais de 10 usos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags Não Utilizadas</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : quickStats.unusedTags}
            </div>
            <p className="text-xs text-muted-foreground">
              Sem conteúdo associado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas Este Mês</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : quickStats.newThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">
              Criadas recentemente
            </p>
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
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema de Tags</CardTitle>
              <CardDescription>
                Configurações globais para o comportamento das tags
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Exportar Tags</div>
                    <div className="text-sm text-gray-500">
                      Baixar lista completa de tags em CSV
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Importar Tags</div>
                    <div className="text-sm text-gray-500">
                      Carregar tags de arquivo CSV
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Sincronizar Hierarquia</div>
                    <div className="text-sm text-gray-500">
                      Verificar e corrigir relações de hierarquia
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Recriar Índices</div>
                    <div className="text-sm text-gray-500">
                      Otimizar performance de busca de tags
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTagManagement;
