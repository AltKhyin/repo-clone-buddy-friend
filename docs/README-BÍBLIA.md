# EVIDENS AI Development Bible v6.0

**Version:** 6.0.1 (Canon - Critical Infrastructure Fixes)
**Date:** June 24, 2025
**Purpose:** This document contains the complete, authoritative, and machine-optimized set of rules, architectural models, and implementation directives for the EVIDENS project.

---

## CRITICAL UPDATES v6.0.1

### 🔧 Infrastructure Fixes Applied
- **RESOLVED**: Analytics dashboard `req.headers.get is not a function` error
- **STANDARDIZED**: Rate limiting architecture with proper Deno Request handling
- **CENTRALIZED**: Shared utilities for CORS, authentication, and rate limiting
- **IMPLEMENTED**: 7-step Edge Function pattern across all admin functions

---

## INDEX

*   [PART 1: PROJECT SETUP & WORKFLOW](#part-1-project-setup--workflow)
    *   [P1.1 — Development Environment Setup](#p11--development-environment-setup)
    *   [P1.2 — Version Control & Branching](#p12--version-control--branching)
    *   [P1.3 — Pre-Flight Checklist (Mandatory)](#p13--pre-flight-checklist-mandatory)
    *   [P1.4 — Conflict Resolution Protocol](#p14--conflict-resolution-protocol)
*   [PART 2: CANONICAL MODELS (THE PROJECT'S REALITY)](#part-2-canonical-models-the-projects-reality)
    *   [M2.1 — The Authentication Model](#m21--the-authentication-model)
    *   [M2.2 — The Data Model](#m22--the-data-model)
    *   [M2.3 — The Component Model](#m23--the-component-model)
    *   [M2.4 — The Directory Structure Model](#m24--the-directory-structure-model)
*   [PART 3: IMPLEMENTATION DIRECTIVES (CODING ALGORITHMS)](#part-3-implementation-directives-coding-algorithms)
    *   [D3.1 — Filesystem & Naming](#d31--filesystem--naming)
    *   [D3.2 — Component Architecture](#d32--component-architecture)
    *   [D3.3 — State Management](#d33--state-management)
    *   [D3.4 — Data Access Layer (The Golden Rule)](#d34--data-access-layer-the-golden-rule)
    *   [D3.5 — Security, API, & Edge Functions](#d35--security-api--edge-functions)
    *   [D3.6 — Adaptive Design](#d36--adaptive-design)
    *   [D3.7 — Error Handling & Logging](#d37--error-handling--logging)
    *   [D3.8 — Performance Optimization](#d38--performance-optimization)
*   [CURRENT IMPLEMENTATION STATUS](#current-implementation-status)
*   [CRITICAL ARCHITECTURE COMPLIANCE STATUS](#critical-architecture-compliance-status)
*   [TECHNICAL DEBT STATUS](#technical-debt-status)
*   [NEXT IMMEDIATE ACTIONS](#next-immediate-actions)
*   [SHARED UTILITIES REFERENCE](#shared-utilities-reference)
*   [IMPLEMENTATION PROGRESS FLOWCHART](#implementation-progress-flowchart)

---

## PART 1: PROJECT SETUP & WORKFLOW

### [P1.1] — Development Environment Setup

*   **P1.1.1 (Editor):** VS Code with the recommended extensions (ESLint, Prettier, TypeScript).
*   **P1.1.2 (Node.js):** Version 20.x or higher.
*   **P1.1.3 (Deno):** Version 1.40 or higher (for Edge Functions).
*   **P1.1.4 (Supabase CLI):** Latest version.
*   **P1.1.5 (Docker):** For local Supabase development (optional).

### [P1.2] — Version Control & Branching

*   **P1.2.1 (Git):** Use Git for version control.
*   **P1.2.2 (Trunk-Based Development):** All changes are merged directly into the `main` branch.
*   **P1.2.3 (Feature Flags):** Use feature flags to enable/disable new features in production.

### [P1.3] — Pre-Flight Checklist (Mandatory) - UPDATED v6.0.1

* **P1.3.1 (Verification Algorithm):** Before executing any task, you **MUST** perform the following verification steps in sequence:
    1.  **Analyze Intent:** Deconstruct the user's prompt to establish the primary goal.
    2.  **Analyze Context:** Identify and fully read the specific `/docs` files relevant to the prompt's goal.
    3.  **Analyze Security:** Cross-reference the task with `[DOC_4]` and `[D3.5]` to identify all applicable RLS policies, roles, and API security constraints.
    4.  **Analyze Conflicts:** Scan the codebase for code duplication or logical conflicts. If the user's request violates a directive in this document, proceed to `[P1.4]`.
    5.  **Verify Shared Utilities:** Ensure all Edge Functions use standardized shared utilities from `supabase/functions/_shared/`

*   **P1.3.2 (Enforcement):** If any step in the verification algorithm fails or results in ambiguity, you **MUST** stop and ask for clarification.

### [P1.4] — Conflict Resolution Protocol

*   **P1.4.1 (Architectural Conflicts):** If a proposed change violates the architectural models defined in `PART 2`, the change **MUST** be rejected.
*   **P1.4.2 (Implementation Conflicts):** If a proposed change conflicts with an existing implementation directive in `PART 3`, the directive **MUST** be updated to accommodate the change.
*   **P1.4.3 (Documentation Conflicts):** If the code diverges from the documentation, the documentation **MUST** be updated to reflect the code.

---

## PART 2: CANONICAL MODELS (THE PROJECT'S REALITY)

### [M2.1] — The Authentication Model

*   **M2.1.1 (Supabase Auth):** Use Supabase Auth for user authentication.
*   **M2.1.2 (JWT Claims):** User roles and subscription tiers are stored as custom claims in the JWT.
*   **M2.1.3 (Row Level Security):** Access to data is controlled by Row Level Security (RLS) policies in the database.

### [M2.2] — The Data Model

*   **M2.2.1 (PostgreSQL):** Use PostgreSQL as the primary database.
*   **M2.2.2 (JSONB):** Store flexible data structures in JSONB columns.
*   **M2.2.3 (Relationships):** Define relationships between tables using foreign keys.

### [M2.3] — The Component Model

*   **M2.3.1 (React):** Use React for building UI components.
*   **M2.3.2 (Shadcn/ui):** Use Shadcn/ui for reusable UI primitives.
*   **M2.3.3 (Atomic Design):** Organize components using the Atomic Design methodology (Atoms, Molecules, Organisms, Templates, Pages).

### [M2.4] — The Directory Structure Model - UPDATED v6.0.1

```
src/
├── components/
│   ├── ui/             # Reusable UI primitives (from shadcn/ui)
│   ├── shell/          # App layout (AppShell, Sidebar, Header)
│   ├── auth/           # Authentication-specific components
│   ├── acervo/         # 'Acervo' feature components
│   ├── community/      # 'Community' feature components
│   └── admin/          # Admin management components (UPDATED)
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
│   ├── _shared/        # CRITICAL: Centralized utilities (NEW v6.0.1)
│   │   ├── cors.ts     # Standardized CORS handling
│   │   ├── rate-limit.ts  # Rate limiting with proper Deno Request support
│   │   └── auth.ts     # Authentication and authorization utilities
│   └── [function-name]/# Individual Edge Functions using shared utilities
└── migrations/         # Database schema migrations
```

---

## PART 3: IMPLEMENTATION DIRECTIVES (CODING ALGORITHMS) - UPDATED v6.0.1

### [D3.1] — Filesystem & Naming

*   **D3.1.1 (Directory Structure):** Follow the directory structure defined in `[M2.4]`.
*   **D3.1.2 (Component Naming):** Use PascalCase for component filenames and component names (e.g., `MyComponent.tsx`).
*   **D3.1.3 (Hook Naming):** Use camelCase for hook filenames and hook names, prefixed with `use` (e.g., `useMyHook.ts`).
*   **D3.1.4 (Utility Naming):** Use camelCase for utility filenames and function names (e.g., `myUtility.ts`).

### [D3.2] — Component Architecture

*   **D3.2.1 (Atomic Design):** Organize components using the Atomic Design methodology.
*   **D3.2.2 (UI Primitives):** Use Shadcn/ui components for UI primitives.
*   **D3.2.3 (Composition):** Build complex components by composing simpler components.
*   **D3.2.4 (Props):** Use TypeScript interfaces to define component props.

### [D3.3] — State Management

*   **D3.3.1 (TanStack Query):** Use TanStack Query for data fetching and caching.
*   **D3.3.2 (Zustand):** Use Zustand for global client state.
*   **D3.3.3 (Immutability):** Treat state as immutable.

### [D3.4] — Data Access Layer (The Golden Rule)

*   **D3.4.1 (Hooks):** All data fetching **MUST** be performed using TanStack Query hooks.
*   **D3.4.2 (Edge Functions):** Hooks **MUST** call Edge Functions to access data.
*   **D3.4.3 (RLS):** Edge Functions **MUST NOT** bypass Row Level Security (RLS) policies.
*   **D3.4.4 (No Direct DB Access):** UI components **MUST NOT** directly access the database.

### [D3.5] — Security, API, & Edge Functions - UPDATED v6.0.1

*   **SEC.1 (RLS is Firewall):** All data access is governed by database-level RLS policies. Any new feature requiring data access **MUST** be accompanied by a corresponding migration file that defines its RLS policies. (Source: `[DOC_4]`)
*   **SEC.2 (JWT Claims):** Authorization logic **MUST** rely on JWT custom claims (`role`, `subscription_tier`). Functions that alter a user's role **MUST** also call `supabase.auth.admin.updateUserById()` to update these claims in the token.
*   **SEC.3 (Edge Function Guardrails) - MANDATORY 7-STEP PATTERN:** Every Edge Function **MUST** implement the following pattern using shared utilities:
    1.  **CORS Preflight**: Use `handleCorsPrelight()` from `_shared/cors.ts`
    2.  **Rate Limiting**: Use appropriate rate limiter from `_shared/rate-limit.ts`
    3.  **Authentication**: Use `authenticateRequest()` from `_shared/auth.ts`
    4.  **Authorization**: Use `requireRole()` from `_shared/auth.ts`
    5.  **Client Creation**: Create Supabase client with service role
    6.  **Business Logic**: Execute the core function logic
    7.  **Response**: Return structured response with proper headers
*   **SEC.4 (Shared Utilities Requirement):** All Edge Functions **MUST** use the centralized utilities from `supabase/functions/_shared/` to ensure consistency and prevent architectural drift.

### [D3.6] — Adaptive Design

*   **D3.6.1 (Mobile-First):** Design for mobile devices first.
*   **D3.6.2 (Responsive Components):** Use responsive components from Shadcn/ui.
*   **D3.6.3 (CSS Media Queries):** Use CSS media queries for adaptive styling.

### [D3.7] — Error Handling & Logging

*   **D3.7.1 (Error Boundaries):** Use React Error Boundaries to catch and handle errors.
*   **D3.7.2 (Centralized Logging):** Log errors to a centralized logging service.
*   **D3.7.3 (User-Friendly Messages):** Display user-friendly error messages.

### [D3.8] — Performance Optimization

*   **D3.8.1 (Code Splitting):** Use code splitting to reduce initial load time.
*   **D3.8.2 (Caching):** Use TanStack Query for caching data.
*   **D3.8.3 (Image Optimization):** Optimize images for web delivery.

---

## CURRENT IMPLEMENTATION STATUS v6.0.1

### ✅ PHASE 1: INFRASTRUCTURE REPAIR & STANDARDIZATION - COMPLETED
- **Rate Limiting Architecture**: ✅ Standardized with proper Deno Request handling
- **Shared Utilities**: ✅ Centralized CORS, auth, and rate limiting
- **Edge Function Pattern**: ✅ 7-step pattern implemented across all functions
- **Admin Functions**: ✅ All operational with consistent error handling
- **Analytics Dashboard**: ✅ Fixed critical `req.headers.get` error

### 🔄 PHASE 2: THEME COMPLIANCE & VISUAL STANDARDIZATION - READY
- **Admin Components Theme Compliance**: Ready to start
- **Component Audit & Fixes**: Pending theme application

### 🔄 PHASE 3: 08B COMPONENT IMPLEMENTATION - READY
- **User Management Interface**: Backend ready, frontend pending
- **Analytics Dashboard**: Backend operational, frontend ready
- **Tag Management System**: Architecture ready
- **Advanced Moderation Tools**: Foundation complete

---

## CRITICAL ARCHITECTURE COMPLIANCE STATUS v6.0.1

### ✅ FULLY COMPLIANT
- [D3.4] Data Access Layer - All admin functions use proper hooks
- [D3.5] Security & API - Rate limiting, authentication enforced universally
- [SEC.3] Edge Function Guardrails - 7-step pattern with shared utilities
- [DOC_5] API Contract - All Edge Functions follow mandatory structure
- [P1.3] Pre-Flight Checklist - Complete verification implemented

### 🔄 PARTIALLY COMPLIANT  
- [DOC_7] Visual System - Admin components need theme fixes (next priority)
- [D3.2] Component Architecture - Some admin components need refactoring

### ❌ NON-COMPLIANT
- None identified (all critical violations resolved in v6.0.1)

---

## TECHNICAL DEBT STATUS v6.0.1

### ✅ RESOLVED
- **CRITICAL**: Edge Function CORS failures - Fixed with standardized utilities
- **CRITICAL**: Rate limiting boot errors - Resolved with proper Deno Request handling
- **CRITICAL**: Analytics dashboard errors - Fixed architectural inconsistencies
- **CRITICAL**: Import/export inconsistencies - Standardized shared utilities
- **HIGH**: Admin function pattern deviation - Applied 7-step pattern universally

### 🔄 REMAINING
- **MEDIUM**: Admin component theme compliance needed
- **LOW**: Some component prop type standardization pending

---

## NEXT IMMEDIATE ACTIONS v6.0.1

1. **✅ Verify Infrastructure**: All admin functions now operational
2. **🔄 Begin Task 2.1**: Apply [DOC_7] theme compliance to admin components  
3. **🔄 Proceed systematically** through 08b component implementation

---

**Last Updated**: June 24, 2025 - v6.0.1  
**Next Review**: After Phase 2 initiation and theme compliance verification

---

## SHARED UTILITIES REFERENCE v6.0.1

### Rate Limiting Functions
```typescript
import { checkRateLimit, checkAdminRateLimit, checkAnalyticsRateLimit } from '../_shared/rate-limit.ts';
```

### CORS Handling
```typescript
import { corsHeaders, handleCorsPrelight } from '../_shared/cors.ts';
```

### Authentication
```typescript
import { authenticateRequest, requireRole } from '../_shared/auth.ts';
```

---

## IMPLEMENTATION PROGRESS FLOWCHART v6.0.1

```
PHASE 1: INFRASTRUCTURE REPAIR ✅ COMPLETED
├── Task 1.1: Rate Limiting Infrastructure ✅
├── Task 1.2: Edge Functions Standardization ✅  
├── Task 1.3: Admin Functions Completion ✅
└── Task 1.4: Critical Error Resolution ✅ NEW
    ├── Fixed Analytics Dashboard Error ✅
    ├── Standardized Shared Utilities ✅
    ├── Applied 7-Step Pattern Universally ✅
    └── All Admin Functions Verified Operational ✅

PHASE 2: THEME COMPLIANCE (CURRENT FOCUS)
├── Task 2.1: Admin Components Theme Fixes (READY)
└── Task 2.2: Component Standards Audit (READY)

PHASE 3: 08B IMPLEMENTATION (READY)
├── Task 3.1: User Management Interface (READY)
├── Task 3.2: Analytics Dashboard (READY)
├── Task 3.3: Tag Management System (READY)
└── Task 3.4: Advanced Moderation Tools (READY)
```

---

**✅ Infrastructure Layer: 100% Complete**  
**🔄 Presentation Layer: Ready to Start**  
**🔄 Feature Layer: Architecture Ready**

**Overall Project Completion: ~85% Infrastructure + Backend Architecture**
