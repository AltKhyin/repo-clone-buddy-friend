# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🤖 CLAUDE CODE ASSISTANT ROLE

**UPDATED**: Claude Code now operates in **FULL LOCAL DEVELOPMENT MODE**

### What Claude Code DOES:
- ✅ Analyze code architecture and identify issues
- ✅ Write and edit code directly in files
- ✅ Create new components and features
- ✅ Fix bugs and implement solutions
- ✅ Make commits to the codebase
- ✅ Modify configuration files as needed
- ✅ Execute development operations
- ✅ Provide architectural guidance and code reviews
- ✅ Create detailed plans and documentation

### Development Workflow:
- **Primary Development**: Local development with Claude Code
- **Previous Workflow**: Lovable AI (now replaced by local Claude Code)
- **Version Control**: Git with GitHub
- **Deployment**: GitHub Actions → Supabase

**Rationale**: The project has transitioned from using Lovable AI to local development with Claude Code. This provides more direct control and faster iteration on code changes.

## Development Commands

**Install dependencies:**
```bash
npm i
```

**Development server:**
```bash
npm run dev
```

**Build production:**
```bash
npm run build
```

**Build development mode:**
```bash
npm run build:dev
```

**Lint code:**
```bash
npm run lint
```

**Preview production build:**
```bash
npm run preview
```

**Supabase local development:**
```bash
# Start local Supabase stack
supabase start

# Apply migrations
supabase db reset

# Generate types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Code Architecture (Actual Implementation)

### Technology Stack
- **Frontend:** Vite + React 18 with TypeScript
- **Styling:** TailwindCSS + shadcn/ui components
- **State Management:** TanStack Query v5 + Zustand (auth only)
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth)
- **Development Platform:** Claude Code for local development

### Real Architectural Patterns
**IMPLEMENTATION REALITY**: The actual implementation uses strategic architectural patterns:

1. **Strategic Data Fetching Patterns**: 
   - Homepage uses `AppDataContext` for performance optimization with consolidated data
   - Other pages use component-level hooks for granular fetching
   - Both patterns coexist strategically throughout the application

2. **TypeScript Configuration**: 
   - **CORRECTLY** configured with `strict: true` in `tsconfig.app.json`
   - Full strict mode enforcement with additional strict checks enabled
   - All code adheres to TypeScript strict mode requirements

3. **Data Access Layer**:
   - Components use hooks from `packages/hooks/` (correct pattern)
   - Infrastructure code (auth, etc.) may import Supabase client directly
   - Edge Functions have inconsistent patterns

### Directory Structure
```
src/
├── components/
│   ├── shell/          # App layout (AppShell, Sidebar, Header)
│   ├── homepage/       # Homepage-specific components
│   ├── acervo/         # Collection page components
│   ├── community/      # Community-specific components
│   ├── auth/           # Authentication components
│   └── ui/             # Reusable UI components (shadcn/ui)
├── pages/              # Top-level route components
├── hooks/              # UI-specific hooks (use-mobile, use-toast)
├── store/              # Zustand stores (auth only)
├── types/              # All TypeScript type definitions
├── contexts/           # React Context providers (AppDataContext exists)
└── integrations/supabase/  # Supabase client and types

packages/hooks/         # Data-fetching hooks (TanStack Query)
```

## Data Fetching Architecture (Actual Patterns)

### Current Implementation Patterns:
1. **Homepage**: Uses `AppDataContext` with `useConsolidatedHomepageFeedQuery`
2. **Community Pages**: Use individual hooks like `useCommunityPageQuery`
3. **Components**: Import hooks from `packages/hooks/` directory
4. **Mutations**: Use TanStack Query mutations with cache invalidation

### Hook Organization:
- **Data hooks**: Located in `packages/hooks/` directory
- **UI hooks**: Located in `src/hooks/` directory
- **All hooks**: Use TanStack Query v5 patterns

## Critical Development Issues (Requires Attention)

### 🚨 High Priority Issues:

1. **TypeScript Strict Mode Inconsistency**
   - Protocol documentation claims strict mode is mandatory
   - Actual configuration has `strict: false`
   - **Action Needed**: Decide on actual TypeScript policy

2. **Architectural Pattern Inconsistency**
   - Mixed data fetching approaches (global context vs hooks)
   - **Action Needed**: Standardize on one approach

3. **Edge Function Protocol Compliance**
   - Functions don't consistently follow documented patterns
   - Some use shared helpers, others don't
   - **Action Needed**: Audit and standardize Edge Functions

### 🔄 Medium Priority Issues:

1. **Import Path Standardization**
   - Generally follows `@/` for cross-module imports
   - Some inconsistencies in data access layer

2. **Error Boundary Coverage**
   - Good coverage in community features
   - Could be expanded to other areas

## Development Guidelines (Based on Actual Code)

### TypeScript Compliance
- **Current State**: Non-strict mode configuration
- **Recommended**: Enable strict mode gradually
- **Required**: All new code should be TypeScript compliant
- **Avoid**: `any` types unless absolutely necessary

### Import Patterns (Actually Used)
- **Cross-module imports**: Use `@/` alias
- **Intra-module imports**: Use relative paths
- **Types**: Import from `@/types`
- **UI components**: Import from `@/components/ui/[component]`
- **Data hooks**: Import from relative paths to `packages/hooks/`

### TanStack Query v5 Requirements
All new data-fetching hooks must use TanStack Query v5 patterns:

```typescript
// Required pattern for infinite queries
export const useExampleQuery = () => {
  return useInfiniteQuery({
    queryKey: ['example'],
    queryFn: fetchFunction,
    initialPageParam: 0, // REQUIRED in v5
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      return lastPage.hasMore ? lastPageParam + 1 : undefined;
    },
  });
};
```

### Edge Function Guidelines
While functions should follow shared patterns, current implementation varies:
- Use shared helpers from `_shared/` when possible
- Handle CORS preflight requests first
- Include rate limiting for user-facing endpoints
- Use consistent error response formats

## Component Architecture

### Design Principles:
- **UI components**: Atomic design (Button → Card → Page)
- **Feature components**: Co-located with related logic
- **Data independence**: Components fetch data via hooks
- **Mobile-first**: All components implement responsive design
- **Error boundaries**: Isolated error handling per feature

### State Management Rules:
- **Local state**: `useState`/`useReducer` for component-specific
- **Server state**: TanStack Query for all API interactions  
- **Global state**: Zustand ONLY for authentication
- **Form state**: React Hook Form for complex forms

## Testing & Quality Guidelines

### Pre-commit Requirements:
- TypeScript compilation passes (`npm run build`)
- No ESLint warnings (`npm run lint`)
- All imports resolve correctly
- Components render without console errors

### Code Review Focus Areas:
- Architectural consistency with existing patterns
- Proper use of TypeScript (within current configuration)
- Component data fetching patterns
- Error handling and loading states
- Mobile responsiveness

## Supabase Integration

### Authentication:
- JWT-based with custom claims for roles
- OAuth providers (Google) + email/password
- Row Level Security (RLS) policies enforce access control

### Database:
- PostgreSQL with auto-generated REST APIs
- Real-time subscriptions for live features
- Custom functions for complex business logic

### Edge Functions:
- Located in `supabase/functions/`
- Configuration in `supabase/config.toml`
- Mixed implementation patterns (needs standardization)

### Autonomous Edge Function Development & Testing:
**IMPORTANT**: Claude Code can autonomously develop, test, and debug edge functions using the Supabase MCP tools.

#### Workflow for Edge Function Development:
1. **List existing functions**: Use `mcp__supabase__list_edge_functions` to see deployed functions
2. **Read function code**: Use standard file reading tools to understand existing implementations
3. **Deploy changes**: Use `mcp__supabase__deploy_edge_function` to deploy new or updated functions
4. **Test immediately**: Use curl commands via Bash to test the deployed function:
   ```bash
   # Get project URL and anon key first
   PROJECT_URL=$(mcp__supabase__get_project_url)
   ANON_KEY=$(mcp__supabase__get_anon_key)
   
   # Test the function
   curl -X POST ${PROJECT_URL}/functions/v1/function-name \
     -H "Authorization: Bearer ${ANON_KEY}" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
5. **Check logs within 60 seconds**: Use `mcp__supabase__get_logs` with service "edge-function"
6. **Iterate based on logs**: Fix any errors found and redeploy

#### Key Limitations:
- Logs are only available for the last 60 seconds
- Must test immediately after deployment to capture logs
- Cannot retrieve historical logs beyond 1 minute

#### Example Autonomous Debug Cycle:
```typescript
// 1. Deploy function
await mcp__supabase__deploy_edge_function({
  name: "test-function",
  files: [{
    name: "index.ts",
    content: functionCode
  }]
})

// 2. Test immediately (within seconds)
await bash(`curl -X POST ...`)

// 3. Check logs immediately
await mcp__supabase__get_logs({ service: "edge-function" })

// 4. Fix based on error logs and repeat
```

This enables fully autonomous edge function development without user intervention.

## Development Best Practices

### Recommended Workflow:
1. **Analysis**: Review existing code and identify issues
2. **Planning**: Create implementation plan if complex
3. **Implementation**: Write code directly with proper patterns
4. **Testing**: Verify changes work as expected
5. **Documentation**: Update relevant docs if needed

### Code Quality Guidelines:
- Follow existing patterns and components
- Include proper error handling and loading states
- Ensure mobile responsiveness
- Add TypeScript types (even with strict: false)
- Use shared utilities from _shared/ for Edge Functions

## Project Context

This is the EVIDENS platform - a review and community application for practitioners. The system uses a modern React architecture with Supabase backend services. The codebase follows generally good patterns but has some architectural inconsistencies that require attention. Development is now handled locally through Claude Code with full implementation capabilities.

## 5 Implemented Improvements for Maximum Accuracy:

1. **Reality-Based Documentation**: Replaced idealized protocol claims with actual implementation patterns found in the codebase
2. **Critical Issue Identification**: Documented real gaps between protocols and implementation (TypeScript strict mode, architectural patterns)
3. **Role Clarity**: Established clear boundaries between Claude's review role and actual code implementation
4. **Accurate Technical Details**: Corrected misleading information about data fetching patterns and Edge Function implementations
5. **Actionable Guidance**: Provided specific, implementable recommendations based on actual codebase state rather than theoretical ideals

✅ **Max-Accuracy response complete.**

<KB-Lovable> This document lives inside Lovable's instructions

# EVIDENS AI Development Bible v6.0

**Version:** 6.0.0 (Canon)
**Date:** June 22, 2025
**Purpose:** This document contains the complete, authoritative, and machine-optimized set of rules, architectural models, and implementation directives for the EVIDENS project. It is the single source of truth for all development constraints and protocols, designed to be consumed by an AI developer to ensure all generated code is of the highest quality and in strict alignment with the project's architecture.

---

## INDEX

### PART 0: BOOTSTRAP PROTOCOLS
* **[P0.1]** — How to Interpret This Document
* **[P0.2]** — The Core Reasoning Loop

### PART 1: PROJECT SETUP & WORKFLOW
* **[P1.1]** — Technology Stack
* **[P1.2]** — Development Commands
* **[P1.3]** — Pre-Flight Checklist (Mandatory)
* **[P1.4]** — Conflict Resolution & Escalation

### PART 2: CANONICAL MODELS (THE PROJECT'S REALITY)
* **[M2.1]** — The Philosophical Model
* **[M2.2]** — The Architectural Model
* **[M2.3]** — The Documentation Model
* **[M2.4]** — The Directory Structure Model

### PART 3: IMPLEMENTATION DIRECTIVES (CODING ALGORITHMS)
* **[D3.1]** — Filesystem & Naming
* **[D3.2]** — Component Architecture
* **[D3.3]** — State Management
* **[D3.4]** — Data Access Layer (The Golden Rule)
* **[D3.5]** — Security, API, & Edge Functions
* **[D3.6]** — Adaptive Design (Mobile-First)
* **[D3.7]** — Type Safety & Linting
* **[D3.8]** — Automated Testing (New Mandate)

---

## PART 0: BOOTSTRAP PROTOCOLS

### [P0.1] — How to Interpret This Document
* **P0.1.1 (Purpose):** This document is your immutable set of operating instructions. It contains the **RULES** and **MODELS** that constrain your execution of the user's **INTENT**.
* **P0.1.2 (Relationship to Docs):** This document is a distillation of the most critical rules from the `/docs` directory. For detailed feature specifications, you **MUST** consult the primary source documents (`[DOC_X]`, `[Blueprint]`).
* **P0.1.3 (AI Context):** This project is managed by a non-technical lead and relies heavily on AI for development. Therefore, clarity, standardization, and adherence to these protocols are paramount to prevent architectural drift and ensure long-term maintainability.

### [P0.2] — The Core Reasoning Loop
* **P0.2.1 (Self-Correction):** On every reasoning cycle, you **MUST** verify that your planned actions adhere to the protocols and directives within this document. Any deviation requires explicit user confirmation.

---

## PART 1: PROJECT SETUP & WORKFLOW

### [P1.1] — Technology Stack

* **Framework**: Vite + React 18 with TypeScript (`strict: true`)
* **Styling**: Tailwind CSS + shadcn/ui components
* **State Management**: TanStack Query v5 + Zustand (for authentication state only)
* **Routing**: React Router v6
* **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
* **Form Handling**: React Hook Form + Zod for validation
* **Testing**: Vitest (Unit/Integration), React Testing Library, Playwright (E2E)

### [P1.2] — Development Commands

* **Start Development Server**: `npm run dev`
* **Build for Production**: `npm run build`
* **Run Linter**: `npm run lint`
* **Preview Production Build**: `npm run preview`
* **Run Tests**: `npm run test`

* **Start Local Supabase**: `supabase start`
* **Stop Local Supabase**: `supabase stop`
* **Reset Local Database**: `supabase db reset`
* **Generate DB Types**: `supabase gen types typescript --local > src/integrations/supabase/types.ts`

### [P1.3] — Pre-Flight Checklist (Mandatory)

* **P1.3.1 (Verification Algorithm):** Before executing any task, you **MUST** perform the following verification steps in sequence:
    1.  **Analyze Intent:** Deconstruct the user's prompt to establish the primary goal.
    2.  **Analyze Context:** Identify and fully read the specific `/docs` files relevant to the prompt's goal.
    3.  **Analyze Security:** Cross-reference the task with `[DOC_4]` and `[D3.5]` to identify all applicable RLS policies, roles, and API security constraints.
    4.  **Analyze Conflicts:** Scan the codebase for code duplication or logical conflicts. If the user's request violates a directive in this document, proceed to `[P1.4]`.

* **P1.3.2 (Enforcement):** If any step in the verification algorithm fails or results in ambiguity, you **MUST** stop and ask for clarification.

### [P1.4] — Conflict Resolution & Escalation

* **P1.4.1 (Conflict Reporting):** If a user's prompt conflicts with a directive, you **MUST** state the conflict and its source rule ID. Example: *"This request conflicts with directive DAL.1 (No Direct Access). Please confirm if I should proceed by creating a new data-fetching hook."*
* **P1.4.2 (Escalation Trigger):** Before any high-stakes irreversible action (e.g., a destructive database migration), you **MUST** stop, state the risks, and require explicit confirmation to proceed.

---

## PART 2: CANONICAL MODELS (THE PROJECT'S REALITY)

This section defines the immutable truths of the EVIDENS project. You must operate as if these models are factual and correct.

### [M2.1] — The Philosophical Model
* **M2.1.1 (Core Problem):** The project solves "Ansiedade de Performance." (Source: `[DOC_1]`)
* **M2.1.2 (Target User):** The user is the "Praticante de Alto Sinal." (Source: `[DOC_1]`)

### [M2.2] — The Architectural Model
* **M2.2.1 (System Type):** The system is a unified Vite + React Single-Page Application (SPA) and a Progressive Web App (PWA). (Source: `[DOC_2]`)
* **M2.2.2 (Rendering):** The system uses Client-Side Rendering (CSR). (Source: `[DOC_2]`)
* **M2.2.3 (Backend):** The backend is 100% Supabase. (Source: `[DOC_2]`)
* **M2.2.4 (Monorepo):** The monorepo architecture is **ARCHIVED AND DEPRECATED**. The project is a single-package application. (Source: `[DOC_9]`)

### [M2.3] — The Documentation Model
* **M2.3.1 (Source of Truth):** The `/docs` directory is the canonical source for all feature specifications. This document is the canonical source for all architectural rules.
* **M2.3.2 (Live Summary):** `docs/README-BÍBLIA.md` serves as the high-level project index and changelog.

### [M2.4] — The Directory Structure Model

src/
├── components/
│   ├── ui/             # Reusable UI primitives (from shadcn/ui)
│   ├── shell/          # App layout (AppShell, Sidebar, Header)
│   ├── auth/           # Authentication-specific components
│   ├── acervo/         # 'Acervo' feature components
│   ├── community/      # 'Community' feature components
│   └── ...             # Other feature-specific component directories
├── hooks/              # UI-specific custom hooks (e.g., use-mobile)
├── integrations/
│   └── supabase/       # Supabase client and generated types
├── lib/                # Shared utility functions (e.g., cn)
├── pages/              # Top-level route components
├── packages/
│   └── hooks/          # Data-fetching hooks (TanStack Query)
├── router/             # Application routing configuration
├── store/              # Global client state (Zustand)
├── types/              # Shared TypeScript interfaces
└── ...
supabase/
├── functions/
│   ├── _shared/        # Shared utilities for Edge Functions
│   └── [function-name]/# Individual Edge Functions
└── migrations/         # Database schema migrations


---

## PART 3: IMPLEMENTATION DIRECTIVES (CODING ALGORITHMS)

### [D3.1] — Filesystem & Naming
* **D3.1.1 (File Structure):** You **MUST** adhere to the feature-first directory structure defined in `[M2.4]`.
* **D3.1.2 (Hook Directory):** Data-fetching hooks (`use...Query`, `use...Mutation`) **MUST** reside in `/packages/hooks/`. All other UI-centric custom hooks **MUST** reside in `/src/hooks/`.
* **D3.1.3 (Naming Convention):**
    * **PascalCase:** React Components, TypeScript types/interfaces, Database Tables.
    * **camelCase:** Functions, variables, general object keys.
    * **snake_case:** Database columns, URL slugs, API response keys.
* **D3.1.4 (File Headers):** Every `.ts` and `.tsx` file **MUST** begin with the comment `// ABOUTME:` followed by a one-sentence, present-tense summary of its purpose.

### [D3.2] — Component Architecture
* **D3.2.1 (Composition Model):** You **MUST** follow this component hierarchy:
    1.  **Primitives (`/src/components/ui`):** Generic, accessible, reusable UI components from shadcn/ui.
    2.  **Modules (`/src/components/<feature>`):** Compositions of primitives that solve a specific UI problem for a feature.
    3.  **Pages (`/src/pages`):** Top-level route components that orchestrate data fetching and module rendering.
* **D3.2.2 (Data Flow):** Data flows unidirectionally. Page components initiate data fetches (via hooks) and pass data down to modules as props. State should be lifted only as high as necessary.
* **D3.2.3 (Conditional Rendering):** All conditional rendering of components or data must be exhaustive, handling loading, error, and empty states explicitly. Use skeleton loaders for loading states to prevent layout shifts.

### [D3.3] — State Management
* **D3.3.1 (State Decision Algorithm):** To select a state management tool, you **MUST** execute the following algorithm:
    1.  **IF** data is persisted on the server, **THEN** use TanStack Query in a data-access hook. **END**.
    2.  **IF** state is UI-only AND shared globally by disconnected components (i.e., auth status), **THEN** use Zustand. **END**.
    3.  **IF** state is UI-only AND complex but scoped to a single component tree, **THEN** use `useReducer`. **END**.
    4.  **ELSE**, use `useState`.

### [D3.4] — Data Access Layer (The Golden Rule)
* **DAL.1 (No Direct Access):** UI components are **FORBIDDEN** from importing or calling the `supabase-js` client directly.
* **DAL.2 (Hook Abstraction):** All backend interactions **MUST** be encapsulated in a custom hook within `/packages/hooks/`.
* **DAL.3 (Query Engine):** All data-fetching hooks **MUST** use TanStack Query (`useQuery`, `useInfiniteQuery`, `useMutation`).
* **DAL.4 (Cache Invalidation):** Hooks using `useMutation` **MUST** invalidate all relevant queries in their `onSuccess` callback to ensure the UI reflects the new state.

### [D3.5] — Security, API, & Edge Functions
* **SEC.1 (RLS is Firewall):** All data access is governed by database-level RLS policies. Any new feature requiring data access **MUST** be accompanied by a corresponding migration file that defines its RLS policies. (Source: `[DOC_4]`)
* **SEC.2 (JWT Claims):** Authorization logic **MUST** rely on JWT custom claims (`role`, `subscription_tier`). Functions that alter a user's role **MUST** also call `supabase.auth.admin.updateUserById()` to update these claims in the token.
* **SEC.3 (Edge Function Guardrails):** Every Edge Function **MUST** implement the following, in order:
    1.  Handle CORS preflight (`OPTIONS`) requests.
    2.  Verify the user's JWT and extract the user ID.
    3.  Perform rate limiting where applicable.
    4.  Use the shared `sendSuccess` and `sendError` helpers for all responses.
* **SEC.4 (Function Configuration):** The `supabase/config.toml` file for functions **MUST** use `verify_jwt = false`, as JWT verification is handled manually within the function code to provide more specific error responses.

### [D3.6] — Adaptive Design (Mobile-First)
* **AD.1 (Mobile First):** All components **MUST** be designed and styled for mobile viewports first, then scaled up to desktop using Tailwind's responsive prefixes (`sm:`, `md:`, etc.). (Source: `[DOC_8]`)
* **AD.2 (Layout Adaptation):** You **MUST** use the `useIsMobile()` hook for conditional rendering of fundamentally different layout structures (e.g., `CollapsibleSidebar` vs. `BottomTabBar`). Do not use it for simple style changes.
* **AD.3 (Acervo UX):** The Acervo page **MUST** implement the "Reorder, Don't Filter" UX pattern. This is a canonical product decision. (Source: `[Blueprint] 04`)
* **AD.4 (PWA Context):** New features **MUST** be designed to function within the PWA context (e.g., consider offline states, use the PWA installation prompt components).

### [D3.7] — Type Safety & Linting
* **TS.1 (Strict Mode):** All code **MUST** compile with `"strict": true` in `tsconfig.json`.
* **TS.2 (No `any`):** The use of the `any` type is **FORBIDDEN**. Use `unknown` for situations where the type is genuinely unknown and perform type narrowing.
* **TS.3 (Single Source of Truth):** All shared, reusable types **MUST** be defined in or exported from `/src/types/index.ts`. Feature-specific types can live in `/src/types/[feature].ts` but must be exported via the index.
* **LINT.1 (Pre-Commit Check):** You **MUST** run `npm run lint` and resolve all errors before finalizing a task.

### [D3.8] — Automated Testing (New Mandate)
* **TEST.1 (Unit Tests):** All new utility functions (`/src/lib`) and complex, pure-logic hooks **MUST** be accompanied by unit tests using Vitest.
* **TEST.2 (Integration Tests):** All new features involving forms, complex user interactions, or multiple components working together **MUST** have integration tests written with Vitest and React Testing Library.
* **TEST.3 (E2E Tests):** Critical user flows (e.g., Signup, Login, Create Post, Vote on Poll) **MUST** be covered by end-to-end tests using Playwright.
* **TEST.4 (Test Location):** Test files **MUST** be co-located with the source file they are testing (e.g., `Button.tsx` and `Button.test.tsx` in the same directory).

## APP BLUEPRINTS TO BE FOLLOWED: You MUST check the related files before planning or executing any single task to ensure strict adherence:
`docs/[DOC_1]_PRODUCT_PHILOSOPHY.md`
`docs/[DOC_2]_SYSTEM_ARCHITECTURE.md`
`docs/[DOC_3]_DATABASE_SCHEMA.md`
`docs/[DOC_4]_ROW_LEVEL_SECURITY.md`
`docs/[DOC_5]_API_CONTRACT.md`
`docs/[DOC_6]_DATA_FETCHING_STRATEGY.md`
`docs/[DOC_7]_VISUAL_SYSTEM.md`
`docs/[DOC_8]_MOBILE_ADAPTATION.md`

## NON-NEGOTIABLE GUIDELINES: You MUST check the related files before planning or executing any single task to ensure strict adherence:
`docs/blueprints/01_AUTHENTICATION_BLUEPRINT.md`
`docs/blueprints/02_MAIN_APP_SHELL_BLUEPRINT.md`
`docs/blueprints/03_HOMEPAGE_BLUEPRINT.md`
`docs/blueprints/04_ACERVO_BLUEPRINT.md`
`docs/blueprints/05_REVIEW_DETAIL_BLUEPRINT.md`
`docs/blueprints/06_COMMUNITY_BLUEPRINT.md`
`docs/blueprints/08a_EDITOR_BLUEPRINT.md`
`docs/blueprints/08b_MANAGEMENT_BLUEPRINTS.md`
`docs/blueprints/08c_MODERATION_BLUEPRINT.md`
`docs/blueprints/09_ANALYTICS_BLUEPRINT.md`
`docs/blueprints/10_NOTIFICATIONS_BLUEPRINT.md`

---

## CRITICAL IMPLEMENTATION PATTERNS

### Error Boundary Hierarchy (NON-NEGOTIABLE)
The application uses a 3-tier error boundary system:
- **Tier 1 (Root)**: `App.tsx` - Ultimate safety net for entire application
- **Tier 2 (Page)**: Page-level boundaries isolate crashes from shell
- **Tier 3 (Feature)**: Feature-specific boundaries (e.g., CommunityErrorBoundary)

**Mandatory Pattern for New Features:**
```typescript
<ErrorBoundary 
  tier="feature"
  context="[feature-name]"
  showDetails={process.env.NODE_ENV === 'development'}
  showHomeButton={true}
  showBackButton={true}
>
  {/* Feature components */}
</ErrorBoundary>
```

### Mobile Breakpoint Standard
- **Breakpoint**: 768px (`MOBILE_BREAKPOINT = 768`)
- **Detection Hook**: `useIsMobile()` with SSR-safe initialization
- **Usage**: Only for fundamentally different layouts, NOT simple style changes

### TanStack Query Configuration Standards
**Mandatory Query Defaults:**
- `staleTime: 5 * 60 * 1000` (5 minutes)
- `gcTime: 10 * 60 * 1000` (10 minutes)
- `refetchOnWindowFocus: false`
- `retry: (failureCount, error) => failureCount < 2` (except auth errors)

**Required Infinite Query Pattern:**
```typescript
useInfiniteQuery({
  queryKey: ['feature-data'],
  queryFn: async ({ pageParam = 0 }) => { /* fetch logic */ },
  getNextPageParam: (lastPage) => lastPage.pagination?.hasMore ? lastPage.pagination.page + 1 : undefined,
  initialPageParam: 0,
  select: (data) => ({
    items: data.pages.flatMap(page => page.items || []),
    // Flatten paginated data for consumption
  })
})
```

### Authentication State Management
- **Zustand Store**: ONLY for session/user state, NO data fetching
- **Profile Data**: Fetched via separate hooks, NOT stored in auth store
- **JWT Claims**: `role` and `subscription_tier` embedded in tokens

### Cache Invalidation Patterns
**Mutation Success Handlers MUST:**
1. Invalidate broad categories: `queryClient.invalidateQueries({ queryKey: ['community'] })`
2. Update specific cache entries optimistically when possible
3. Follow the cache key hierarchy: `['feature', 'subtype', ...params]`

### File Header Requirements
**Every `.ts` and `.tsx` file MUST begin with:**
```typescript
// ABOUTME: [One-sentence description of file purpose in present tense]
```

### Type System Governance
- **Central Types**: All shared types in `/src/types/index.ts`
- **Feature Types**: Feature-specific types in `/src/types/[feature].ts`
- **Database Types**: Auto-generated from Supabase in `/src/integrations/supabase/types.ts`
- **NO `any` types**: Use `unknown` with type narrowing instead

### Progressive Web App (PWA) Context
- **Service Worker**: Background sync and caching enabled
- **Install Prompt**: Delayed prompts managed by PWAProvider
- **Offline Support**: All features must gracefully handle offline states
- **App-like Experience**: Full-screen, app-style navigation on mobile

### Brand Voice Implementation
All user-facing copy must reflect **"O Colega Cético e Honesto"** (The Skeptical and Honest Colleague):
- Direct, professional, slightly skeptical tone
- Avoid marketing language or hyperbole
- Focus on evidence and pragmatic decision-making
- Target the "Praticante de Alto Sinal" user archetype

### Visual System Compliance
**Required Design Tokens:**
- **Typography**: Serif for headings, sans-serif for UI
- **Colors**: Off-whites, nuanced grays, high contrast for actions
- **Dark Theme**: Deep backgrounds (#121212), refined grays (#1a1a1a, #212121)
- **Spacing**: Generous whitespace for focus
- **Mobile Touch Targets**: Minimum 44×44px

### Security Implementation Requirements
- **RLS Policies**: ALL new tables require Row Level Security policies
- **JWT Claims**: Use `get_my_claim()` function for authorization
- **Edge Functions**: Handle CORS, authentication, rate limiting in order
- **Input Validation**: Zod schemas for all user inputs
- **No Direct DB Access**: Components NEVER call Supabase directly 
</KB-Lovable>