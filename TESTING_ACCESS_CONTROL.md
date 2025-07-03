# 🧪 Access Control System Testing Guide

This document provides comprehensive testing instructions for the 4-tier Universal Access Control System.

## 🎯 System Overview

The access control system uses **4 tiers**:

- **Public** (0): No authentication required
- **Free** (1): Requires free account/login
- **Premium** (2): Requires premium subscription
- **Editor/Admin** (3): Requires admin or editor role

## 🧪 Manual Testing Checklist

### **1. Public Routes (Should Always Work)**

- [ ] `http://localhost:8080/` - Homepage
- [ ] `http://localhost:8080/acervo` - Archive page
- [ ] `http://localhost:8080/reviews/test-slug` - Review detail page
- [ ] `http://localhost:8080/comunidade/123` - Individual community post
- [ ] `http://localhost:8080/login` - Login page
- [ ] `http://localhost:8080/acesso-negado` - Unauthorized page

**Expected Result**: All pages load without redirection

### **2. Free Account Routes (Require Login)**

Test these **without being logged in**:

- [ ] `http://localhost:8080/comunidade`
- [ ] `http://localhost:8080/comunidade/criar`
- [ ] `http://localhost:8080/perfil`
- [ ] `http://localhost:8080/perfil/123`
- [ ] `http://localhost:8080/definicoes`
- [ ] `http://localhost:8080/configuracoes`
- [ ] `http://localhost:8080/sugestoes`

**Expected Result**: Should redirect to `/login`

Test these **while logged in with free account**:

- [ ] All above routes should work normally

### **3. Admin/Editor Routes (Require Admin Role)**

Test these **without admin role**:

- [ ] `http://localhost:8080/admin`
- [ ] `http://localhost:8080/admin/dashboard`
- [ ] `http://localhost:8080/admin/access-control`
- [ ] `http://localhost:8080/admin/users`
- [ ] `http://localhost:8080/editor/123`

**Expected Result**: Should redirect to `/acesso-negado`

Test these **with admin role**:

- [ ] All above routes should work normally

## 🔧 Admin Interface Testing

### **CRUD Operations Test**

1. **Navigate to**: `http://localhost:8080/admin/access-control`
2. **Create New Rule**:
   - [ ] Click "Nova Regra"
   - [ ] Fill in: Path: `/test-page`, Level: `premium`, Redirect: `/upgrade`
   - [ ] Click "Criar Regra"
   - [ ] Verify rule appears in table
3. **Edit Rule**:
   - [ ] Click edit button on test rule
   - [ ] Change level to `free`
   - [ ] Click "Atualizar Regra"
   - [ ] Verify change in table
4. **Delete Rule**:
   - [ ] Click delete button on test rule
   - [ ] Confirm deletion
   - [ ] Verify rule disappears from table

### **Edge Function Testing**

Monitor browser console for errors during CRUD operations. Should see:

- ✅ `Function admin-page-access-control` calls succeeding
- ❌ No 500 errors
- ❌ No "supabase.rpc(...).catch is not a function" errors

## 🐛 Debug Mode Testing

To enable debug logging for troubleshooting:

1. **Edit**: `src/components/shell/ProtectedAppShell.tsx`
2. **Change**: `showDebugInfo={false}` to `showDebugInfo={true}`
3. **Check browser console** for detailed protection logs:

```
🌐 Universal Route Protection: Public route, no check needed: /
🔒 Universal Route Protection Debug: {path: '/comunidade', configFound: true, requiredLevel: 'free', ...}
🚫 Universal Route Protection: Authentication required, redirecting to: /login
✅ Universal Route Protection: Access granted for: /comunidade
```

## 🔄 Configuration Testing

### **Add New Protected Route**

1. **Edit**: `src/config/routeProtection.ts`
2. **Add**: New route to `ROUTE_PROTECTION_CONFIG`
3. **Test**: Route should be automatically protected
4. **No router changes needed** - protection is automatic!

### **Database Sync Testing**

1. **Run**: SQL sync to update database
2. **Verify**: Database entries match configuration
3. **Test**: Both code-level and database-level protection work

## 🚨 Common Issues & Solutions

### **Issue**: Route not protected despite being in config

**Solution**: Check path format - use `comunidade` not `/comunidade` in config

### **Issue**: Admin interface shows 500 errors

**Solution**: Check Edge Function logs for specific error details

### **Issue**: Redirects in infinite loop

**Solution**: Verify redirect URLs are in PUBLIC_ROUTES list

### **Issue**: User can access route they shouldn't

**Solution**: Check user's access level calculation and role assignment

## ✅ Success Criteria

**System is working correctly when**:

- [ ] All public routes accessible without authentication
- [ ] Free routes require login and work for authenticated users
- [ ] Admin routes require admin role and work for admin users
- [ ] Unauthorized access redirects to appropriate pages
- [ ] Admin interface CRUD operations work without errors
- [ ] Debug logging shows correct protection decisions
- [ ] Configuration changes automatically apply to all routes

## 📊 Performance Testing

**Monitor for**:

- [ ] Fast route transitions (no noticeable delay)
- [ ] No excessive API calls during protection checks
- [ ] Efficient caching of access control decisions
- [ ] Minimal impact on app startup time

---

**🎉 If all tests pass, the Universal Access Control System is production-ready!**
