// ABOUTME: Bulk operations component for content management with functional implementation

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Archive, Calendar, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { useAdminBulkOperations } from '../../../../packages/hooks/useAdminBulkOperations';
import { useToast } from '../../../hooks/use-toast';

interface BulkOperationsProps {
  selectedReviews: number[];
  onComplete: () => void;
}

export const BulkOperations = ({ selectedReviews, onComplete }: BulkOperationsProps) => {
  const { toast } = useToast();
  const bulkOperations = useAdminBulkOperations();

  const handleBulkAction = async (action: 'publish' | 'schedule' | 'archive' | 'delete') => {
    // Add confirmation for destructive delete action
    if (action === 'delete') {
      const confirmed = confirm(
        `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nVocê está prestes a deletar PERMANENTEMENTE ${selectedReviews.length} review(s).\n\nEsta ação não pode ser desfeita. Os reviews serão completamente removidos do sistema.\n\nTem certeza de que deseja continuar?`
      );
      if (!confirmed) return;
    }

    try {
      const result = await bulkOperations.mutateAsync({
        reviewIds: selectedReviews,
        action,
      });

      toast({
        title: 'Success',
        description: `Bulk ${action} completed: ${result.processedCount} processed, ${result.failedCount} failed`,
      });

      onComplete();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} reviews`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-border bg-surface shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              {selectedReviews.length} items selecionados
            </Badge>
            <span className="text-sm text-secondary">
              Selecione uma ação para aplicar aos itens selecionados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('publish')}
              disabled={bulkOperations.isPending}
              className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-950"
            >
              {bulkOperations.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Publicar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('schedule')}
              disabled={bulkOperations.isPending}
              className="text-blue-700 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-950"
            >
              {bulkOperations.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-1" />
              )}
              Agendar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('archive')}
              disabled={bulkOperations.isPending}
              className="text-orange-700 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-950"
            >
              {bulkOperations.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-1" />
              )}
              Arquivar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              disabled={bulkOperations.isPending}
              className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-950"
            >
              {bulkOperations.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Deletar
            </Button>

            <Button variant="ghost" size="sm" onClick={onComplete}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
