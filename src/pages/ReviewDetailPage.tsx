
// ABOUTME: Review detail page with intelligent renderer selection - V3 Native WYSIWYG for V3 content, Legacy Layout-Aware for V2/legacy content

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReviewDetailQuery } from '../../packages/hooks/useReviewDetailQuery';
import LayoutAwareRenderer from '@/components/review-detail/LayoutAwareRenderer';
import WYSIWYGRenderer from '@/components/review-detail/WYSIWYGRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Lock, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/auth';

const ReviewDetailPageContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: review, isLoading, isError, error } = useReviewDetailQuery(slug);
  const { user } = useAuthStore();

  // Check if user has admin/editor role
  const userRole = user?.app_metadata?.role || 'practitioner';
  const canEdit = ['admin', 'editor'].includes(userRole);

  console.log('ReviewDetailPage render:', { slug, review, isLoading, isError, error });

  // Loading state with skeleton loaders
  if (isLoading) {
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

  console.log('Rendering review successfully:', {
    title: review.title,
    contentFormat: review.contentFormat,
    nodeCount: review.nodeCount,
    hasPositions: review.hasPositions,
    hasMobilePositions: review.hasMobilePositions,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Review Header */}
        <header className="mb-8 space-y-6">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-bold text-foreground font-serif leading-tight flex-1">
              {review.title}
            </h1>
            {canEdit && review.id && (
              <div className="ml-6 flex-shrink-0">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/editor/${review.id}`}>
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Link>
                </Button>
              </div>
            )}
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

        {/* Main Content - Intelligent Renderer Selection */}
        <main className="mb-12">
          {review.structured_content ? (
            <div className="review-content">
              {/* V3 Content Bridge: Smart renderer selection based on format */}
              {review.contentFormat === 'v3' ? (
                <div className="v3-content">
                  {/* V3 Native WYSIWYG Renderer */}
                  <WYSIWYGRenderer 
                    content={review.structured_content} 
                    isReadOnly={true}
                    className="review-v3-content"
                  />
                  
                  {/* Development format indicator */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">V3 Content Bridge:</span>
                        <span>Using V3 Native Renderer</span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                          {review.nodeCount} blocks • {review.hasPositions ? 'Positioned' : 'Vertical'} • 
                          {review.hasMobilePositions ? ' Mobile-optimized' : ' Scaled'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : review.contentFormat === 'v2' ? (
                <div className="v2-content">
                  {/* Legacy V2 Layout-Aware Renderer */}
                  <LayoutAwareRenderer content={review.structured_content} />
                  
                  {/* Development format indicator */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <span className="font-medium">Legacy Content:</span>
                        <span>Using V2 Layout Renderer</span>
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 rounded text-xs">
                          {review.nodeCount} blocks • Grid-based
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="legacy-content">
                  {/* Fallback for unknown/legacy formats */}
                  <LayoutAwareRenderer content={review.structured_content} />
                  
                  {/* Development format indicator */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Unknown Format:</span>
                        <span>Using Legacy Fallback Renderer</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                          {review.contentFormat} • {review.nodeCount} elements
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
