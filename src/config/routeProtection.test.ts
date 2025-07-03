// ABOUTME: Comprehensive test suite for route protection configuration and utilities

import { describe, it, expect } from 'vitest';
import {
  ROUTE_PROTECTION_CONFIG,
  PUBLIC_ROUTES,
  getRouteProtection,
  isPublicRoute,
  getRoutesByAccessLevel,
} from './routeProtection';
import type { AccessLevel } from '@/lib/accessControl';

describe('Route Protection Configuration', () => {
  describe('ROUTE_PROTECTION_CONFIG', () => {
    it('should have valid configuration entries', () => {
      expect(ROUTE_PROTECTION_CONFIG).toBeDefined();
      expect(ROUTE_PROTECTION_CONFIG.length).toBeGreaterThan(0);
    });

    it('should have all required fields for each config entry', () => {
      ROUTE_PROTECTION_CONFIG.forEach(config => {
        expect(config.path).toBeDefined();
        expect(typeof config.path).toBe('string');
        expect(config.path.length).toBeGreaterThan(0);

        expect(config.requiredLevel).toBeDefined();
        expect(['public', 'free', 'premium', 'editor_admin']).toContain(config.requiredLevel);

        expect(config.redirectUrl).toBeDefined();
        expect(typeof config.redirectUrl).toBe('string');
        expect(config.redirectUrl.startsWith('/')).toBe(true);

        expect(config.description).toBeDefined();
        expect(typeof config.description).toBe('string');
      });
    });

    it('should not have duplicate paths', () => {
      const paths = ROUTE_PROTECTION_CONFIG.map(config => config.path);
      const uniquePaths = new Set(paths);
      expect(paths.length).toBe(uniquePaths.size);
    });

    it('should have consistent redirect URLs for same access levels', () => {
      const freeRoutes = ROUTE_PROTECTION_CONFIG.filter(config => config.requiredLevel === 'free');
      const adminRoutes = ROUTE_PROTECTION_CONFIG.filter(
        config => config.requiredLevel === 'editor_admin'
      );

      // All free routes should redirect to /login
      freeRoutes.forEach(route => {
        expect(route.redirectUrl).toBe('/login');
      });

      // All admin routes should redirect to /acesso-negado
      adminRoutes.forEach(route => {
        expect(route.redirectUrl).toBe('/acesso-negado');
      });
    });
  });

  describe('PUBLIC_ROUTES', () => {
    it('should include essential public routes', () => {
      const essentialRoutes = ['/', '/login', '/acesso-negado', '/acervo'];
      essentialRoutes.forEach(route => {
        expect(PUBLIC_ROUTES).toContain(route);
      });
    });

    it('should not include protected routes', () => {
      const protectedPaths = ROUTE_PROTECTION_CONFIG.map(config => `/${config.path}`);
      protectedPaths.forEach(path => {
        expect(PUBLIC_ROUTES).not.toContain(path);
      });
    });
  });

  describe('getRouteProtection()', () => {
    it('should return config for existing routes', () => {
      const config = getRouteProtection('comunidade');
      expect(config).toBeDefined();
      expect(config?.path).toBe('comunidade');
      expect(config?.requiredLevel).toBe('free');
    });

    it('should return null for non-existent routes', () => {
      const config = getRouteProtection('non-existent-route');
      expect(config).toBeNull();
    });

    it('should handle admin routes correctly', () => {
      const config = getRouteProtection('admin');
      expect(config).toBeDefined();
      expect(config?.requiredLevel).toBe('editor_admin');
      expect(config?.redirectUrl).toBe('/acesso-negado');
    });

    it('should handle nested admin routes', () => {
      const config = getRouteProtection('admin/access-control');
      expect(config).toBeDefined();
      expect(config?.requiredLevel).toBe('editor_admin');
    });
  });

  describe('isPublicRoute()', () => {
    it('should return true for public routes', () => {
      expect(isPublicRoute('/')).toBe(true);
      expect(isPublicRoute('/login')).toBe(true);
      expect(isPublicRoute('/acervo')).toBe(true);
      expect(isPublicRoute('/acesso-negado')).toBe(true);
    });

    it('should return false for protected routes', () => {
      expect(isPublicRoute('/comunidade')).toBe(false);
      expect(isPublicRoute('/admin')).toBe(false);
      expect(isPublicRoute('/perfil')).toBe(false);
    });

    it('should handle dynamic routes correctly', () => {
      expect(isPublicRoute('/reviews/some-slug')).toBe(true);
      expect(isPublicRoute('/comunidade/123')).toBe(true);
    });

    it('should handle edge cases', () => {
      expect(isPublicRoute('')).toBe(false);
      expect(isPublicRoute('/unknown-route')).toBe(false);
    });
  });

  describe('getRoutesByAccessLevel()', () => {
    it('should return all free routes', () => {
      const freeRoutes = getRoutesByAccessLevel('free');
      expect(freeRoutes.length).toBeGreaterThan(0);
      freeRoutes.forEach(route => {
        expect(route.requiredLevel).toBe('free');
      });
    });

    it('should return all admin routes', () => {
      const adminRoutes = getRoutesByAccessLevel('editor_admin');
      expect(adminRoutes.length).toBeGreaterThan(0);
      adminRoutes.forEach(route => {
        expect(route.requiredLevel).toBe('editor_admin');
      });
    });

    it('should return empty array for premium routes (none currently)', () => {
      const premiumRoutes = getRoutesByAccessLevel('premium');
      expect(premiumRoutes).toEqual([]);
    });

    it('should return empty array for public routes (handled differently)', () => {
      const publicRoutes = getRoutesByAccessLevel('public');
      expect(publicRoutes).toEqual([]);
    });
  });

  describe('Access Level Hierarchy', () => {
    it('should have proper distribution across access levels', () => {
      const levels: AccessLevel[] = ['public', 'free', 'premium', 'editor_admin'];

      const distribution = levels.map(level => ({
        level,
        count: getRoutesByAccessLevel(level).length,
      }));

      // Should have some free routes
      const freeCount = distribution.find(d => d.level === 'free')?.count || 0;
      expect(freeCount).toBeGreaterThan(0);

      // Should have some admin routes
      const adminCount = distribution.find(d => d.level === 'editor_admin')?.count || 0;
      expect(adminCount).toBeGreaterThan(0);

      // Public routes are handled separately
      expect(PUBLIC_ROUTES.length).toBeGreaterThan(0);
    });

    it('should have logical redirect patterns', () => {
      // Free routes should redirect to login
      const freeRoutes = getRoutesByAccessLevel('free');
      freeRoutes.forEach(route => {
        expect(route.redirectUrl).toBe('/login');
      });

      // Admin routes should redirect to access denied
      const adminRoutes = getRoutesByAccessLevel('editor_admin');
      adminRoutes.forEach(route => {
        expect(route.redirectUrl).toBe('/acesso-negado');
      });
    });
  });

  describe('Configuration Integrity', () => {
    it('should not have conflicting configurations', () => {
      // No route should be both public and protected
      const protectedPaths = ROUTE_PROTECTION_CONFIG.map(config => `/${config.path}`);
      const publicPaths = PUBLIC_ROUTES.filter(route => !route.includes(':'));

      const intersection = protectedPaths.filter(path => publicPaths.includes(path));
      expect(intersection).toEqual([]);
    });

    it('should have descriptions for all protected routes', () => {
      ROUTE_PROTECTION_CONFIG.forEach(config => {
        expect(config.description).toBeTruthy();
        expect(config.description.length).toBeGreaterThan(10);
      });
    });

    it('should use consistent path formats', () => {
      ROUTE_PROTECTION_CONFIG.forEach(config => {
        // Paths should not start with '/' (router format)
        expect(config.path.startsWith('/')).toBe(false);

        // Paths should not be empty
        expect(config.path.length).toBeGreaterThan(0);
      });
    });
  });
});
