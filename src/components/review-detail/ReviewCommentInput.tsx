// ABOUTME: Review-specific comment input that uses the review comment mutation system for unified commenting

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateReviewCommentMutation } from '../../../packages/hooks/useCreateReviewCommentMutation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewCommentInputProps {
  reviewId: number;
  onCommentPosted: () => void;
  placeholder?: string;
  className?: string;
}

export const ReviewCommentInput = ({ 
  reviewId,
  onCommentPosted, 
  placeholder = "Participar da conversa",
  className 
}: ReviewCommentInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createReviewComment = useCreateReviewCommentMutation();

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setContent('');
  };

  const handleSubmit = () => {
    if (content.trim().length < 3) {
      toast.error('O comentário precisa ter pelo menos 3 caracteres.');
      return;
    }

    createReviewComment.mutate({
      content: content.trim(),
      reviewId: reviewId,
    }, {
      onSuccess: () => {
        toast.success('Comentário publicado com sucesso!');
        setContent('');
        setIsExpanded(false);
        onCommentPosted();
        // Force re-render to clear loading state
        setTimeout(() => {
          console.log('Comment input: clearing state after success');
        }, 100);
      },
      onError: (error) => {
        console.error('Failed to create review comment:', error);
        toast.error('Erro ao publicar comentário. Tente novamente.');
      },
    });
  };

  return (
    <div className={cn('w-full', className)}>
      {!isExpanded ? (
        // Collapsed state - Simple input that expands on focus
        <div
          className="border border-border/60 rounded-lg p-3 bg-background cursor-text hover:border-border transition-colors"
          onClick={handleFocus}
        >
          <p className="text-muted-foreground text-sm">
            {placeholder}
          </p>
        </div>
      ) : (
        // Expanded state - Full comment composition
        <div className="border border-border rounded-lg bg-background overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="border-0 resize-none min-h-[100px] focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            autoFocus
          />
          
          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/30 bg-muted/20">
            <div className="text-xs text-muted-foreground">
              {content.length < 3 && content.length > 0 && (
                <span className="text-destructive">
                  Mínimo de 3 caracteres
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={createReviewComment.isPending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={content.trim().length < 3 || createReviewComment.isPending}
              >
                {createReviewComment.isPending ? 'Publicando...' : 'Comentar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};