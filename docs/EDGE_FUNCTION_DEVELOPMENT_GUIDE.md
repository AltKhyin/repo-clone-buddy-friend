# Edge Function Development Guide

**Version:** 2.0.0 (Post-Crisis Resolution)  
**Last Updated:** June 25, 2025  
**Status:** Production Ready

## Overview

This guide documents the standardized architecture and development patterns for Supabase Edge Functions in the EVIDENS platform. It reflects lessons learned from the major import/export crisis resolution of June 2025.

## Table of Contents

1. [Architectural Principles](#architectural-principles)
2. [Standard Import Patterns](#standard-import-patterns)
3. [Function Template](#function-template)
4. [Shared Utilities Reference](#shared-utilities-reference)
5. [Deployment Process](#deployment-process)
6. [Troubleshooting](#troubleshooting)
7. [Historical Context](#historical-context)

## Architectural Principles

### 1. Direct Imports Only
- **NEVER** use aggregator patterns like `imports.ts` with star exports
- Import only what you need from specific files
- Make dependencies explicit and traceable

### 2. Shared Utilities Pattern
```
supabase/functions/_shared/
├── auth.ts          # Authentication utilities
├── cors.ts          # CORS handling
├── rate-limit.ts    # Rate limiting
└── api-helpers.ts   # Response helpers & error handling
```

### 3. Consistent Function Structure
Every Edge Function must follow the 7-step pattern:
1. CORS Preflight Handling
2. Authentication  
3. Rate Limiting (if applicable)
4. Input Validation
5. Business Logic
6. Success Response
7. Error Handling

## Standard Import Patterns

### ✅ CORRECT Pattern
```typescript
// ABOUTME: [Function purpose in present tense]

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';
import { getUserFromRequest, requireRole } from '../_shared/auth.ts';
```

### ❌ FORBIDDEN Patterns
```typescript
// DON'T: Star imports from aggregator
import { serve, createClient, /* ... */ } from '../_shared/imports.ts';

// DON'T: Mixed import sources without explicit paths
import { serve } from 'imports.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
```

## Function Template

Use this template for ALL new Edge Functions:

```typescript
// ABOUTME: [Describe what this function does in present tense]

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createSuccessResponse, createErrorResponse, authenticateUser } from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders, RateLimitError } from '../_shared/rate-limit.ts';
import { getUserFromRequest, requireRole } from '../_shared/auth.ts';

serve(async (req: Request) => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Authentication (if required)
    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return createErrorResponse('Authentication required', 401);
    }

    // STEP 3: Rate Limiting (if applicable)
    const rateLimitResult = await checkRateLimit(req, { 
      windowMs: 60000, 
      maxRequests: 100 
    });
    if (!rateLimitResult.success) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    // STEP 4: Input Validation
    const requestData = await req.json();
    // ... validate requestData ...

    // STEP 5: Business Logic
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // ... implement core functionality ...

    // STEP 6: Success Response
    return createSuccessResponse(result, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 7: Centralized Error Handling
    console.error('Error in [function-name]:', error);
    return createErrorResponse(error);
  }
});
```

## Shared Utilities Reference

### Authentication (`auth.ts`)
```typescript
// Get user from request with error handling
const { user, error } = await getUserFromRequest(req);

// Check if user has required roles
const roleCheck = requireRole(user, ['admin', 'moderator']);

// Direct authentication with supabase client
const user = await authenticateUser(supabase, authHeader);
```

### CORS Handling (`cors.ts`)
```typescript
// Handle preflight requests
if (req.method === 'OPTIONS') {
  return handleCorsPreflightRequest();
}

// Use CORS headers in responses (included in createSuccessResponse)
import { corsHeaders } from '../_shared/cors.ts';
```

### Rate Limiting (`rate-limit.ts`)
```typescript
// Standard rate limiting
const rateLimitResult = await checkRateLimit(req, { 
  windowMs: 60000,     // 1 minute window
  maxRequests: 100     // 100 requests per window
});

// Include rate limit headers in response
return createSuccessResponse(data, rateLimitHeaders(rateLimitResult));

// Handle rate limit errors
if (!rateLimitResult.success) {
  throw RateLimitError;
}
```

### API Helpers (`api-helpers.ts`)
```typescript
// Success responses (preferred)
return createSuccessResponse(data, additionalHeaders);

// Error responses (preferred)
return createErrorResponse(error, additionalHeaders);

// Legacy compatibility (available but not recommended for new code)
return sendSuccess(data);
return sendError('Error message', 500);
```

## Deployment Process

### 1. Automated Deployment
Changes are deployed automatically via GitHub Actions when pushed to `main`:

```yaml
# .github/workflows/deploy-supabase.yml
# Deploys Edge Functions only (migrations handled separately)
```

### 2. Manual Deployment (Local)
```bash
# Deploy specific function
supabase functions deploy [function-name] --project-ref $PROJECT_REF

# Deploy all functions
supabase functions deploy --project-ref $PROJECT_REF
```

### 3. Validation Checklist
After deployment, verify:
- [ ] Function returns 200 status codes (not 503)
- [ ] CORS preflight requests work (OPTIONS method)
- [ ] Authentication flow works correctly
- [ ] Rate limiting headers are present
- [ ] Error responses use standard format

## Troubleshooting

### Common Issues & Solutions

#### 503 Service Unavailable
**Symptoms:** Function fails to start, shows `null` deployment_id
**Causes:**
- Import/export conflicts
- Missing exports in shared utilities
- Syntax errors in function code

**Solution:**
1. Check function logs in Supabase dashboard
2. Verify all imports resolve correctly
3. Test function locally with `supabase functions serve`

#### Missing Export Errors
**Symptoms:** `does not provide an export named 'X'`
**Solution:**
1. Check that the export exists in the target file
2. Verify import path is correct
3. Ensure no typos in export/import names

#### Rate Limit Issues
**Symptoms:** Functions return 429 errors frequently
**Solution:**
1. Adjust rate limit configuration
2. Implement user-specific rate limiting
3. Consider using Redis for production rate limiting

### Debugging Commands
```bash
# View function logs
supabase functions logs [function-name]

# Serve function locally for testing
supabase functions serve [function-name]

# Test function with curl
curl -X POST https://[project-ref].supabase.co/functions/v1/[function-name] \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## Historical Context

### The Import/Export Crisis (June 2025)
A critical system failure occurred when the centralized `imports.ts` aggregator pattern caused widespread 503 errors across all Edge Functions.

**Root Causes:**
1. Star export conflicts (multiple files exporting same names)
2. Missing function exports (`sendSuccess`, `sendError`)
3. Inconsistent import patterns across functions

**Resolution:**
1. Eliminated `imports.ts` aggregator completely
2. Implemented direct import patterns
3. Added missing function exports for backward compatibility
4. Standardized all function templates

**Lessons Learned:**
- Avoid "clever" aggregator patterns in favor of explicit imports
- Star exports (`export *`) are fragile and should be avoided
- Consistent patterns across all functions prevent cascading failures
- Shared utilities should have complete, well-documented APIs

### Function Migration History
- **Phase 1:** Functions using `imports.ts` (problematic)
- **Phase 2:** Mixed import patterns (transitional)  
- **Phase 3:** Direct imports only (current standard)

## Best Practices

### DO:
✅ Use direct imports from specific files  
✅ Follow the 7-step function template  
✅ Include ABOUTME comment in every function  
✅ Handle all error cases explicitly  
✅ Use consistent Supabase client version (`@2.50.0`)  
✅ Include rate limiting for user-facing endpoints  
✅ Test functions locally before deployment  

### DON'T:
❌ Create import aggregator files  
❌ Use star exports for shared utilities  
❌ Skip CORS preflight handling  
❌ Return raw Response objects (use helper functions)  
❌ Mix different Supabase client versions  
❌ Deploy without testing locally  
❌ Ignore TypeScript compilation errors  

## Version History

### v2.0.0 (June 2025)
- Eliminated imports.ts aggregator pattern
- Implemented direct import architecture
- Added comprehensive error handling
- Standardized function template

### v1.0.0 (Initial)
- Basic Edge Function structure
- Shared utilities pattern
- CORS and authentication helpers

---

**Questions or Issues?**
Refer to this guide first, then check existing function implementations for examples. When in doubt, follow the standard template and direct import patterns.