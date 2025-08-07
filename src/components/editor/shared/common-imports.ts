// ABOUTME: Common imports barrel to reduce duplication across editor components

// Frequently used UI components
export { Label } from '@/components/ui/label';
export { Button } from '@/components/ui/button';
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Separator } from '@/components/ui/separator';
export { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export { Badge } from '@/components/ui/badge';

// Common Lucide React icons used across editor
export {
  Type, // Typography controls
  Palette, // Color/style controls
  Square, // Border/spacing controls
  User, // Author/user references
  Settings, // Configuration controls
  Edit2, // Edit mode toggles
  BarChart3, // Data visualization
  Plus, // Add actions
  Minus, // Remove actions
  ChevronUp, // Reorder actions
  ChevronDown, // Reorder actions
  Users, // User/community features
  Sparkles, // Style/enhancement features
  Info, // Information displays
  Quote, // Quote blocks
} from 'lucide-react';

// Common editor store imports
export { useEditorStore } from '@/store/editorStore';
export { useEditorTheme } from '../../hooks/useEditorTheme';

// Common utility functions
export { cn } from '@/lib/utils';
