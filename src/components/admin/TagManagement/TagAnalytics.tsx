// ABOUTME: Tag analytics and reporting component with usage statistics and insights

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Hash, 
  Activity,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useTagAnalyticsQuery, type TagWithStats } from '../../../../packages/hooks/useTagManagementQuery';

export const TagAnalytics = () => {
  const { data: analytics, isLoading, error } = useTagAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics de Tags</CardTitle>
          <CardDescription>Erro ao carregar dados analíticos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Falha ao carregar analytics das tags.</p>
        </CardContent>
      </Card>
    );
  }

  const {
    totalTags,
    popularTags,
    unusedTags,
    newThisMonth,
    hierarchyDepth,
    topUsedTags,
    orphanedTags,
    recentTags
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tags</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags}</div>
            <p className="text-xs text-muted-foreground">
              Tags no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags Populares</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popularTags}</div>
            <p className="text-xs text-muted-foreground">
              Mais de 10 usos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tags Não Utilizadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unusedTags}</div>
            <p className="text-xs text-muted-foreground">
              Sem conteúdo associado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novas Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Criadas recentemente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura Hierárquica</CardTitle>
          <CardDescription>
            Informações sobre a organização das tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profundidade Máxima</span>
            <Badge variant="outline">{hierarchyDepth} níveis</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tags Órfãs</span>
            <Badge variant={orphanedTags.length > 0 ? "destructive" : "secondary"}>
              {orphanedTags.length} tags
            </Badge>
          </div>
          {orphanedTags.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <h4 className="text-sm font-medium text-orange-800 mb-2">Tags Órfãs Encontradas:</h4>
              <div className="flex flex-wrap gap-1">
                {orphanedTags.slice(0, 5).map(tag => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.tag_name}
                  </Badge>
                ))}
                {orphanedTags.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{orphanedTags.length - 5} mais
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Used Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags Mais Utilizadas</CardTitle>
            <CardDescription>
              Tags com maior número de associações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topUsedTags.length > 0 ? (
              <div className="space-y-3">
                {topUsedTags.slice(0, 8).map((tag, index) => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{tag.tag_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress 
                          value={(tag.usage_count / (topUsedTags[0]?.usage_count || 1)) * 100} 
                          className="h-2"
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs min-w-12">
                        {tag.usage_count}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhum dado de uso disponível
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags Recentes</CardTitle>
            <CardDescription>
              Tags criadas nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTags.length > 0 ? (
              <div className="space-y-3">
                {recentTags.slice(0, 8).map(tag => (
                  <div key={tag.id} className="flex items-center justify-between">
                    <span className="font-medium">{tag.tag_name}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(tag.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhuma tag criada recentemente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Score de Saúde do Sistema</CardTitle>
          <CardDescription>
            Avaliação geral da organização das tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Utilização Geral</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={totalTags > 0 ? ((totalTags - unusedTags) / totalTags) * 100 : 0} 
                  className="w-20 h-2"
                />
                <span className="text-sm text-gray-600">
                  {totalTags > 0 ? Math.round(((totalTags - unusedTags) / totalTags) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Organização Hierárquica</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={orphanedTags.length === 0 ? 100 : Math.max(0, 100 - (orphanedTags.length / totalTags) * 100)} 
                  className="w-20 h-2"
                />
                <span className="text-sm text-gray-600">
                  {orphanedTags.length === 0 ? 100 : Math.round(Math.max(0, 100 - (orphanedTags.length / totalTags) * 100))}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Crescimento</span>
              <div className="flex items-center gap-2">
                <Activity className={`h-4 w-4 ${newThisMonth > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {newThisMonth > 0 ? 'Ativo' : 'Estável'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
