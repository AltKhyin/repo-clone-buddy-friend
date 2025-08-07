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
import { UnifiedColorPicker } from '@/components/editor/shared/UnifiedColorPicker';
import { validateColorOrToken } from '@/utils/color-tokens';
import { sanitizeStyleColors } from '@/utils/color-sanitization';
import { useContentTypeOperationMutation, getDefaultContentTypeColors } from '@packages/hooks/useContentTypeManagement';
import { useColorHandling } from '../../../hooks/useColorHandling';
import { TEXT_COLOR_TOKENS, BORDER_COLOR_TOKENS, BACKGROUND_COLOR_TOKENS, STANDARD_COLOR_PICKER_PROPS } from '@/constants/color-picker-tokens';

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
  const { handleColorChange } = useColorHandling(setFormData);

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
              {operationMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};