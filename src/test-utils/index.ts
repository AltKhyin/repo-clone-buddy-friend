// ABOUTME: Essential testing utilities for strategic testing approach - minimal, focused exports
export { renderWithProviders, TestProviders } from './test-providers';

// Re-export essential testing library functions
export { screen, fireEvent, waitFor, act, renderHook } from '@testing-library/react';

export { userEvent } from '@testing-library/user-event';

// Re-export essential Vitest functions
export { vi, expect, describe, it, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
