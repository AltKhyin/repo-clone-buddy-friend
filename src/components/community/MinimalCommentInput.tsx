// ABOUTME: Minimal Reddit-style comment input that expands on focus with essential controls only.

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, FileText, Type } from 'lucide-react';
import { useCreateCommentMutation } from '@packages/hooks/useCreateCommentMutation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MinimalCommentInputProps {
  parentPostId: number;
  rootPostId?: number; // The root post ID for cache invalidation
  onCommentPosted: () => void;
  placeholder?: string;
  className?: string;
}

export const MinimalCommentInput = ({ 
  parentPostId, 
  rootPostId,
  onCommentPosted, 
  placeholder = "Join the conversation",
  className 
}: MinimalCommentInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isRichText, setIsRichText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createComment = useCreateCommentMutation();

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setContent('');
    setIsRichText(false);
  };

  const handleSubmit = () => {
    if (content.trim().length < 3) {
      toast.error('O comentário precisa ter pelo menos 3 caracteres.');
      return;
    }

    createComment.mutate({
      content: content.trim(),
      parent_post_id: parentPostId,
      root_post_id: rootPostId || parentPostId, // Use rootPostId for cache invalidation
      category: 'comment',
    }, {
      onSuccess: () => {
        toast.success('Comentário publicado!');
        setContent('');
        setIsExpanded(false);
        setIsRichText(false);
        onCommentPosted();
      },
      onError: (error) => {
        toast.error('Falha ao publicar comentário.', { 
          description: error.message 
        });
      }
    });
  };

  const handleImageClick = () => {
    toast.info('Upload de imagens em comentários será implementado em breve');
  };

  const handleGifClick = () => {
    toast.info('GIFs em comentários serão implementados em breve');
  };

  const toggleRichText = () => {
    setIsRichText(!isRichText);
    // Visual feedback for toggling
    if (!isRichText) {
      toast.info('Modo texto rico ativado (funcionalidade em desenvolvimento)');
    } else {
      toast.info('Modo texto simples ativado');
    }
    // Focus textarea after toggle
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  if (!isExpanded) {
    // Collapsed state - minimal single line input
    return (
      <div className={cn("w-full", className)}>
        <div
          className="w-full px-4 py-3 text-sm text-muted-foreground bg-transparent border border-border rounded-md cursor-text hover:border-border-hover transition-colors"
          onClick={handleFocus}
        >
          {placeholder}
        </div>
      </div>
    );
  }

  // Expanded state - minimal editor with controls
  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva seu comentário..."
          className="min-h-[80px] resize-none border-border focus:border-border-hover"
          autoFocus
        />
      </div>

      {/* Bottom controls row */}
      <div className="flex items-center justify-between">
        {/* Left controls - minimal icons */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-surface-muted/50"
            onClick={handleImageClick}
            title="Adicionar imagem"
          >
            <Image className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-surface-muted/50"
            onClick={handleGifClick}
            title="Adicionar GIF"
          >
            <FileText className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 hover:bg-surface-muted/50",
              isRichText && "bg-surface-muted text-primary"
            )}
            onClick={toggleRichText}
            title="Alternar editor de texto"
          >
            <Type className="w-4 h-4" />
          </Button>
        </div>

        {/* Right controls - action buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={createComment.isPending}
            className="h-8 px-3 text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={createComment.isPending || content.trim().length < 3}
            className="h-8 px-3 text-xs"
          >
            {createComment.isPending ? 'Publicando...' : 'Comentar'}
          </Button>
        </div>
      </div>
    </div>
  );
};