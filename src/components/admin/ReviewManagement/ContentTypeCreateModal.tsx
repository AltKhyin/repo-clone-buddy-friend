// ABOUTME: Modal for creating new content types with color picker and preview functionality

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useContentTypeOperationMutation, getDefaultContentTypeColors } from '../../../../packages/hooks/useContentTypeManagement';

interface ContentTypeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContentTypeCreateModal = ({ isOpen, onClose }: ContentTypeCreateModalProps) => {
  const operationMutation = useContentTypeOperationMutation();
  
  const [formData, setFormData] = useState(() => ({
    label: '',
    description: '',
    ...getDefaultContentTypeColors(),
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        label: '',
        description: '',
        ...getDefaultContentTypeColors(),
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Nome do tipo é obrigatório';
    }

    // Validate hex colors
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (!hexColorRegex.test(formData.text_color)) {
      newErrors.text_color = 'Cor deve estar no formato #000000';
    }
    if (!hexColorRegex.test(formData.border_color)) {
      newErrors.border_color = 'Cor deve estar no formato #000000';
    }
    if (!hexColorRegex.test(formData.background_color)) {
      newErrors.background_color = 'Cor deve estar no formato #000000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await operationMutation.mutateAsync({
        action: 'create',
        contentType: {
          label: formData.label.trim(),
          description: formData.description.trim(),
          text_color: formData.text_color,
          border_color: formData.border_color,
          background_color: formData.background_color,
        },
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create content type:', error);
      setErrors({ submit: 'Erro ao criar tipo de conteúdo. Tente novamente.' });
    }
  };

  const handleColorChange = (field: string, value: string) => {
    // Ensure the value starts with # and is 7 characters max
    let formattedValue = value;
    if (!value.startsWith('#')) {
      formattedValue = '#' + value;
    }
    formattedValue = formattedValue.slice(0, 7);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Tipo de Conteúdo</DialogTitle>
          <DialogDescription>
            Crie um novo tipo de conteúdo personalizado definindo nome, descrição e cores para categorizar suas reviews.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="label">Nome do Tipo</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Ex: Revisão Clínica"
              required
            />
            {errors.label && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.label}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do tipo de conteúdo..."
            />
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Text Color */}
            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => handleColorChange('text_color', e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={formData.text_color}
                  onChange={(e) => handleColorChange('text_color', e.target.value)}
                  className="font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
              {errors.text_color && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.text_color}</p>
              )}
            </div>

            {/* Border Color */}
            <div className="space-y-2">
              <Label>Cor da Borda</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.border_color}
                  onChange={(e) => handleColorChange('border_color', e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={formData.border_color}
                  onChange={(e) => handleColorChange('border_color', e.target.value)}
                  className="font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
              {errors.border_color && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.border_color}</p>
              )}
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.background_color}
                  onChange={(e) => handleColorChange('background_color', e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={formData.background_color}
                  onChange={(e) => handleColorChange('background_color', e.target.value)}
                  className="font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
              {errors.background_color && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.background_color}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div>
              <Badge
                style={{
                  color: formData.text_color,
                  borderColor: formData.border_color,
                  backgroundColor: formData.background_color,
                  border: `1px solid ${formData.border_color}`
                }}
                className="text-sm"
              >
                {formData.label || 'Nome do Tipo'}
              </Badge>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.label.trim() || operationMutation.isPending}
            >
              {operationMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};