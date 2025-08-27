// ABOUTME: Simplified admin interface for Reddit-perfect page customization - direct editing with always-on preview

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Upload, Edit } from 'lucide-react';
import { 
  useAllPageSettings, 
  useUpdatePageSettings,
  PageSettings
} from '../../packages/hooks/usePageSettings';
import { StandardLayout } from '@/components/layout/StandardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/page/PageHeader';

interface PageSettingsForm {
  title: string;
  banner_url: string;
  avatar_url: string;
}

const AdminLayoutManagement: React.FC = () => {
  const { data: allSettings, isLoading, error, refetch } = useAllPageSettings();
  const updatePageSettings = useUpdatePageSettings();
  
  const [selectedPageId, setSelectedPageId] = useState<string>('acervo');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<PageSettingsForm>({
    title: '',
    banner_url: '',
    avatar_url: '',
  });

  // Get current page settings (simplified)
  const currentSettings = allSettings?.find(s => s.page_id === selectedPageId);
  
  // Simplified form initialization
  React.useEffect(() => {
    if (currentSettings) {
      setFormData({
        title: currentSettings.title || '',
        banner_url: currentSettings.banner_url || '',
        avatar_url: currentSettings.avatar_url || '',
      });
    }
  }, [currentSettings]);

  // Page options for selection (homepage doesn't have header)
  const pageOptions = [
    { id: 'acervo', label: 'Acervo', description: 'Coleção de reviews' },
    { id: 'comunidade', label: 'Comunidade', description: 'Discussões da comunidade' },
  ];

  // Simplified save handler
  const handleSave = async () => {
    if (!currentSettings) return;
    
    setIsSaving(true);
    try {
      await updatePageSettings.mutateAsync({
        pageId: selectedPageId,
        updates: {
          title: formData.title || null,
          banner_url: formData.banner_url || null,
          avatar_url: formData.avatar_url || null,
        }
      });
      
      await refetch();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof PageSettingsForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <StandardLayout type="centered" contentClassName="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </StandardLayout>
    );
  }

  if (error) {
    return (
      <StandardLayout type="centered">
        <Alert>
          <AlertDescription>
            Erro ao carregar configurações: {error.message}
          </AlertDescription>
        </Alert>
      </StandardLayout>
    );
  }

  return (
    <ErrorBoundary>
      <StandardLayout type="centered" contentClassName="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Personalização de Páginas
          </h2>
          <p className="text-muted-foreground">
            Configure títulos, banners e avatares com preview em tempo real.
          </p>
        </div>

        {/* Page Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Página</CardTitle>
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

        {/* Always-On Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Preview em Tempo Real
            </CardTitle>
            <CardDescription>
              As mudanças aparecem imediatamente no preview abaixo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-lg overflow-hidden">
              <PageHeader pageId={selectedPageId} />
            </div>
          </CardContent>
        </Card>

        {/* Simplified Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>
              Configure apenas os campos essenciais para Reddit parity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Página</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder={`Ex: ${pageOptions.find(p => p.id === selectedPageId)?.label}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="banner_url">URL do Banner (64px altura)</Label>
              <Input
                id="banner_url"
                value={formData.banner_url}
                onChange={(e) => handleInputChange('banner_url', e.target.value)}
                placeholder="https://exemplo.com/banner.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="avatar_url">URL do Avatar (80px)</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                placeholder="https://exemplo.com/avatar.jpg"
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                ✅ Reddit parity: 64px banner, 80px avatar, no descriptions
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !currentSettings}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </StandardLayout>
    </ErrorBoundary>
  );
};

export default AdminLayoutManagement;