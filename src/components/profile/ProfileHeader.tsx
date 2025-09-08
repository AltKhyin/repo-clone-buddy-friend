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
  CreditCard,
  Pause,
  HelpCircle,
} from 'lucide-react';
import { useUpdateProfileMutation } from '@packages/hooks/useUpdateProfileMutation';
import { useToast } from '../../hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedUserStatus } from '@/hooks/useEnhancedUserStatus';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStatus } from './SubscriptionStatus';
import { SubscriptionActions } from './SubscriptionActions';
import { useCustomerSupportSettings, getPrimaryContact } from '@/hooks/useCustomerSupportSettings';
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
  
  // Customer support settings
  const { data: supportSettings } = useCustomerSupportSettings();
  
  // Calculate subscription days remaining
  const getSubscriptionDaysRemaining = () => {
    if (!enhancedStatus.userProfile?.subscription_end_date) return null;
    const endDate = new Date(enhancedStatus.userProfile.subscription_end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

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

  const handleSupportClick = () => {
    if (supportSettings) {
      const primaryContact = getPrimaryContact(supportSettings);
      window.open(primaryContact.formatted, '_blank');
    }
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

  // Smart link detection utilities
  const formatSocialLink = (platform: string, value: string): string => {
    if (!value) return '';
    
    const cleanValue = value.trim();
    
    // If it's already a full URL, return as is
    if (cleanValue.startsWith('http://') || cleanValue.startsWith('https://')) {
      return cleanValue;
    }
    
    // Handle platform-specific formatting
    switch (platform) {
      case 'instagram':
        const instaHandle = cleanValue.replace('@', '');
        return `https://instagram.com/${instaHandle}`;
      case 'twitter':
        const twitterHandle = cleanValue.replace('@', '');
        return `https://twitter.com/${twitterHandle}`;
      case 'linkedin':
        // LinkedIn can be either /in/username or full profile URL
        if (cleanValue.includes('linkedin.com')) {
          return cleanValue;
        }
        return `https://linkedin.com/in/${cleanValue}`;
      default:
        return cleanValue;
    }
  };

  const getDisplayValue = (platform: string, value: string): string => {
    if (!value) return '';
    
    const cleanValue = value.trim();
    
    // If it's a full URL, extract the relevant part for display
    if (cleanValue.startsWith('http://') || cleanValue.startsWith('https://')) {
      if (platform === 'instagram' || platform === 'twitter') {
        const match = cleanValue.match(/(?:instagram\.com|twitter\.com)\/(.+)/i);
        return match ? `@${match[1]}` : cleanValue;
      }
      if (platform === 'linkedin') {
        const match = cleanValue.match(/linkedin\.com\/in\/(.+)/i);
        return match ? match[1] : cleanValue.replace(/^https?:\/\//i, '');
      }
      return cleanValue.replace(/^https?:\/\//i, '');
    }
    
    // For handles, add @ for Instagram and Twitter
    if (platform === 'instagram' || platform === 'twitter') {
      return cleanValue.startsWith('@') ? cleanValue : `@${cleanValue}`;
    }
    
    return cleanValue;
  };

  return (
    <div className="space-y-6">
      {/* Main Profile Card - Premium Design */}
      <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm">
        {!isEditing ? (
          <>
            {/* MOBILE-FIRST: Hero Section */}
            <div className="p-4 md:hidden">
              {/* MOBILE ONLY: Centralized Layout */}
              <div className="flex flex-col items-center text-center">
                {/* Edit Button - Top Right Absolute */}
                <div className="relative w-full">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-0 right-0 min-w-[48px] min-h-[48px] flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Editar perfil"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>

                {/* Avatar - Centered */}
                <div 
                  className="relative group cursor-pointer mb-4"
                  onClick={handleAvatarUpload}
                >
                  <div className="relative h-20 w-20 rounded-full overflow-hidden mx-auto">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={userProfile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-lg font-serif tracking-tight bg-gray-100 text-black">
                        {displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                      <Camera className="h-4 w-4 text-white" />
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

                {/* Name & Profession - Centered, No Badge on Mobile */}
                <div className="space-y-2 mb-6 w-full">
                  <h1 className="text-2xl font-serif tracking-tight text-black font-medium">
                    {displayName}
                  </h1>
                  <p className="text-base text-gray-600 font-normal">
                    {userProfile?.profession || (
                      <span className="text-gray-400 italic">Adicionar profissão</span>
                    )}
                  </p>

                  {/* Upgrade Button - Mobile Full Width */}
                  {enhancedStatus.subscriptionTier === 'free' && enhancedStatus.shouldShowUpgradeButton && (
                    <Button 
                      variant="outline"
                      onClick={handleUpgradeClick}
                      className="w-full bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal mt-4"
                    >
                      {enhancedStatus.upgradeButtonText}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* DESKTOP: Original Hero Section - Hidden on Mobile */}
            <div className="hidden md:block">
              <div className="flex items-start gap-6 p-6">
                {/* Avatar Section */}
                <div 
                  className="relative group cursor-pointer flex-shrink-0"
                  onClick={handleAvatarUpload}
                >
                  <div className="relative h-28 w-28 rounded-full overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={userProfile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-lg font-serif tracking-tight bg-gray-100 text-black">
                        {displayName?.split(' ').map(n => n[0]).join('') || 'U'}
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

                {/* Content Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      {/* Name & Badge */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
                          <h1 className="text-4xl font-serif tracking-tight text-black font-medium">
                            {displayName}
                          </h1>
                        </div>
                        {enhancedStatus.isMember && (
                          <Badge className="bg-black text-white font-normal text-xs px-2 py-1">
                            {enhancedStatus.memberBadge.text}
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg text-gray-600 font-normal">
                        {userProfile?.profession || (
                          <span className="text-gray-400 italic">Adicionar profissão</span>
                        )}
                      </p>

                      {/* Upgrade Button */}
                      {enhancedStatus.subscriptionTier === 'free' && enhancedStatus.shouldShowUpgradeButton && (
                        <Button 
                          variant="outline"
                          onClick={handleUpgradeClick}
                          className="bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal mt-4"
                        >
                          {enhancedStatus.upgradeButtonText}
                        </Button>
                      )}
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Editar perfil"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE ONLY: Information Sections */}
            <div className="block md:hidden px-4 pb-6 space-y-6">
              {/* Essential Contact Information */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-medium text-black">Contato</h3>
                
                <div className="space-y-1">
                  {/* Email */}
                  <div className="flex items-center gap-3 min-h-[48px] py-2">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{displayEmail}</span>
                        {session?.user?.email_confirmed_at && (
                          <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-3 min-h-[48px] py-2">
                    <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900">
                      {userProfile?.phone || <span className="text-gray-400">Adicionar telefone</span>}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-3 min-h-[48px] py-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900">
                      {userProfile?.location || <span className="text-gray-400">Adicionar localização</span>}
                    </span>
                  </div>

                  {/* Website */}
                  {userProfile?.website_url && (
                    <div className="flex items-center gap-3 min-h-[48px] py-2">
                      <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a 
                        href={userProfile.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-black"
                      >
                        {userProfile.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              {(userProfile?.instagram_url || userProfile?.linkedin_url || userProfile?.twitter_url) && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-medium text-black">Redes sociais</h3>
                  
                  <div className="space-y-1">
                    {userProfile?.instagram_url && (
                      <div className="flex items-center gap-3 min-h-[48px] py-2">
                        <Instagram className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a 
                          href={formatSocialLink('instagram', userProfile.instagram_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-black"
                        >
                          {getDisplayValue('instagram', userProfile.instagram_url)}
                        </a>
                      </div>
                    )}

                    {userProfile?.linkedin_url && (
                      <div className="flex items-center gap-3 min-h-[48px] py-2">
                        <Linkedin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a 
                          href={formatSocialLink('linkedin', userProfile.linkedin_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-black"
                        >
                          {getDisplayValue('linkedin', userProfile.linkedin_url)}
                        </a>
                      </div>
                    )}

                    {userProfile?.twitter_url && (
                      <div className="flex items-center gap-3 min-h-[48px] py-2">
                        <Twitter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <a 
                          href={formatSocialLink('twitter', userProfile.twitter_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-black"
                        >
                          {getDisplayValue('twitter', userProfile.twitter_url)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Membership Info */}
              {userProfile?.created_at && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Membro desde {new Date(userProfile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            {/* DESKTOP ONLY: Two-Column Layout */}
            <div className="hidden md:block p-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column: Contact Information */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-medium text-black">Informações de contato</h3>
                    
                    <div className="space-y-3">
                      {/* Email */}
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">{displayEmail}</span>
                            {session?.user?.email_confirmed_at && (
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900">
                          {userProfile?.phone || <span className="text-gray-400 italic">Adicionar telefone</span>}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900">
                          {userProfile?.location || <span className="text-gray-400 italic">Adicionar localização</span>}
                        </span>
                      </div>

                      {/* Website */}
                      {userProfile?.website_url && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <a 
                            href={userProfile.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 hover:text-black transition-colors"
                          >
                            {userProfile.website_url.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Social Media */}
                <div className="space-y-6">
                  {(userProfile?.instagram_url || userProfile?.linkedin_url || userProfile?.twitter_url) ? (
                    <div className="space-y-4">
                      <h3 className="font-serif text-lg font-medium text-black">Redes sociais</h3>
                      
                      <div className="space-y-3">
                        {userProfile?.instagram_url && (
                          <div className="flex items-center gap-3">
                            <Instagram className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <a 
                              href={formatSocialLink('instagram', userProfile.instagram_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-900 hover:text-black transition-colors"
                            >
                              {getDisplayValue('instagram', userProfile.instagram_url)}
                            </a>
                          </div>
                        )}

                        {userProfile?.linkedin_url && (
                          <div className="flex items-center gap-3">
                            <Linkedin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <a 
                              href={formatSocialLink('linkedin', userProfile.linkedin_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-900 hover:text-black transition-colors"
                            >
                              {getDisplayValue('linkedin', userProfile.linkedin_url)}
                            </a>
                          </div>
                        )}

                        {userProfile?.twitter_url && (
                          <div className="flex items-center gap-3">
                            <Twitter className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <a 
                              href={formatSocialLink('twitter', userProfile.twitter_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-900 hover:text-black transition-colors"
                            >
                              {getDisplayValue('twitter', userProfile.twitter_url)}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-serif text-lg font-medium text-black">Redes sociais</h3>
                      <p className="text-gray-400 italic">Nenhuma rede social adicionada</p>
                    </div>
                  )}

                  {/* Membership Info */}
                  {userProfile?.created_at && (
                    <div className="pt-6 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Membro desde {new Date(userProfile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* MOBILE-FIRST: Editing State - Complete Rebuild */
          <div className="p-4 md:p-6 space-y-6">
            {/* Mobile: Avatar centered at top | Desktop: Left with content */}
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar Section */}
              <div className="flex justify-center md:justify-start">
                <div 
                  className="relative group cursor-pointer flex-shrink-0"
                  onClick={handleAvatarUpload}
                >
                  <div className="relative h-20 w-20 md:h-28 md:w-28 rounded-full overflow-hidden">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={userProfile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-lg md:text-xl font-serif tracking-tight bg-gray-100 text-black">
                        {displayName
                          ?.split(' ')
                          .map(n => n[0])
                          .join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                      <Camera className="h-4 w-4 md:h-5 md:w-5 text-white" />
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
              </div>

              {/* Form Content - Full width on mobile */}
              <div className="flex-1">
                {/* Basic Info */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-serif text-lg tracking-tight text-black font-medium">Informações pessoais</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome completo</Label>
                      <Input
                        id="name"
                        value={formData.full_name}
                        onChange={e => handleInputChange('full_name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profession" className="text-sm font-medium text-gray-700">Profissão</Label>
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={e => handleInputChange('profession', e.target.value)}
                        placeholder="Sua profissão"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-serif text-lg tracking-tight text-black font-medium">Informações da conta (confidenciais)</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        placeholder="Seu telefone"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">Localização</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={e => handleInputChange('location', e.target.value)}
                        placeholder="Cidade, Estado"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={e => handleInputChange('website', e.target.value)}
                        placeholder="https://seusite.com"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-4 mb-8">
                  <h3 className="font-serif text-lg tracking-tight text-black font-medium">Redes sociais</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="text-sm font-medium text-gray-700">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={e => handleInputChange('instagram', e.target.value)}
                        placeholder="@seuusuario ou https://instagram.com/seuusuario"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={e => handleInputChange('linkedin', e.target.value)}
                        placeholder="seuusuario ou https://linkedin.com/in/seuusuario"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter" className="text-sm font-medium text-gray-700">Twitter</Label>
                      <Input
                        id="twitter"
                        value={formData.twitter}
                        onChange={e => handleInputChange('twitter', e.target.value)}
                        placeholder="@seuusuario ou https://twitter.com/seuusuario"
                        className="bg-background border-gray-300 focus:border-black focus:ring-0 text-black min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile: Full width stacked | Desktop: Inline */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-2 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateProfileMutation.isPending}
                className="w-full md:w-auto bg-background hover:bg-muted border-gray-300 text-gray-700 flex items-center justify-center gap-2 font-normal min-h-[48px] md:min-h-auto"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="w-full md:w-auto !bg-black hover:!bg-gray-800 !text-white flex items-center justify-center gap-2 min-h-[48px] md:min-h-auto"
              >
                <Save className="h-4 w-4" />
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Subscription Management - Enhanced Display */}
      {enhancedStatus.isMember && (
        <Card className="border-0 shadow-sm bg-background/95 backdrop-blur-sm">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
              <h3 className="font-serif text-base md:text-lg font-medium text-black">Assinatura</h3>
            </div>
            
            {/* Mobile: Enhanced Single Column */}
            <div className="block md:hidden space-y-4">
              {/* Status Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <span className="text-base font-medium text-black">Plano Ativo</span>
                    <p className="text-xs text-gray-500">Assinatura {enhancedStatus.subscriptionTier}</p>
                  </div>
                </div>
                
                {/* Subscription Details */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Próxima renovação</span>
                    <span className="text-xs font-medium text-gray-900">
                      {enhancedStatus.userProfile?.subscription_end_date 
                        ? new Date(enhancedStatus.userProfile.subscription_end_date).toLocaleDateString('pt-BR')
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Customer Support Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSupportClick}
                  className="w-full justify-start gap-2 bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal min-h-[44px]"
                >
                  <HelpCircle className="h-4 w-4" />
                  Precisa de ajuda? Falar com o suporte
                </Button>
              </div>
            </div>

            {/* Desktop: Two Column Enhanced Layout */}
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column: Status and Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <span className="text-lg font-medium text-black">Plano Ativo</span>
                      <p className="text-sm text-gray-500 capitalize">Assinatura {enhancedStatus.subscriptionTier}</p>
                    </div>
                  </div>
                  
                  {/* Subscription Timeline */}
                  <div className="space-y-3 pl-8">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Próxima renovação</span>
                      <span className="text-sm font-medium text-gray-900">
                        {enhancedStatus.userProfile?.subscription_end_date 
                          ? new Date(enhancedStatus.userProfile.subscription_end_date).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Support */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-black mb-3">Suporte</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSupportClick}
                      className="w-full justify-start gap-2 bg-background hover:bg-muted border-gray-300 text-gray-700 font-normal"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Precisa de ajuda? Falar com o suporte
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};