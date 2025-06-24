
// ABOUTME: Reusable form component for creating new comments with rich text editing.

import React, { useState } from 'react';
import { TiptapEditor } from './TiptapEditor';
import { Button } from '@/components/ui/button';
import { useCreateCommentMutation } from '../../../packages/hooks/useCreateCommentMutation';
import { toast } from 'sonner';

interface CommentEditorProps {
  parentPostId: number;
  onCommentPosted: () => void;
}

export const CommentEditor = ({ parentPostId, onCommentPosted }: CommentEditorProps) => {
  const [content, setContent] = useState('');
  const createComment = useCreateCommentMutation();

  const handleSubmit = () => {
    if (content.trim().length < 3) {
      toast.error('O comentário precisa ter pelo menos 3 caracteres.');
      return;
    }

    createComment.mutate({
      content,
      parent_post_id: parentPostId,
      category: 'comment', // Dedicated category for comments
    }, {
      onSuccess: () => {
        toast.success('Comentário publicado!');
        setContent('');
        onCommentPosted();
      },
      onError: (error) => {
        toast.error('Falha ao publicar comentário.', { 
          description: error.message 
        });
      }
    });
  };

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-card">
      <TiptapEditor 
        content={content} 
        onChange={setContent}
        placeholder="Escreva seu comentário..."
      />
      <div className="flex justify-end gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onCommentPosted}
          disabled={createComment.isPending}
        >
          Cancelar
        </Button>
        <Button 
          size="sm"
          onClick={handleSubmit} 
          disabled={createComment.isPending || content.trim().length < 3}
        >
          {createComment.isPending ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </div>
  );
};
