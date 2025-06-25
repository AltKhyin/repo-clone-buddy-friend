# Supabase Infrastructure

This directory contains ALL database infrastructure for the EVIDENS platform.

## 📁 Directory Structure

```
supabase/
├── config.toml          # Supabase project configuration
├── seed.sql            # Local development seed data
├── migrations/         # Database schema migrations
│   └── [timestamp]_*.sql  # Consolidated schema from production
└── functions/          # Edge Functions (all backend endpoints)
    ├── _shared/        # Shared utilities
    └── [function-name]/ # Individual Edge Functions
```

## 🚨 CRITICAL CONTEXT (Updated 2025-06-25)

### Current State:
- **Migrations**: Contain consolidated schema from `supabase db pull` of production
- **Edge Functions**: Local versions have fixes for voting and admin features
- **Deployment**: GitHub Actions will deploy these fixed functions to replace broken production ones

### What Happened:
1. Production Edge Functions were broken (500 errors on admin functions, voting UI issues)
2. We ran `supabase db pull` to capture current production schema
3. We fixed Edge Functions locally (voting optimistic updates, admin payload fixes)
4. Now we need to deploy these fixes to production

### Do NOT:
- ❌ Copy old migration files here (they're already consolidated)
- ❌ Pull Edge Functions from production (they're broken)
- ❌ Create a separate repository for Supabase (this IS the source of truth)

## 🚀 Deployment

All deployments happen automatically via GitHub Actions:

```bash
# Any changes to supabase/ directory trigger deployment
git add .
git commit -m "fix: description of changes"
git push origin main
# Watch the deployment in GitHub Actions tab
```

## 🛠️ Local Development

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Serve Edge Functions locally
supabase functions serve

# Access local services:
# Studio: http://localhost:54323
# API: http://localhost:54321
```

## 📝 Making Changes

### Database Schema:
1. Make changes in local Supabase Studio
2. Generate migration: `supabase db diff -f "descriptive_name"`
3. Commit and push to deploy

### Edge Functions:
1. Edit function in `functions/[name]/index.ts`
2. Test locally with `supabase functions serve`
3. Commit and push to deploy

## ⚠️ Important Notes

- This is the SINGLE SOURCE OF TRUTH for all infrastructure
- The GitHub Actions workflow handles all deployments
- Never make manual changes to production
- Always test locally before pushing