
// ABOUTME: Dedicated page for creating new community posts with rich text editor functionality.

import React from 'react';
import { CreatePostForm } from '../../components/community/CreatePostForm';

export const SubmitPage = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Nova Discussão</h1>
        <p className="text-muted-foreground">
          Compartilhe suas ideias e inicie uma discussão com a comunidade.
        </p>
      </div>
      
      <CreatePostForm />
    </div>
  );
};
