// ABOUTME: Modal for editing existing content types with pre-populated form and update functionality

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
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { validateColorOrToken } from '@/utils/color-tokens';
import { sanitizeStyleColors } from '@/utils/color-sanitization';
import { useContentTypeOperationMutation } from '@packages/hooks/useContentTypeManagement';
import { useColorHandling } from '@/hooks/useColorHandling';
import { TEXT_COLOR_TOKENS, BORDER_COLOR_TOKENS, BACKGROUND_COLOR_TOKENS, STANDARD_COLOR_PICKER_PROPS } from '@/constants/color-picker-tokens';
import type { ContentType } from '@/types';

interface ContentTypeEditModalProps {
  contentType: ContentType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContentTypeEditModal = ({ contentType, isOpen, onClose }: ContentTypeEditModalProps) => {
  const operationMutation = useContentTypeOperationMutation();
  
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    text_color: '#1f2937',
    border_color: '#3b82f6',
    background_color: '#dbeafe',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { handleColorChange } = useColorHandling(setFormData);

  // Populate form when content type changes
  useEffect(() => {
    if (contentType && isOpen) {
      setFormData({
        label: contentType.label,
        description: contentType.description || '',
        text_color: contentType.text_color,
        border_color: contentType.border_color,
        background_color: contentType.background_color,
      });
      setErrors({});
    }
  }, [contentType, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Nome do tipo é obrigatório';
    }

    // Validate color formats (accept both hex colors and theme tokens)
    if (!validateColorOrToken(formData.text_color)) {
      newErrors.text_color = 'Formato de cor inválido';
    }
    if (!validateColorOrToken(formData.border_color)) {
      newErrors.border_color = 'Formato de cor inválido';
    }
    if (!validateColorOrToken(formData.background_color)) {
      newErrors.background_color = 'Formato de cor inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentType || !validateForm()) {
      return;
    }

    // All content types can be edited

    try {
      await operationMutation.mutateAsync({
        action: 'update',
        contentTypeId: contentType.id,
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
      console.error('Failed to update content type:', error);
      setErrors({ submit: 'Erro ao atualizar tipo de conteúdo. Tente novamente.' });
    }
  };


  if (!contentType) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Tipo de Conteúdo</DialogTitle>
          <DialogDescription>
            Modifique as propriedades do tipo de conteúdo, incluindo nome, descrição e cores para personalização visual.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* All content types are fully editable */}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="edit-label">Nome do Tipo</Label>
            <Input
              id="edit-label"
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
            <Label htmlFor="edit-description">Descrição (opcional)</Label>
            <Input
              id="edit-description"
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
              <UnifiedColorPicker
                {...STANDARD_COLOR_PICKER_PROPS}
                value={formData.text_color || 'hsl(var(--foreground))'}
                onColorSelect={(color) => handleColorChange('text_color', color)}
                label="Text Color"
                customTokens={TEXT_COLOR_TOKENS}
              />
              {errors.text_color && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.text_color}</p>
              )}
            </div>

            {/* Border Color */}
            <div className="space-y-2">
              <Label>Cor da Borda</Label>
              <UnifiedColorPicker
                {...STANDARD_COLOR_PICKER_PROPS}
                value={formData.border_color || 'hsl(var(--border))'}
                onColorSelect={(color) => handleColorChange('border_color', color)}
                label="Border Color"
                customTokens={BORDER_COLOR_TOKENS}
              />
              {errors.border_color && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.border_color}</p>
              )}
            </div>

            {/* Background Color */}
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <UnifiedColorPicker
                {...STANDARD_COLOR_PICKER_PROPS}
                value={formData.background_color || 'hsl(var(--muted))'}
                onColorSelect={(color) => handleColorChange('background_color', color)}
                label="Background Color"
                customTokens={BACKGROUND_COLOR_TOKENS}
              />
              {errors.background_color && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.background_color}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div>
              {(() => {
                const sanitizedColors = sanitizeStyleColors({
                  color: formData.text_color,
                  borderColor: formData.border_color,
                  backgroundColor: formData.background_color,
                });
                return (
                  <Badge
                    style={{
                      ...sanitizedColors,
                      border: `1px solid ${sanitizedColors.borderColor}`
                    }}
                    className="text-sm"
                  >
                    {formData.label || 'Nome do Tipo'}
                  </Badge>
                );
              })()}
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
              {operationMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};