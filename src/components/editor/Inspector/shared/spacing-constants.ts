// ABOUTME: Constants for spacing controls to avoid Fast Refresh warnings

import React from 'react';
import { ArrowLeftRight, ArrowUpDown, Square } from 'lucide-react';

export interface SpacingField {
  key: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  category?: 'padding' | 'border' | 'other';
}

export const PADDING_FIELDS: SpacingField[] = [
  {
    key: 'paddingX',
    label: 'Horizontal Padding',
    icon: ArrowLeftRight,
    min: 0,
    max: 80,
    step: 2,
    unit: 'px',
    category: 'padding',
  },
  {
    key: 'paddingY',
    label: 'Vertical Padding',
    icon: ArrowUpDown,
    min: 0,
    max: 80,
    step: 2,
    unit: 'px',
    category: 'padding',
  },
];

export const BORDER_FIELDS: SpacingField[] = [
  {
    key: 'borderRadius',
    label: 'Corner Radius',
    icon: Square,
    min: 0,
    max: 32,
    step: 1,
    unit: 'px',
    category: 'border',
  },
  {
    key: 'borderWidth',
    label: 'Border Width',
    icon: Square,
    min: 0,
    max: 8,
    step: 1,
    unit: 'px',
    category: 'border',
  },
];

export const DEFAULT_SPACING_FIELDS: SpacingField[] = [...PADDING_FIELDS, ...BORDER_FIELDS];

// Enhanced spacing presets
export const SPACING_PRESETS = [
  { name: 'None', values: { paddingX: 0, paddingY: 0 } },
  { name: 'Tight', values: { paddingX: 8, paddingY: 6 } },
  { name: 'Normal', values: { paddingX: 16, paddingY: 12 } },
  { name: 'Loose', values: { paddingX: 24, paddingY: 18 } },
  { name: 'Extra Loose', values: { paddingX: 32, paddingY: 24 } },
];

// Style generation utilities
export const generateSpacingStyles = (spacing: Record<string, number>) => {
  return Object.entries(spacing).reduce(
    (styles, [key, value]) => {
      if (typeof value === 'number') {
        styles[key] = `${value}px`;
      }
      return styles;
    },
    {} as Record<string, string>
  );
};

export const validateSpacingValue = (value: number, field: SpacingField): number => {
  return Math.max(field.min, Math.min(field.max, value));
};
