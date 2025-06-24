// ABOUTME: Centralized import definitions for consistent Edge Function dependencies

// Standardized Deno imports (consistent version across all functions)
export { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Standardized Supabase imports (consistent version across all functions)
export { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// Re-export all shared utilities for convenience
export * from './cors.ts';
export * from './api-helpers.ts';
export * from './rate-limit.ts';
export * from './auth.ts';

// Compatibility exports for legacy patterns
export { checkRateLimit as rateLimit } from './rate-limit.ts';