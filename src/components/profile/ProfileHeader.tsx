// ABOUTME: Premium profile header with clean typography and elegant member differentiation

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  X,
  Camera,
  CheckCircle,
  Edit,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useUpdateProfileMutation } from '@packages/hooks/useUpdateProfileMutation';
import { useToast } from '../../hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedUserStatus } from '@/hooks/useEnhancedUserStatus';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from './SubscriptionStatus';
import { SubscriptionActions } from './SubscriptionActions';
import type { ExtendedUserProfile, ProfileUpdateData } from '@/types';

interface ProfileHeaderProps {
  userProfile: ExtendedUserProfile | undefined;
  isLoading?: boolean;
}

interface CompleteProfileData {
  full_name: string;
  profession: string;
  location: string;
  phone: string;
  website: string;
  instagram: string;
  linkedin: string;
  twitter: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userProfile, isLoading = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CompleteProfileData>({
    full_name: userProfile?.full_name || '',
    profession: userProfile?.profession || '',
    location: userProfile?.location || '',
    phone: userProfile?.phone || '',
    website: userProfile?.website_url || '',
    instagram: userProfile?.instagram_url || '',
    linkedin: userProfile?.linkedin_url || '',
    twitter: userProfile?.twitter_url || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfileMutation();
  const session = useAuthStore(state => state.session);
  const navigate = useNavigate();
  
  // Enhanced user status for membership differentiation
  const enhancedStatus = useEnhancedUserStatus();

  // Update form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile?.full_name || '',
        profession: userProfile?.profession || '',
        location: userProfile?.location || '',
        phone: userProfile?.phone || '',
        website: userProfile?.website_url || '',
        instagram: userProfile?.instagram_url || '',
        linkedin: userProfile?.linkedin_url || '',
        twitter: userProfile?.twitter_url || '',
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync(formData);
      setIsEditing(false);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: userProfile?.full_name || '',
      profession: userProfile?.profession || '',
      location: userProfile?.location || '',
      phone: userProfile?.phone || '',
      website: userProfile?.website_url || '',
      instagram: userProfile?.instagram_url || '',
      linkedin: userProfile?.linkedin_url || '',
      twitter: userProfile?.twitter_url || '',
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
    if (!file || !session?.user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem válida.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Selecione uma imagem menor que 10MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      
      await updateProfileMutation.mutateAsync({
        avatar_url: urlData.publicUrl,
      });

      toast({
        title: 'Foto atualizada',
        description: 'Sua foto de perfil foi atualizada.',
      });
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível atualizar a foto.',
        variant: 'destructive',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpgradeClick = () => {
    navigate(enhancedStatus.upgradeRedirectPath);
  };

  const displayName = userProfile?.full_name || 'Usuário';
  const displayEmail = session?.user?.email || '';

  if (isLoading) {
    return (
      <Card className="shadow-sm bg-background">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-6">
            <div className="h-28 w-28 rounded-full bg-muted animate-pulse" />
            <div className="space-y-3">
              <div className="h-7 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Profile Card - Premium Design */}
      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-start gap-6">
            {/* Avatar Section - Clean & Simple */}
            <div 
              className="relative group cursor-pointer flex-shrink-0"
              onClick={handleAvatarUpload}
            >
              <div className="relative h-28 w-28 rounded-full overflow-hidden">
                <Avatar className="h-full w-full">
                  <AvatarImage src={userProfile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-lg font-serif tracking-tight bg-gray-100 text-black">
                    {displayName
                      ?.split(' ')
                      .map(n => n[0])
                      .join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Profile Info - Expanded Personal Information */}
            <div className="flex-1 space-y-6">
              {!isEditing ? (
                <>
                  {/* Hero Header Section */}
                  <div className="space-y-6 pb-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        {/* Edit button positioned independently */}
                        <button
                          onClick={() => setIsEditing(true)}
                          className="absolute -right-2 -top-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-muted rounded-full transition-colors z-10"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        {/* Aligned content with consistent left margin */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-4">
                            <span className="h-1.5 w-1.5 rounded-full bg-black mt-2.5 flex-shrink-0"></span>
                            <div className="space-y-2">
                              <div className="flex items-baseline gap-3 flex-wrap">
                                <h1 className="text-4xl font-serif tracking-tight text-black font-medium leading-tight">
                                  {displayName}
                                </h1>
                                {enhancedStatus.isMember && (
                                  <Badge 
                                    variant="default"
                                    className="bg-black text-white hover:bg-gray-800 font-normal text-xs px-3 py-1 self-start"
                                  >
                                    {enhancedStatus.memberBadge.text}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xl text-gray-600 font-normal leading-relaxed">
                                {userProfile?.profession || (
                                  <span className="text-gray-400 italic">Adicionar profissão</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Upgrade Button - Only for non-members */}
                        {enhancedStatus.subscriptionTier === 'free' && enhancedStatus.shouldShowUpgradeButton && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={handleUpgradeClick}
                            className="bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal px-6 py-3 text-base"
                          >
                            {enhancedStatus.upgradeButtonText}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Contact Information Section */}
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg tracking-tight text-black font-medium">Informações da conta (confidenciais)</h3>
                        <p className="text-sm text-gray-500">Como você pode ser encontrado</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 py-2">
                          <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-800 font-medium">{displayEmail}</span>
                              {session?.user?.email_confirmed_at && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">Email principal</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 py-2">
                          <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-gray-800 font-medium">
                              {userProfile?.phone || <span className="text-gray-400">Adicionar telefone</span>}
                            </span>
                            <p className="text-xs text-gray-500">Número de contato</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 py-2">
                          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-gray-800 font-medium">
                              {userProfile?.location || <span className="text-gray-400">Adicionar localização</span>}
                            </span>
                            <p className="text-xs text-gray-500">Cidade e estado</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 py-2">
                          <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            {userProfile?.website_url ? (
                              <a 
                                href={userProfile.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-gray-800 font-medium hover:text-black transition-colors"
                              >
                                {userProfile.website_url.replace(/^https?:\/\//, '')}
                              </a>
                            ) : (
                              <span className="text-gray-400 font-medium">Adicionar website</span>
                            )}
                            <p className="text-xs text-gray-500">Site pessoal ou profissional</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Media & Professional Links */}
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg tracking-tight text-black font-medium">Redes sociais</h3>
                        <p className="text-sm text-gray-500">Conecte suas redes profissionais</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 py-2">
                          <Instagram className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            {userProfile?.instagram_url ? (
                              <a 
                                href={`https://instagram.com/${userProfile.instagram_url.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-800 font-medium hover:text-black transition-colors"
                              >
                                @{userProfile.instagram_url.replace('@', '')}
                              </a>
                            ) : (
                              <span className="text-gray-400 font-medium">Conectar Instagram</span>
                            )}
                            <p className="text-xs text-gray-500">Perfil no Instagram</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 py-2">
                          <Linkedin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            {userProfile?.linkedin_url ? (
                              <a 
                                href={`https://linkedin.com/in/${userProfile.linkedin_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-800 font-medium hover:text-black transition-colors"
                              >
                                {userProfile.linkedin_url}
                              </a>
                            ) : (
                              <span className="text-gray-400 font-medium">Conectar LinkedIn</span>
                            )}
                            <p className="text-xs text-gray-500">Perfil profissional</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 py-2">
                          <Twitter className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            {userProfile?.twitter_url ? (
                              <a 
                                href={`https://twitter.com/${userProfile.twitter_url.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-800 font-medium hover:text-black transition-colors"
                              >
                                @{userProfile.twitter_url.replace('@', '')}
                              </a>
                            ) : (
                              <span className="text-gray-400 font-medium">Conectar Twitter</span>
                            )}
                            <p className="text-xs text-gray-500">Perfil no Twitter</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Membership Info */}
                      <div className="pt-4 border-t border-gray-100">
                        {userProfile?.created_at && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Membro desde:</span> {new Date(userProfile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg tracking-tight text-black font-medium">Informações pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome completo</Label>
                        <Input
                          id="name"
                          value={formData.full_name}
                          onChange={e => handleInputChange('full_name', e.target.value)}
                          placeholder="Seu nome completo"
                          className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profession" className="text-sm font-medium text-gray-700">Profissão</Label>
                        <Input
                          id="profession"
                          value={formData.profession}
                          onChange={e => handleInputChange('profession', e.target.value)}
                          placeholder="Sua profissão"
                          className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg tracking-tight text-black font-medium">Informações da conta (confidenciais)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={e => handleInputChange('phone', e.target.value)}
                          placeholder="Seu telefone"
                          className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium text-gray-700">Localização</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={e => handleInputChange('location', e.target.value)}
                          placeholder="Cidade, Estado"
                          className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={e => handleInputChange('website', e.target.value)}
                        placeholder="https://seusite.com"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                      />
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg tracking-tight text-black font-medium">Redes sociais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="text-sm font-medium text-gray-700">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={e => handleInputChange('instagram', e.target.value)}
                          placeholder="@seuusuario"
                          className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={e => handleInputChange('linkedin', e.target.value)}
                          placeholder="seuusuario"
                          className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="text-sm font-medium text-gray-700">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.twitter}
                          onChange={e => handleInputChange('twitter', e.target.value)}
                          placeholder="@seuusuario"
                          className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Only when editing */}
            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                  className="bg-background hover:bg-muted border-gray-300 text-gray-700 flex items-center gap-2 font-normal"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="!bg-black hover:!bg-gray-800 !text-white flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Subscription Management - Minimalist approach */}
      {enhancedStatus.isMember && (
        <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
              <h3 className="font-serif text-base tracking-tight text-black font-medium">Assinatura</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SubscriptionStatus />
              <SubscriptionActions />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};