// ABOUTME: Filter panel for content queue with status and search filtering

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilterPanelProps {
  filters: {
    status: string;
    search: string;
    authorId: string;
    reviewerId: string;
  };
  onFiltersChange: (filters: any) => void;
  summary?: {
    totalReviews: number;
    totalPosts: number;
  };
}

export const FilterPanel = ({ filters, onFiltersChange, summary }: FilterPanelProps) => {
  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          Filtros da Fila de Conteúdo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Status</label>
            <Select
              value={filters.status}
              onValueChange={value => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="under_review">Em Revisão</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Buscar</label>
            <Input
              placeholder="Buscar por título..."
              value={filters.search}
              onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">Estatísticas</label>
            <div className="text-sm text-secondary">
              {summary && (
                <>
                  <div>Reviews: {summary.totalReviews}</div>
                  <div>Posts: {summary.totalPosts}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
