// ABOUTME: Multi-select content type component for selecting from predefined content type presets

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Plus, Settings, Edit, Trash2 } from 'lucide-react';
import { useContentTypeManagement, useContentTypeOperationMutation } from '../../../../packages/hooks/useContentTypeManagement';
import { ContentTypeCreateModal } from './ContentTypeCreateModal';
import { ContentTypeEditModal } from './ContentTypeEditModal';
import { useToast } from '@/hooks/use-toast';

interface ContentTypeSelectorProps {
  selectedContentTypes: number[];
  onChange: (contentTypeIds: number[]) => void;
}

export const ContentTypeSelector = ({ selectedContentTypes, onChange }: ContentTypeSelectorProps) => {
  const { data: contentTypes = [], isLoading } = useContentTypeManagement();
  const { toast } = useToast();
  const deleteContentTypeMutation = useContentTypeOperationMutation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContentType, setEditingContentType] = useState<any>(null);

  // Multi-select logic for preset content types
  const handleToggleSelection = (contentTypeId: number) => {
    const isSelected = selectedContentTypes.includes(contentTypeId);
    if (isSelected) {
      onChange(selectedContentTypes.filter(id => id !== contentTypeId));
    } else {
      onChange([...selectedContentTypes, contentTypeId]);
    }
  };

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
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir tipo de conteúdo. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Label>Tipo de Conteúdo</Label>
        <Card className="border border-border">
          <CardContent className="p-3">
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-surface-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Tipo de Conteúdo</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="h-8 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Novo Tipo
        </Button>
      </div>
      
      {/* Selected content types as pills */}
      {selectedContentTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedContentTypes.map(id => {
            const type = contentTypes.find(t => t.id === id);
            if (!type) return null;
            
            return (
              <div key={id} className="group relative">
                <Badge
                  style={{
                    color: type.text_color,
                    borderColor: type.border_color,
                    backgroundColor: type.background_color,
                    border: `1px solid ${type.border_color}`
                  }}
                  className="flex items-center gap-1 px-2 py-1 pr-8"
                >
                  {type.label}
                </Badge>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContentType(type);
                      setShowEditModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded flex items-center justify-center w-4 h-4"
                    title={`Editar ${type.label}`}
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={() => handleToggleSelection(id)}
                    className="hover:opacity-70 flex items-center justify-center w-4 h-4"
                    aria-label={`Remove ${type.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content type selection (preset options only) */}
      <Card className="border border-border">
        <CardContent className="p-3">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {contentTypes.map(type => (
              <div key={type.id} className="flex items-center justify-between space-x-2 group">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedContentTypes.includes(type.id)}
                    onCheckedChange={() => handleToggleSelection(type.id)}
                    id={`content-type-${type.id}`}
                  />
                  <label htmlFor={`content-type-${type.id}`} className="cursor-pointer flex items-center space-x-2">
                    <Badge
                      style={{
                        color: type.text_color,
                        borderColor: type.border_color,
                        backgroundColor: type.background_color,
                        border: `1px solid ${type.border_color}`
                      }}
                      className="text-xs"
                    >
                      {type.label}
                    </Badge>
                    {type.description && (
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    )}
                  </label>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingContentType(type);
                      setShowEditModal(true);
                    }}
                    className="h-6 w-6 p-0 hover:bg-muted"
                    title={`Editar ${type.label}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteContentType(type)}
                    className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                    title={`Excluir ${type.label}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
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
    </div>
  );
};