// ABOUTME: Admin component for creating and managing community posts linked to reviews with review banner integration

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  Send, 
  Calendar, 
  EyeOff, 
  Eye, 
  AlertCircle,
  Image,
  Clock,
} from 'lucide-react';
import { TiptapEditor } from '../../community/TiptapEditor';
import { toast } from 'sonner';
import { useReviewCommunityPost, type ReviewCommunityPost } from '../../../../packages/hooks/useReviewCommunityPost';
import { 
  useCreateAdminCommunityPost,
  useUpdateAdminCommunityPost,
  usePublishAdminCommunityPost,
  useScheduleAdminCommunityPost,
  useHideAdminCommunityPost,
  useUnhideAdminCommunityPost,
} from '../../../../packages/hooks/useAdminCommunityPostMutation';
import { usePostCategoriesAdmin } from '../../../../packages/hooks/usePostCategories';
import { cn } from '@/lib/utils';
import type { ReviewManagementData } from '../../../../packages/hooks/useAdminReviewManagement';

interface AdminCommunityPostEditorProps {
  review: ReviewManagementData;
}

interface FormData {
  title: string;
  content: string;
  category: string;
  post_type: 'text' | 'image' | 'video' | 'poll' | 'link';
  admin_notes: string;
  scheduled_publish_at: string;
}

export const AdminCommunityPostEditor: React.FC<AdminCommunityPostEditorProps> = ({ review }) => {
  // Query existing community post for this review
  const { data: existingPost, isLoading: isLoadingExistingPost, refetch } = useReviewCommunityPost(review.id);
  
  // Categories for dropdown (admin version includes hidden categories)
  const { data: categories = [], isLoading: categoriesLoading } = usePostCategoriesAdmin();
  
  // Mutation hooks
  const createMutation = useCreateAdminCommunityPost();
  const updateMutation = useUpdateAdminCommunityPost();
  const publishMutation = usePublishAdminCommunityPost();
  const scheduleMutation = useScheduleAdminCommunityPost();
  const hideMutation = useHideAdminCommunityPost();
  const unhideMutation = useUnhideAdminCommunityPost();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    category: 'review',
    post_type: 'image',
    admin_notes: '',
    scheduled_publish_at: '',
  });

  // Initialize form with existing post data
  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title || '',
        content: existingPost.content || '',
        category: existingPost.category || 'evidencia-cientifica',
        post_type: existingPost.post_type || 'image',
        admin_notes: existingPost.admin_notes || '',
        scheduled_publish_at: existingPost.scheduled_publish_at ? 
          new Date(existingPost.scheduled_publish_at).toISOString().slice(0, 16) : '',
      });
    } else {
      // Default values for new post
      setFormData(prev => ({
        ...prev,
        title: `Discussão: ${review.title}`,
        content: review.description || '',
      }));
    }
  }, [existingPost, review]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPostData = () => ({
    title: formData.title.trim(),
    content: formData.content.trim(),
    category: formData.category,
    post_type: formData.post_type,
    admin_notes: formData.admin_notes.trim() || undefined,
    image_url: formData.post_type === 'image' ? review.cover_image_url || undefined : undefined,
  });

  // Action handlers
  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const postData = { ...getPostData(), post_status: 'draft' as const, visibility_level: 'public' as const };

    if (existingPost) {
      await updateMutation.updatePost(review.id, postData, existingPost.id);
      toast.success('Rascunho salvo com sucesso!');
    } else {
      await createMutation.createPost(review.id, postData);
      toast.success('Rascunho criado com sucesso!');
    }
    refetch();
  };

  const handlePublishNow = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (existingPost) {
      // Update first, then publish
      const postData = getPostData();
      await updateMutation.updatePost(review.id, postData, existingPost.id);
      await publishMutation.publishPost(review.id, existingPost.id);
    } else {
      // Create and publish
      const postData = { ...getPostData(), post_status: 'published' as const, visibility_level: 'public' as const };
      await createMutation.createPost(review.id, postData);
    }
    toast.success('Post publicado com sucesso!');
    refetch();
  };

  const handlePublishWhenReviewPublished = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const postData = { 
      ...getPostData(), 
      post_status: review.review_status === 'published' ? 'published' as const : 'draft' as const,
      visibility_level: 'public' as const 
    };

    if (existingPost) {
      await updateMutation.updatePost(review.id, postData, existingPost.id);
    } else {
      await createMutation.createPost(review.id, postData);
    }
    
    const message = review.review_status === 'published' 
      ? 'Post publicado junto com a review!' 
      : 'Post será publicado automaticamente quando a review for publicada!';
    toast.success(message);
    refetch();
  };

  const handleCreateHiddenPost = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const postData = { ...getPostData(), post_status: 'hidden' as const, visibility_level: 'hidden' as const };

    if (existingPost) {
      await updateMutation.updatePost(review.id, postData, existingPost.id);
      await hideMutation.hidePost(review.id, existingPost.id);
    } else {
      await createMutation.createPost(review.id, postData);
    }
    toast.success('Post oculto criado com sucesso!');
    refetch();
  };

  const handleToggleVisibility = async () => {
    if (!existingPost) return;

    if (existingPost.visibility_level === 'hidden') {
      await unhideMutation.unhidePost(review.id, existingPost.id);
      toast.success('Post agora está visível na comunidade!');
    } else {
      await hideMutation.hidePost(review.id, existingPost.id);
      toast.success('Post ocultado da comunidade!');
    }
    refetch();
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || 
                   publishMutation.isPending || scheduleMutation.isPending ||
                   hideMutation.isPending || unhideMutation.isPending;

  if (isLoadingExistingPost || isMutating) {
    return (
      <Card className="bg-surface border-border shadow-sm">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Image className="h-5 w-5" />
              Post na Comunidade
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Crie e gerencie o post da comunidade para esta review
            </CardDescription>
          </div>
          
          {existingPost && (
            <div className="flex items-center gap-2">
              <Badge 
                variant={existingPost.post_status === 'published' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {existingPost.post_status}
              </Badge>
              {existingPost.visibility_level === 'hidden' && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Oculto
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Review Banner Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Preview do Banner da Review</Label>
          <div className="relative rounded-lg overflow-hidden border border-border bg-surface-muted">
            {review.cover_image_url ? (
              <div className="relative h-32 sm:h-40">
                <img 
                  src={review.cover_image_url} 
                  alt={review.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
                    {review.title}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="h-32 sm:h-40 flex items-center justify-center bg-gradient-to-br from-surface via-surface-muted to-accent/10">
                <div className="text-center">
                  <div className="text-6xl font-bold text-muted-foreground/30 font-serif mb-2">
                    {review.title.charAt(0)}
                  </div>
                  <div className="text-sm text-muted-foreground/60 tracking-wider uppercase font-semibold">
                    EVIDENS
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Esta imagem será usada automaticamente como banner do post na comunidade
          </p>
        </div>

        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-foreground">
            Título do Post *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Digite o título do post na comunidade..."
            className="w-full"
          />
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium text-foreground">
            Categoria
          </Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>Carregando categorias...</SelectItem>
              ) : (
                categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>
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
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Conteúdo do Post
          </Label>
          <TiptapEditor
            content={formData.content}
            onChange={(content) => handleInputChange('content', content)}
            placeholder="Descreva o conteúdo da review, faça perguntas para a comunidade ou inicie uma discussão..."
          />
        </div>

        {/* Admin Notes */}
        <div className="space-y-2">
          <Label htmlFor="admin_notes" className="text-sm font-medium text-foreground">
            Notas Administrativas (Internas)
          </Label>
          <Textarea
            id="admin_notes"
            value={formData.admin_notes}
            onChange={(e) => handleInputChange('admin_notes', e.target.value)}
            placeholder="Notas internas sobre este post (não visível para usuários)..."
            rows={3}
          />
        </div>

        {/* Status Information */}
        {existingPost && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>Status atual: <strong className="capitalize">{existingPost.post_status}</strong></div>
                <div>Visibilidade: <strong>{existingPost.visibility_level === 'public' ? 'Público' : 'Oculto'}</strong></div>
                {existingPost.scheduled_publish_at && (
                  <div>Agendado para: <strong>{new Date(existingPost.scheduled_publish_at).toLocaleDateString('pt-BR')}</strong></div>
                )}
                {existingPost.admin_creator && (
                  <div>Criado por: <strong>{existingPost.admin_creator.full_name}</strong></div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleSaveDraft}
            disabled={isMutating || !formData.title.trim()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {existingPost ? 'Salvar Alterações' : 'Salvar Rascunho'}
          </Button>

          <Button
            onClick={handlePublishNow}
            disabled={isMutating || !formData.title.trim()}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Publicar Agora
          </Button>

          <Button
            onClick={handlePublishWhenReviewPublished}
            disabled={isMutating || !formData.title.trim()}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Publicar com Review
          </Button>

          <Button
            onClick={handleCreateHiddenPost}
            disabled={isMutating || !formData.title.trim()}
            variant="outline"
            className={cn(
              "flex items-center gap-2",
              existingPost?.visibility_level === 'hidden' && "text-orange-600 border-orange-600"
            )}
          >
            <EyeOff className="h-4 w-4" />
            Post Oculto
          </Button>

          {/* Toggle Visibility for existing posts */}
          {existingPost && (
            <Button
              onClick={handleToggleVisibility}
              disabled={isMutating}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 ml-auto"
            >
              {existingPost.visibility_level === 'hidden' ? (
                <>
                  <Eye className="h-4 w-4" />
                  Mostrar na Comunidade
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Ocultar da Comunidade
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-1 pt-2">
          <p><strong>Salvar:</strong> Mantém como rascunho privado</p>
          <p><strong>Publicar Agora:</strong> Torna público imediatamente na comunidade</p>
          <p><strong>Publicar com Review:</strong> Publica automaticamente quando a review for publicada</p>
          <p><strong>Post Oculto:</strong> Permite comentários na review mas não aparece na comunidade</p>
        </div>
      </CardContent>
    </Card>
  );
};