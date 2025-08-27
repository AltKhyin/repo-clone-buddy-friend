// ABOUTME: Admin page header customization interface for managing page banners, avatars, and titles

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Upload, Eye, Trash2, Settings, Image, Type } from 'lucide-react';
import { useAllPageSettings, useUpdatePageSettings, PageSettings } from '../../packages/hooks/usePageSettings';
import { StandardLayout } from '@/components/layout/StandardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/page/PageHeader';

interface PageSettingsForm {
  title: string;
  description: string;
  banner_url: string;
  avatar_url: string;
  theme_color: string;
  banner_urls: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
}

const AdminLayoutManagement: React.FC = () => {
  const { data: allSettings, isLoading, error, refetch } = useAllPageSettings();
  const updatePageSettings = useUpdatePageSettings();
  
  const [selectedPageId, setSelectedPageId] = useState<string>('acervo');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [formData, setFormData] = useState<PageSettingsForm>({
    title: '',
    description: '',
    banner_url: '',
    avatar_url: '',
    theme_color: '#0F172A',
    banner_urls: {
      small: '',
      medium: '',
      large: '',
      xlarge: '',
    },
  });

  // Get current page settings
  const currentSettings = allSettings?.find(s => s.page_id === selectedPageId);
  
  // Update form when page selection or data changes
  React.useEffect(() => {
    if (currentSettings) {
      setFormData({
        title: currentSettings.title || '',
        description: currentSettings.description || '',
        banner_url: currentSettings.banner_url || '',
        avatar_url: currentSettings.avatar_url || '',
        theme_color: currentSettings.theme_color || '#0F172A',
        banner_urls: {
          small: currentSettings.banner_urls?.small || '',
          medium: currentSettings.banner_urls?.medium || '',
          large: currentSettings.banner_urls?.large || '',
          xlarge: currentSettings.banner_urls?.xlarge || '',
        },
      });
    }
  }, [currentSettings]);

  const handleSave = async () => {
    try {
      await updatePageSettings.mutateAsync({
        pageId: selectedPageId,
        updates: {
          title: formData.title || null,
          description: formData.description || null,
          banner_url: formData.banner_url || null,
          avatar_url: formData.avatar_url || null,
          theme_color: formData.theme_color,
          banner_urls: Object.values(formData.banner_urls).some(url => url.trim()) 
            ? formData.banner_urls 
            : null,
        },
      });
    } catch (error) {
      console.error('Failed to save page settings:', error);
    }
  };

  const handleInputChange = (field: keyof PageSettingsForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBannerUrlChange = (size: keyof PageSettingsForm['banner_urls'], value: string) => {
    setFormData(prev => ({
      ...prev,
      banner_urls: { ...prev.banner_urls, [size]: value }
    }));
  };

  const pageOptions = [
    { id: 'acervo', label: 'Acervo', description: 'Página de reviews e conteúdo' },
    { id: 'comunidade', label: 'Comunidade', description: 'Página de discussões' },
  ];

  if (isLoading) {
    return (
      <ErrorBoundary
        tier="feature"
        context="customização de páginas"
        showDetails={process.env.NODE_ENV === 'development'}
        showHomeButton={true}
        showBackButton={true}
      >
        <StandardLayout type="centered" contentClassName="space-y-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </StandardLayout>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary
        tier="feature"
        context="customização de páginas"
        showDetails={process.env.NODE_ENV === 'development'}
        showHomeButton={true}
        showBackButton={true}
      >
        <StandardLayout type="centered" contentClassName="space-y-6">
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao carregar configurações das páginas: {error.message}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} variant="outline">
            Tentar Novamente
          </Button>
        </StandardLayout>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary
      tier="feature"
      context="customização de páginas"
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
      showBackButton={true}
    >
      <StandardLayout type="centered" contentClassName="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Personalização de Páginas
          </h2>
          <p className="text-muted-foreground">
            Configure banners, avatares e títulos das páginas principais do site.
          </p>
        </div>

        {/* Page Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Página</CardTitle>
            <CardDescription>Escolha a página que deseja personalizar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageOptions.map((page) => (
                <Button
                  key={page.id}
                  variant={selectedPageId === page.id ? "default" : "outline"}
                  className="justify-start h-auto p-4 flex-col items-start"
                  onClick={() => setSelectedPageId(page.id)}
                >
                  <span className="font-semibold">{page.label}</span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {page.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview Toggle */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Personalizando: {pageOptions.find(p => p.id === selectedPageId)?.label}
          </h3>
          <Button
            variant={isPreviewMode ? "default" : "outline"}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {isPreviewMode ? 'Esconder Preview' : 'Mostrar Preview'}
          </Button>
        </div>

        {/* Live Preview */}
        {isPreviewMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <PageHeader pageId={selectedPageId} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Imagens
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Avançado
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Página</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Acervo EVIDENS"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Breve descrição da página..."
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme_color">Cor do Tema</Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme_color"
                      type="color"
                      value={formData.theme_color}
                      onChange={(e) => handleInputChange('theme_color', e.target.value)}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.theme_color}
                      onChange={(e) => handleInputChange('theme_color', e.target.value)}
                      placeholder="#0F172A"
                      className="flex-1"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">URL do Avatar</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    placeholder="https://exemplo.com/avatar.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    Recomendado: 128x128px, formato PNG ou JPG
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label>Banner Responsivo</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure diferentes tamanhos para uma experiência responsiva
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="banner_small">Banner Pequeno (Mobile)</Label>
                      <Input
                        id="banner_small"
                        value={formData.banner_urls.small}
                        onChange={(e) => handleBannerUrlChange('small', e.target.value)}
                        placeholder="https://exemplo.com/banner-small.jpg"
                      />
                      <p className="text-xs text-muted-foreground">Até 768px</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="banner_medium">Banner Médio (Tablet)</Label>
                      <Input
                        id="banner_medium"
                        value={formData.banner_urls.medium}
                        onChange={(e) => handleBannerUrlChange('medium', e.target.value)}
                        placeholder="https://exemplo.com/banner-medium.jpg"
                      />
                      <p className="text-xs text-muted-foreground">768px - 1024px</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="banner_large">Banner Grande (Desktop)</Label>
                      <Input
                        id="banner_large"
                        value={formData.banner_urls.large}
                        onChange={(e) => handleBannerUrlChange('large', e.target.value)}
                        placeholder="https://exemplo.com/banner-large.jpg"
                      />
                      <p className="text-xs text-muted-foreground">1024px - 1440px</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="banner_xlarge">Banner Extra Grande (4K)</Label>
                      <Input
                        id="banner_xlarge"
                        value={formData.banner_urls.xlarge}
                        onChange={(e) => handleBannerUrlChange('xlarge', e.target.value)}
                        placeholder="https://exemplo.com/banner-xlarge.jpg"
                      />
                      <p className="text-xs text-muted-foreground">1440px+</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="banner_url">Banner URL Único (Fallback)</Label>
                  <Input
                    id="banner_url"
                    value={formData.banner_url}
                    onChange={(e) => handleInputChange('banner_url', e.target.value)}
                    placeholder="https://exemplo.com/banner.jpg"
                  />
                  <p className="text-sm text-muted-foreground">
                    Usado quando não há banners responsivos configurados
                  </p>
                </div>
                
                <div className="pt-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Dica:</strong> Para melhor performance, use o sistema de banners responsivos 
                      na aba "Imagens" ao invés do banner único.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              if (currentSettings) {
                setFormData({
                  title: currentSettings.title || '',
                  description: currentSettings.description || '',
                  banner_url: currentSettings.banner_url || '',
                  avatar_url: currentSettings.avatar_url || '',
                  theme_color: currentSettings.theme_color || '#0F172A',
                  banner_urls: {
                    small: currentSettings.banner_urls?.small || '',
                    medium: currentSettings.banner_urls?.medium || '',
                    large: currentSettings.banner_urls?.large || '',
                    xlarge: currentSettings.banner_urls?.xlarge || '',
                  },
                });
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Resetar
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={updatePageSettings.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updatePageSettings.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </StandardLayout>
    </ErrorBoundary>
  );
};

export default AdminLayoutManagement;