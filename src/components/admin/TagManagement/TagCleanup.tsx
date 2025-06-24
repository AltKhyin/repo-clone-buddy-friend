// ABOUTME: Tag cleanup component for managing unused and orphaned tags

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import { useTagAnalyticsQuery, useTagOperationMutation } from '../../../../packages/hooks/useTagManagementQuery';

export const TagCleanup = () => {
  const { data: analytics, isLoading, refetch } = useTagAnalyticsQuery();
  const tagOperationMutation = useTagOperationMutation();
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true);
      await tagOperationMutation.mutateAsync({
        action: 'cleanup'
      });
      await refetch();
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const unusedTags = analytics?.orphanedTags || [];
  const canCleanup = unusedTags.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Limpeza de Tags</CardTitle>
          <CardDescription>Carregando dados de limpeza...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limpeza Automática de Tags</CardTitle>
        <CardDescription>
          Remova tags não utilizadas e organize o sistema automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cleanup Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-semibold">{unusedTags.length}</div>
                  <div className="text-sm text-gray-600">Tags Não Utilizadas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold">{analytics?.orphanedTags?.length || 0}</div>
                  <div className="text-sm text-gray-600">Tags Órfãs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-semibold">{(analytics?.totalTags || 0) - unusedTags.length}</div>
                  <div className="text-sm text-gray-600">Tags Ativas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cleanup Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ações de Limpeza</h3>
            <Button 
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>

          {canCleanup ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Foram encontradas {unusedTags.length} tag(s) que podem ser removidas por não estarem 
                associadas a nenhum conteúdo. Esta ação é irreversível.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Parabéns! Não há tags não utilizadas no sistema. Todas as tags estão 
                associadas a pelo menos um conteúdo.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleCleanup}
              disabled={!canCleanup || isCleaningUp || tagOperationMutation.isPending}
              variant={canCleanup ? "destructive" : "secondary"}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isCleaningUp ? 'Limpando...' : `Remover ${unusedTags.length} Tag(s) Não Utilizadas`}
            </Button>
          </div>
        </div>

        {/* Detailed List of Tags to Clean */}
        {unusedTags.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Tags que serão removidas:</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
              {unusedTags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{tag.tag_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {new Date(tag.created_at).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
