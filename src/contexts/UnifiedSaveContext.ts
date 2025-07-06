// ABOUTME: Unified save context definition separated for Fast Refresh compatibility

import { createContext } from 'react';
import { UnifiedSaveContextValue } from '@/types/admin';

export const UnifiedSaveContext = createContext<UnifiedSaveContextValue | null>(null);
