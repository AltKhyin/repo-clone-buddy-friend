// ABOUTME: Utility to synchronize database PageAccessControl table with centralized configuration

import { ROUTE_PROTECTION_CONFIG } from '@/config/routeProtection';

/**
 * Generate SQL statements to sync database with configuration
 * This ensures the database stays in sync with the centralized config
 */
export function generateSyncSQL(): string {
  const statements: string[] = [];

  // First, clear existing entries
  statements.push('-- Clear existing page access control entries');
  statements.push('DELETE FROM "PageAccessControl";');
  statements.push('');

  // Then insert all entries from config
  statements.push('-- Insert current configuration');
  statements.push(
    'INSERT INTO "PageAccessControl" (page_path, required_access_level, redirect_url, is_active) VALUES'
  );

  const values = ROUTE_PROTECTION_CONFIG.map(
    config => `  ('/${config.path}', '${config.requiredLevel}', '${config.redirectUrl}', true)`
  );

  statements.push(values.join(',\n'));
  statements.push('ON CONFLICT (page_path) DO UPDATE SET');
  statements.push('  required_access_level = EXCLUDED.required_access_level,');
  statements.push('  redirect_url = EXCLUDED.redirect_url,');
  statements.push('  is_active = EXCLUDED.is_active,');
  statements.push('  updated_at = NOW();');
  statements.push('');

  // Add verification query
  statements.push('-- Verification: Check all entries');
  statements.push(
    'SELECT page_path, required_access_level, redirect_url, is_active FROM "PageAccessControl" ORDER BY page_path;'
  );

  return statements.join('\n');
}

/**
 * Log the sync SQL to console for manual execution
 */
export function logSyncSQL(): void {
  console.group('🔄 Database Sync SQL');
  console.log(generateSyncSQL());
  console.groupEnd();
}

/**
 * Validate that all config routes have valid settings
 */
export function validateConfiguration(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  ROUTE_PROTECTION_CONFIG.forEach(config => {
    if (!config.path || config.path.trim() === '') {
      errors.push(`Missing path in config: ${JSON.stringify(config)}`);
    }

    if (!['public', 'free', 'premium', 'editor_admin'].includes(config.requiredLevel)) {
      errors.push(`Invalid requiredLevel "${config.requiredLevel}" for path "${config.path}"`);
    }

    if (!config.redirectUrl || !config.redirectUrl.startsWith('/')) {
      errors.push(`Invalid redirectUrl "${config.redirectUrl}" for path "${config.path}"`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
