// ABOUTME: Simplified dialog for saving block configurations as reusable presets with name-only input

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { createBlockPreset, addBlockPreset, type BlockPreset } from '@/types/editor';

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockType: string;
  blockData: any;
  onPresetSaved?: (preset: BlockPreset) => void;
}

export function SavePresetDialog({ 
  open, 
  onOpenChange, 
  blockType, 
  blockData,
  onPresetSaved 
}: SavePresetDialogProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const preset = createBlockPreset(
        name.trim(),
        blockType,
        blockData,
        {
          category: 'custom' // Default category for simplified system
        }
      );

      addBlockPreset(preset);
      onPresetSaved?.(preset);
      
      // Reset form
      setName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save preset:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Block as Preset</DialogTitle>
          <DialogDescription>
            Give your custom block a name to save it for future use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Block Name</Label>
            <Input
              id="preset-name"
              placeholder="e.g., My Custom Block"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Block'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}