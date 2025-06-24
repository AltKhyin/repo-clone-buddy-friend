
// ABOUTME: Admin layout management page for visual system and design configuration

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout, Palette, Settings, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const AdminLayoutManagement: React.FC = () => {
  const { user } = useAuthStore();

  // Mock data for demonstration - would be replaced with actual hooks
  const layoutStats = {
    activeThemes: 2,
    layoutComponents: 15,
    customizations: 8,
    breakpoints: 4
  };

  const layoutComponents = [
    { id: 1, name: 'Header Principal', type: 'Cabeçalho', status: 'ativo', lastModified: '2025-06-20' },
    { id: 2, name: 'Sidebar Desktop', type: 'Navegação', status: 'ativo', lastModified: '2025-06-19' },
    { id: 3, name: 'Bottom Tab Bar', type: 'Navegação', status: 'ativo', lastModified: '2025-06-18' },
    { id: 4, name: 'Review Card', type: 'Conteúdo', status: 'ativo', lastModified: '2025-06-17' },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gestão de Layout
          </h2>
          <p className="text-gray-600">
            Configure o sistema visual, temas e componentes de layout da plataforma.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temas Ativos</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{layoutStats.activeThemes}</div>
              <p className="text-xs text-muted-foreground">
                Claro e Escuro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Componentes</CardTitle>
              <Layout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{layoutStats.layoutComponents}</div>
              <p className="text-xs text-muted-foreground">
                Componentes de layout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customizações</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{layoutStats.customizations}</div>
              <p className="text-xs text-muted-foreground">
                Configurações personalizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Breakpoints</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{layoutStats.breakpoints}</div>
              <p className="text-xs text-muted-foreground">
                Pontos de quebra responsivos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Design System Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema Visual</CardTitle>
            <CardDescription>
              Configurações globais do sistema de design
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <Palette className="mr-2 h-4 w-4" />
                Editor de Cores
              </Button>
              <Button variant="outline" className="justify-start">
                <Layout className="mr-2 h-4 w-4" />
                Configurar Grid
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Tipografia
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Design Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Teste Responsivo</CardTitle>
            <CardDescription>
              Visualize como o layout se comporta em diferentes dispositivos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start">
                <Monitor className="mr-2 h-4 w-4" />
                Desktop (1024px+)
              </Button>
              <Button variant="outline" className="justify-start">
                <Tablet className="mr-2 h-4 w-4" />
                Tablet (768px)
              </Button>
              <Button variant="outline" className="justify-start">
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile (&lt;768px)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Layout Components */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes de Layout</CardTitle>
            <CardDescription>
              Gerencie os componentes principais da interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {layoutComponents.map((component) => (
                <div key={component.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Layout className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">{component.name}</h3>
                      <p className="text-sm text-gray-500">{component.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={component.status === 'ativo' ? 'default' : 'secondary'}>
                      {component.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(component.lastModified).toLocaleDateString('pt-BR')}
                    </span>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminLayoutManagement;
