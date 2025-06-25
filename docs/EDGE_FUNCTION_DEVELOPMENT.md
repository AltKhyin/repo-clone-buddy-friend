# EVIDENS Edge Function Development Guidelines

**Last Updated:** June 24, 2025  
**Status:** ✅ STANDARDIZED & VERIFIED  

## 🎯 Overview

This document provides the mandatory development guidelines for creating and maintaining EVIDENS Edge Functions. All new functions MUST follow these patterns to ensure consistency, reliability, and maintainability.

## 📋 Mandatory 7-Step Pattern

### Template Structure

```typescript
// ABOUTME: [One sentence description of function purpose in present tense]

import { 
  serve,
  createClient,
  corsHeaders,
  handleCorsPreflightRequest,
  createSuccessResponse,
  createErrorResponse,
  authenticateUser,
  checkRateLimit,
  rateLimitHeaders,
  RateLimitError
} from '../_shared/imports.ts';

interface FunctionRequest {
  // Define your request interface
}

interface FunctionResponse {
  // Define your response interface
}

serve(async (req) => {
  // STEP 1: CORS Preflight Handling (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // STEP 3: Rate Limiting
    const rateLimitResult = await checkRateLimit(req, { 
      windowMs: 60000,  // 1 minute window
      maxRequests: 30   // Adjust based on function needs
    });
    if (!rateLimitResult.success) {
      throw RateLimitError;
    }

    // STEP 4: Authentication & Authorization (if required)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('UNAUTHORIZED: Authentication required for this action');
    }
    
    const user = await authenticateUser(supabase, authHeader);
    
    // Add authorization checks if needed
    const { data: practitioner } = await supabase
      .from('Practitioners')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!['admin', 'editor'].includes(practitioner?.role)) {
      throw new Error('FORBIDDEN: Insufficient permissions');
    }

    // STEP 5: Input Validation
    const body: FunctionRequest = await req.json();
    
    if (!body.required_field) {
      throw new Error('VALIDATION_FAILED: Required field is missing');
    }

    // STEP 6: Core Business Logic
    const result = await performYourBusinessLogic(supabase, body, user);

    const response: FunctionResponse = {
      success: true,
      data: result,
      message: 'Operation completed successfully'
    };

    // STEP 7: Standardized Success Response
    return createSuccessResponse(response, rateLimitHeaders(rateLimitResult));

  } catch (error) {
    // STEP 8: Centralized Error Handling
    console.error('Error in function-name:', error);
    return createErrorResponse(error);
  }
});

async function performYourBusinessLogic(supabase: any, body: FunctionRequest, user: any) {
  // Implement your core logic here
  return {};
}
```

## 🔧 Configuration Guidelines

### Rate Limiting Patterns

```typescript
// Public endpoints (higher limits)
const rateLimitResult = await checkRateLimit(req, { 
  windowMs: 60000, 
  maxRequests: 100 
});

// User actions (moderate limits)
const rateLimitResult = await checkRateLimit(req, { 
  windowMs: 60000, 
  maxRequests: 30 
});

// Admin actions (strict limits)
const rateLimitResult = await checkRateLimit(req, { 
  windowMs: 60000, 
  maxRequests: 10 
});

// Resource-intensive operations (very strict)
const rateLimitResult = await checkRateLimit(req, { 
  windowMs: 60000, 
  maxRequests: 5 
});
```

### Error Message Patterns

```typescript
// Validation errors
throw new Error('VALIDATION_FAILED: Specific validation message');

// Authentication errors
throw new Error('UNAUTHORIZED: Authentication required');

// Authorization errors
throw new Error('FORBIDDEN: Insufficient permissions');

// Not found errors
throw new Error('NOT_FOUND: Resource not found');

// Database errors
throw new Error(`Database operation failed: ${error.message}`);
```

### Authentication Patterns

```typescript
// Optional authentication (public endpoints)
let user = null;
const authHeader = req.headers.get('Authorization');
if (authHeader) {
  try {
    user = await authenticateUser(supabase, authHeader);
  } catch (authError) {
    console.log('Auth failed, continuing as anonymous:', authError);
  }
}

// Required authentication
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  throw new Error('UNAUTHORIZED: Authentication required');
}
const user = await authenticateUser(supabase, authHeader);

// Role-based authorization
const { data: practitioner } = await supabase
  .from('Practitioners')
  .select('role, subscription_tier')
  .eq('id', user.id)
  .single();

if (!practitioner || !['admin', 'editor'].includes(practitioner.role)) {
  throw new Error('FORBIDDEN: Admin or editor privileges required');
}
```

## 📁 File Organization

### Naming Convention
- **File names:** `kebab-case` (e.g., `get-community-posts`)
- **Function names:** `camelCase` (e.g., `getCommunityPosts`)
- **Interfaces:** `PascalCase` (e.g., `CommunityPostRequest`)

### Directory Structure
```
supabase/functions/
├── _shared/                 # Shared utilities (DO NOT MODIFY)
│   ├── imports.ts          # Centralized imports
│   ├── cors.ts             # CORS handling
│   ├── api-helpers.ts      # Response helpers
│   ├── rate-limit.ts       # Rate limiting
│   └── auth.ts             # Authentication
├── your-function-name/
│   └── index.ts            # Your function implementation
```

## 🚫 Common Mistakes to Avoid

### ❌ Wrong Import Patterns
```typescript
// DON'T: Direct imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// DON'T: Mixed imports from different shared files
import { createSuccessResponse } from '../_shared/api-helpers.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
```

```typescript
// ✅ DO: Use unified imports
import { 
  serve,
  createClient,
  createSuccessResponse,
  checkRateLimit,
  // ... other needed imports
} from '../_shared/imports.ts';
```

### ❌ Wrong Rate Limiting Patterns
```typescript
// DON'T: Old database-based pattern
const rateLimitResult = await checkRateLimit(supabase, 'action', userId, 30, 60);

// DON'T: Manual rate limiting
const clientIP = req.headers.get('x-forwarded-for');
```

```typescript
// ✅ DO: Use request-based pattern
const rateLimitResult = await checkRateLimit(req, { windowMs: 60000, maxRequests: 30 });
```

### ❌ Wrong Error Handling
```typescript
// DON'T: Manual error responses
return new Response(JSON.stringify({ 
  error: { message: 'Error occurred', code: 'ERROR' } 
}), { 
  status: 500, 
  headers: corsHeaders 
});
```

```typescript
// ✅ DO: Use centralized error handling
throw new Error('VALIDATION_FAILED: Specific error message');
// Will be automatically handled by createErrorResponse()
```

### ❌ Wrong CORS Handling
```typescript
// DON'T: Manual CORS
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

```typescript
// ✅ DO: Use standardized CORS
if (req.method === 'OPTIONS') {
  return handleCorsPreflightRequest();
}
```

## 🧪 Testing Your Function

### Local Testing
```bash
# Start Supabase locally
supabase start

# Test your function
curl -X POST http://localhost:54321/functions/v1/your-function-name \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Integration Testing
```bash
# Run build to verify no TypeScript errors
npm run build:dev

# Check function follows pattern
grep -E "(STEP [1-8]|createSuccessResponse|createErrorResponse)" supabase/functions/your-function-name/index.ts
```

## 📚 Reference Examples

### Simple Function (No Auth)
- `get-trending-discussions` - Public content fetching
- `get-homepage-feed` - Anonymous-friendly data

### Authenticated Function
- `create-community-post` - User content creation
- `save-post` - User-specific actions

### Admin Function
- `moderate-community-post` - Role-based operations
- `reward-content` - Admin-only actions

### Complex Function
- `get-community-page-data` - Multiple data sources
- `get-acervo-data` - Access control + filtering

## 📋 Pre-Deployment Checklist

- [ ] Function uses unified imports from `_shared/imports.ts`
- [ ] Follows mandatory 7-step pattern
- [ ] Has proper ABOUTME comment
- [ ] Implements appropriate rate limiting
- [ ] Uses centralized error handling
- [ ] Includes proper TypeScript interfaces
- [ ] Handles authentication correctly (if required)
- [ ] Uses structured error messages
- [ ] Returns standardized responses
- [ ] Builds without TypeScript errors

## 🔄 Maintenance

### Updating Dependencies
**⚠️ ONLY modify `_shared/imports.ts` for dependency updates**

```typescript
// Update versions here ONLY
export { serve } from "https://deno.land/std@0.X.X/http/server.ts";
export { createClient } from 'https://esm.sh/@supabase/supabase-js@X.X.X';
```

### Adding New Shared Utilities
1. Add utility to appropriate `_shared/*.ts` file
2. Export from `_shared/imports.ts`
3. Update this documentation

---

**Following these guidelines ensures your Edge Functions are consistent, reliable, and maintainable within the EVIDENS platform architecture.**