// ABOUTME: Custom Jest/Vitest matchers for domain-specific testing assertions

import { expect } from 'vitest';
import type { MatcherResult } from 'vitest';

/**
 * Custom matcher to check if an element has a specific Tailwind class
 */
function toHaveTailwindClass(received: Element, expectedClass: string): MatcherResult {
  const classList = Array.from(received.classList);
  const pass = classList.includes(expectedClass);

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to have Tailwind class "${expectedClass}"`
        : `Expected element to have Tailwind class "${expectedClass}". Received: ${classList.join(', ')}`,
  };
}

/**
 * Custom matcher to check if an element is properly accessible
 */
function toBeAccessible(received: Element): MatcherResult {
  const hasRole = received.getAttribute('role') !== null;
  const hasAriaLabel = received.getAttribute('aria-label') !== null;
  const hasAriaLabelledBy = received.getAttribute('aria-labelledby') !== null;
  const hasAriaDescribedBy = received.getAttribute('aria-describedby') !== null;
  
  // Check if it's a button or interactive element
  const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
    received.tagName.toLowerCase()
  );
  
  const hasAccessibleName = hasAriaLabel || hasAriaLabelledBy || received.textContent?.trim();
  
  const pass = !isInteractive || hasAccessibleName;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to be accessible`
        : `Expected interactive element to have accessible name (aria-label, aria-labelledby, or text content)`,
  };
}

// Type for query result structure
type QueryResult = {
  data?: unknown;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  [key: string]: unknown;
};

/**
 * Custom matcher to check if a query hook result has the expected shape
 */
function toBeValidQueryResult(received: QueryResult): MatcherResult {
  const hasData = 'data' in received;
  const hasIsLoading = 'isLoading' in received;
  const hasIsError = 'isError' in received;
  const hasError = 'error' in received;

  const pass = hasData && hasIsLoading && hasIsError && hasError;

  return {
    pass,
    message: () =>
      pass
        ? `Expected object not to be a valid query result`
        : `Expected object to have TanStack Query properties (data, isLoading, isError, error)`,
  };
}

// Type for mutation result structure
type MutationResult = {
  mutate: (...args: unknown[]) => void;
  mutateAsync: (...args: unknown[]) => Promise<unknown>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  [key: string]: unknown;
};

/**
 * Custom matcher to check if a mutation hook result has the expected shape
 */
function toBeValidMutationResult(received: MutationResult): MatcherResult {
  const hasMutate = 'mutate' in received;
  const hasMutateAsync = 'mutateAsync' in received;
  const hasIsPending = 'isPending' in received;
  const hasIsError = 'isError' in received;
  const hasError = 'error' in received;

  const pass = hasMutate && hasMutateAsync && hasIsPending && hasIsError && hasError;

  return {
    pass,
    message: () =>
      pass
        ? `Expected object not to be a valid mutation result`
        : `Expected object to have TanStack Query mutation properties (mutate, mutateAsync, isPending, isError, error)`,
  };
}

/**
 * Custom matcher to check if an element has proper loading state
 */
function toBeInLoadingState(received: Element): MatcherResult {
  const hasSkeletonClass = received.classList.contains('animate-pulse') || 
                          received.querySelector('[data-testid*="skeleton"]') !== null ||
                          received.querySelector('.skeleton') !== null;
  
  const hasLoadingText = received.textContent?.includes('Carregando') ||
                        received.textContent?.includes('Loading') ||
                        received.querySelector('[data-testid*="loading"]') !== null;

  const hasAriaLabel = received.getAttribute('aria-label')?.includes('carregando') ||
                      received.getAttribute('aria-label')?.includes('loading');

  const pass = hasSkeletonClass || hasLoadingText || hasAriaLabel;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to be in loading state`
        : `Expected element to show loading state (skeleton animation, loading text, or loading aria-label)`,
  };
}

/**
 * Custom matcher to check if an element has proper error state
 */
function toBeInErrorState(received: Element): MatcherResult {
  const hasErrorClass = received.classList.contains('text-destructive') ||
                        received.classList.contains('border-destructive') ||
                        received.querySelector('[data-testid*="error"]') !== null;
  
  const hasErrorText = received.textContent?.includes('Erro') ||
                      received.textContent?.includes('Error') ||
                      received.textContent?.includes('falha') ||
                      received.textContent?.includes('failed');

  const hasErrorIcon = received.querySelector('[data-testid*="error-icon"]') !== null ||
                      received.querySelector('svg[data-error]') !== null;

  const pass = hasErrorClass || hasErrorText || hasErrorIcon;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to be in error state`
        : `Expected element to show error state (error classes, error text, or error icon)`,
  };
}

/**
 * Custom matcher to check if responsive design is properly implemented
 */
function toBeResponsive(received: Element): MatcherResult {
  const classList = Array.from(received.classList);
  const hasResponsiveClasses = classList.some(cls => 
    cls.startsWith('sm:') || cls.startsWith('md:') || cls.startsWith('lg:') || cls.startsWith('xl:')
  );

  const pass = hasResponsiveClasses;

  return {
    pass,
    message: () =>
      pass
        ? `Expected element not to have responsive classes`
        : `Expected element to have responsive Tailwind classes (sm:, md:, lg:, xl:)`,
  };
}

/**
 * Extend Vitest's expect with custom matchers
 */
expect.extend({
  toHaveTailwindClass,
  toBeAccessible,
  toBeValidQueryResult,
  toBeValidMutationResult,
  toBeInLoadingState,
  toBeInErrorState,
  toBeResponsive,
});

/**
 * Type declarations for custom matchers
 */
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveTailwindClass(expectedClass: string): T;
    toBeAccessible(): T;
    toBeValidQueryResult(): T;
    toBeValidMutationResult(): T;
    toBeInLoadingState(): T;
    toBeInErrorState(): T;
    toBeResponsive(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveTailwindClass(expectedClass: string): Assertion;
    toBeAccessible(): Assertion;
    toBeValidQueryResult(): Assertion;
    toBeValidMutationResult(): Assertion;
    toBeInLoadingState(): Assertion;
    toBeInErrorState(): Assertion;
    toBeResponsive(): Assertion;
  }
}