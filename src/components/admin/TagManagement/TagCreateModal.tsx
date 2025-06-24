
// ABOUTME: Modal component for creating new tags with proper validation and parent selection

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTagManagementQuery, useTagOperationMutation, type TagWithStats } from '../../../../packages/hooks/useTagManagementQuery';

interface TagCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId?: number | null;
}

export const TagCreateModal = ({ isOpen, onClose, parentId }: TagCreateModalProps) => {
  const [tagName, setTagName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(parentId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tags = [] } = useTagManagementQuery();
  const tagOperationMutation = useTagOperationMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tagName.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await tagOperationMutation.mutateAsync({
        action: 'create',
        name: tagName.trim(),
        parentId: selectedParentId
      });
      
      // Reset form and close modal
      setTagName('');
      setSelectedParentId(null);
      onClose();
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTagName('');
    setSelectedParentId(parentId || null);
    onClose();
  };

  // Get available parent tags (exclude current tag to prevent circular references)
  const availableParents = tags.filter(tag => tag.id !== selectedParentId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tag</DialogTitle>
          <DialogDescription>
            Adicione uma nova tag ao sistema de categorização.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">Nome da Tag *</Label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Digite o nome da tag..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentTag">Tag Pai (Opcional)</Label>
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
                {availableParents.map(tag => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    {tag.tag_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !tagName.trim()}>
              {isSubmitting ? 'Criando...' : 'Criar Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
