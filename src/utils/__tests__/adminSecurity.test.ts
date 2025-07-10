// ABOUTME: TDD tests for admin security validation utilities ensuring proper authentication, authorization, and input validation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useAdminAuth,
  isAdminUser,
  sanitizeHtml,
  validateCategorySlug,
  validateCategoryLabel,
  validateCategoryDescription,
  validateColorHex,
  validateUrl,
  validateAnnouncementTitle,
  validateAnnouncementContent,
  validatePriority,
  validateCategoryForm,
  validateAnnouncementForm,
  adminRateLimiter,
  logSecurityEvent,
  handleSecureError,
  ADMIN_ROLES,
  VALIDATION_PATTERNS,
  INPUT_LIMITS,
} from '../adminSecurity';
import { useAuthStore } from '../../store/auth';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('../../store/auth', () => ({
  useAuthStore: vi.fn(),
}));

describe('🔴 TDD: Admin Security Validation', () => {
  const mockNavigate = vi.fn();
  const mockUser = {
    id: '123',
    email: 'admin@test.com',
    app_metadata: { role: 'admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🔴 TDD: Admin Role Validation', () => {
    it('should correctly identify admin users', () => {
      expect(isAdminUser(mockUser)).toBe(true);
      expect(isAdminUser({ ...mockUser, app_metadata: { role: 'super_admin' } })).toBe(true);
      expect(isAdminUser({ ...mockUser, app_metadata: { role: 'practitioner' } })).toBe(false);
      expect(isAdminUser(null)).toBe(false);
      expect(isAdminUser({})).toBe(false);
    });

    it('should define correct admin roles', () => {
      expect(ADMIN_ROLES).toEqual(['admin', 'super_admin']);
    });

    it('should validate admin authentication hook', () => {
      const mockAuthStore = {
        user: mockUser,
      };
      (useAuthStore as any).mockReturnValue(mockAuthStore);

      const { result } = renderHook(() => useAdminAuth());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should redirect unauthenticated users', () => {
      const mockAuthStore = { user: null };
      (useAuthStore as any).mockReturnValue(mockAuthStore);

      renderHook(() => useAdminAuth());

      expect(toast.error).toHaveBeenCalledWith('Acesso negado. Faça login para continuar.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should redirect non-admin users', () => {
      const nonAdminUser = { ...mockUser, app_metadata: { role: 'practitioner' } };
      const mockAuthStore = { user: nonAdminUser };
      (useAuthStore as any).mockReturnValue(mockAuthStore);

      renderHook(() => useAdminAuth());

      expect(toast.error).toHaveBeenCalledWith(
        'Acesso negado. Permissões de administrador necessárias.'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('🔴 TDD: Input Sanitization', () => {
    it('should sanitize HTML to prevent XSS attacks', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(sanitizeHtml('Hello & "World"')).toBe('Hello &amp; &quot;World&quot;');
      expect(sanitizeHtml("It's a test")).toBe('It&#x27;s a test');
      expect(sanitizeHtml('Path/to/file')).toBe('Path&#x2F;to&#x2F;file');
    });

    it('should handle empty and normal strings', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml('Normal text')).toBe('Normal text');
      expect(sanitizeHtml('123 456')).toBe('123 456');
    });
  });

  describe('🔴 TDD: Category Validation', () => {
    it('should validate category slug format', () => {
      // Valid slugs
      expect(validateCategorySlug('valid-slug')).toEqual({ isValid: true });
      expect(validateCategorySlug('test123')).toEqual({ isValid: true });
      expect(validateCategorySlug('a-1-b-2')).toEqual({ isValid: true });

      // Invalid slugs
      expect(validateCategorySlug('')).toEqual({
        isValid: false,
        error: 'Nome da categoria é obrigatório',
      });
      expect(validateCategorySlug('Invalid Slug')).toEqual({
        isValid: false,
        error: 'Nome deve conter apenas letras minúsculas, números e hífens',
      });
      expect(validateCategorySlug('UPPERCASE')).toEqual({
        isValid: false,
        error: 'Nome deve conter apenas letras minúsculas, números e hífens',
      });
      expect(validateCategorySlug('special@chars')).toEqual({
        isValid: false,
        error: 'Nome deve conter apenas letras minúsculas, números e hífens',
      });
    });

    it('should validate category slug length limits', () => {
      const longSlug = 'a'.repeat(INPUT_LIMITS.categoryName + 1);
      expect(validateCategorySlug(longSlug)).toEqual({
        isValid: false,
        error: `Nome deve ter no máximo ${INPUT_LIMITS.categoryName} caracteres`,
      });
    });

    it('should validate category label', () => {
      expect(validateCategoryLabel('Valid Label')).toEqual({ isValid: true });
      expect(validateCategoryLabel('')).toEqual({
        isValid: false,
        error: 'Nome de exibição é obrigatório',
      });

      const longLabel = 'a'.repeat(INPUT_LIMITS.categoryLabel + 1);
      expect(validateCategoryLabel(longLabel)).toEqual({
        isValid: false,
        error: `Nome de exibição deve ter no máximo ${INPUT_LIMITS.categoryLabel} caracteres`,
      });
    });

    it('should validate category description', () => {
      expect(validateCategoryDescription('Valid description')).toEqual({ isValid: true });
      expect(validateCategoryDescription('')).toEqual({ isValid: true });

      const longDescription = 'a'.repeat(INPUT_LIMITS.categoryDescription + 1);
      expect(validateCategoryDescription(longDescription)).toEqual({
        isValid: false,
        error: `Descrição deve ter no máximo ${INPUT_LIMITS.categoryDescription} caracteres`,
      });
    });

    it('should validate hex color format', () => {
      expect(validateColorHex('#ff0000')).toEqual({ isValid: true });
      expect(validateColorHex('#FF0000')).toEqual({ isValid: true });
      expect(validateColorHex('#123abc')).toEqual({ isValid: true });

      expect(validateColorHex('')).toEqual({
        isValid: false,
        error: 'Cor é obrigatória',
      });
      expect(validateColorHex('red')).toEqual({
        isValid: false,
        error: 'Cor deve estar no formato hexadecimal (#RRGGBB)',
      });
      expect(validateColorHex('#fff')).toEqual({
        isValid: false,
        error: 'Cor deve estar no formato hexadecimal (#RRGGBB)',
      });
      expect(validateColorHex('ff0000')).toEqual({
        isValid: false,
        error: 'Cor deve estar no formato hexadecimal (#RRGGBB)',
      });
    });

    it('should validate complete category form', () => {
      const validData = {
        name: 'test-category',
        label: 'Test Category',
        description: 'A test category',
        text_color: '#000000',
        border_color: '#ff0000',
        background_color: '#ffffff',
      };

      expect(validateCategoryForm(validData)).toEqual({ isValid: true, errors: {} });

      const invalidData = {
        name: '',
        label: '',
        description: 'a'.repeat(600),
        text_color: 'invalid',
        border_color: '',
        background_color: '#gg0000',
      };

      const result = validateCategoryForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(6);
    });
  });

  describe('🔴 TDD: Announcement Validation', () => {
    it('should validate announcement title', () => {
      expect(validateAnnouncementTitle('Valid Title')).toEqual({ isValid: true });
      expect(validateAnnouncementTitle('')).toEqual({
        isValid: false,
        error: 'Título é obrigatório',
      });

      const longTitle = 'a'.repeat(INPUT_LIMITS.announcementTitle + 1);
      expect(validateAnnouncementTitle(longTitle)).toEqual({
        isValid: false,
        error: `Título deve ter no máximo ${INPUT_LIMITS.announcementTitle} caracteres`,
      });
    });

    it('should validate announcement content', () => {
      expect(validateAnnouncementContent('Valid content')).toEqual({ isValid: true });
      expect(validateAnnouncementContent('')).toEqual({
        isValid: false,
        error: 'Conteúdo é obrigatório',
      });

      const longContent = 'a'.repeat(INPUT_LIMITS.announcementContent + 1);
      expect(validateAnnouncementContent(longContent)).toEqual({
        isValid: false,
        error: `Conteúdo deve ter no máximo ${INPUT_LIMITS.announcementContent} caracteres`,
      });
    });

    it('should validate priority range', () => {
      expect(validatePriority(1)).toEqual({ isValid: true });
      expect(validatePriority(5)).toEqual({ isValid: true });
      expect(validatePriority(10)).toEqual({ isValid: true });

      expect(validatePriority(0)).toEqual({
        isValid: false,
        error: 'Prioridade deve estar entre 1 e 10',
      });
      expect(validatePriority(11)).toEqual({
        isValid: false,
        error: 'Prioridade deve estar entre 1 e 10',
      });
    });

    it('should validate URL format', () => {
      expect(validateUrl('')).toEqual({ isValid: true }); // Optional
      expect(validateUrl('https://example.com')).toEqual({ isValid: true });
      expect(validateUrl('http://test.com')).toEqual({ isValid: true });

      expect(validateUrl('invalid-url')).toEqual({
        isValid: false,
        error: 'URL deve começar com http:// ou https://',
      });
      expect(validateUrl('ftp://test.com')).toEqual({
        isValid: false,
        error: 'URL deve começar com http:// ou https://',
      });

      const longUrl = 'https://' + 'a'.repeat(INPUT_LIMITS.url);
      expect(validateUrl(longUrl)).toEqual({
        isValid: false,
        error: `URL deve ter no máximo ${INPUT_LIMITS.url} caracteres`,
      });
    });

    it('should validate complete announcement form', () => {
      const validData = {
        title: 'Test Announcement',
        content: 'Test content',
        priority: 5,
        image_url: 'https://example.com/image.jpg',
        link_url: 'https://example.com',
      };

      expect(validateAnnouncementForm(validData)).toEqual({ isValid: true, errors: {} });

      const invalidData = {
        title: '',
        content: '',
        priority: 15,
        image_url: 'invalid-url',
        link_url: 'also-invalid',
      };

      const result = validateAnnouncementForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(5);
    });
  });

  describe('🔴 TDD: Rate Limiting', () => {
    it('should enforce rate limits', () => {
      const testKey = 'test-user';

      // Should allow requests up to the limit
      for (let i = 0; i < 20; i++) {
        expect(adminRateLimiter.canProceed(testKey)).toBe(true);
      }

      // Should deny request after limit is reached
      expect(adminRateLimiter.canProceed(testKey)).toBe(false);
    });

    it('should track remaining requests correctly', () => {
      const testKey = 'test-user-2';

      expect(adminRateLimiter.getRemainingRequests(testKey)).toBe(20);

      adminRateLimiter.canProceed(testKey);
      expect(adminRateLimiter.getRemainingRequests(testKey)).toBe(19);
    });
  });

  describe('🔴 TDD: Security Logging', () => {
    it('should log security events with proper format', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockAuthStore = { user: mockUser };

      // Mock the store getter
      vi.mocked(useAuthStore).getState = vi.fn().mockReturnValue(mockAuthStore);

      logSecurityEvent('Test Event', { action: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SECURITY] Test Event',
        expect.objectContaining({
          timestamp: expect.any(String),
          userId: '123',
          userEmail: 'admin@test.com',
          userRole: 'admin',
          action: 'test',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('🔴 TDD: Error Handling', () => {
    it('should handle unauthorized errors', () => {
      const error = new Error('unauthorized access');
      expect(handleSecureError(error, 'test')).toBe('Acesso negado. Verifique suas permissões.');
    });

    it('should handle validation errors', () => {
      const error = new Error('validation failed');
      expect(handleSecureError(error, 'test')).toBe(
        'Dados inválidos. Verifique as informações fornecidas.'
      );
    });

    it('should handle network errors', () => {
      const error = new Error('network connection failed');
      expect(handleSecureError(error, 'test')).toBe(
        'Erro de conexão. Verifique sua internet e tente novamente.'
      );
    });

    it('should handle unknown errors generically', () => {
      const error = new Error('something went wrong');
      expect(handleSecureError(error, 'test')).toBe('Ocorreu um erro inesperado. Tente novamente.');
    });
  });

  describe('🔴 TDD: Validation Patterns', () => {
    it('should define correct validation patterns', () => {
      expect(VALIDATION_PATTERNS.categorySlug.test('valid-slug')).toBe(true);
      expect(VALIDATION_PATTERNS.categorySlug.test('Invalid Slug')).toBe(false);

      expect(VALIDATION_PATTERNS.email.test('user@example.com')).toBe(true);
      expect(VALIDATION_PATTERNS.email.test('invalid-email')).toBe(false);

      expect(VALIDATION_PATTERNS.url.test('https://example.com')).toBe(true);
      expect(VALIDATION_PATTERNS.url.test('invalid-url')).toBe(false);

      expect(VALIDATION_PATTERNS.colorHex.test('#ff0000')).toBe(true);
      expect(VALIDATION_PATTERNS.colorHex.test('red')).toBe(false);

      expect(VALIDATION_PATTERNS.alphanumeric.test('Valid Text 123')).toBe(true);
      expect(VALIDATION_PATTERNS.alphanumeric.test('Invalid@Text')).toBe(false);
    });
  });

  describe('🔴 TDD: Input Limits', () => {
    it('should define correct input limits', () => {
      expect(INPUT_LIMITS.categoryName).toBe(50);
      expect(INPUT_LIMITS.categoryLabel).toBe(100);
      expect(INPUT_LIMITS.categoryDescription).toBe(500);
      expect(INPUT_LIMITS.announcementTitle).toBe(200);
      expect(INPUT_LIMITS.announcementContent).toBe(2000);
      expect(INPUT_LIMITS.url).toBe(2000);
    });
  });
});
