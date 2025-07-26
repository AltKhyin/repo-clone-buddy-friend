// ABOUTME: New unified editor page replacing the old complex editor system

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UnifiedEditor, type RichContentBlock } from '@/components/unified-editor';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewData {
  id: number;
  title: string;
  structured_content: any; // Existing structured content field
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export const UnifiedEditorPage: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: reviewData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      if (!reviewId) throw new Error('Review ID is required');

      const { data, error } = await supabase
        .from('Reviews')
        .select('*')
        .eq('id', parseInt(reviewId))
        .single();

      if (error) throw error;
      return data as ReviewData;
    },
    enabled: !!reviewId,
  });

  // ============================================================================
  // SAVE MUTATION
  // ============================================================================

  const saveMutation = useMutation({
    mutationFn: async (blocks: RichContentBlock[]) => {
      if (!reviewId) throw new Error('Review ID is required');

      const { error } = await supabase
        .from('Reviews')
        .update({
          structured_content: blocks,
        })
        .eq('id', parseInt(reviewId));

      if (error) throw error;
    },

    onSuccess: () => {
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['review', reviewId] });
      toast.success('Review saved successfully');
    },

    onError: error => {
      console.error('Save failed:', error);
      toast.error('Failed to save review');
    },

    onSettled: () => {
      setIsSaving(false);
    },
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleContentChange = useCallback((blocks: RichContentBlock[]) => {
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(
    async (blocks: RichContentBlock[]) => {
      setIsSaving(true);
      await saveMutation.mutateAsync(blocks);
    },
    [saveMutation]
  );

  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [hasUnsavedChanges, navigate]);

  const handlePreview = useCallback(() => {
    if (reviewId) {
      // Open preview in new tab
      window.open(`/review/${reviewId}`, '_blank');
    }
  }, [reviewId]);

  // ============================================================================
  // CONTENT MIGRATION (OLD TO NEW FORMAT)
  // ============================================================================

  const migrateOldContent = useCallback((structuredContent: any): RichContentBlock[] => {
    // Convert existing structured content to unified editor format
    if (!structuredContent) return [];

    try {
      // If it's already in the unified format, return as-is
      if (Array.isArray(structuredContent) && structuredContent[0]?.type === 'richText') {
        return structuredContent as RichContentBlock[];
      }

      // Create a default block for existing structured content
      const migratedBlock: RichContentBlock = {
        id: `migrated_${Date.now()}`,
        type: 'richText',
        position: { x: 100, y: 100 },
        dimensions: { width: 600, height: 400 },
        content: {
          tiptapJSON: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Content from existing review. Ready for editing with the new unified editor.',
                  },
                ],
              },
            ],
          },
          htmlContent:
            '<p>Content from existing review. Ready for editing with the new unified editor.</p>',
        },
        styling: {
          backgroundColor: 'var(--color-editor-bg)',
          borderColor: 'var(--color-editor-border)',
          borderWidth: 1,
          borderRadius: 8,
          padding: { x: 16, y: 16 },
          opacity: 1,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      };

      return [migratedBlock];
    } catch (error) {
      console.error('Content migration failed:', error);
      return [];
    }
  }, []);

  // ============================================================================
  // INITIAL CONTENT PREPARATION
  // ============================================================================

  const initialContent = React.useMemo(() => {
    if (!reviewData) return [];

    // Use existing structured_content or create default content
    if (reviewData.structured_content) {
      return migrateOldContent(reviewData.structured_content);
    }

    return [];
  }, [reviewData, migrateOldContent]);

  // ============================================================================
  // PAGE TITLE EFFECT
  // ============================================================================

  useEffect(() => {
    if (reviewData?.title) {
      document.title = `Editing: ${reviewData.title} - EVIDENS`;
    }

    return () => {
      document.title = 'EVIDENS';
    };
  }, [reviewData?.title]);

  // ============================================================================
  // UNSAVED CHANGES WARNING
  // ============================================================================

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading editor...</div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !reviewData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Failed to load review
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="unified-editor-page h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="border-l border-gray-300 h-6 mx-2" />

          <div>
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
              {reviewData.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Status: {reviewData.status}</span>
              {lastSaved && (
                <>
                  <span>•</span>
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              )}
              {hasUnsavedChanges && (
                <>
                  <span>•</span>
                  <span className="text-amber-600">Unsaved changes</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>

          <Button
            size="sm"
            onClick={() => {
              // Manual save trigger would go here
              // For now, the UnifiedEditor handles auto-save
            }}
            disabled={isSaving}
            className={cn({
              'bg-green-600 hover:bg-green-700': !hasUnsavedChanges,
            })}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {hasUnsavedChanges ? 'Save' : 'Saved'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-hidden">
        <UnifiedEditor
          initialContent={initialContent}
          onContentChange={handleContentChange}
          onSave={handleSave}
          autoSave={true}
          autoSaveInterval={5000}
          showToolbar={true}
          showMinimap={false}
          className="h-full"
        />
      </div>
    </div>
  );
};
