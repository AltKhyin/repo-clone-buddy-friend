# Access Control Optimization Implementation Guide

## Problem Analysis

### Before Optimization:
- **Per-route API calls**: Every route change triggers `usePageAccessQuery()` → database query
- **No session caching**: Same user checking same routes = repeated identical queries
- **Excessive security logs**: Constant admin security checks firing
- **Poor performance**: Multiple API calls per navigation

### After Optimization:
- **Session-based caching**: Single batch API call fetches ALL access rules 
- **Memory lookups**: Fast local access checks using cached data
- **Aggressive caching**: 15-minute stale time, 30-minute garbage collection
- **Minimal API calls**: ~95% reduction in database queries

## Implementation Strategy

### 1. Session Cache Architecture

```typescript
// NEW: Session-based cache (packages/hooks/useSessionAccessCache.ts)
useSessionAccessCache() → Single API call fetches ALL rules
useQuickAccessCheck() → Fast memory lookup, no API calls

// OLD: Per-route queries (packages/hooks/usePageAccessQuery.ts) 
usePageAccessQuery() → API call PER ROUTE CHANGE ❌
```

### 2. Batch API Endpoint

```typescript
// NEW: batch-page-access-rules edge function
GET /batch-page-access-rules
→ Returns ALL active page access rules in single request
→ Frontend caches for 15+ minutes

// OLD: page-access-check edge function
GET /page-access-check?page_path=/admin
→ Individual API call per route ❌
```

### 3. Optimized Route Protection

```typescript
// NEW: OptimizedRouteProtection.tsx
- Uses useQuickAccessCheck() (memory lookup)
- Zero API calls for cached routes
- Same UX, dramatically faster

// OLD: UniversalRouteProtection.tsx  
- Uses usePageAccessControl() → usePageAccessQuery() → API call ❌
- Network request per route change
```

## Migration Steps

### Phase 1: Deploy New System (Parallel)
1. ✅ Deploy `batch-page-access-rules` edge function
2. ✅ Create `useSessionAccessCache.ts` hook
3. ✅ Create `OptimizedRouteProtection.tsx` component
4. Test new system alongside existing

### Phase 2: Replace Route Protection (Gradual)
```typescript
// In App.tsx or main router file:

// OLD:
import { UniversalRouteProtection } from '@/components/routes/UniversalRouteProtection';

// NEW:
import { OptimizedRouteProtection } from '@/components/routes/OptimizedRouteProtection';

// Replace component usage:
<OptimizedRouteProtection>
  <YourAppRoutes />
</OptimizedRouteProtection>
```

### Phase 3: Update Main Pages
Replace access control in homepage, acervo, comunidade, perfil:

```typescript
// OLD pattern:
const { hasAccess } = usePageAccessControl(pathname);

// NEW pattern:
const { hasAccess } = useQuickAccessCheck(pathname);
```

### Phase 4: Cleanup (After Testing)
- Remove old `usePageAccessQuery.ts` 
- Remove old `UniversalRouteProtection.tsx`
- Remove individual `page-access-check` edge function calls

## Performance Benefits

### API Call Reduction:
- **Before**: 4+ API calls per navigation (homepage → acervo → comunidade → perfil)
- **After**: 1 API call per 15-minute session

### Memory Usage:
- **Cache size**: ~1KB for typical access rules
- **Lookup speed**: O(n) array search vs O(network) API call
- **Battery/data**: 95% reduction in network requests

### User Experience:
- **Route changes**: Instant (memory lookup)
- **Initial load**: Same speed (single batch call)
- **Offline resilience**: Works with cached data

## Testing Strategy

### Performance Testing:
1. Monitor network tab during navigation
2. Measure route transition times
3. Check React Query devtools cache hits

### Functional Testing:
1. Verify all access levels work correctly
2. Test admin/premium/free user flows
3. Confirm redirects work as expected

### Load Testing:
1. Multiple users navigating simultaneously
2. Cache invalidation on auth changes
3. Edge function performance under load

## Rollback Plan

If issues occur, immediate rollback:
1. Change imports back to `UniversalRouteProtection`
2. Old system remains functional
3. No data loss or migration needed

## Monitoring

Track these metrics post-deployment:
- API calls to `batch-page-access-rules` vs old endpoints
- Route transition performance
- Cache hit ratio in React Query
- User experience feedback

## Expected Results

- **95% fewer database queries** for access control
- **Instant route transitions** (memory vs network)
- **Better battery life** on mobile devices
- **Reduced server load** on Supabase
- **Same security model** with better performance