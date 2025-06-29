
// ABOUTME: Form component for creating new community posts with rich content support.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { TiptapEditor } from './TiptapEditor';
import { ImageUploadZone } from './ImageUploadZone';
import { VideoInput } from './VideoInput';
import { PollCreator } from './PollCreator';
import { useCreateCommunityPostMutation } from '../../../packages/hooks/useCreateCommunityPostMutation';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';

interface CreatePostFormProps {
  onPostCreated?: (postId: number) => void;
}

export const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'poll' | 'video'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pollData, setPollData] = useState<{
    question: string;
    options: Array<{ id: string; text: string }>;
    expiresAt?: string;
  } | null>(null);

  const createPostMutation = useCreateCommunityPostMutation();

  const categories = [
    'discussao-geral',
    'duvida-clinica',
    'caso-clinico',
    'evidencia-cientifica',
    'tecnologia-saude',
    'carreira-medicina',
    'bem-estar-medico'
  ];

  const getCategoryLabel = (value: string) => {
    const labels: Record<string, string> = {
      'discussao-geral': 'Discussão Geral',
      'duvida-clinica': 'Dúvida Clínica',
      'caso-clinico': 'Caso Clínico',
      'evidencia-cientifica': 'Evidência Científica',
      'tecnologia-saude': 'Tecnologia & Saúde',
      'carreira-medicina': 'Carreira em Medicina',
      'bem-estar-medico': 'Bem-estar Médico'
    };
    return labels[value] || value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('O conteúdo da discussão é obrigatório');
      return;
    }
    
    if (!category) {
      toast.error('Selecione uma categoria');
      return;
    }

    // Validate post type specific requirements
    if (postType === 'image' && !imageFile) {
      toast.error('Adicione uma imagem para posts do tipo imagem');
      return;
    }
    
    if (postType === 'video' && !videoUrl && !videoFile) {
      toast.error('Adicione um URL de vídeo ou faça upload de um arquivo para posts do tipo vídeo');
      return;
    }
    
    if (postType === 'poll' && (!pollData || pollData.options.length < 2)) {
      toast.error('Adicione pelo menos 2 opções para a enquete');
      return;
    }

    // Transform poll data to match API expectations
    const transformedPollData = pollData ? {
      question: pollData.question,
      options: pollData.options.map(opt => ({ text: opt.text }))
    } : undefined;

    // Handle image upload to Supabase Storage if needed
    let uploadedImageUrl = '';
    if (postType === 'image' && imageFile) {
      if (!user) {
        toast.error('Você precisa estar logado para fazer upload de imagens');
        return;
      }
      
      try {
        // Generate unique filename
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Erro ao fazer upload da imagem');
          return;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(filePath);
          
        uploadedImageUrl = publicUrl;
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('Falha no upload da imagem');
        return;
      }
    }

    // Handle video upload to Supabase Storage if needed
    let uploadedVideoUrl = '';
    if (postType === 'video' && videoFile) {
      if (!user) {
        toast.error('Você precisa estar logado para fazer upload de vídeos');
        return;
      }
      
      try {
        // Generate unique filename
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-videos')
          .upload(filePath, videoFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error('Video upload error:', uploadError);
          toast.error('Erro ao fazer upload do vídeo');
          return;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('community-videos')
          .getPublicUrl(filePath);
          
        uploadedVideoUrl = publicUrl;
      } catch (error) {
        console.error('Video upload failed:', error);
        toast.error('Falha no upload do vídeo');
        return;
      }
    }

    const payload = {
      title: title.trim() || undefined,
      content: content.trim(),
      category,
      post_type: postType,
      ...(postType === 'image' && uploadedImageUrl && { image_url: uploadedImageUrl }),
      ...(postType === 'video' && (uploadedVideoUrl || videoUrl) && { video_url: uploadedVideoUrl || videoUrl }),
      ...(postType === 'poll' && transformedPollData && { poll_data: transformedPollData })
    };

    createPostMutation.mutate(payload, {
      onSuccess: (response) => {
        toast.success('Discussão criada com sucesso!');
        
        // Call the callback if provided
        if (onPostCreated && response.id) {
          onPostCreated(response.id);
        } else if (response.id) {
          // Navigate to the created post
          navigate(`/comunidade/${response.id}`);
        } else {
          // Fallback to community page
          navigate('/comunidade');
        }
      },
      onError: (error) => {
        console.error('Error creating post:', error);
        toast.error('Erro ao criar discussão. Tente novamente.');
      }
    });
  };

  const handleCancel = () => {
    navigate('/comunidade');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Nova Discussão</CardTitle>
        <p className="text-muted-foreground">
          Compartilhe suas ideias e inicie uma conversa com a comunidade
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria *</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Post</label>
            <Tabs value={postType} onValueChange={(value) => setPostType(value as typeof postType)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text">Texto</TabsTrigger>
                <TabsTrigger value="image">Imagem</TabsTrigger>
                <TabsTrigger value="video">Vídeo</TabsTrigger>
                <TabsTrigger value="poll">Enquete</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título (opcional)</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite um título para sua discussão..."
                    maxLength={200}
                  />
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título (opcional)</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite um título para sua discussão..."
                    maxLength={200}
                  />
                </div>
                <ImageUploadZone 
                  onImageSelect={setImageFile}
                  selectedImage={imageFile}
                  onImageRemove={() => setImageFile(null)}
                />
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título (opcional)</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite um título para sua discussão..."
                    maxLength={200}
                  />
                </div>
                <VideoInput 
                  urlValue={videoUrl}
                  fileValue={videoFile}
                  onUrlChange={setVideoUrl}
                  onFileChange={setVideoFile}
                  onRemove={() => {
                    setVideoUrl('');
                    setVideoFile(null);
                  }}
                  isUploading={createPostMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="poll" className="space-y-4">
                <PollCreator 
                  value={pollData}
                  onChange={setPollData} 
                  onRemove={() => setPollData(null)}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Conteúdo *
              <Badge variant="secondary" className="ml-2">
                {postType === 'poll' ? 'Descrição da enquete' : 'Sua discussão'}
              </Badge>
            </label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder={
                postType === 'poll' 
                  ? "Descreva sua enquete e forneça contexto..."
                  : "Compartilhe seus pensamentos, faça uma pergunta ou inicie uma discussão..."
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={createPostMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createPostMutation.isPending || !content.trim() || !category}
            >
              {createPostMutation.isPending ? 'Publicando...' : 'Publicar Discussão'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
