
# **ARCHIVAL NOTICE (June 16, 2025)**
**Status:** ARCHIVED - Not applicable to current implementation

The monorepo architecture described in this document represents a potential future state for the project should a migration to a different hosting platform be undertaken. The current active implementation utilizes a single-package Vite architecture as defined in [DOC_2]_SYSTEM_ARCHITECTURE.md. 

This document is preserved for long-term strategic context only and should not be used as a reference for current development.

---

# **[DOC_9] Monorepo Architecture (ARCHIVED)**

**Version:** 1.0 (Archived)  
**Date:** June 15, 2025  
**Status:** Not applicable to current Vite implementation

**Purpose**  
This document originally defined the canonical monorepo structure for the EVIDENS platform using `pnpm` + `Turborepo`. The current implementation uses a single Vite application structure.

## **Original Monorepo Vision (For Reference Only)**

The original plan envisioned a structure with:
- `apps/main` - Primary user-facing application
- `apps/admin` - Administrative interface
- `packages/ui` - Shared component library
- `packages/hooks` - Shared data-fetching logic
- `packages/db` - Database types and utilities

## **Current Reality (June 2025)**

The project is implemented as a single Vite + React application with internal organization that maintains separation of concerns within the `src/` directory structure. See [DOC_2]_SYSTEM_ARCHITECTURE.md for the current architectural approach.

---

*End of Archived Document*
