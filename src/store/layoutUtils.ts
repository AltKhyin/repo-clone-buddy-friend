// ABOUTME: Utility functions for master/derived layout management and migration

import { 
  LayoutConfig, 
  Layouts, 
  MasterDerivedLayouts, 
  LegacyLayouts,
  MasterLayout,
  DerivedLayout,
  NodeObject 
} from '@/types/editor';
import { IntelligentViewportConverter } from './intelligentViewportConversion';

/**
 * Hash function for layout configurations to detect changes
 */
export function hashLayoutConfig(layout: LayoutConfig): string {
  const sortedItems = layout.items
    .map(item => `${item.nodeId}:${item.x},${item.y},${item.w},${item.h}`)
    .sort()
    .join('|');
  
  const configString = `${layout.gridSettings.columns}:${sortedItems}`;
  
  // Simple hash function (good enough for our use case)
  let hash = 0;
  for (let i = 0; i < configString.length; i++) {
    const char = configString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Check if layouts are using the new master/derived structure
 */
export function isMasterDerivedLayout(layouts: Layouts): layouts is MasterDerivedLayouts {
  return (
    typeof layouts.desktop === 'object' &&
    'type' in layouts.desktop &&
    layouts.desktop.type === 'master' &&
    typeof layouts.mobile === 'object' &&
    'type' in layouts.mobile &&
    layouts.mobile.type === 'derived'
  );
}

/**
 * Check if layouts are using the legacy structure
 */
export function isLegacyLayout(layouts: Layouts): layouts is LegacyLayouts {
  return !isMasterDerivedLayout(layouts);
}

/**
 * Migrate legacy layouts to master/derived structure
 */
export function migrateLegacyLayouts(legacyLayouts: LegacyLayouts): MasterDerivedLayouts {
  const now = new Date().toISOString();
  const desktopHash = hashLayoutConfig(legacyLayouts.desktop);
  
  return {
    desktop: {
      type: 'master',
      data: legacyLayouts.desktop,
      lastModified: now,
    },
    mobile: {
      type: 'derived',
      isGenerated: true,
      generatedFromHash: desktopHash,
      data: legacyLayouts.mobile,
      hasCustomizations: true, // Assume existing mobile layouts have customizations
      lastModified: now,
    },
  };
}

/**
 * Create initial master/derived layouts for new documents
 */
export function createInitialLayouts(): MasterDerivedLayouts {
  const now = new Date().toISOString();
  
  return {
    desktop: {
      type: 'master',
      data: {
        gridSettings: { columns: 12 },
        items: [],
      },
      lastModified: now,
    },
    mobile: {
      type: 'derived',
      isGenerated: false,
      data: {
        gridSettings: { columns: 4 },
        items: [],
      },
      hasCustomizations: false,
      lastModified: now,
    },
  };
}

/**
 * Ensure layouts are in master/derived format (auto-migrate if needed)
 */
export function ensureMasterDerivedLayouts(layouts: Layouts): MasterDerivedLayouts {
  if (isMasterDerivedLayout(layouts)) {
    return layouts;
  }
  
  console.log('[LayoutUtils] Migrating legacy layout structure to master/derived');
  return migrateLegacyLayouts(layouts);
}

/**
 * Generate mobile layout from desktop master layout
 */
export function generateMobileFromDesktop(
  desktopLayout: LayoutConfig,
  nodes: NodeObject[]
): { mobileLayout: LayoutConfig; nodeUpdates: Record<string, Partial<NodeObject>> } {
  
  // Use the intelligent conversion system but only for desktop → mobile
  const { layouts: convertedLayouts, nodeUpdates } = IntelligentViewportConverter.convertToMobile(
    nodes,
    { desktop: desktopLayout, mobile: { gridSettings: { columns: 4 }, items: [] } }
  );
  
  return {
    mobileLayout: convertedLayouts.mobile,
    nodeUpdates,
  };
}

/**
 * Check if mobile layout needs regeneration from desktop
 */
export function shouldRegenerateMobile(layouts: MasterDerivedLayouts): boolean {
  const mobile = layouts.mobile;
  
  // If mobile was never generated, it needs generation
  if (!mobile.isGenerated) {
    return true;
  }
  
  // If no hash stored, we can't detect changes
  if (!mobile.generatedFromHash) {
    return false;
  }
  
  // Check if desktop layout has changed since mobile generation
  const currentDesktopHash = hashLayoutConfig(layouts.desktop.data);
  return mobile.generatedFromHash !== currentDesktopHash;
}

/**
 * Update mobile layout as generated from current desktop
 */
export function markMobileAsGenerated(
  layouts: MasterDerivedLayouts,
  newMobileLayout: LayoutConfig
): MasterDerivedLayouts {
  const now = new Date().toISOString();
  const desktopHash = hashLayoutConfig(layouts.desktop.data);
  
  return {
    ...layouts,
    mobile: {
      ...layouts.mobile,
      isGenerated: true,
      generatedFromHash: desktopHash,
      data: newMobileLayout,
      hasCustomizations: false,
      lastModified: now,
    },
  };
}

/**
 * Mark mobile layout as having user customizations
 */
export function markMobileAsCustomized(layouts: MasterDerivedLayouts): MasterDerivedLayouts {
  if (layouts.mobile.hasCustomizations) {
    return layouts; // Already marked as customized
  }
  
  return {
    ...layouts,
    mobile: {
      ...layouts.mobile,
      hasCustomizations: true,
      lastModified: new Date().toISOString(),
    },
  };
}

/**
 * Update desktop layout (master)
 */
export function updateDesktopLayout(
  layouts: MasterDerivedLayouts,
  newDesktopLayout: LayoutConfig
): MasterDerivedLayouts {
  return {
    ...layouts,
    desktop: {
      ...layouts.desktop,
      data: newDesktopLayout,
      lastModified: new Date().toISOString(),
    },
  };
}

/**
 * Update mobile layout (derived)
 */
export function updateMobileLayout(
  layouts: MasterDerivedLayouts,
  newMobileLayout: LayoutConfig
): MasterDerivedLayouts {
  const updatedLayouts = {
    ...layouts,
    mobile: {
      ...layouts.mobile,
      data: newMobileLayout,
      lastModified: new Date().toISOString(),
    },
  };
  
  // Mark as customized if it was previously generated
  return markMobileAsCustomized(updatedLayouts);
}

/**
 * Get the appropriate layout config for the current viewport
 */
export function getLayoutForViewport(
  layouts: MasterDerivedLayouts,
  viewport: 'desktop' | 'mobile'
): LayoutConfig {
  return viewport === 'desktop' ? layouts.desktop.data : layouts.mobile.data;
}

/**
 * Convert master/derived layouts back to legacy format for persistence
 * (for backward compatibility with existing save/load logic)
 */
export function convertToLegacyFormat(layouts: MasterDerivedLayouts): LegacyLayouts {
  return {
    desktop: layouts.desktop.data,
    mobile: layouts.mobile.data,
  };
}