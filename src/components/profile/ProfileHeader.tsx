// ABOUTME: Complete profile header with name, profession, social links and avatar upload

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Linkedin, 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter, 
  Globe,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Calendar,
  Award,
  Settings
} from 'lucide-react';
import { useUpdateProfileMutation } from '../../../packages/hooks/useUpdateProfileMutation';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import type { ExtendedUserProfile, ProfileUpdateData } from '@/types';

interface ProfileHeaderProps {
  userProfile: ExtendedUserProfile | undefined;
  isLoading?: boolean;
}

interface CompleteProfileData {
  full_name: string;
  profession: string;
  linkedin_url: string;
  youtube_url: string;
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  website_url: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  userProfile, 
  isLoading = false 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CompleteProfileData>({
    full_name: userProfile?.full_name || '',
    profession: userProfile?.profession || '',
    linkedin_url: userProfile?.linkedin_url || '',
    youtube_url: userProfile?.youtube_url || '',
    instagram_url: userProfile?.instagram_url || '',
    facebook_url: userProfile?.facebook_url || '',
    twitter_url: userProfile?.twitter_url || '',
    website_url: userProfile?.website_url || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfileMutation();
  const session = useAuthStore((state) => state.session);

  // Update form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile?.full_name || '',
        profession: userProfile?.profession || '',
        linkedin_url: userProfile?.linkedin_url || '',
        youtube_url: userProfile?.youtube_url || '',
        instagram_url: userProfile?.instagram_url || '',
        facebook_url: userProfile?.facebook_url || '',
        twitter_url: userProfile?.twitter_url || '',
        website_url: userProfile?.website_url || '',
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(formData);
      setIsEditing(false);
      toast({
        title: "Perfil atualizado",
        description: "Seu nome foi salvo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar perfil",
        description: "Não foi possível salvar suas informações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: userProfile?.full_name || '',
      profession: userProfile?.profession || '',
      linkedin_url: userProfile?.linkedin_url || '',
      youtube_url: userProfile?.youtube_url || '',
      instagram_url: userProfile?.instagram_url || '',
      facebook_url: userProfile?.facebook_url || '',
      twitter_url: userProfile?.twitter_url || '',
      website_url: userProfile?.website_url || '',
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof CompleteProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Por favor, selecione uma imagem menor que 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      
      toast({
        title: "Uploading avatar...",
        description: "Sua foto está sendo enviada.",
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update user profile with new avatar URL
      await updateProfileMutation.mutateAsync({
        avatar_url: urlData.publicUrl
      });

      toast({
        title: "Avatar atualizado!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível atualizar sua foto de perfil. Tente novamente.",
        variant: "destructive",
      });
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSocialUrl = (url: string, platform: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    switch (platform) {
      case 'linkedin': return `https://linkedin.com/in/${url}`;
      case 'youtube': return `https://youtube.com/@${url}`;
      case 'instagram': return `https://instagram.com/${url}`;
      case 'facebook': return `https://facebook.com/${url}`;
      case 'twitter': return `https://twitter.com/${url}`;
      default: return url.startsWith('www.') ? `https://${url}` : `https://www.${url}`;
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const calculateProfileCompletion = () => {
    if (!userProfile) return 0;
    
    const fields = [
      userProfile.full_name,
      userProfile.profession,
      userProfile.avatar_url,
      userProfile.linkedin_url,
      userProfile.youtube_url,
      userProfile.instagram_url,
      userProfile.facebook_url,
      userProfile.twitter_url,
      userProfile.website_url
    ];
    
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateProfileCompletion();
  const isProfileComplete = completionPercentage >= 80;

  const getCompletionColor = () => {
    if (completionPercentage >= 80) return 'text-green-600';
    if (completionPercentage >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getCompletionIcon = () => {
    if (completionPercentage >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-orange-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-40 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                <div className="h-5 w-20 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 w-full bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Banner */}
      {!isProfileComplete && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {getCompletionIcon()}
              <div className="flex-1">
                <h3 className="font-medium text-sm">Complete seu perfil</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Seu perfil está {completionPercentage}% completo. Adicione mais informações para melhorar sua presença.
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-semibold ${getCompletionColor()}`}>
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Profile Card */}
      <Card>
        <CardHeader className="pb-6">
          <div className="flex items-start gap-8">
            {/* Avatar Section */}
            <div className="relative group flex-shrink-0">
              <div 
                className="relative h-32 w-32 rounded-full overflow-hidden ring-4 ring-background shadow-lg cursor-pointer"
                onClick={handleAvatarUpload}
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={userProfile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-2xl font-semibold">
                    {userProfile?.full_name?.split(' ').map(n => n[0]).join('') ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Camera className="h-8 w-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">Alterar foto</span>
                  </div>
                </div>
              </div>
              
              {/* Profile Completion Ring */}
              <div className="absolute -inset-1 rounded-full pointer-events-none">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted/20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${completionPercentage * 3.01} 301`}
                    className={`transition-all duration-500 ${getCompletionColor()}`}
                  />
                </svg>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-6">
              {/* Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {!isEditing && (
                    <div className="space-y-3">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground leading-tight">
                          {userProfile?.full_name ?? 'Usuário'}
                        </h1>
                        {userProfile?.profession && (
                          <p className="text-lg text-muted-foreground mt-1">
                            {userProfile.profession}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="capitalize font-medium">
                          {userProfile?.role ?? 'practitioner'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {userProfile?.subscription_tier ?? 'free'} tier
                        </Badge>
                        {isProfileComplete && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Perfil Completo
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Membro desde {userProfile?.created_at 
                            ? new Date(userProfile.created_at).toLocaleDateString('pt-BR', {
                                month: 'long',
                                year: 'numeric'
                              })
                            : 'N/A'
                          }</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-6">
                  {!isEditing ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Editar Perfil
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Configurações
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancel}
                        disabled={updateProfileMutation.isPending}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Editing Form */}
              {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profissão</Label>
                    <Input
                      id="profession"
                      value={formData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      placeholder="Sua profissão"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Links de Redes Sociais</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-xs text-muted-foreground">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin_url}
                        onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                        placeholder="linkedin.com/in/seuusuario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube" className="text-xs text-muted-foreground">YouTube</Label>
                      <Input
                        id="youtube"
                        value={formData.youtube_url}
                        onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                        placeholder="youtube.com/@seucanal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram_url}
                        onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                        placeholder="instagram.com/seuusuario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebook" className="text-xs text-muted-foreground">Facebook</Label>
                      <Input
                        id="facebook"
                        value={formData.facebook_url}
                        onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                        placeholder="facebook.com/seuusuario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-xs text-muted-foreground">Twitter</Label>
                      <Input
                        id="twitter"
                        value={formData.twitter_url}
                        onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                        placeholder="twitter.com/seuusuario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-xs text-muted-foreground">Website</Label>
                      <Input
                        id="website"
                        value={formData.website_url}
                        onChange={(e) => handleInputChange('website_url', e.target.value)}
                        placeholder="www.seusite.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Social Media Links Card */}
      {(userProfile?.linkedin_url || userProfile?.youtube_url || userProfile?.instagram_url || 
        userProfile?.facebook_url || userProfile?.twitter_url || userProfile?.website_url) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Links e Redes Sociais</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {userProfile?.linkedin_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-3 h-auto p-3"
                >
                  <a
                    href={formatSocialUrl(userProfile.linkedin_url, 'linkedin')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon('linkedin')}
                    <span className="font-medium">LinkedIn</span>
                  </a>
                </Button>
              )}
              {userProfile?.youtube_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-3 h-auto p-3"
                >
                  <a
                    href={formatSocialUrl(userProfile.youtube_url, 'youtube')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon('youtube')}
                    <span className="font-medium">YouTube</span>
                  </a>
                </Button>
              )}
              {userProfile?.instagram_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-3 h-auto p-3"
                >
                  <a
                    href={formatSocialUrl(userProfile.instagram_url, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon('instagram')}
                    <span className="font-medium">Instagram</span>
                  </a>
                </Button>
              )}
              {userProfile?.facebook_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-3 h-auto p-3"
                >
                  <a
                    href={formatSocialUrl(userProfile.facebook_url, 'facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon('facebook')}
                    <span className="font-medium">Facebook</span>
                  </a>
                </Button>
              )}
              {userProfile?.twitter_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-3 h-auto p-3"
                >
                  <a
                    href={formatSocialUrl(userProfile.twitter_url, 'twitter')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon('twitter')}
                    <span className="font-medium">Twitter</span>
                  </a>
                </Button>
              )}
              {userProfile?.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-3 h-auto p-3"
                >
                  <a
                    href={formatSocialUrl(userProfile.website_url, 'website')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getSocialIcon('website')}
                    <span className="font-medium">Website</span>
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Informações da Conta</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Tipo de Conta</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize font-medium">
                  {userProfile?.role ?? 'practitioner'}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {userProfile?.subscription_tier ?? 'free'} tier
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Status do Perfil</span>
              <div className="flex items-center gap-2">
                {getCompletionIcon()}
                <span className={`font-medium ${getCompletionColor()}`}>
                  {completionPercentage}% completo
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Última atualização</span>
              <div className="font-medium">
                {userProfile?.updated_at 
                  ? new Date(userProfile.updated_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'N/A'
                }
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">ID da Conta</span>
              <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {userProfile?.id ? userProfile.id.slice(0, 8) + '...' : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};