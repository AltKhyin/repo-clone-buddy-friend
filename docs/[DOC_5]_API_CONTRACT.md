
# **[DOC_5] EVIDENS API Contract**

**Version:** 3.5  
**Date:** June 20, 2025

**Purpose:** This document defines the canonical contract for all server‑side business logic within the EVIDENS ecosystem. It specifies when to use Supabase's auto‑generated API and provides the definitive blueprint for all custom Supabase Edge Functions. The AI developer must adhere to this specification to ensure all backend interactions are secure, transactional, and predictable.

**CHANGELOG (v3.5):**
- **CRITICAL UPDATE**: Added Section 1.5 "Mandatory Edge Function Structure" to prevent recurring CORS and authentication errors
- Enhanced error prevention protocols for systematic Edge Function development
- Established canonical 7-step implementation pattern for all new functions

---

## **1.0 Core Principles & The Dual API Strategy**

**PRINCIPLE 1 (Default to Auto‑API):**  
For all simple Create, Read, Update, and Delete (CRUD) operations, the primary method of data interaction is through Supabase's auto‑generated REST API, secured by RLS policies in [DOC_4]_ROW_LEVEL_SECURITY.md. Custom Edge Functions **must not** be created for these tasks.

*Use Case: Fetching lists (e.g., reviews, user profiles), updating simple fields (e.g., biography).*  
*Implementation: Use the `supabase-js` client directly within the data‑fetching hooks defined in [DOC_6]_DATA_FETCHING_STRATEGY.md.*

**PRINCIPLE 2 (Edge Functions for Business Logic):**  
Use Edge Functions exclusively for operations that involve complex, multi‑step, or transactional business logic beyond a single CRUD action.

*Use Case: Casting a community vote (atomic updates across tables), creating content with side effects (auto‑upvote), publishing a review with auto‑generated discussion, processing analytics ETL.*

**PRINCIPLE 3 (Security First):**  
Every Edge Function must validate inputs, enforce authorization, and handle errors explicitly before executing core logic.

**PRINCIPLE 4 (Schema‑Driven Contract):**  
Input and output of every Edge Function **must** be defined by Zod schemas to guarantee type safety and predictable behavior.

**PRINCIPLE 5 (CORS Handling):**  
Every Edge Function MUST include a boilerplate block at the beginning of its code to handle the `OPTIONS` preflight request, returning the appropriate `Access-Control-Allow-*` headers. All successful responses from the function must also include the `Access-Control-Allow-Origin` header.

**PRINCIPLE 6 (Rate Limiting):**  
Every Edge Function MUST implement rate limiting using the centralized utility in `supabase/functions/_shared/rate-limit.ts`. Rate limits are configured per function and enforced per user.

---

## **1.5 The Mandatory Edge Function Structure (CRITICAL)**

**RULE 7 (Mandatory Structure):** All new Edge Functions must adhere to the following 7-step internal structure to ensure consistency, security, and proper CORS handling. This pattern eliminates the recurring CORS preflight errors and authentication failures.

### **The 7-Step Implementation Pattern:**

```typescript
// STEP 1: CORS Preflight Handling (MANDATORY FIRST)
if (req.method === 'OPTIONS') {
  return handleCorsPreflightRequest();
}

try {
  // STEP 2: Manual Authentication (requires verify_jwt = false in config.toml)
  const supabase = createClient(/* ... */);
  const user = await authenticateUser(supabase, req.headers.get('Authorization'));

  // STEP 3: Rate Limiting Implementation
  const rateLimitResult = await checkRateLimit(supabase, 'function-name', user.id);
  if (!rateLimitResult.allowed) throw RateLimitError;

  // STEP 4: Input Parsing & Validation
  const body = await req.json();
  validateRequiredFields(body, ['required', 'fields']);

  // STEP 5: Core Business Logic Execution
  // [Function-specific implementation]

  // STEP 6: Standardized Success Response
  return createSuccessResponse(result, rateLimitHeaders(rateLimitResult));

} catch (error) {
  // STEP 7: Centralized Error Handling
  return createErrorResponse(error);
}
```

### **Critical Configuration Requirements:**

1. **Function Code**: Must use shared helpers from `supabase/functions/_shared/api-helpers.ts`
2. **Gateway Config**: Must set `verify_jwt = false` in `supabase/config.toml` for the specific function
3. **Rate Limiting**: Must implement using `checkRateLimit` from shared utilities

### **Why This Pattern Prevents Errors:**

- **CORS Issues**: Step 1 immediately handles OPTIONS requests with proper headers
- **Auth Failures**: Manual authentication allows proper error handling and response formatting
- **Rate Limit Errors**: Consistent implementation prevents service abuse
- **Response Inconsistency**: Shared helpers ensure uniform API responses

**VIOLATION CONSEQUENCES**: Functions that do not follow this exact pattern will experience the recurring error cycle of CORS failures, authentication issues, and inconsistent responses.

---

## **2.0 Rate Limiting Architecture**

**IMPLEMENTATION STATUS:** Comprehensive rate limiting infrastructure has been implemented and is ready for deployment. The following rate limits are configured:

| Function | Rate Limit | Window | Purpose |
|----------|------------|--------|---------|
| `get-homepage-feed` | 60 requests | 60 seconds | Prevent homepage abuse |
| `get-acervo-data` | 30 requests | 60 seconds | Protect search/filter endpoints |
| `submit-suggestion` | 5 requests | 300 seconds | Prevent suggestion spam |
| `cast-suggestion-vote` | 10 requests | 60 seconds | Limit voting frequency |
| `cast-vote` | 20 requests | 60 seconds | Community voting protection |
| `get-personalized-recommendations` | 10 requests | 60 seconds | Expensive computation protection |
| `save-post` | 30 requests | 60 seconds | Prevent save/unsave spam |
| `get-saved-posts` | 20 requests | 60 seconds | Limit saved posts retrieval |

**Rate Limiting Implementation:**

All Edge Functions must use the centralized rate limiting utility:

```typescript
import { checkRateLimit, rateLimitHeaders } from '../_shared/rate-limit.ts';

// In each Edge Function:
const rateLimitResult = await checkRateLimit(supabase, 'function-name', userId);
if (!rateLimitResult.allowed) {
  return new Response(JSON.stringify({
    error: { message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      ...rateLimitHeaders(rateLimitResult)
    }
  });
}
```

**Database Table:** The `rate_limit_log` table tracks API usage with automatic cleanup of entries older than 1 hour.

---

## **3.0 Standardized Error Response**

All Edge Functions must return errors in the following JSON format:

```json
{
  "error": {
    "message": "A human‑readable error message.",
    "code": "ERROR_CODE_ENUM" // e.g., "VALIDATION_FAILED", "UNAUTHORIZED", "RATE_LIMIT_EXCEEDED"
  }
}
```

This enables uniform error handling on the frontend.

---

## **4.0 Edge Function Specifications**

### **4.1 Function: `upsert-review`**

* **Trigger:** `POST /functions/v1/upsert-review`
* **Purpose:** Create or update a Review, validating the `structured_content` v2.0 payload.
* **Auth:** Required (`admin` role).
* **Rate Limit:** Not applicable (admin-only function)

**Request Body Schema (Zod):**

```typescript
import { z } from 'zod';

const Position   = z.object({ x: z.number(), y: z.number() });
const Size       = z.object({ width: z.number(), height: z.number() });
const LayoutItem = z.object({ nodeId: z.string(), position: Position, size: Size });
const Node       = z.object({ id: z.string(), type: z.string(), data: z.record(z.any()) });
const ContentV2  = z.object({
  version: z.literal("2.0"),
  nodes:   z.array(Node),
  layouts: z.object({
    desktop: z.array(LayoutItem),
    mobile:  z.array(LayoutItem),
  }),
  canvasState: z.any(),
});

const UpsertReview = z.object({
  reviewId:               z.number().int().optional().nullable(),
  source_article_title:   z.string().min(1),
  source_article_citation:z.string().min(1),
  cover_image_url:        z.string().url().optional().nullable(),
  access_level:           z.enum(['public','free_users_only','paying_users_only']),
  status:                 z.enum(['draft','published']),
  structured_content:     ContentV2,
});
```

**Business Logic:**

1. Handle CORS preflight request.
2. Validate JWT contains `admin` role; else 403.
3. Validate body against `UpsertReview`; else 400.
4. If `reviewId` exists, verify edit permission; else 403.
5. Upsert into `Reviews` table via `supabase-js`.

**Success Response:** `200 OK` (update) or `201 Created` (create)

```json
{
  "review_id": 457,
  "source_article_title": "..."
  /* full review object */
}
```

---

### **4.2 Function: `create-community-post`**

* **Trigger:** `POST /functions/v1/create-community-post`
* **Purpose:** Create a community post/comment, auto‑upvote, update `contribution_score`, optionally create a poll.
* **Auth:** Required (authenticated).
* **Rate Limit:** 5 requests per 5 minutes per user

**Request Body Schema (Zod):**

```typescript
import { z } from 'zod';

const CreatePost = z.object({
  review_id:      z.number().int().optional().nullable(),
  parent_post_id: z.number().int().optional().nullable(),
  title:          z.string().min(1).optional().nullable(),
  content:        z.string().min(1),
  category:       z.string().min(1),
  poll: z.object({
    question: z.string().min(1),
    options:  z.array(z.string().min(1)).min(2),
  }).optional(),
});
```

**Business Logic (Transactional RPC):**

1. Handle CORS preflight request.
2. Check rate limit; return 429 if exceeded.
3. Extract `practitioner_id` from JWT.
4. Validate input; else 400.
5. RPC transaction:  
    a. INSERT into `CommunityPosts` with `upvotes = 1`.  
    b. INSERT into `CommunityPost_Votes` for auto‑upvote.  
    c. UPDATE `Practitioners.contribution_score` +1.  
    d. If `poll`, INSERT into `Polls` & `Poll_Options`.

**Success Response:** `201 Created`

```json
{ "post_id": 123 /* full post object */ }
```

---

### **4.3 Function: `cast-post-vote`**

* **Trigger:** `POST /functions/v1/cast-post-vote`
* **Purpose:** Cast, change, or retract a vote; update post counters and contributor score.
* **Auth:** Required (authenticated).
* **Rate Limit:** 20 requests per minute per user

**Request Body Schema (Zod):**

```typescript
import { z } from 'zod';

const CastVote = z.object({
  post_id:   z.number().int(),
  vote_type: z.enum(['up','down','none']),
});
```

**Business Logic (Transactional RPC):**

1. Handle CORS preflight request.
2. Check rate limit; return 429 if exceeded.
3. Validate input; else 400.
4. RPC transaction:  
    a. UPSERT/DELETE in `CommunityPost_Votes`.  
    b. UPDATE `CommunityPosts.upvotes / downvotes`.  
    c. UPDATE author's `contribution_score` by delta.

**Success Response:** `200 OK`

```json
{ "post_id": 123, "new_upvotes": 5, "new_downvotes": 1 }
```

---

### **4.4 Function: `publish-review`**

* **Trigger:** `POST /functions/v1/publish-review`
* **Purpose:** Mark Review as `published` and auto‑create discussion post.
* **Auth:** Required (`admin` role).
* **Rate Limit:** Not applicable (admin-only function)

**Request Body Schema (Zod):**

```typescript
import { z } from 'zod';

const PublishReview = z.object({ review_id: z.number().int() });
```

**Business Logic (Transactional):**

1. Handle CORS preflight request.
2. Verify `admin` role; else 403.
3. Validate input; else 400.
4. Transaction:  
    a. UPDATE `Reviews.status` to `published`.  
    b. FETCH `Review.title`.  
    c. INSERT into `CommunityPosts` with title `Discussão: [Review Title]`.

**Success Response:** `200 OK`

```json
{
  "message": "Review published and discussion created successfully.",
  "review_id": 456,
  "community_post_id": 789
}
```

---

### **4.5 Cron Function: `run-analytics-etl`**

* **Trigger:** Scheduled (e.g., hourly) via Supabase Cron.
* **Purpose:** Process `Analytics_Events` into `Summary_*` tables.
* **Auth:** Runs with `service_role`.
* **Rate Limit:** Not applicable (internal cron function)

**Business Logic:**

1. Handle CORS preflight request.
2. Determine last‑processed timestamp.
3. SELECT new events since then.
4. Aggregate counts (DAU, page views).
5. UPSERT into `Summary_*` tables.
6. Record new last‑processed timestamp.

---

### **4.6 Function: `save-post`**

* **Trigger:** `POST /functions/v1/save-post`
* **Purpose:** Save or unsave a community post for the authenticated user.
* **Auth:** Required (authenticated).
* **Rate Limit:** 30 requests per minute per user

**Request Body Schema (Zod):**

```typescript
import { z } from 'zod';

const SavePost = z.object({
  post_id: z.number().int().positive(),
  is_saved: z.boolean().optional(), // If not provided, toggles current status
});
```

**Business Logic:**

1. Handle CORS preflight request.
2. Check rate limit; return 429 if exceeded.
3. Extract `practitioner_id` from JWT.
4. Validate input; else 400.
5. Check if post exists and is accessible.
6. Determine current save status if `is_saved` not provided.
7. Insert/delete from `SavedPosts` table based on desired action.

**Success Response:** `200 OK`

```json
{
  "success": true,
  "is_saved": true,
  "message": "Post saved successfully"
}
```

---

### **4.7 Function: `get-saved-posts`**

* **Trigger:** `GET /functions/v1/get-saved-posts?page=0&limit=20`
* **Purpose:** Retrieve authenticated user's saved posts with pagination.
* **Auth:** Required (authenticated).
* **Rate Limit:** 20 requests per minute per user

**Query Parameters:**

- `page` (optional): Page number, 0-based (default: 0)
- `limit` (optional): Posts per page, max 50 (default: 20)

**Business Logic:**

1. Handle CORS preflight request.
2. Check rate limit; return 429 if exceeded.
3. Extract `practitioner_id` from JWT.
4. Parse and validate query parameters.
5. Fetch saved posts with full post data and author info.
6. Return paginated results with metadata.

**Success Response:** `200 OK`

```json
{
  "posts": [
    {
      "id": 123,
      "title": "Post title",
      "content": "Post content",
      "author": {
        "id": "uuid",
        "full_name": "Author Name",
        "avatar_url": "url"
      },
      "is_saved": true,
      // ... other post fields
    }
  ],
  "pagination": {
    "page": 0,
    "limit": 20,
    "total_count": 45,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

---

### **4.8 Function: `get-community-post-detail`**

* **Trigger:** `POST /functions/v1/get-community-post-detail`
* **Purpose:** Retrieve individual community post with full details, user vote status, and save status.
* **Auth:** Optional (authenticated users get personalized data).
* **Rate Limit:** 60 requests per minute per user/IP

**Request Body Schema (Zod):**

```typescript
import { z } from 'zod';

const GetPostDetail = z.object({
  post_id: z.number().int().positive(),
});
```

**Business Logic:**

1. Handle CORS preflight request.
2. Check rate limit; return 429 if exceeded.
3. Extract `practitioner_id` from JWT if available.
4. Validate input; else 400.
5. Fetch complete post data from `CommunityPosts` with author info.
6. If authenticated, fetch user's vote and save status for the post.
7. Fetch reply count for the post.
8. Return comprehensive post data.

**Success Response:** `200 OK`

```json
{
  "id": 123,
  "title": "Post title",
  "content": "Full post content",
  "category": "general",
  "upvotes": 15,
  "downvotes": 2,
  "reply_count": 8,
  "created_at": "2025-06-19T10:00:00Z",
  "is_pinned": false,
  "is_locked": false,
  "flair_text": "Discussion",
  "flair_color": "#3b82f6",
  "image_url": "https://example.com/image.jpg",
  "video_url": null,
  "poll_data": null,
  "post_type": "text",
  "author": {
    "id": "uuid",
    "full_name": "Author Name",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "user_vote": "up",
  "is_saved": true,
  "user_can_moderate": false
}
```

---

*End of [DOC_5] EVIDENS API Contract*
