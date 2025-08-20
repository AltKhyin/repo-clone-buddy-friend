
// ABOUTME: Review detail page with intelligent renderer selection - V3 Native WYSIWYG for V3 content, Legacy Layout-Aware for V2/legacy content

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReviewDetailQuery } from '../../packages/hooks/useReviewDetailQuery';
import { useEditorLoadQuery } from '../../packages/hooks/useEditorPersistence';
import LayoutAwareRenderer from '@/components/review-detail/LayoutAwareRenderer';
import { ReadOnlyCanvas } from '@/components/review-detail/ReadOnlyCanvas';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Lock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ReviewDetailPageContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: review, isLoading, isError, error } = useReviewDetailQuery(slug);
  
  // 🎯 UNIFIED DATA SOURCE: Use same data as editor for perfect parity
  const { data: editorContent, isLoading: isEditorLoading } = useEditorLoadQuery(slug || null);


  // Loading state with skeleton loaders  
  if (isLoading || isEditorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Header skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-6">
            <Skeleton className="w-full h-64" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (isError) {
    console.error('Review detail error:', error);
    
    // Handle specific error types
    if (error?.message?.includes('not found')) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground font-serif">Review não encontrado</h1>
            <p className="text-muted-foreground">
              O review que você está procurando não existe ou foi removido.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }

    if (error?.message?.includes('Access denied')) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground font-serif">Acesso restrito</h1>
            <p className="text-muted-foreground">
              Este conteúdo requer uma assinatura premium para ser acessado.
            </p>
            <button
              onClick={() => window.location.href = '/perfil'}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors"
            >
              Ver planos
            </button>
          </div>
        </div>
      );
    }

    // Generic error
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground font-serif">Erro ao carregar</h1>
          <p className="text-muted-foreground">
            {error?.message || 'Ocorreu um erro inesperado. Tente novamente.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!review) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground font-serif">Nenhum conteúdo</h1>
          <p className="text-muted-foreground">
            Não foi possível carregar o review solicitado.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Review Header */}
        <header className="mb-8 space-y-6">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-bold text-foreground font-serif leading-tight flex-1">
              {review.title}
            </h1>
          </div>
          
          {review.description && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {review.description}
            </p>
          )}
          
          {/* Author and Meta Information */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            {review.author && (
              <>
                {review.author.avatar_url ? (
                  <img 
                    src={review.author.avatar_url}
                    alt={review.author.full_name || 'Autor'}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-semibold text-muted-foreground">
                      {(review.author.full_name || 'A').charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {review.author.full_name || 'Autor anônimo'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Publicado em {new Date(review.published_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Content - Unified Canvas Architecture */}
        <main className="mb-12">
          {editorContent?.structured_content ? (
            <div className="review-content">
              {/* Break out of ALL container padding for true edge-to-edge mobile canvas */}
              <div className="v3-content -mx-6 sm:mx-0">
                {/* 🎯 UNIFIED DATA SOURCE: Same data as editor = perfect parity */}
                <ReadOnlyCanvas 
                  content={editorContent.structured_content}
                  className="review-v3-content"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Este review ainda não possui conteúdo estruturado.
              </p>
            </div>
          )}
        </main>

        {/* Community Thread Section - Lazy loaded per Blueprint 05 */}
        {review.community_post_id && (
          <section className="border-t border-border pt-8">
            <h2 className="text-2xl font-bold text-foreground font-serif mb-6">
              Discussão da comunidade
            </h2>
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                Seção de comentários será implementada em breve.
              </p>
            </div>
          </section>
        )}

        {/* Recommended Section */}
        <section className="border-t border-border pt-8 mt-12">
          <h2 className="text-2xl font-bold text-foreground font-serif mb-6">
            Leituras recomendadas
          </h2>
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              Recomendações personalizadas serão implementadas em breve.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default function ReviewDetailPage() {
  return (
    <ErrorBoundary 
      tier="page"
      context="página de detalhes da review"
      showHomeButton={true}
      showBackButton={true}
    >
      <ReviewDetailPageContent />
    </ErrorBoundary>
  );
}
