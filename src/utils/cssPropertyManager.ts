// ABOUTME: CSS custom property injection and management utility for dynamic theming

import type { ThemeTokens, ColorValue } from '@/types/unified-editor';

// ============================================================================
// CSS PROPERTY MANAGER CLASS
// ============================================================================

export class CSSPropertyManager {
  private targetElement: HTMLElement;
  private appliedProperties: Set<string> = new Set();
  private propertyObserver?: MutationObserver;

  constructor(targetElement: HTMLElement = document.documentElement) {
    this.targetElement = targetElement;
    this.setupPropertyObserver();
  }

  /**
   * Apply a single CSS custom property
   */
  setProperty(name: string, value: string): void {
    const cssPropertyName = this.normalizeCSSPropertyName(name);

    try {
      this.targetElement.style.setProperty(cssPropertyName, value);
      this.appliedProperties.add(cssPropertyName);
    } catch (error) {
      console.warn(`Failed to set CSS property ${cssPropertyName}:`, error);
    }
  }

  /**
   * Apply multiple CSS custom properties in batch
   */
  setProperties(properties: Record<string, string>): void {
    // Use requestAnimationFrame to batch DOM updates
    requestAnimationFrame(() => {
      Object.entries(properties).forEach(([name, value]) => {
        this.setProperty(name, value);
      });
    });
  }

  /**
   * Remove a CSS custom property
   */
  removeProperty(name: string): void {
    const cssPropertyName = this.normalizeCSSPropertyName(name);

    try {
      this.targetElement.style.removeProperty(cssPropertyName);
      this.appliedProperties.delete(cssPropertyName);
    } catch (error) {
      console.warn(`Failed to remove CSS property ${cssPropertyName}:`, error);
    }
  }

  /**
   * Remove multiple CSS custom properties
   */
  removeProperties(names: string[]): void {
    requestAnimationFrame(() => {
      names.forEach(name => this.removeProperty(name));
    });
  }

  /**
   * Get current value of a CSS custom property
   */
  getProperty(name: string): string | null {
    const cssPropertyName = this.normalizeCSSPropertyName(name);
    return getComputedStyle(this.targetElement).getPropertyValue(cssPropertyName) || null;
  }

  /**
   * Check if a CSS custom property is currently applied
   */
  hasProperty(name: string): boolean {
    const cssPropertyName = this.normalizeCSSPropertyName(name);
    return this.appliedProperties.has(cssPropertyName);
  }

  /**
   * Clear all managed CSS custom properties
   */
  clearAllProperties(): void {
    this.appliedProperties.forEach(propertyName => {
      this.targetElement.style.removeProperty(propertyName);
    });
    this.appliedProperties.clear();
  }

  /**
   * Get all currently applied properties
   */
  getAppliedProperties(): Record<string, string> {
    const properties: Record<string, string> = {};

    this.appliedProperties.forEach(propertyName => {
      const value = this.getProperty(propertyName);
      if (value) {
        properties[propertyName] = value;
      }
    });

    return properties;
  }

  /**
   * Apply theme tokens as CSS custom properties
   */
  applyThemeTokens(tokens: Partial<ThemeTokens>): void {
    const properties: Record<string, string> = {};

    Object.entries(tokens).forEach(([tokenName, value]) => {
      if (value) {
        properties[tokenName] = value;
      }
    });

    this.setProperties(properties);
  }

  /**
   * Create a CSS class with current theme properties
   */
  generateCSSClass(className: string, properties?: string[]): string {
    const propsToInclude = properties || Array.from(this.appliedProperties);

    const cssRules = propsToInclude
      .map(prop => {
        const value = this.getProperty(prop);
        return value ? `  ${prop}: ${value};` : null;
      })
      .filter(Boolean)
      .join('\n');

    return `.${className} {\n${cssRules}\n}`;
  }

  /**
   * Setup mutation observer to track external changes to CSS properties
   */
  private setupPropertyObserver(): void {
    if (!MutationObserver) return;

    this.propertyObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this.syncAppliedProperties();
        }
      });
    });

    this.propertyObserver.observe(this.targetElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  /**
   * Sync our tracking with actual applied properties
   */
  private syncAppliedProperties(): void {
    const currentStyle = this.targetElement.style;
    const actualProperties = new Set<string>();

    // Check which of our tracked properties are actually still applied
    for (let i = 0; i < currentStyle.length; i++) {
      const propertyName = currentStyle[i];
      if (propertyName.startsWith('--')) {
        actualProperties.add(propertyName);
      }
    }

    // Update our tracking to match reality
    this.appliedProperties = actualProperties;
  }

  /**
   * Normalize CSS property name (ensure it starts with --)
   */
  private normalizeCSSPropertyName(name: string): string {
    return name.startsWith('--') ? name : `--${name}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.propertyObserver) {
      this.propertyObserver.disconnect();
      this.propertyObserver = undefined;
    }
  }
}

// ============================================================================
// GLOBAL MANAGER INSTANCE
// ============================================================================

let globalCSSManager: CSSPropertyManager | null = null;

/**
 * Get or create the global CSS property manager
 */
export const getGlobalCSSManager = (): CSSPropertyManager => {
  if (!globalCSSManager) {
    globalCSSManager = new CSSPropertyManager();
  }
  return globalCSSManager;
};

/**
 * Create a scoped CSS property manager for a specific element
 */
export const createScopedCSSManager = (element: HTMLElement): CSSPropertyManager => {
  return new CSSPropertyManager(element);
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Apply theme tokens to the global CSS scope
 */
export const applyGlobalThemeTokens = (tokens: Partial<ThemeTokens>): void => {
  const manager = getGlobalCSSManager();
  manager.applyThemeTokens(tokens);
};

/**
 * Remove theme tokens from the global CSS scope
 */
export const removeGlobalThemeTokens = (tokenNames: (keyof ThemeTokens)[]): void => {
  const manager = getGlobalCSSManager();
  manager.removeProperties(tokenNames.map(name => `--${name}`));
};

/**
 * Get current global theme property value
 */
export const getGlobalThemeProperty = (tokenName: keyof ThemeTokens): string | null => {
  const manager = getGlobalCSSManager();
  return manager.getProperty(`--${tokenName}`);
};

/**
 * Check if a global theme property is currently applied
 */
export const hasGlobalThemeProperty = (tokenName: keyof ThemeTokens): boolean => {
  const manager = getGlobalCSSManager();
  return manager.hasProperty(`--${tokenName}`);
};

// ============================================================================
// THEME TRANSITION UTILITIES
// ============================================================================

export interface ThemeTransitionOptions {
  duration?: number; // in milliseconds
  easing?: string; // CSS easing function
  properties?: (keyof ThemeTokens)[]; // specific properties to transition
}

/**
 * Apply theme changes with smooth transitions
 */
export const applyThemeWithTransition = (
  tokens: Partial<ThemeTokens>,
  options: ThemeTransitionOptions = {}
): Promise<void> => {
  const {
    duration = 200,
    easing = 'ease-in-out',
    properties = Object.keys(tokens) as (keyof ThemeTokens)[],
  } = options;

  const manager = getGlobalCSSManager();

  return new Promise(resolve => {
    // Set transition properties
    const transitionProperties = properties.map(prop => `--${prop}`).join(', ');

    manager.setProperty('transition', `${transitionProperties} ${duration}ms ${easing}`);

    // Apply new values
    manager.applyThemeTokens(tokens);

    // Remove transition after completion
    setTimeout(() => {
      manager.removeProperty('transition');
      resolve();
    }, duration);
  });
};

/**
 * Batch multiple theme updates with transitions
 */
export const batchThemeUpdates = (
  updates: Array<{ tokens: Partial<ThemeTokens>; delay?: number }>,
  options: ThemeTransitionOptions = {}
): Promise<void> => {
  return updates.reduce(async (promise, update, index) => {
    await promise;

    if (update.delay && index > 0) {
      await new Promise(resolve => setTimeout(resolve, update.delay));
    }

    return applyThemeWithTransition(update.tokens, options);
  }, Promise.resolve());
};

// ============================================================================
// CSS CUSTOM PROPERTY UTILITIES
// ============================================================================

/**
 * Extract all CSS custom properties from computed styles
 */
export const extractCSSCustomProperties = (
  element: HTMLElement = document.documentElement
): Record<string, string> => {
  const computedStyle = getComputedStyle(element);
  const customProperties: Record<string, string> = {};

  // Modern browsers support iterating over computed styles
  for (let i = 0; i < computedStyle.length; i++) {
    const propertyName = computedStyle[i];
    if (propertyName.startsWith('--')) {
      customProperties[propertyName] = computedStyle.getPropertyValue(propertyName);
    }
  }

  return customProperties;
};

/**
 * Generate CSS variable fallback chain
 */
export const createCSSVariableFallback = (primaryVar: string, fallbacks: string[]): string => {
  const normalizedPrimary = primaryVar.startsWith('--') ? `var(${primaryVar})` : primaryVar;

  if (fallbacks.length === 0) {
    return normalizedPrimary;
  }

  const fallbackChain = fallbacks
    .map(fallback => (fallback.startsWith('--') ? `var(${fallback})` : fallback))
    .join(', ');

  return `var(${primaryVar.startsWith('--') ? primaryVar : `--${primaryVar}`}, ${fallbackChain})`;
};

/**
 * Validate CSS custom property value
 */
export const isValidCSSPropertyValue = (value: string): boolean => {
  if (!value || typeof value !== 'string') return false;

  // Create a temporary element to test the value
  const testElement = document.createElement('div');
  testElement.style.setProperty('--test-property', value);

  const computedValue = getComputedStyle(testElement).getPropertyValue('--test-property');
  return computedValue.trim() === value.trim();
};

/**
 * Convert theme tokens to CSS custom properties object
 */
export const themeTokensToCSSProperties = (
  tokens: Partial<ThemeTokens>
): Record<string, string> => {
  const cssProperties: Record<string, string> = {};

  Object.entries(tokens).forEach(([tokenName, value]) => {
    if (value) {
      const cssPropertyName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
      cssProperties[cssPropertyName] = value;
    }
  });

  return cssProperties;
};
