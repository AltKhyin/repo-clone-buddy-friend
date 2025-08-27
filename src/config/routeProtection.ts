// ABOUTME: Centralized route protection configuration - single source of truth for all access control

import type { AccessLevel } from '@/lib/accessControl';

export interface RouteProtectionConfig {
  path: string;
  requiredLevel: AccessLevel;
  redirectUrl?: string;
  description?: string;
}

/**
 * CENTRAL ROUTE PROTECTION CONFIGURATION
 *
 * This is the SINGLE SOURCE OF TRUTH for all route protection in the application.
 *
 * Rules:
 * 1. Every protected route MUST be listed here
 * 2. Database entries will be auto-generated from this config
 * 3. Router protection will use these exact settings
 * 4. Changes here automatically apply everywhere
 */
export const ROUTE_PROTECTION_CONFIG: RouteProtectionConfig[] = [
  // Community Routes
  {
    path: 'comunidade',
    requiredLevel: 'free',
    redirectUrl: '/login',
    description: 'Community page - requires free account',
  },
  {
    path: 'comunidade/criar',
    requiredLevel: 'free',
    redirectUrl: '/login',
    description: 'Create community post - requires free account',
  },

  // User Profile Routes
  {
    path: 'perfil',
    requiredLevel: 'free',
    redirectUrl: '/login',
    description: 'User profile page - requires free account',
  },
  {
    path: 'perfil/:userId',
    requiredLevel: 'free',
    redirectUrl: '/login',
    description: 'View user profile - requires free account',
  },

  // Settings Routes
  {
    path: 'definicoes',
    requiredLevel: 'free',
    redirectUrl: '/login',
    description: 'User settings page - requires free account',
  },
  {
    path: 'configuracoes', // Legacy path
    requiredLevel: 'free',
    redirectUrl: '/login',
    description: 'User settings page (legacy) - requires free account',
  },

  // Feature Routes
  {
    path: 'sugestoes',
    requiredLevel: 'free',
    redirectUrl: '/login',
    description: 'Suggestions page - requires free account',
  },

  // Premium Content Routes
  // Add premium routes here when they exist
  // {
  //   path: '/premium-content',
  //   requiredLevel: 'premium',
  //   redirectUrl: '/upgrade',
  //   description: 'Premium content - requires premium subscription'
  // },

  // Admin Routes
  {
    path: 'admin',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Admin dashboard - requires admin/editor role',
  },
  {
    path: 'admin/community',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Community management - requires admin/editor role',
  },
  {
    path: 'admin/dashboard',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Admin dashboard home - requires admin/editor role',
  },
  {
    path: 'admin/content',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Content management - requires admin/editor role',
  },
  {
    path: 'admin/users',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'User management - requires admin/editor role',
  },
  {
    path: 'admin/tags',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Tag management - requires admin/editor role',
  },
  {
    path: 'admin/layout',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Layout management - requires admin/editor role',
  },
  {
    path: 'admin/analytics',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Analytics dashboard - requires admin/editor role',
  },
  {
    path: 'admin/access-control',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Access control management - requires admin/editor role',
  },
  {
    path: 'admin/review/:reviewId',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Review management - requires admin/editor role',
  },

  // Editor Routes
  {
    path: 'editor/:reviewId',
    requiredLevel: 'editor_admin', // Aligned with database level
    redirectUrl: '/acesso-negado',
    description: 'Review editor - requires admin/editor role',
  },
];

/**
 * PUBLIC ROUTES (no protection needed)
 *
 * These routes are accessible to everyone, including unauthenticated users
 */
export const PUBLIC_ROUTES = [
  '/', // Homepage
  '/acervo', // Archive/collection page
  '/reviews/:slug', // Individual review pages
  '/comunidade/:postId', // Individual community posts
  '/login', // Login page
  '/registrar', // Registration page
  '/acesso-negado', // Unauthorized page
  '/nao-autorizado', // Legacy unauthorized page
  '/salvar-post', // Save post utility
];

/**
 * Get protection config for a specific route
 */
export function getRouteProtection(path: string): RouteProtectionConfig | null {
  return ROUTE_PROTECTION_CONFIG.find(config => config.path === path) || null;
}

/**
 * Check if a route is public (no authentication required)
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(publicPath => {
    // Handle exact matches
    if (publicPath === path) return true;

    // Handle dynamic routes (basic pattern matching)
    if (publicPath.includes(':')) {
      const pattern = publicPath.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    }

    return false;
  });
}

/**
 * Get all routes that require a specific access level
 */
export function getRoutesByAccessLevel(level: AccessLevel): RouteProtectionConfig[] {
  return ROUTE_PROTECTION_CONFIG.filter(config => config.requiredLevel === level);
}
