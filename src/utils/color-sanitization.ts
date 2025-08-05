// ABOUTME: Security utilities for sanitizing color values before DOM injection to prevent CSS injection attacks

import { validateColorOrToken } from './color-tokens';

/**
 * Sanitizes color values for safe DOM injection
 * Prevents CSS injection attacks by validating color format
 */
export function sanitizeColorForStyle(color: string | undefined): string {
  if (!color || typeof color !== 'string') {
    return 'transparent';
  }

  const trimmedColor = color.trim();
  
  // Block potentially dangerous values
  const dangerousPatterns = [
    /javascript:/i,
    /expression\(/i,
    /url\(/i,
    /data:/i,
    /@import/i,
    /behavior:/i,
    /binding:/i,
  ];

  if (dangerousPatterns.some(pattern => pattern.test(trimmedColor))) {
    console.warn(`Blocked potentially dangerous color value: ${trimmedColor}`);
    return 'transparent';
  }

  // Only allow validated color formats
  if (!validateColorOrToken(trimmedColor)) {
    console.warn(`Invalid color format blocked: ${trimmedColor}`);
    return 'transparent';
  }

  return trimmedColor;
}

/**
 * Sanitizes multiple color properties for style objects
 */
export function sanitizeStyleColors(colors: Record<string, string | undefined>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(colors)) {
    sanitized[key] = sanitizeColorForStyle(value);
  }
  
  return sanitized;
}