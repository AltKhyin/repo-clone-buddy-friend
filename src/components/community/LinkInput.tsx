// ABOUTME: Link input component for creating link posts with preview functionality.

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Link2, Image, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { LinkPreviewData } from '@/types/community';

interface LinkInputProps {
  value?: string;
  onValueChange: (url: string) => void;
  previewData?: LinkPreviewData | null;
  onPreviewDataChange: (data: LinkPreviewData | null) => void;
  disabled?: boolean;
}

export const LinkInput = ({
  value = '',
  onValueChange,
  previewData,
  onPreviewDataChange,
  disabled = false,
}: LinkInputProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const fetchLinkPreview = async (url: string) => {
    if (!isValidUrl(url)) {
      setError('URL inválida. Use http:// ou https://');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching link preview for URL:', url);
      const { data, error } = await supabase.functions.invoke('get-link-preview', {
        body: { url },
      });

      console.log('Link preview response:', { data, error });

      if (error) {
        console.error('Link preview error:', error);
        setError(`Erro ao obter preview do link: ${error.message || 'Erro desconhecido'}`);
        onPreviewDataChange(null);
        return;
      }

      if (data?.success && data?.preview) {
        console.log('Link preview success:', data.preview);
        console.log('Preview image URL:', data.preview.image);
        console.log('Preview data full:', JSON.stringify(data.preview, null, 2));
        onPreviewDataChange(data.preview);
      } else if (data?.success === false) {
        console.error('Link preview API returned failure:', data);
        setError(`Não foi possível obter o preview: ${data.error || 'Erro desconhecido'}`);
        onPreviewDataChange(null);
      } else {
        console.error('Unexpected response format:', data);
        setError('Não foi possível obter o preview do link');
        onPreviewDataChange(null);
      }
    } catch (err) {
      console.error('Failed to fetch link preview:', err);
      setError(
        `Erro ao conectar com o serviço de preview: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
      );
      onPreviewDataChange(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onValueChange(url);

    // Clear previous data when URL changes
    if (previewData && previewData.url !== url) {
      onPreviewDataChange(null);
    }

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleFetchPreview = () => {
    if (value.trim()) {
      fetchLinkPreview(value.trim());
    }
  };

  const handleRemovePreview = () => {
    onPreviewDataChange(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFetchPreview();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Cole o link aqui (ex: https://example.com)"
          value={value}
          onChange={e => handleUrlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleFetchPreview}
          disabled={disabled || isLoading || !value.trim()}
          className="px-4"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        </Button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</div>}

      {previewData && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemovePreview}
                className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/40 text-white p-1 h-auto"
              >
                <X className="h-3 w-3" />
              </Button>

              <div className="flex">
                {previewData.image && (
                  <div className="w-32 h-24 flex-shrink-0 overflow-hidden bg-gray-100">
                    <img
                      src={previewData.image}
                      alt="Link preview"
                      className="w-full h-full object-cover"
                      onLoad={e => {
                        console.log('Link preview image loaded successfully:', previewData.image);
                      }}
                      onError={e => {
                        console.error('Link preview image failed to load:', previewData.image);
                        console.error('Image error event:', e);
                        // Hide broken images
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {previewData.domain}
                    </Badge>
                  </div>

                  {previewData.title && (
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{previewData.title}</h3>
                  )}

                  {previewData.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {previewData.description}
                    </p>
                  )}

                  {previewData.siteName && (
                    <p className="text-xs text-muted-foreground mt-1">{previewData.siteName}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Cole um link e clique no botão para gerar o preview automaticamente
      </p>
    </div>
  );
};
