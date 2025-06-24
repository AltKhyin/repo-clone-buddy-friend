
// ABOUTME: Modal component for editing existing tags with validation and parent reassignment

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTagManagementQuery, useTagOperationMutation, type TagWithStats } from '../../../../packages/hooks/useTagManagementQuery';

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: TagWithStats | null;
}

export const TagEditModal = ({ isOpen, onClose, tag }: TagEditModalProps) => {
  const [tagName, setTagName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tags = [] } = useTagManagementQuery();
  const tagOperationMutation = useTagOperationMutation();

  // Initialize form when tag changes
  useEffect(() => {
    if (tag) {
      setTagName(tag.tag_name);
      setSelectedParentId(tag.parent_id);
    }
  }, [tag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tagName.trim() || !tag) {
      return;
    }

    try {
      setIsSubmitting(true);
      await tagOperationMutation.mutateAsync({
        action: 'update',
        tagId: tag.id,
        name: tagName.trim(),
        parentId: selectedParentId
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update tag:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (tag) {
      setTagName(tag.tag_name);
      setSelectedParentId(tag.parent_id);
    }
    onClose();
  };

  // Get available parent tags (exclude current tag and its descendants to prevent circular references)
  const getDescendantIds = (tagId: number): number[] => {
    const descendants: number[] = [tagId];
    const children = tags.filter(t => t.parent_id === tagId);
    children.forEach(child => {
      descendants.push(...getDescendantIds(child.id));
    });
    return descendants;
  };

  const excludedIds = tag ? getDescendantIds(tag.id) : [];
  const availableParents = tags.filter(t => !excludedIds.includes(t.id));

  if (!tag) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Tag</DialogTitle>
          <DialogDescription>
            Modifique o nome ou hierarquia da tag selecionada.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editTagName">Nome da Tag *</Label>
            <Input
              id="editTagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Digite o nome da tag..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editParentTag">Tag Pai</Label>
            <Select 
              value={selectedParentId?.toString() || "none"} 
              onValueChange={(value) => setSelectedParentId(value === "none" ? null : parseInt(value))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tag pai..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (Tag raiz)</SelectItem>
                {availableParents.map(parentTag => (
                  <SelectItem key={parentTag.id} value={parentTag.id.toString()}>
                    {parentTag.tag_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <strong>Usos atuais:</strong> {tag.usage_count} conteúdos
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !tagName.trim()}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
