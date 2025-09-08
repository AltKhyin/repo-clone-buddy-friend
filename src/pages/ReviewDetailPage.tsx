
// ABOUTME: Review detail page with intelligent renderer selection - V3 Native WYSIWYG for V3 content, Legacy Layout-Aware for V2/legacy content

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReviewDetailQuery } from '../../packages/hooks/useReviewDetailQuery';
import { useEditorLoadQuery } from '../../packages/hooks/useEditorPersistence';
import { useReviewRecommendations } from '../../packages/hooks/useReviewRecommendations';
import { useReviewCommentsQuery } from '../../packages/hooks/useReviewCommentsQuery';
import { ReadOnlyCanvas } from '@/components/review-detail/ReadOnlyCanvas';
import { ReviewHero } from '@/components/review-detail';
import { CommentThread } from '@/components/community/CommentThread';
import { ReviewCommentInput } from '@/components/review-detail/ReviewCommentInput';
import { useAuthStore } from '../store/auth';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/layout/Footer';
import ReviewCarousel from '@/components/homepage/ReviewCarousel';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Lock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ReviewDetailPageContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: review, isLoading, isError, error } = useReviewDetailQuery(slug);
  const { user } = useAuthStore();
  
  // 🎯 UNIFIED DATA SOURCE: Use same data as editor for perfect parity
  const { data: editorContent, isLoading: isEditorLoading } = useEditorLoadQuery(slug || null);

  // 📚 RECOMMENDATIONS: Fetch similar reviews based on tags
  const { data: recommendations, isLoading: isRecommendationsLoading } = useReviewRecommendations(review?.id);

  // 💬 COMMENTS: Fetch unified comment system data (virtual or community post-based)  
  const { data: commentsData, isLoading: isCommentsLoading } = useReviewCommentsQuery(review?.id);


  // Loading state with skeleton loaders  
  if (isLoading || isEditorLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 space-y-8">
          {/* Editorial article skeleton - appropriately sized */}
          <div className="space-y-6">
            {/* Hero Cover - Editorial appropriate */}
            <Skeleton className="w-full h-60 rounded-lg" />
            
            {/* Metadata and Author Section */}
            <div className="space-y-5">
              {/* Metadata row */}
              <div className="flex gap-4">
                <Skeleton className="h-4 w-28" /> {/* Date */}
                <Skeleton className="h-4 w-20" /> {/* Reading time */}
                <Skeleton className="h-4 w-24" /> {/* Views */}
              </div>
              
              {/* Author and Description row */}
              <div className="flex gap-6 items-start">
                {/* Author section */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                
                {/* Description */}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
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

          {/* Comments skeleton */}
          <div className="border-t border-border pt-8 mt-16 space-y-6">
            <Skeleton className="h-8 w-48" /> {/* Comments section title */}
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" /> {/* Comment input */}
              <Skeleton className="h-32 w-full rounded-lg" /> {/* Comment 1 */}
              <Skeleton className="h-24 w-11/12 rounded-lg ml-6" /> {/* Reply 1 */}
              <Skeleton className="h-28 w-full rounded-lg" /> {/* Comment 2 */}
            </div>
          </div>

          {/* Recommendations skeleton */}
          <div className="border-t border-border pt-8 mt-16 space-y-6">
            <Skeleton className="h-8 w-64" /> {/* Title */}
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="w-72 h-48 rounded-md flex-shrink-0" />
              ))}
            </div>
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

    if (error?.message?.includes('Access denied') || error?.message?.includes('ACCESS_DENIED')) {
      // Extract required tier from error message or default to premium
      let requiredTier = 'premium';
      let tierMessage = 'uma assinatura premium';
      let actionText = 'Ver planos';
      let actionHandler = () => window.location.href = '/perfil';
      
      if (error?.message?.includes('free account')) {
        requiredTier = 'free';
        tierMessage = 'uma conta gratuita';
        actionText = 'Criar conta gratuita';
        actionHandler = () => window.location.href = '/registrar';
      } else if (error?.message?.includes('premium subscription')) {
        requiredTier = 'premium';
        tierMessage = 'uma assinatura premium';
        actionText = 'Ver planos premium';
        actionHandler = () => window.location.href = '/perfil';
      }
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md mx-auto p-6">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground font-serif">Acesso restrito</h1>
            <p className="text-muted-foreground">
              Este conteúdo requer {tierMessage} para ser acessado.
            </p>
            <div className="space-y-2">
              <button
                onClick={actionHandler}
                className="w-full bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors"
              >
                {actionText}
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-secondary text-secondary-foreground px-6 py-2 rounded-md font-semibold hover:bg-secondary/90 transition-colors"
              >
                Voltar
              </button>
            </div>
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
      {/* Skip to content accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold z-50"
      >
        Pular para o conteúdo
      </a>
      
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
        {/* Review Hero */}
        <header className="mb-12" role="banner">
          <ReviewHero review={review} />
          
          {/* Header-Content Separator - Only after image */}
          <div className="w-full border-t border-border/40 mt-8 mb-8"></div>
        </header>

        {/* Main Content - Unified Canvas Architecture */}
        <main id="main-content" className="mb-16" role="main">
          {editorContent?.structured_content ? (
            <div className="review-content">
              {/* Break out of container padding for edge-to-edge mobile canvas */}
              <div className="v3-content -mx-4 lg:mx-0">
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

        {/* Recommended Section */}
        {recommendations && recommendations.length > 0 && (
          <section className="border-t border-border pt-8 mt-16" aria-labelledby="recommendations-heading">
            <ReviewCarousel 
              title="Leituras recomendadas" 
              reviews={recommendations}
            />
          </section>
        )}

        {/* Unified Comment Section - Works with both virtual and community posts */}
        <section className="border-t border-border pt-8 mt-16" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="text-2xl font-bold text-foreground font-serif mb-6">
            Comentários
          </h2>
          
          {isCommentsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" /> {/* Comment input */}
              <Skeleton className="h-32 w-full rounded-lg" /> {/* Comment 1 */}
              <Skeleton className="h-24 w-11/12 rounded-lg ml-6" /> {/* Reply 1 */}
              <Skeleton className="h-28 w-full rounded-lg" /> {/* Comment 2 */}
            </div>
          ) : commentsData ? (
            <div className="space-y-4">
              {/* Review Comment Input - Only for authenticated users */}
              {user && review && (
                <>
                  <ReviewCommentInput
                    reviewId={review.id}
                    onCommentPosted={() => {
                      // TanStack Query will handle cache invalidation automatically
                      console.log('Review comment posted successfully - cache will be updated automatically');
                    }}
                    placeholder="Participar da conversa"
                  />
                  
                  {/* Separator between input and comments */}
                  <Separator className="border-border/50" />
                </>
              )}
              
              {/* Comments Thread - Only comments, no post display */}
              <CommentThread 
                comments={commentsData.comments} 
                rootPostId={commentsData.post.id}
                onCommentPosted={() => {
                  console.log('Comment posted successfully - cache will be updated automatically');
                }}
              />
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                Não foi possível carregar os comentários.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <Footer />
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
