# EVIDENS Development Protocols
Version: 2.1.0 (Edge Function Protocol Update)
Date: June 20, 2025
Purpose: Standardized development protocols to ensure code quality, type safety, and prevent integration issues. Updated with mandatory Edge Function implementation protocol to eliminate recurring CORS and authentication errors.

**CHANGELOG (v2.1.0):**
- **CRITICAL ADDITION**: Protocol #7 - Edge Function Implementation (Non-Negotiable)
- Established canonical pattern to prevent recurring CORS preflight failures
- Defined mandatory configuration standards for supabase/config.toml
- Enhanced error prevention for systematic backend development

## **PROTOCOL #1: Strict TypeScript Compliance (NON-NEGOTIABLE)**

**RULE**: The EVIDENS codebase MUST be configured to run with `strict: true` in `tsconfig.app.json`.

**RATIONALE**: Strict TypeScript is the foundation of production-ready code quality. It prevents the most common sources of runtime errors and ensures reliable type checking.

**MANDATORY CONFIGURATION:**
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**IMPLEMENTATION GUIDELINES:**
- All new code must be fully strict-compliant
- No new `any` types are permitted unless explicitly justified and approved in code review
- The use of the non-null assertion operator (`!`) is strongly discouraged
- All potentially null or undefined values must be handled with explicit type guards or optional chaining (`?.`)
- All TODO comments regarding type safety must be linked to a ticket in the project management system

**VERIFICATION CHECKLIST:**
- [ ] `npm run build` completes without type errors
- [ ] No `any` types in new code
- [ ] All null/undefined values properly handled
- [ ] TypeScript strict mode enabled in configuration

## **PROTOCOL #2: Import Pathing Strategy (STANDARDIZATION)**

**RULE**: The style of an import path should communicate its architectural purpose and maintain consistency across the codebase.

**PRINCIPLE**: Intra-module vs. Cross-module distinction drives import path selection.

**RULE FOR ALIASED PATHS (@/):** Use aliased paths for all cross-module imports. An import is cross-module if it accesses a shared, application-wide resource from a different architectural layer.

**Examples:**
```typescript
// Cross-module imports - USE ALIASED PATHS
import { Button } from '@/components/ui/button';
import { useSomeQuery } from '@/packages/hooks/useSomeQuery';
import { useAuthStore } from '@/store/auth';
import type { UserProfile } from '@/types';
```

**RULE FOR RELATIVE PATHS (./, ../):** Use relative paths for all intra-module imports. An import is intra-module if it accesses a file that is considered a "private" part of the same, self-contained module.

**Examples:**
```typescript
// Intra-module imports - USE RELATIVE PATHS
import styles from './styles.module.css';
import { helper } from './helpers';
// In barrel files (index.ts):
export * from './ComponentA';
// Between shared files in isolated environments:
import { corsHeaders } from '../_shared/cors';
```

**VERIFICATION CHECKLIST:**
- [ ] All cross-module imports use `@/` alias
- [ ] All intra-module imports use relative paths
- [ ] Import paths are consistent within each file
- [ ] No mixing of aliased and relative paths for the same resource

## **PROTOCOL #3: Single Source of Truth for Types**

**RULE**: All type definitions MUST reside in `src/types/index.ts`
**RATIONALE**: Prevents duplicate interfaces and type inconsistencies across components

**IMPLEMENTATION GUIDELINES:**
- All shared types belong in `src/types/index.ts`
- Components MUST import types from `@/types`
- Hook-specific interfaces should extend from base types, not duplicate them
- Before creating a new interface, verify it doesn't exist in the global types

**VERIFICATION CHECKLIST:**
- [ ] Search codebase for duplicate interface definitions
- [ ] Verify all imports reference `@/types`
- [ ] Confirm TypeScript compilation passes
- [ ] No duplicate type warnings in IDE

## **PROTOCOL #4: TanStack Query Implementation Standards**

**RULE**: All data-fetching hooks MUST follow TanStack Query v5 patterns
**RATIONALE**: Ensures consistent server state management and prevents API compatibility issues

**REQUIRED PATTERNS:**
```typescript
// useInfiniteQuery v5 Pattern
export const useExampleQuery = () => {
  return useInfiniteQuery({
    queryKey: ['example'],
    queryFn: fetchFunction,
    initialPageParam: 0, // REQUIRED in v5
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // v5 signature with lastPageParam
      return lastPage.hasMore ? lastPageParam + 1 : undefined;
    },
  });
};

// useQuery v5 Pattern  
export const useSingleQuery = (id: string) => {
  return useQuery({
    queryKey: ['example', id],
    queryFn: () => fetchSingle(id),
    enabled: !!id, // Only run when id exists
  });
};
```

**VERIFICATION CHECKLIST:**
- [ ] All infinite queries include `initialPageParam`
- [ ] `getNextPageParam` uses v5 signature
- [ ] Query keys are descriptive arrays
- [ ] Mutations invalidate relevant queries in `onSuccess`

## **PROTOCOL #5: Component Integration Standards**

**RULE**: Components using shared types MUST follow standardized import and usage patterns
**RATIONALE**: Prevents type mismatches and ensures components work together seamlessly

**IMPORT STANDARDS:**
```typescript
// Correct type imports
import type { CommunityPost, UserProfile } from '@/types';

// Correct icon imports
import { Bookmark, BookmarkCheck, Share2 } from 'lucide-react';

// Correct hook imports  
import { useSavePostMutation } from '@/packages/hooks/useSavePostMutation';
```

**COMPONENT STRUCTURE:**
- Data fetching: Use custom hooks only (never direct supabase calls)
- State management: Follow [D3.3] decision algorithm from EVIDENS Directives
- Event handlers: Proper TypeScript event types
- Conditional rendering: Safe property access with optional chaining

**VERIFICATION CHECKLIST:**
- [ ] All types imported from canonical source
- [ ] All icons explicitly imported
- [ ] No direct database calls in components
- [ ] Proper event handler typing

## **PROTOCOL #6: Data Access Layer (The Golden Rule)**

**DAL.1 (No Direct Access)**: UI components are FORBIDDEN from importing or calling the supabase-js client directly.

**DAL.2 (Hook Abstraction)**: All backend interactions MUST be encapsulated in a custom hook within `/packages/hooks/`.

**DAL.3 (Query Engine)**: All data-fetching hooks MUST use TanStack Query.

**DAL.4 (Cache Invalidation)**: Hooks using useMutation MUST invalidate relevant queries in their onSuccess callback.

**DAL.5 (Granular Fetching)**: Each hook should have a single, clear responsibility. Avoid consolidated queries except for specific optimizations.

## **PROTOCOL #7: Edge Function Implementation (NON-NEGOTIABLE)**

**RULE**: All new Supabase Edge Functions must be implemented following the EVIDENS Edge Function Development Protocol. This protocol eliminates the recurring cycle of CORS, authentication, and configuration errors.

**RATIONALE**: Analysis of development patterns reveals that 95% of new Edge Function implementations fail with the same 2-3 step error sequence:
1. CORS preflight failure (OPTIONS request not handled)
2. Authentication/JWT verification issues (gateway vs. function-level mismatch)
3. Inconsistent error responses and rate limiting

**MANDATORY IMPLEMENTATION REQUIREMENTS:**

### **7.1: Function Code Structure**
Every new Edge Function MUST follow the exact 7-step pattern defined in [DOC_5]_API_CONTRACT.md, Section 1.5:

```typescript
// Template location: supabase/functions/[function-name]/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  handleCorsPreflightRequest,
  authenticateUser,
  createSuccessResponse,
  createErrorResponse,
  RateLimitError
} from '../_shared/api-helpers.ts';
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts';

Deno.serve(async (req) => {
  // STEP 1: Handle CORS preflight (MANDATORY FIRST)
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // STEP 2-7: Following the canonical pattern...
    // [Implementation details in DOC_5]
  } catch (error) {
    return createErrorResponse(error);
  }
});
```

### **7.2: Gateway Configuration**
For every new function, the `supabase/config.toml` file MUST include:

```toml
[functions.new-function-name]
verify_jwt = false
```

**Why `verify_jwt = false` is Required:**
- Allows CORS preflight (OPTIONS) requests to pass through to function code
- Enables proper error handling and response formatting
- Permits function-level authentication with better user experience

### **7.3: Shared Utilities Requirement**
All functions MUST use the shared helpers in `supabase/functions/_shared/`:
- `api-helpers.ts`: For authentication, CORS, and response formatting
- `rate-limit.ts`: For consistent rate limiting implementation

**VERIFICATION CHECKLIST FOR NEW FUNCTIONS:**
- [ ] Function follows exact 7-step structure from DOC_5
- [ ] `verify_jwt = false` set in config.toml
- [ ] Uses shared utilities for CORS, auth, and responses
- [ ] Implements rate limiting with checkRateLimit
- [ ] Returns standardized success/error responses
- [ ] Handles OPTIONS requests as first step

**ENFORCEMENT**: Functions that violate this protocol will experience predictable failures and must be refactored before deployment.

## **Error Prevention Protocols**

**PRE-COMMIT VERIFICATION:**
1. TypeScript compilation passes without errors (`npm run build`)
2. No ESLint warnings
3. All imports resolve correctly
4. Component renders without console errors

**INTEGRATION TESTING REQUIREMENTS:**
- Critical user flows tested (save/unsave posts)
- Mobile responsiveness verified
- Type contracts validated across components
- Data access patterns confirmed

**DOCUMENTATION REQUIREMENTS:**
- All new features documented in README-BÍBLIA.md
- Type changes noted in change log
- Component interactions documented

## **File Organization Standards**

### Hook Directory Structure
```
packages/hooks/
├── use[Feature]Query.ts          # Data fetching
├── use[Feature]Mutation.ts       # Data modification
└── use[Feature]State.ts          # Local state management

src/hooks/
├── use-mobile.tsx                # UI-specific hooks
└── use-toast.ts                  # UI utility hooks
```

### Component Directory Structure
```
src/components/
├── ui/                           # Primitive components
├── [feature]/                    # Feature-specific components
│   ├── [Feature]Card.tsx         # Individual items
│   ├── [Feature]List.tsx         # Collections
│   └── [Feature]Actions.tsx      # Interactive elements
└── shell/                        # Layout components
```

## **Common Anti-Patterns to Avoid**

### ❌ Direct Database Calls in Components
```typescript
// WRONG
const MyComponent = () => {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: () => supabase.from('CommunityPosts').select('*')
  });
};
```

### ✅ Proper Hook Abstraction
```typescript
// CORRECT
const MyComponent = () => {
  const { data } = useCommunityPostsQuery();
};
```

### ❌ Duplicate Type Definitions
```typescript
// WRONG - in hook file
interface CommunityPost {
  id: number;
  title: string;
}

// WRONG - in component file  
interface CommunityPost {
  id: number;
  title: string;
  content: string; // Different from hook!
}
```

### ✅ Single Source of Truth
```typescript
// CORRECT - only in src/types/index.ts
export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  // All properties in one place
}
```

### ❌ Edge Function Anti-Patterns (NEW)

```typescript
// WRONG - Missing CORS preflight handling
Deno.serve(async (req) => {
  // Immediately tries to process request without OPTIONS check
  const body = await req.json();
});

// WRONG - Relying on gateway JWT verification with verify_jwt = true
// This causes CORS preflight failures for authenticated endpoints

// WRONG - Custom error responses instead of shared helpers
return new Response(JSON.stringify({ error: 'Custom error' }), { status: 400 });
```

### ✅ Correct Edge Function Pattern

```typescript
// CORRECT - Following the mandatory 7-step pattern
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    const user = await authenticateUser(supabase, req.headers.get('Authorization'));
    // ... rest of implementation following protocol
  } catch (error) {
    return createErrorResponse(error);
  }
});
```

## **Troubleshooting Guide**

### Type Import Errors
**Symptom**: "Cannot find name 'CommunityPost'"
**Solution**: Verify import path points to `@/types`

### TanStack Query Errors  
**Symptom**: "Property 'initialPageParam' is missing"
**Solution**: Add `initialPageParam: 0` to useInfiniteQuery config

### Icon Not Found Errors
**Symptom**: "Cannot find name 'Video'"
**Solution**: Add explicit import: `import { Video } from 'lucide-react';`

### Data Access Errors
**Symptom**: "Property 'posts' does not exist on type 'InfiniteData'"
**Solution**: Use `data.pages.flatMap(page => page.posts)` for infinite queries

### Strict TypeScript Migration Errors
**Symptom**: Various null/undefined errors after enabling strict mode
**Solution**: Add proper type guards and optional chaining systematically

### Edge Function Errors (NEW)
**Symptom**: "CORS preflight failure" or "Cannot read properties of null"
**Solution**: Ensure function handles OPTIONS requests first and has `verify_jwt = false` in config.toml

**Symptom**: "Authentication required" errors with inconsistent formatting
**Solution**: Use `authenticateUser` helper instead of manual JWT validation

**Symptom**: "Rate limit exceeded" without proper headers
**Solution**: Implement `checkRateLimit` and include `rateLimitHeaders` in responses

## **Version History**
- v2.1.0 (June 20, 2025): Added mandatory Edge Function implementation protocol to eliminate recurring errors
- v2.0.0 (June 20, 2025): Added strict TypeScript mandate and import path standardization
- v1.0.0 (June 19, 2025): Initial protocols established during Community stabilization
