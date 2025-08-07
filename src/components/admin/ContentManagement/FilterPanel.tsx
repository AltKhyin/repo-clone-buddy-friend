// ABOUTME: Filter panel for content queue with status and search filtering

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { useContentTypeManagement, useContentTypeOperationMutation } from '../../../../packages/hooks/useContentTypeManagement';
import { ContentTypeCreateModal } from '../ReviewManagement/ContentTypeCreateModal';
import { ContentTypeEditModal } from '../ReviewManagement/ContentTypeEditModal';
import { useToast } from '../../../hooks/use-toast';

interface FilterPanelProps {
  filters: {
    status: string;
    search: string;
    authorId: string;
    reviewerId: string;
    contentType?: string;
  };
  onFiltersChange: (filters: any) => void;
  summary?: {
    totalReviews: number;
    totalPosts: number;
  };
}

export const FilterPanel = ({ filters, onFiltersChange, summary }: FilterPanelProps) => {
  const { data: contentTypes = [], isLoading: contentTypesLoading } = useContentTypeManagement();
  const { toast } = useToast();
  const deleteContentTypeMutation = useContentTypeOperationMutation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContentType, setEditingContentType] = useState<any>(null);
  const [showManageDropdown, setShowManageDropdown] = useState(false);

  const handleDeleteContentType = async (contentType: any) => {
    if (confirm(`Tem certeza que deseja excluir o tipo "${contentType.label}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteContentTypeMutation.mutateAsync({
          action: 'delete',
          contentTypeId: contentType.id,
        });
        
        toast({
          title: 'Sucesso',
          description: 'Tipo de conteúdo excluído com sucesso.',
        });
        
        setShowManageDropdown(false);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir tipo de conteúdo. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showManageDropdown) {
        setShowManageDropdown(false);
      }
    };
    
    if (showManageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showManageDropdown]);

  return (
    <>
    <Card className="bg-surface border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          Filtros da Fila de Conteúdo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Buscar</label>
            <Input
              placeholder="Buscar por título..."
              value={filters.search}
              onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Tipo de Conteúdo</label>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManageDropdown(!showManageDropdown)}
                  className="h-8 w-8 p-0"
                  title="Gerenciar tipos de conteúdo"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {showManageDropdown && (
                  <div className="absolute right-0 top-10 z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCreateModal(true);
                        setShowManageDropdown(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Novo Tipo
                    </Button>
                    {contentTypes.length > 0 && (
                      <div className="my-1 h-px bg-border" />
                    )}
                    {contentTypes.map(type => (
                      <div key={type.id} className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingContentType(type);
                            setShowEditModal(true);
                            setShowManageDropdown(false);
                          }}
                          className="w-full justify-start"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar {type.label}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContentType(type)}
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir {type.label}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Select
              value={filters.contentType || 'all'}
              onValueChange={value => onFiltersChange({ ...filters, contentType: value })}
              disabled={contentTypesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {contentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center justify-between w-full group">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{
                            backgroundColor: type.background_color,
                            borderColor: type.border_color,
                          }}
                        />
                        {type.label}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingContentType(type);
                            setShowEditModal(true);
                          }}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                          title={`Editar ${type.label}`}
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteContentType(type);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                          title={`Excluir ${type.label}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Estatísticas</label>
            <div className="text-sm text-muted-foreground space-y-1">
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
    
    {/* Content Type Management Modals */}
    <ContentTypeCreateModal
      isOpen={showCreateModal}
      onClose={() => setShowCreateModal(false)}
    />
    
    {editingContentType && (
      <ContentTypeEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingContentType(null);
        }}
        contentType={editingContentType}
      />
    )}
  </>
  );
};
