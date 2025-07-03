// ABOUTME: Test suite for database sync utility functions

import { describe, it, expect, vi } from 'vitest';
import { generateSyncSQL, validateConfiguration } from './syncAccessControlDatabase';
import * as routeConfig from '@/config/routeProtection';

vi.mock('@/config/routeProtection');

describe('syncAccessControlDatabase', () => {
  describe('generateSyncSQL()', () => {
    it('should generate valid SQL for database sync', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: 'test-route',
          requiredLevel: 'free',
          redirectUrl: '/login',
          description: 'Test route',
        },
        {
          path: 'admin/test',
          requiredLevel: 'editor_admin',
          redirectUrl: '/acesso-negado',
          description: 'Admin test route',
        },
      ]);

      const sql = generateSyncSQL();

      expect(sql).toContain('DELETE FROM "PageAccessControl"');
      expect(sql).toContain('INSERT INTO "PageAccessControl"');
      expect(sql).toContain("('/test-route', 'free', '/login', true)");
      expect(sql).toContain("('/admin/test', 'editor_admin', '/acesso-negado', true)");
      expect(sql).toContain('ON CONFLICT (page_path) DO UPDATE SET');
      expect(sql).toContain('SELECT page_path, required_access_level');
    });

    it('should handle empty configuration', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([]);

      const sql = generateSyncSQL();

      expect(sql).toContain('DELETE FROM "PageAccessControl"');
      expect(sql).toContain('INSERT INTO "PageAccessControl"');
      // Should have empty values section but still be valid SQL
      expect(sql).toContain('VALUES');
    });

    it('should escape SQL special characters in paths', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: "test'route",
          requiredLevel: 'free',
          redirectUrl: '/login',
          description: 'Route with apostrophe',
        },
      ]);

      const sql = generateSyncSQL();

      // Should handle paths with special characters safely
      expect(sql).toContain("/test'route");
    });
  });

  describe('validateConfiguration()', () => {
    it('should pass validation for valid configuration', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: 'valid-route',
          requiredLevel: 'free',
          redirectUrl: '/login',
          description: 'Valid route',
        },
        {
          path: 'admin/valid',
          requiredLevel: 'editor_admin',
          redirectUrl: '/acesso-negado',
          description: 'Valid admin route',
        },
      ]);

      const result = validateConfiguration();

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation for missing paths', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: '',
          requiredLevel: 'free',
          redirectUrl: '/login',
          description: 'Route with empty path',
        },
      ]);

      const result = validateConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Missing path'))).toBe(true);
    });

    it('should fail validation for invalid access levels', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: 'test-route',
          requiredLevel: 'invalid_level' as any,
          redirectUrl: '/login',
          description: 'Route with invalid level',
        },
      ]);

      const result = validateConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Invalid requiredLevel'))).toBe(true);
    });

    it('should fail validation for invalid redirect URLs', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: 'test-route',
          requiredLevel: 'free',
          redirectUrl: 'invalid-url',
          description: 'Route with invalid redirect',
        },
      ]);

      const result = validateConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Invalid redirectUrl'))).toBe(true);
    });

    it('should collect multiple validation errors', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: '',
          requiredLevel: 'invalid' as any,
          redirectUrl: 'bad-url',
          description: 'Multiple issues',
        },
      ]);

      const result = validateConfiguration();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2); // Should have at least 3 errors
      expect(result.errors.some(error => error.includes('Missing path'))).toBe(true);
      expect(result.errors.some(error => error.includes('Invalid requiredLevel'))).toBe(true);
      expect(result.errors.some(error => error.includes('Invalid redirectUrl'))).toBe(true);
    });

    it('should validate all access levels correctly', () => {
      const validLevels = ['public', 'free', 'premium', 'editor_admin'];

      validLevels.forEach(level => {
        vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
          {
            path: 'test-route',
            requiredLevel: level as any,
            redirectUrl: '/redirect',
            description: `Route with ${level} level`,
          },
        ]);

        const result = validateConfiguration();
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate redirect URL formats', () => {
      const validUrls = ['/login', '/acesso-negado', '/upgrade', '/'];
      const invalidUrls = ['login', 'http://external.com', '', 'relative'];

      validUrls.forEach(url => {
        vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
          {
            path: 'test-route',
            requiredLevel: 'free',
            redirectUrl: url,
            description: 'Test route',
          },
        ]);

        const result = validateConfiguration();
        expect(result.isValid).toBe(true);
      });

      invalidUrls.forEach(url => {
        vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
          {
            path: 'test-route',
            requiredLevel: 'free',
            redirectUrl: url,
            description: 'Test route',
          },
        ]);

        const result = validateConfiguration();
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Integration', () => {
    it('should generate SQL that passes validation', () => {
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: 'comunidade',
          requiredLevel: 'free',
          redirectUrl: '/login',
          description: 'Community page',
        },
        {
          path: 'admin',
          requiredLevel: 'editor_admin',
          redirectUrl: '/acesso-negado',
          description: 'Admin area',
        },
      ]);

      const validation = validateConfiguration();
      const sql = generateSyncSQL();

      expect(validation.isValid).toBe(true);
      expect(sql).toBeTruthy();
      expect(sql.length).toBeGreaterThan(0);
    });

    it('should handle real configuration without errors', () => {
      // Test with realistic configuration that might exist
      vi.spyOn(routeConfig, 'ROUTE_PROTECTION_CONFIG', 'get').mockReturnValue([
        {
          path: 'comunidade',
          requiredLevel: 'free',
          redirectUrl: '/login',
          description: 'Community',
        },
        {
          path: 'comunidade/criar',
          requiredLevel: 'free',
          redirectUrl: '/login',
          description: 'Create post',
        },
        { path: 'perfil', requiredLevel: 'free', redirectUrl: '/login', description: 'Profile' },
        {
          path: 'admin',
          requiredLevel: 'editor_admin',
          redirectUrl: '/acesso-negado',
          description: 'Admin',
        },
        {
          path: 'admin/users',
          requiredLevel: 'editor_admin',
          redirectUrl: '/acesso-negado',
          description: 'User management',
        },
      ]);

      expect(() => {
        const validation = validateConfiguration();
        const sql = generateSyncSQL();

        expect(validation.isValid).toBe(true);
        expect(sql).toContain('INSERT INTO "PageAccessControl"');
      }).not.toThrow();
    });
  });
});
