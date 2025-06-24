
# **[DOC_6] Data-Fetching Strategy**

Version: 2.0 (Decoupled Architecture Update)  
Date: June 20, 2025  
Purpose: This document defines the canonical, non-negotiable strategy for all data fetching and server state management within the EVIDENS front-end applications. Updated to reflect the decoupled architecture with granular, component-scoped data fetching patterns.

## **1.0 Core Principles**

* **PRINCIPLE 1 (Granular & Co-located Data Fetching):** Each component should fetch only the data it needs, when it needs it. Data fetching should be co-located with the component that uses the data.
* **PRINCIPLE 2 (No Global Data Dependencies):** Components must not depend on global data providers except for truly global state (authentication). Each component is self-contained.
* **PRINCIPLE 3 (Separation of Concerns):** UI components are responsible for presentation only. They must be completely decoupled from the logic of how data is fetched. All data-fetching logic must reside in a dedicated data access layer (custom hooks).
* **PRINCIPLE 4 (Server State vs. Client State):** A clear distinction must be maintained:  
  * **Server State:** Any data that persists on the backend (in our PostgreSQL database). This is asynchronous data. **It MUST be managed by TanStack Query.**  
  * **Client State:** Ephemeral state that lives only in the UI (e.g., the current state of a form input, whether a modal is open). **It SHOULD be managed by simple React hooks (useState, useReducer) or a lightweight client state manager like Zustand.**

## **2.0 The Mandatory Technology Stack**

* **RULE 1 (Server State Management):** **TanStack Query (v5) (@tanstack/react-query)** is the mandatory and sole library for managing all server state.  
* **RULE 2 (Data Fetching):** The **supabase-js** client library is the mandatory tool for making requests to the Supabase backend.

## **3.0 The Golden Rule: The Data-Fetching Mandate**

**RULE 3 (The Golden Rule): UI components MUST NOT call the supabase-js client directly.** All data access must be mediated through a dedicated custom hook that uses TanStack Query.

This is the most critical rule in this document. Adherence is not optional.

## **4.0 Architectural Patterns**

### **4.1 The Principle of Granular & Co-located Data Fetching**

**NEW PHILOSOPHY:** Our primary strategy is to create small, focused TanStack Query hooks for each distinct piece of data. Each component fetches only what it needs, where it needs it.

**Examples of Good, Granular Hooks:**
- `useUserProfileQuery()` - Fetches only user profile data
- `useNotificationCountQuery()` - Fetches only unread notification count
- `useSavePostMutation()` - Handles only post saving/unsaving

**The Exception - Consolidated Queries:**
The `useConsolidatedHomepageFeedQuery` is a specific optimization only for the homepage, where multiple modules need to be populated simultaneously. **It is the exception, not the rule.**

### **4.2 Data Fetching for Shell Components**

Shell components (those that are part of the AppShell and persist across page navigation) must be self-contained and must not rely on page-level data providers.

**Required Pattern:**
1. Create a dedicated, minimal TanStack Query hook (e.g., `useNotificationCountQuery`)
2. The shell component itself calls this hook directly
3. The shell component manages its own `isLoading` and `isError` states, typically by rendering a Skeleton component
4. The hook has a single, clear responsibility

**Example Implementation:**

```typescript
// Hook: /packages/hooks/useUserProfileQuery.ts
export const useUserProfileQuery = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Practitioners')
        .select('id, full_name, avatar_url, role, subscription_tier')
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Component: UserProfileBlock.tsx
const UserProfileBlock = () => {
  const { data: userProfile, isLoading, isError } = useUserProfileQuery();
  
  if (isLoading) return <Skeleton className="h-12 w-full" />;
  if (isError) return <div>Error loading profile</div>;
  
  return <div>{userProfile.full_name}</div>;
};
```

**Benefits:**
- Shell remains stable and performant regardless of page content
- Independent loading states prevent shell from disappearing
- Each shell component can be developed and tested in isolation

## **5.0 The Mandatory Implementation Patterns**

### **5.1 Pattern for Reading Data (useQuery)**

This pattern is used for all SELECT operations.

* **Step 1:** Create a custom hook encapsulating the query logic. The hook's name must be prefixed with use and suffixed with Query (e.g., useReviewsQuery).  
* **Step 2:** Inside the hook, use useQuery from TanStack Query.  
* **Step 3:** The actual supabase-js call is made *only* inside the queryFn passed to useQuery.

**Reference Implementation:**

```typescript
// FILE: /packages/hooks/useReviewQuery.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';

/**
 * Fetches a single review by its ID.
 * This function contains the actual data-fetching logic. It is not exported.
 * @param reviewId The ID of the review to fetch.
 */
const fetchReviewById = async (reviewId: number) => {
  // RULE: The Supabase query is isolated here.
  const { data, error } = await supabase
    .from('Reviews')
    .select('*') // Select all columns for the review
    .eq('review_id', reviewId)
    .single(); // Expect only one result

  // RULE: Always handle potential errors and throw them.
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Custom hook for fetching a single EVIDENS Review.
 * UI components will use this hook to get review data.
 * It handles caching, re-fetching, and other server state logic via TanStack Query.
 * @param reviewId The ID of the review to fetch.
 */
export const useReviewQuery = (reviewId: number) => {
  return useQuery({
    // queryKey is an array that uniquely identifies this query in the cache.
    // It includes the resource name and its unique identifier.
    queryKey: ['reviews', reviewId],
    // queryFn is the function that will be called to fetch the data.
    queryFn: () => fetchReviewById(reviewId),
    // enabled: false prevents the query from running automatically if reviewId is not yet available.
    enabled: !!reviewId,
  });
};
```

### **5.2 Pattern for Creating/Updating/Deleting Data (useMutation)**

This pattern is used for all INSERT, UPDATE, and DELETE operations, or for calls to Edge Functions.

* **Step 1:** Use the useMutation hook from TanStack Query.  
* **Step 2:** On success, **invalidate** the relevant cached queries to ensure the UI automatically re-fetches fresh data.

**Reference Implementation:**

```typescript
// FILE: /packages/hooks/useCreatePostMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../src/integrations/supabase/client';
import { type CreatePostPayload } from '@/types';

/**
 * The mutation function that calls our custom Supabase Edge Function.
 * @param postPayload The data needed to create the post.
 */
const createPost = async (postPayload: CreatePostPayload) => {
  // RULE: Calls to Edge Functions are also managed by TanStack Query.
  const { data, error } = await supabase.functions.invoke('create-community-post', {
    body: postPayload,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Custom hook for creating a new community post.
 * UI components will use this to trigger the post creation action.
 */
export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    // RULE: On success, invalidate queries that are now stale.
    onSuccess: (data) => {
      // This tells TanStack Query to re-fetch the main community feed
      // because new content has been added.
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
        
      // We can also intelligently update the cache without a refetch
      // using the returned data if desired.
    },
    onError: (error) => {
      // Handle and log the error, e.g., show a toast notification.
      console.error('Failed to create post:', error);
    },
  });
};
```

### **5.3 Pattern for Paginated/Infinite Data (useInfiniteQuery)**

This pattern is mandatory for feeds like the /community page to avoid loading all data at once.

* **Implementation:** Use the useInfiniteQuery hook. The queryFn will receive a pageParam which will be used with Supabase's .range() method or Edge Functions to fetch data in pages.

```typescript
export const useCommunityPostsQuery = () => {
  return useInfiniteQuery({
    queryKey: ['communityPosts'],
    queryFn: ({ pageParam = 0 }) => fetchCommunityPosts(pageParam),
    initialPageParam: 0, // Required for TanStack Query v5
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      return lastPage.hasMore ? lastPageParam + 1 : undefined;
    },
  });
};
```

## **6.0 Anti-Patterns to Avoid**

### **6.1 DEPRECATED: Global Data Providers**

**❌ DO NOT CREATE:** Application-wide data providers that fetch large amounts of data upfront.

```typescript
// WRONG - Don't do this
const AppDataProvider = ({ children }) => {
  const consolidatedData = useConsolidatedAppDataQuery(); // Fetches everything
  return (
    <AppDataContext.Provider value={consolidatedData}>
      {children}
    </AppDataContext.Provider>
  );
};
```

**✅ CORRECT:** Component-specific data fetching

```typescript
// RIGHT - Each component fetches its own data
const UserProfileBlock = () => {
  const { data } = useUserProfileQuery(); // Only fetches profile data
  // ... render logic
};
```

### **6.2 DEPRECATED: Consolidated Queries for Multiple Pages**

**❌ DO NOT CREATE:** Large, consolidated hooks for data used across multiple pages.

**✅ EXCEPTION:** The `useConsolidatedHomepageFeedQuery` is acceptable only because it serves a single page (Homepage) with multiple modules that need to render simultaneously.

## **7.0 Final Checklist for AI Developer**

**RULE:** Before committing code that involves data fetching, verify the following:

* [ ] Is all server state managed by **TanStack Query**?  
* [ ] Does the code avoid calling supabase-js directly from within a UI component?  
* [ ] Is data-fetching logic properly encapsulated within a custom use...Query or use...Mutation hook?  
* [ ] Do mutations correctly invalidate relevant queries in their onSuccess callback to keep the UI synchronized?  
* [ ] Are infinite feeds implemented using useInfiniteQuery?
* [ ] Is each hook focused on a single, clear responsibility?
* [ ] Do shell components fetch their own data independently?
* [ ] Are loading and error states handled at the component level?

## **8.0 Migration Notes**

**From Legacy Pattern:** Components that previously relied on global AppDataContext should be refactored to use their own specific query hooks.

**Backwards Compatibility:** The `useConsolidatedHomepageFeedQuery` remains valid for the Homepage component only. All other pages should use granular, page-specific hooks.

**Performance Benefits:** The new pattern eliminates over-fetching, reduces initial load times, and provides better user experience with independent loading states.
