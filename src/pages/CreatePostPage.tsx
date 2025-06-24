
// ABOUTME: Page for creating new community posts with form validation and submission.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { CreatePostForm } from '../components/community/CreatePostForm';
import { useIsMobile } from '../hooks/use-mobile';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handlePostCreated = (postId: number) => {
    navigate(`/comunidade/${postId}`);
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 ${isMobile ? 'px-2' : ''}`}>
      {/* Navigation header */}
      <div className="mb-6">
        <Button 
          onClick={() => navigate('/comunidade')} 
          variant="ghost" 
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Comunidade
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          Criar Nova Discussão
        </h1>
        <p className="text-muted-foreground mt-2">
          Compartilhe suas ideias com a comunidade EVIDENS
        </p>
      </div>

      {/* Create post form */}
      <CreatePostForm onPostCreated={handlePostCreated} />
    </div>
  );
}
