// ABOUTME: Simplified admin interface for Reddit-perfect page customization - direct editing with always-on preview

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Save, Upload, Edit, Image, X, Type, Palette, User, Sparkles,
  Home, BookOpen, Users, Settings, Shield, FileText, Tags, Layout, 
  TrendingUp, MessageSquare, Heart, Star, Crown, Award, Target, 
  Zap, Flame, Sun, Moon, Flower, Leaf, Tree, Mountain, Coffee, 
  Music, Camera, Brush, Pen, Book, Calendar, Clock, Globe, 
  Mail, Phone, Laptop, Wifi, Battery, Volume2
} from 'lucide-react';
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { iconLibrary, getIconsByCategory, getIconComponent, type IconCategory } from '@/config/icon-library';
import { cn } from '@/lib/utils';

interface PageSettingsForm {
  title: string;
  title_prefix: string;
  title_color: string;
  prefix_color: string;
  font_family: string;
  title_size: string;
  prefix_size: string;
  title_size_custom: number | null;
  prefix_size_custom: number | null;
  show_avatar: boolean;
  title_shadow: boolean;
  prefix_shadow: boolean;
  banner_url: string;
  banner_background_color: string;
  avatar_url: string;
  avatar_type: 'image' | 'icon'; // New field to choose avatar type
  avatar_icon: string;
  avatar_icon_color: string;
  avatar_background_color: string;
  avatar_icon_size: number;
}

interface UploadState {
  bannerFile: File | null;
  avatarFile: File | null;
  bannerPreview: string | null;
  avatarPreview: string | null;
  uploading: boolean;
}

// Real-time preview component that uses form data instead of database data
const PageHeaderPreview: React.FC<{ 
  formData: PageSettingsForm;
  selectedPageId: string;
}> = ({ formData, selectedPageId }) => {
  const pageOptions = [
    { id: 'acervo', label: 'Acervo' },
    { id: 'comunidade', label: 'Comunidade' }
  ];

  const title = formData.title || pageOptions.find(p => p.id === selectedPageId)?.label || selectedPageId;
  
  return (
    <div className="w-full relative overflow-hidden">
      {/* Banner Section */}
      <div 
        className="h-16 bg-center bg-cover bg-slate-100 shadow-lg -mt-22 pt-22 rounded-b-lg"
        style={{
          backgroundImage: formData.banner_url ? `url('${formData.banner_url}')` : undefined,
          backgroundColor: formData.banner_background_color || undefined
        }}
      />
      
      {/* Header Content */}
      <div className="relative -mt-10 px-4 pb-2">
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            {formData.show_avatar && (
              <div className="relative">
                {formData.avatar_type === 'icon' && formData.avatar_icon ? (
                  <div 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                    style={{
                      backgroundColor: formData.avatar_background_color || 'hsl(var(--muted))',
                      color: formData.avatar_icon_color || 'hsl(var(--muted-foreground))'
                    }}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(formData.avatar_icon);
                      return <IconComponent size={formData.avatar_icon_size || 37} />;
                    })()}
                  </div>
                ) : formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt={`${title} avatar`}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center font-bold text-3xl bg-slate-200 text-slate-600">
                    {title?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div className="flex flex-col justify-end pb-2">
              <h1 
                className="font-bold leading-none"
                style={{ 
                  fontFamily: formData.font_family || 'Inter',
                  color: !formData.title_color && !formData.prefix_color ? 'inherit' : undefined
                }}
              >
                {formData.title_prefix && (
                  <span 
                    className={formData.prefix_size_custom ? '' : (formData.prefix_size || 'text-4xl')}
                    style={{ 
                      color: formData.prefix_color || 'inherit',
                      fontSize: formData.prefix_size_custom ? `${formData.prefix_size_custom}px` : undefined,
                      textShadow: formData.prefix_shadow ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
                    }}
                  >
                    {formData.title_prefix}
                  </span>
                )}
                <span 
                  className={formData.title_size_custom ? '' : (formData.title_size || 'text-4xl')}
                  style={{ 
                    color: formData.title_color || 'inherit',
                    fontSize: formData.title_size_custom ? `${formData.title_size_custom}px` : undefined,
                    textShadow: formData.title_shadow ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
                  }}
                >
                  {title}
                </span>
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    title_size_custom: null,
    prefix_size_custom: null,
    show_avatar: true,
    title_shadow: false,
    prefix_shadow: false,
    banner_url: '',
    banner_background_color: '',
    avatar_url: '',
    avatar_type: 'image', // Default to image type
    avatar_icon: '',
    avatar_icon_color: '',
    avatar_background_color: '',
    avatar_icon_size: 37,
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
  
  // Enhanced form initialization with all title system fields including advanced features
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
        title_size_custom: currentSettings.title_size_custom || null,
        prefix_size_custom: currentSettings.prefix_size_custom || null,
        show_avatar: currentSettings.show_avatar !== false, // Default to true
        title_shadow: currentSettings.title_shadow || false,
        prefix_shadow: currentSettings.prefix_shadow || false,
        banner_url: currentSettings.banner_url || '',
        banner_background_color: currentSettings.banner_background_color || '',
        avatar_url: currentSettings.avatar_url || '',
        avatar_type: (currentSettings.avatar_type as 'image' | 'icon') || 'image', // Default to image
        avatar_icon: currentSettings.avatar_icon || '',
        avatar_icon_color: currentSettings.avatar_icon_color || '',
        avatar_background_color: currentSettings.avatar_background_color || '',
        avatar_icon_size: currentSettings.avatar_icon_size || 37,
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

      // Save settings with uploaded URLs and complete title system including advanced features and icon avatars
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
          title_size_custom: formData.title_size_custom || null,
          prefix_size_custom: formData.prefix_size_custom || null,
          show_avatar: formData.show_avatar,
          title_shadow: formData.title_shadow,
          prefix_shadow: formData.prefix_shadow,
          banner_url: bannerUrl || null,
          banner_background_color: formData.banner_background_color || null,
          avatar_url: avatarUrl || null,
          avatar_type: formData.avatar_type,
          avatar_icon: formData.avatar_icon || null,
          avatar_icon_color: formData.avatar_icon_color || null,
          avatar_background_color: formData.avatar_background_color || null,
          avatar_icon_size: formData.avatar_icon_size || null,
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
      <StandardLayout type="full-width" contentClassName="space-y-6 max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Personalização de Páginas
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure títulos, banners e avatares com preview em tempo real
          </p>
        </div>

        {/* Page Selection - Compact Horizontal */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Página:
            </Label>
            <div className="flex gap-2">
              {pageOptions.map((page) => (
                <Button
                  key={page.id}
                  variant={selectedPageId === page.id ? "default" : "outline"}
                  size="sm"
                  className="px-4 py-2"
                  onClick={() => setSelectedPageId(page.id)}
                >
                  {page.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Live Preview */}
          <div className="order-2 lg:order-1">
            <Card className="sticky top-6 z-10">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Edit className="h-5 w-5" />
                  Preview em Tempo Real
                </CardTitle>
                <CardDescription>
                  Visualize suas mudanças instantaneamente
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden bg-background">
                  <PageHeaderPreview formData={formData} selectedPageId={selectedPageId} />
                </div>
              </CardContent>
            </Card>

            {/* Save Actions */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Todas as mudanças são aplicadas em tempo real no preview
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !currentSettings}
                    className="flex items-center gap-2 px-6 py-2"
                    size="lg"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Configuration */}
          <div className="order-1 lg:order-2">
            <div className="max-h-[calc(72vh-1.44rem)] overflow-y-auto space-y-6 pr-2">
            
            {/* Title Configuration */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Type className="h-5 w-5" />
                  Configuração do Título
                </CardTitle>
                <CardDescription>
                  Personalize título, prefixo e estilo da tipografia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

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
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={formData.title_size}
                      onValueChange={(value) => {
                        handleInputChange('title_size', value);
                        // Clear custom size when preset is selected
                        if (value) handleInputChange('title_size_custom', null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-2xl">Pequeno (2xl)</SelectItem>
                        <SelectItem value="text-3xl">Médio (3xl)</SelectItem>
                        <SelectItem value="text-4xl">Grande (4xl)</SelectItem>
                        <SelectItem value="text-5xl">Muito Grande (5xl)</SelectItem>
                        <SelectItem value="text-6xl">Gigante (6xl)</SelectItem>
                        <SelectItem value="text-7xl">Colossal (7xl)</SelectItem>
                        <SelectItem value="text-8xl">Enorme (8xl)</SelectItem>
                        <SelectItem value="text-9xl">Máximo (9xl)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="12"
                        max="200"
                        placeholder="px"
                        className="text-xs"
                        value={formData.title_size_custom || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          handleInputChange('title_size_custom', value);
                          // Clear preset when custom size is set
                          if (value) handleInputChange('title_size', '');
                        }}
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use preset ou digite pixels personalizados
                  </p>
                </div>

                {/* Prefix Size */}
                <div className="space-y-2">
                  <Label htmlFor="prefix_size">Tamanho do Prefixo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={formData.prefix_size}
                      onValueChange={(value) => {
                        handleInputChange('prefix_size', value);
                        // Clear custom size when preset is selected
                        if (value) handleInputChange('prefix_size_custom', null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-2xl">Pequeno (2xl)</SelectItem>
                        <SelectItem value="text-3xl">Médio (3xl)</SelectItem>
                        <SelectItem value="text-4xl">Grande (4xl)</SelectItem>
                        <SelectItem value="text-5xl">Muito Grande (5xl)</SelectItem>
                        <SelectItem value="text-6xl">Gigante (6xl)</SelectItem>
                        <SelectItem value="text-7xl">Colossal (7xl)</SelectItem>
                        <SelectItem value="text-8xl">Enorme (8xl)</SelectItem>
                        <SelectItem value="text-9xl">Máximo (9xl)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="12"
                        max="200"
                        placeholder="px"
                        className="text-xs"
                        value={formData.prefix_size_custom || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : null;
                          handleInputChange('prefix_size_custom', value);
                          // Clear preset when custom size is set
                          if (value) handleInputChange('prefix_size', '');
                        }}
                      />
                      <span className="text-xs text-muted-foreground">px</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use preset ou digite pixels personalizados
                  </p>
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

              {/* Avatar and Shadow Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Avatar Visibility */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Exibir Avatar
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.show_avatar}
                      onCheckedChange={(checked) => handleInputChange('show_avatar', checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.show_avatar ? 'Visível' : 'Oculto'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mostrar ou ocultar o avatar no cabeçalho
                  </p>
                </div>

                {/* Title Shadow */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Sombra do Título
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.title_shadow}
                      onCheckedChange={(checked) => handleInputChange('title_shadow', checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.title_shadow ? 'Com sombra' : 'Sem sombra'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Adicionar sombra ao texto do título
                  </p>
                </div>

                {/* Prefix Shadow */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Sombra do Prefixo
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.prefix_shadow}
                      onCheckedChange={(checked) => handleInputChange('prefix_shadow', checked)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.prefix_shadow ? 'Com sombra' : 'Sem sombra'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Adicionar sombra ao texto do prefixo
                  </p>
                </div>
              </div>

              </CardContent>
            </Card>
            
            {/* Banner Configuration */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image className="h-5 w-5" />
                  Configuração do Banner
                </CardTitle>
                <CardDescription>
                  Configure a imagem de fundo e cores do banner (64px altura)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              
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

                {/* Banner Background Color */}
                <div>
                  <Label htmlFor="banner_background_color" className="text-sm text-muted-foreground">
                    Cor de Fundo do Banner
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Útil para banners com transparência
                  </p>
                  <UnifiedColorPicker
                    value={formData.banner_background_color}
                    onColorSelect={(color) => handleInputChange('banner_background_color', color)}
                    placeholder="Selecione uma cor de fundo"
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

              </div>
              </CardContent>
            </Card>

            {/* Avatar Configuration */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Configuração do Avatar
                </CardTitle>
                <CardDescription>
                  Configure o avatar da página com imagem ou ícone (96px)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              
              {/* Avatar Type Selector */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Tipo de Avatar</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={formData.avatar_type === 'image' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        handleInputChange('avatar_type', 'image');
                        // Clear icon-related fields when switching to image
                        handleInputChange('avatar_icon', '');
                        handleInputChange('avatar_icon_color', '');
                        handleInputChange('avatar_background_color', '');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Image size={14} />
                      Imagem
                    </Button>
                    <Button
                      type="button"
                      variant={formData.avatar_type === 'icon' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        handleInputChange('avatar_type', 'icon');
                        // Clear image-related fields when switching to icon
                        handleInputChange('avatar_url', '');
                        setUploadState(prev => ({ ...prev, avatarFile: null, avatarPreview: null }));
                      }}
                      className="flex items-center gap-2"
                    >
                      <Star size={14} />
                      Ícone
                    </Button>
                  </div>
                </div>

                {/* Image Avatar Section */}
                {formData.avatar_type === 'image' && (
                  <div className="space-y-3 p-3 border rounded-md bg-muted/10">
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

                  </div>
                )}

                {/* Icon Avatar Section */}
                {formData.avatar_type === 'icon' && (
                  <div className="space-y-3 p-3 border rounded-md bg-muted/10">
                  
                  {/* Icon Selection Grid */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Selecionar Ícone</Label>
                      
                      {/* Icon Selection by Category */}
                      {(['storage', 'general', 'healthcare', 'emergency', 'science', 'ui'] as IconCategory[]).map(category => {
                        const categoryIcons = getIconsByCategory(category);
                        if (categoryIcons.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <Label className="text-xs text-muted-foreground capitalize">
                              {category === 'storage' ? 'Armazenamento' :
                               category === 'general' ? 'Geral' :
                               category === 'healthcare' ? 'Saúde' :
                               category === 'emergency' ? 'Emergência' :
                               category === 'science' ? 'Ciência' :
                               category === 'ui' ? 'Interface' : category}
                            </Label>
                            <div className="grid grid-cols-8 gap-2 p-2 border rounded-md bg-muted/20">
                              {categoryIcons.map(({ id, name, component: IconComponent }) => (
                                <Button
                                  key={id}
                                  type="button"
                                  variant={formData.avatar_icon === id ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleInputChange('avatar_icon', id)}
                                  className="h-10 w-10 p-0"
                                  title={name}
                                >
                                  <IconComponent size={18} />
                                </Button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Icon Colors and Size */}
                    {formData.avatar_icon && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Cor do Ícone</Label>
                            <UnifiedColorPicker
                              value={formData.avatar_icon_color}
                              onColorSelect={(color) => handleInputChange('avatar_icon_color', color)}
                              onColorClear={() => handleInputChange('avatar_icon_color', '')}
                              label="Cor do ícone"
                              placeholder="Cor padrão"
                              allowClear={true}
                              variant="button"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Cor de Fundo</Label>
                            <UnifiedColorPicker
                              value={formData.avatar_background_color}
                              onColorSelect={(color) => handleInputChange('avatar_background_color', color)}
                              onColorClear={() => handleInputChange('avatar_background_color', '')}
                              label="Cor de fundo do avatar"
                              placeholder="Cor padrão"
                              allowClear={true}
                              variant="button"
                            />
                          </div>
                        </div>
                        
                        {/* Icon Size Control */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Tamanho do Ícone</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              value={formData.avatar_icon_size}
                              onChange={(e) => handleInputChange('avatar_icon_size', parseInt(e.target.value) || 37)}
                              min="16"
                              max="64"
                              className="h-8 w-20 text-xs"
                            />
                            <span className="text-xs text-muted-foreground">px (16-64)</span>
                            <input
                              type="range"
                              value={formData.avatar_icon_size}
                              onChange={(e) => handleInputChange('avatar_icon_size', parseInt(e.target.value))}
                              min="16"
                              max="64"
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    </div>
                  </div>
                )}
              </div>
              </CardContent>
            </Card>

            </div>
          </div>
        </div>
      </StandardLayout>
    </ErrorBoundary>
  );
};

export default AdminLayoutManagement;