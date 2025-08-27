// ABOUTME: Simplified admin interface for Reddit-perfect page customization - direct editing with always-on preview

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Upload, Edit, Image, X, Type, Palette } from 'lucide-react';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useAllPageSettings, 
  useUpdatePageSettings,
  PageSettings
} from '../../packages/hooks/usePageSettings';
import { StandardLayout } from '@/components/layout/StandardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';
import PageHeader from '@/components/page/PageHeader';

interface PageSettingsForm {
  title: string;
  title_prefix: string;
  title_color: string;
  prefix_color: string;
  font_family: string;
  title_size: string;
  prefix_size: string;
  banner_url: string;
  avatar_url: string;
}

interface UploadState {
  bannerFile: File | null;
  avatarFile: File | null;
  bannerPreview: string | null;
  avatarPreview: string | null;
  uploading: boolean;
}

const AdminLayoutManagement: React.FC = () => {
  const { data: allSettings, isLoading, error, refetch } = useAllPageSettings();
  const updatePageSettings = useUpdatePageSettings();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [selectedPageId, setSelectedPageId] = useState<string>('acervo');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<PageSettingsForm>({
    title: '',
    title_prefix: '',
    title_color: '',
    prefix_color: '',
    font_family: 'Inter',
    title_size: 'text-4xl',
    prefix_size: 'text-4xl',
    banner_url: '',
    avatar_url: '',
  });

  const [uploadState, setUploadState] = useState<UploadState>({
    bannerFile: null,
    avatarFile: null,
    bannerPreview: null,
    avatarPreview: null,
    uploading: false,
  });

  // File input refs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Get current page settings (simplified)
  const currentSettings = allSettings?.find(s => s.page_id === selectedPageId);
  
  // Enhanced form initialization with title system fields
  React.useEffect(() => {
    if (currentSettings) {
      setFormData({
        title: currentSettings.title || '',
        title_prefix: currentSettings.title_prefix || '',
        title_color: currentSettings.title_color || '',
        prefix_color: currentSettings.prefix_color || '',
        font_family: currentSettings.font_family || 'Inter',
        title_size: currentSettings.title_size || 'text-4xl',
        prefix_size: currentSettings.prefix_size || 'text-4xl',
        banner_url: currentSettings.banner_url || '',
        avatar_url: currentSettings.avatar_url || '',
      });
    }
  }, [currentSettings]);

  // File upload handling
  const handleFileSelect = (file: File, type: 'banner' | 'avatar') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor selecione um arquivo de imagem',
        variant: 'destructive',
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setUploadState(prev => ({
      ...prev,
      [type === 'banner' ? 'bannerFile' : 'avatarFile']: file,
      [type === 'banner' ? 'bannerPreview' : 'avatarPreview']: previewUrl,
    }));
  };

  const uploadFile = async (file: File, type: 'banner' | 'avatar'): Promise<string | null> => {
    if (!user) return null;

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedPageId}-${type}-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      // Upload to Supabase Storage - Note: 'page-headers' bucket must be created manually
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-headers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error(`${type} upload error:`, uploadError);
        toast({
          title: 'Erro no Upload',
          description: `Erro ao fazer upload do ${type === 'banner' ? 'banner' : 'avatar'}`,
          variant: 'destructive',
        });
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('page-headers')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error(`${type} upload failed:`, error);
      toast({
        title: 'Erro',
        description: `Falha no upload do ${type === 'banner' ? 'banner' : 'avatar'}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const clearFile = (type: 'banner' | 'avatar') => {
    const previewUrl = type === 'banner' ? uploadState.bannerPreview : uploadState.avatarPreview;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setUploadState(prev => ({
      ...prev,
      [type === 'banner' ? 'bannerFile' : 'avatarFile']: null,
      [type === 'banner' ? 'bannerPreview' : 'avatarPreview']: null,
    }));

    // Reset file input
    if (type === 'banner' && bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
    if (type === 'avatar' && avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  // Page options for selection (homepage doesn't have header)
  const pageOptions = [
    { id: 'acervo', label: 'Acervo', description: 'Coleção de reviews' },
    { id: 'comunidade', label: 'Comunidade', description: 'Discussões da comunidade' },
  ];

  // Enhanced save handler with file upload support
  const handleSave = async () => {
    if (!currentSettings) return;
    
    setIsSaving(true);
    setUploadState(prev => ({ ...prev, uploading: true }));
    
    try {
      let bannerUrl = formData.banner_url;
      let avatarUrl = formData.avatar_url;

      // Upload banner file if selected
      if (uploadState.bannerFile) {
        const uploadedBannerUrl = await uploadFile(uploadState.bannerFile, 'banner');
        if (uploadedBannerUrl) {
          bannerUrl = uploadedBannerUrl;
          // Update form data for immediate preview
          setFormData(prev => ({ ...prev, banner_url: uploadedBannerUrl }));
        } else {
          // Upload failed, don't proceed
          toast({
            title: 'Erro',
            description: 'Falha no upload do banner. Tente novamente.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Upload avatar file if selected
      if (uploadState.avatarFile) {
        const uploadedAvatarUrl = await uploadFile(uploadState.avatarFile, 'avatar');
        if (uploadedAvatarUrl) {
          avatarUrl = uploadedAvatarUrl;
          // Update form data for immediate preview
          setFormData(prev => ({ ...prev, avatar_url: uploadedAvatarUrl }));
        } else {
          // Upload failed, don't proceed
          toast({
            title: 'Erro',
            description: 'Falha no upload do avatar. Tente novamente.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Save settings with uploaded URLs and enhanced title system
      await updatePageSettings.mutateAsync({
        pageId: selectedPageId,
        updates: {
          title: formData.title || null,
          title_prefix: formData.title_prefix || null,
          title_color: formData.title_color || null,
          prefix_color: formData.prefix_color || null,
          font_family: formData.font_family || 'Inter',
          title_size: formData.title_size || 'text-4xl',
          prefix_size: formData.prefix_size || 'text-4xl',
          banner_url: bannerUrl || null,
          avatar_url: avatarUrl || null,
        }
      });
      
      // Clear upload state after successful save
      setUploadState({
        bannerFile: null,
        avatarFile: null,
        bannerPreview: null,
        avatarPreview: null,
        uploading: false,
      });

      // Reset file inputs
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      
      await refetch();
      
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setUploadState(prev => ({ ...prev, uploading: false }));
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
            {/* Enhanced Title System */}
            <div className="space-y-6 border rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Sistema de Título Aprimorado</Label>
              </div>

              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title">Título da Página</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={`Ex: ${pageOptions.find(p => p.id === selectedPageId)?.label}`}
                />
              </div>

              {/* Title Prefix Field */}
              <div className="space-y-2">
                <Label htmlFor="title_prefix">Prefixo (opcional)</Label>
                <Input
                  id="title_prefix"
                  value={formData.title_prefix}
                  onChange={(e) => handleInputChange('title_prefix', e.target.value)}
                  placeholder="Ex: R."
                  className="max-w-24"
                />
                <p className="text-xs text-muted-foreground">
                  Aparecerá antes do título como texto único
                </p>
              </div>

              {/* Font Family Field */}
              <div className="space-y-2">
                <Label htmlFor="font_family">Fonte</Label>
                <Select
                  value={formData.font_family}
                  onValueChange={(value) => handleInputChange('font_family', value)}
                >
                  <SelectTrigger style={{ fontFamily: formData.font_family }}>
                    <SelectValue placeholder="Selecione uma fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter" style={{ fontFamily: 'Inter' }}>
                      <span style={{ fontFamily: 'Inter' }}>Inter (Padrão do Sistema)</span>
                    </SelectItem>
                    <SelectItem value="Source Serif 4" style={{ fontFamily: 'Source Serif 4' }}>
                      <span style={{ fontFamily: 'Source Serif 4' }}>Source Serif 4 (Logo Font)</span>
                    </SelectItem>
                    <SelectItem value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>
                      <span style={{ fontFamily: 'Playfair Display' }}>Playfair Display (Elegante)</span>
                    </SelectItem>
                    <SelectItem value="Montserrat" style={{ fontFamily: 'Montserrat' }}>
                      <span style={{ fontFamily: 'Montserrat' }}>Montserrat (Moderna)</span>
                    </SelectItem>
                    <SelectItem value="Crimson Text" style={{ fontFamily: 'Crimson Text' }}>
                      <span style={{ fontFamily: 'Crimson Text' }}>Crimson Text (Editorial)</span>
                    </SelectItem>
                    <SelectItem value="Lora" style={{ fontFamily: 'Lora' }}>
                      <span style={{ fontFamily: 'Lora' }}>Lora (Legível)</span>
                    </SelectItem>
                    <SelectItem value="Poppins" style={{ fontFamily: 'Poppins' }}>
                      <span style={{ fontFamily: 'Poppins' }}>Poppins (Amigável)</span>
                    </SelectItem>
                    <SelectItem value="Roboto" style={{ fontFamily: 'Roboto' }}>
                      <span style={{ fontFamily: 'Roboto' }}>Roboto (Tecnológica)</span>
                    </SelectItem>
                    <SelectItem value="Open Sans" style={{ fontFamily: 'Open Sans' }}>
                      <span style={{ fontFamily: 'Open Sans' }}>Open Sans (Neutra)</span>
                    </SelectItem>
                    <SelectItem value="Merriweather" style={{ fontFamily: 'Merriweather' }}>
                      <span style={{ fontFamily: 'Merriweather' }}>Merriweather (Leitura)</span>
                    </SelectItem>
                    <SelectItem value="Georgia" style={{ fontFamily: 'Georgia' }}>
                      <span style={{ fontFamily: 'Georgia' }}>Georgia (Clássica)</span>
                    </SelectItem>
                    <SelectItem value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>
                      <span style={{ fontFamily: 'Times New Roman' }}>Times New Roman (Tradicional)</span>
                    </SelectItem>
                    <SelectItem value="Arial" style={{ fontFamily: 'Arial' }}>
                      <span style={{ fontFamily: 'Arial' }}>Arial (Sans-serif)</span>
                    </SelectItem>
                    <SelectItem value="Helvetica" style={{ fontFamily: 'Helvetica' }}>
                      <span style={{ fontFamily: 'Helvetica' }}>Helvetica (Swiss)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Source Serif 4 é a fonte usada no logotipo da marca
                </p>
              </div>

              {/* Text Size Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title Size */}
                <div className="space-y-2">
                  <Label htmlFor="title_size">Tamanho do Título</Label>
                  <Select
                    value={formData.title_size}
                    onValueChange={(value) => handleInputChange('title_size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-2xl">Pequeno (2xl)</SelectItem>
                      <SelectItem value="text-3xl">Médio (3xl)</SelectItem>
                      <SelectItem value="text-4xl">Grande (4xl) - Padrão</SelectItem>
                      <SelectItem value="text-5xl">Muito Grande (5xl)</SelectItem>
                      <SelectItem value="text-6xl">Gigante (6xl)</SelectItem>
                      <SelectItem value="text-7xl">Colossal (7xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Prefix Size */}
                <div className="space-y-2">
                  <Label htmlFor="prefix_size">Tamanho do Prefixo</Label>
                  <Select
                    value={formData.prefix_size}
                    onValueChange={(value) => handleInputChange('prefix_size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-2xl">Pequeno (2xl)</SelectItem>
                      <SelectItem value="text-3xl">Médio (3xl)</SelectItem>
                      <SelectItem value="text-4xl">Grande (4xl) - Padrão</SelectItem>
                      <SelectItem value="text-5xl">Muito Grande (5xl)</SelectItem>
                      <SelectItem value="text-6xl">Gigante (6xl)</SelectItem>
                      <SelectItem value="text-7xl">Colossal (7xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color Pickers Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title Color */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    Cor do Título
                  </Label>
                  <div className="flex items-center gap-2">
                    <UnifiedColorPicker
                      value={formData.title_color}
                      onColorSelect={(color) => handleInputChange('title_color', color)}
                      onColorClear={() => handleInputChange('title_color', '')}
                      label="Cor do título"
                      placeholder="Cor padrão do tema"
                      allowClear={true}
                      variant="button"
                    />
                    {formData.title_color && (
                      <span className="text-xs text-muted-foreground">
                        {formData.title_color}
                      </span>
                    )}
                  </div>
                </div>

                {/* Prefix Color */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-3 w-3" />
                    Cor do Prefixo
                  </Label>
                  <div className="flex items-center gap-2">
                    <UnifiedColorPicker
                      value={formData.prefix_color}
                      onColorSelect={(color) => handleInputChange('prefix_color', color)}
                      onColorClear={() => handleInputChange('prefix_color', '')}
                      label="Cor do prefixo"
                      placeholder="Cor padrão do tema"
                      allowClear={true}
                      variant="button"
                    />
                    {formData.prefix_color && (
                      <span className="text-xs text-muted-foreground">
                        {formData.prefix_color}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 border rounded bg-white">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <div 
                  className="font-bold leading-tight"
                  style={{ fontFamily: formData.font_family }}
                >
                  {formData.title_prefix && (
                    <span 
                      className={formData.prefix_size}
                      style={{ color: formData.prefix_color || 'inherit' }}
                    >
                      {formData.title_prefix}
                    </span>
                  )}
                  <span 
                    className={formData.title_size}
                    style={{ color: formData.title_color || 'inherit' }}
                  >
                    {formData.title || 'Título da Página'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Banner Section with Upload */}
            <div className="space-y-4">
              <Label>Banner da Página (64px altura)</Label>
              
              <div className="space-y-3">
                {/* URL Input */}
                <div>
                  <Label htmlFor="banner_url" className="text-sm text-muted-foreground">
                    URL do Banner
                  </Label>
                  <Input
                    id="banner_url"
                    value={formData.banner_url}
                    onChange={(e) => handleInputChange('banner_url', e.target.value)}
                    placeholder="https://exemplo.com/banner.jpg"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-sm text-muted-foreground">
                    ou Fazer Upload
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'banner');
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={uploadState.uploading}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Banner
                    </Button>
                    
                    {uploadState.bannerFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFile('banner')}
                        className="flex items-center gap-1 text-destructive"
                      >
                        <X className="h-3 w-3" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>

                {/* Banner Preview */}
                {(uploadState.bannerPreview || formData.banner_url) && (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={uploadState.bannerPreview || formData.banner_url}
                      alt="Banner preview"
                      className="w-full h-16 object-cover bg-slate-100"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Section with Upload */}
            <div className="space-y-4">
              <Label>Avatar da Página (96px)</Label>
              
              <div className="space-y-3">
                {/* URL Input */}
                <div>
                  <Label htmlFor="avatar_url" className="text-sm text-muted-foreground">
                    URL do Avatar
                  </Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    placeholder="https://exemplo.com/avatar.jpg"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-sm text-muted-foreground">
                    ou Fazer Upload
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'avatar');
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadState.uploading}
                      className="flex items-center gap-2"
                    >
                      <Image className="h-4 w-4" />
                      Upload Avatar
                    </Button>
                    
                    {uploadState.avatarFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearFile('avatar')}
                        className="flex items-center gap-1 text-destructive"
                      >
                        <X className="h-3 w-3" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>

                {/* Avatar Preview */}
                {(uploadState.avatarPreview || formData.avatar_url) && (
                  <div className="flex justify-start">
                    <img
                      src={uploadState.avatarPreview || formData.avatar_url}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm bg-slate-100"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                ✅ Enhanced design: 64px banner, 96px avatar, aligned title
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