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
import { LinkInput } from './LinkInput';
import { useCreateCommunityPostMutation } from '@packages/hooks/useCreateCommunityPostMutation';
import { usePostCategories } from '@packages/hooks/usePostCategories';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';
import { processVideoUrl, isValidVideoUrl } from '@/lib/video-utils';
import type { LinkPreviewData } from '@/types/community';

interface CreatePostFormProps {
  onPostCreated?: (postId: number) => void;
}

export const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'link'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreviewData, setLinkPreviewData] = useState<LinkPreviewData | null>(null);

  const createPostMutation = useCreateCommunityPostMutation();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = usePostCategories();

  const getCategoryLabel = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.label || categoryName;
  };

  const getCategoryStyle = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (category) {
      return {
        backgroundColor: category.background_color,
        color: category.text_color,
        borderColor: category.border_color,
      };
    }
    return {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // NEW REQUIREMENT: Title is now mandatory, content is optional
    if (!title.trim()) {
      toast.error('O título da discussão é obrigatório');
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

    // Validate video URL if provided
    if (postType === 'video' && videoUrl && !isValidVideoUrl(videoUrl)) {
      toast.error(
        'URL de vídeo inválido. Use YouTube, Vimeo ou links diretos para arquivos de vídeo'
      );
      return;
    }


    if (postType === 'link' && !linkUrl.trim()) {
      toast.error('Adicione um link válido para posts do tipo link');
      return;
    }


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
            upsert: false,
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Erro ao fazer upload da imagem');
          return;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('community-images').getPublicUrl(filePath);

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
            upsert: false,
          });

        if (uploadError) {
          console.error('Video upload error:', uploadError);
          toast.error('Erro ao fazer upload do vídeo');
          return;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('community-videos').getPublicUrl(filePath);

        uploadedVideoUrl = publicUrl;
      } catch (error) {
        console.error('Video upload failed:', error);
        toast.error('Falha no upload do vídeo');
        return;
      }
    }

    // Process video URL to make it embeddable
    const finalVideoUrl = uploadedVideoUrl || (videoUrl ? processVideoUrl(videoUrl) : null);

    const payload = {
      title: title.trim(), // Now mandatory per requirements
      content: content.trim() || undefined, // Now optional per requirements
      category,
      post_type: postType,
      ...(postType === 'image' && uploadedImageUrl && { image_url: uploadedImageUrl }),
      ...(postType === 'video' && finalVideoUrl && { video_url: finalVideoUrl }),
      ...(postType === 'link' && linkUrl && { link_url: linkUrl.trim() }),
      ...(postType === 'link' && linkPreviewData && { link_preview_data: linkPreviewData }),
    };

    createPostMutation.mutate(payload, {
      onSuccess: response => {
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
      onError: error => {
        console.error('Error creating post:', error);
        toast.error('Erro ao criar discussão. Tente novamente.');
      },
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
            <Select value={category} onValueChange={setCategory} disabled={categoriesLoading}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    categoriesLoading
                      ? 'Carregando categorias...'
                      : categoriesError
                        ? 'Erro ao carregar categorias'
                        : 'Selecione uma categoria'
                  }
                >
                  {category &&
                    (() => {
                      const selectedCategory = categories.find(cat => cat.name === category);
                      return selectedCategory ? (
                        <Badge
                          style={{
                            backgroundColor: selectedCategory.background_color,
                            color: selectedCategory.text_color,
                            borderColor: selectedCategory.border_color,
                          }}
                          className="text-xs font-medium"
                        >
                          {selectedCategory.label}
                        </Badge>
                      ) : (
                        category
                      );
                    })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name} className="p-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        style={{
                          backgroundColor: cat.background_color,
                          color: cat.text_color,
                          borderColor: cat.border_color,
                        }}
                        className="text-xs font-medium"
                      >
                        {cat.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Post</label>
            <Tabs value={postType} onValueChange={value => setPostType(value as typeof postType)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text">Texto</TabsTrigger>
                <TabsTrigger value="image">Imagem</TabsTrigger>
                <TabsTrigger value="video">Vídeo</TabsTrigger>
                <TabsTrigger value="link">Link</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Digite um título para sua discussão..."
                    maxLength={200}
                  />
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
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
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
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


              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Digite um título para o link compartilhado..."
                    maxLength={200}
                  />
                </div>
                <LinkInput
                  value={linkUrl}
                  onValueChange={setLinkUrl}
                  previewData={linkPreviewData}
                  onPreviewDataChange={setLinkPreviewData}
                  disabled={createPostMutation.isPending}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Conteúdo (opcional)
              <Badge variant="secondary" className="ml-2">
                {postType === 'link'
                  ? 'Comentário sobre o link'
                  : 'Sua discussão'}
              </Badge>
            </label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder={
                postType === 'link'
                  ? 'Adicione um comentário sobre o link (opcional)...'
                  : 'Compartilhe seus pensamentos, faça uma pergunta ou inicie uma discussão...'
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
              disabled={createPostMutation.isPending || !title.trim() || !category}
            >
              {createPostMutation.isPending ? 'Publicando...' : 'Publicar Discussão'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
