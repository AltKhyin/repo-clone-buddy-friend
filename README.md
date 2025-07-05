# EVIDENS Platform

## 🚨 CRITICAL: Version Control & Sync Requirements

**IMPORTANT**: This repository MUST be kept synchronized with GitHub at all times.

### Sync Protocol:

1. **After EVERY change**: Commit and push to GitHub immediately
2. **Before starting work**: Always pull latest changes
3. **Working directory**: Use `repo-clone-buddy-friend/` as the primary development directory
4. **No desync allowed**: GitHub is the single source of truth

```bash
# Always follow this workflow:
git add .
git commit -m "Descriptive message"
git push origin main
```

## 🔥 Immediate Issues to Address

### High Priority Fixes Required:

1. **Community Posts Issues**:
   - Comments being counted as posts in some queries
   - Image/video/poll posts not displaying correctly
   - Missing multimedia data in post details
   - `/comunidade/:post-id` route data loading issues

2. **Tag System**:
   - Missing color column in Tags table
   - Tag analytics function errors
   - Tag filtering not working properly

3. **Security Warnings**:
   - 20 functions need explicit search_path set
   - rate_limit_log table needs RLS policies

### Testing Requirements:

- All fixes MUST be tested using Supabase MCP tools
- Simulate actual app calls before marking as complete
- Verify data integrity after each change

## Project Info

**Platform**: EVIDENS - Review and Community Application for Practitioners  
**Previous URL**: https://lovable.dev/projects/bf5f0070-40f8-4760-bbe1-41e5ac0dce78 (DEPRECATED)

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bf5f0070-40f8-4760-bbe1-41e5ac0dce78) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bf5f0070-40f8-4760-bbe1-41e5ac0dce78) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

# Test change for pre-commit

# Test Windows-compatible pre-commit hook

# Test extended timeout pre-commit hook

# Test Node.js pre-commit hook

# Test shell + Node.js pre-commit hook
