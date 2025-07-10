// ABOUTME: Security validation utilities for admin interfaces ensuring proper authentication, authorization, and input validation

import { useAuthStore } from '../store/auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Admin role validation
export const ADMIN_ROLES = ['admin', 'super_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// Input validation patterns
export const VALIDATION_PATTERNS = {
  categorySlug: /^[a-z0-9-]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  colorHex: /^#[0-9a-f]{6}$/i,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
} as const;

// Input length limits
export const INPUT_LIMITS = {
  categoryName: 50,
  categoryLabel: 100,
  categoryDescription: 500,
  announcementTitle: 200,
  announcementContent: 2000,
  url: 2000,
} as const;

/**
 * Hook to validate admin access and redirect if unauthorized
 */
export const useAdminAuth = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error('Acesso negado. Faça login para continuar.');
      navigate('/login');
      return;
    }

    const userRole = user.app_metadata?.role;
    if (!userRole || !ADMIN_ROLES.includes(userRole as AdminRole)) {
      toast.error('Acesso negado. Permissões de administrador necessárias.');
      navigate('/');
      return;
    }
  }, [user, navigate]);

  return {
    isAuthenticated: !!user,
    isAdmin: user?.app_metadata?.role && ADMIN_ROLES.includes(user.app_metadata.role as AdminRole),
    user,
  };
};

/**
 * Check if user has admin privileges
 */
export const isAdminUser = (user: any): boolean => {
  if (!user) return false;
  const userRole = user.app_metadata?.role;
  return Boolean(userRole && ADMIN_ROLES.includes(userRole as AdminRole));
};

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate category slug format
 */
export const validateCategorySlug = (slug: string): { isValid: boolean; error?: string } => {
  if (!slug) {
    return { isValid: false, error: 'Nome da categoria é obrigatório' };
  }

  if (slug.length > INPUT_LIMITS.categoryName) {
    return {
      isValid: false,
      error: `Nome deve ter no máximo ${INPUT_LIMITS.categoryName} caracteres`,
    };
  }

  if (!VALIDATION_PATTERNS.categorySlug.test(slug)) {
    return { isValid: false, error: 'Nome deve conter apenas letras minúsculas, números e hífens' };
  }

  return { isValid: true };
};

/**
 * Validate category label
 */
export const validateCategoryLabel = (label: string): { isValid: boolean; error?: string } => {
  if (!label) {
    return { isValid: false, error: 'Nome de exibição é obrigatório' };
  }

  if (label.length > INPUT_LIMITS.categoryLabel) {
    return {
      isValid: false,
      error: `Nome de exibição deve ter no máximo ${INPUT_LIMITS.categoryLabel} caracteres`,
    };
  }

  return { isValid: true };
};

/**
 * Validate category description
 */
export const validateCategoryDescription = (
  description: string
): { isValid: boolean; error?: string } => {
  if (description.length > INPUT_LIMITS.categoryDescription) {
    return {
      isValid: false,
      error: `Descrição deve ter no máximo ${INPUT_LIMITS.categoryDescription} caracteres`,
    };
  }

  return { isValid: true };
};

/**
 * Validate hex color format
 */
export const validateColorHex = (color: string): { isValid: boolean; error?: string } => {
  if (!color) {
    return { isValid: false, error: 'Cor é obrigatória' };
  }

  if (!VALIDATION_PATTERNS.colorHex.test(color)) {
    return { isValid: false, error: 'Cor deve estar no formato hexadecimal (#RRGGBB)' };
  }

  return { isValid: true };
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url) {
    return { isValid: true }; // URL is optional
  }

  if (url.length > INPUT_LIMITS.url) {
    return { isValid: false, error: `URL deve ter no máximo ${INPUT_LIMITS.url} caracteres` };
  }

  if (!VALIDATION_PATTERNS.url.test(url)) {
    return { isValid: false, error: 'URL deve começar com http:// ou https://' };
  }

  return { isValid: true };
};

/**
 * Validate announcement title
 */
export const validateAnnouncementTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title) {
    return { isValid: false, error: 'Título é obrigatório' };
  }

  if (title.length > INPUT_LIMITS.announcementTitle) {
    return {
      isValid: false,
      error: `Título deve ter no máximo ${INPUT_LIMITS.announcementTitle} caracteres`,
    };
  }

  return { isValid: true };
};

/**
 * Validate announcement content
 */
export const validateAnnouncementContent = (
  content: string
): { isValid: boolean; error?: string } => {
  if (!content) {
    return { isValid: false, error: 'Conteúdo é obrigatório' };
  }

  if (content.length > INPUT_LIMITS.announcementContent) {
    return {
      isValid: false,
      error: `Conteúdo deve ter no máximo ${INPUT_LIMITS.announcementContent} caracteres`,
    };
  }

  return { isValid: true };
};

/**
 * Validate priority range
 */
export const validatePriority = (priority: number): { isValid: boolean; error?: string } => {
  if (priority < 1 || priority > 10) {
    return { isValid: false, error: 'Prioridade deve estar entre 1 e 10' };
  }

  return { isValid: true };
};

/**
 * Comprehensive category form validation
 */
export const validateCategoryForm = (data: {
  name: string;
  label: string;
  description: string;
  text_color: string;
  border_color: string;
  background_color: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const nameValidation = validateCategorySlug(data.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!;
  }

  const labelValidation = validateCategoryLabel(data.label);
  if (!labelValidation.isValid) {
    errors.label = labelValidation.error!;
  }

  const descriptionValidation = validateCategoryDescription(data.description);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error!;
  }

  const textColorValidation = validateColorHex(data.text_color);
  if (!textColorValidation.isValid) {
    errors.text_color = textColorValidation.error!;
  }

  const borderColorValidation = validateColorHex(data.border_color);
  if (!borderColorValidation.isValid) {
    errors.border_color = borderColorValidation.error!;
  }

  const backgroundColorValidation = validateColorHex(data.background_color);
  if (!backgroundColorValidation.isValid) {
    errors.background_color = backgroundColorValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Comprehensive announcement form validation
 */
export const validateAnnouncementForm = (data: {
  title: string;
  content: string;
  priority: number;
  image_url?: string;
  link_url?: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const titleValidation = validateAnnouncementTitle(data.title);
  if (!titleValidation.isValid) {
    errors.title = titleValidation.error!;
  }

  const contentValidation = validateAnnouncementContent(data.content);
  if (!contentValidation.isValid) {
    errors.content = contentValidation.error!;
  }

  const priorityValidation = validatePriority(data.priority);
  if (!priorityValidation.isValid) {
    errors.priority = priorityValidation.error!;
  }

  if (data.image_url) {
    const imageUrlValidation = validateUrl(data.image_url);
    if (!imageUrlValidation.isValid) {
      errors.image_url = imageUrlValidation.error!;
    }
  }

  if (data.link_url) {
    const linkUrlValidation = validateUrl(data.link_url);
    if (!linkUrlValidation.isValid) {
      errors.link_url = linkUrlValidation.error!;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Rate limiting utility for admin actions
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canProceed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Global rate limiter instance
export const adminRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute

/**
 * Security logging utility
 */
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  const { user } = useAuthStore.getState();

  console.warn(`[SECURITY] ${event}`, {
    timestamp: new Date().toISOString(),
    userId: user?.id,
    userEmail: user?.email,
    userRole: user?.app_metadata?.role,
    ...details,
  });

  // In production, this would send to a security monitoring service
};

/**
 * Enhanced error handling that doesn't expose sensitive information
 */
export const handleSecureError = (error: Error, context: string): string => {
  logSecurityEvent('Error occurred', {
    context,
    error: error.message,
    stack: error.stack,
  });

  // Return user-friendly error message without exposing internal details
  if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
    return 'Acesso negado. Verifique suas permissões.';
  }

  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return 'Dados inválidos. Verifique as informações fornecidas.';
  }

  if (error.message.includes('network') || error.message.includes('connection')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Generic error message for unknown errors
  return 'Ocorreu um erro inesperado. Tente novamente.';
};
