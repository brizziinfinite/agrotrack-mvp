# Redirect Loop Debugging Guide

## ✅ Changes Made to Fix Redirect Loop

### 1. **Force Logout Feature**
- **File**: `app/logout/page.tsx` (NEW)
- **Purpose**: Completely clears all sessions, cookies, and storage
- **Usage**: Click "🚪 Forçar Logout Completo" on login page

### 2. **Redirect Debugger System**
- **File**: `lib/redirect-debugger.ts` (NEW)
- **Features**:
  - Tracks all redirect attempts
  - Detects infinite redirect loops (>5 redirects to same page in 1 second)
  - Auto-triggers force logout when loop detected
  - Shows prominent console logs with red background
  - Tracks auth state with each redirect

### 3. **Login Page Fixes**
- **File**: `app/login/page.tsx`
- **Changes**:
  - Added `hasCheckedRef` to prevent multiple redirect checks
  - Removed `checkingSetup` from useEffect dependencies (was causing loops)
  - Integrated redirect debugger for all navigation
  - Added force logout button
  - Better console logging with [Login Page] prefix

### 4. **Onboarding Page Fixes**
- **File**: `app/onboarding/page.tsx`
- **Changes**:
  - Added `hasCheckedCustomerRef` to prevent multiple customer checks
  - Integrated redirect debugger
  - Better console logging with [Onboarding] prefix

### 5. **Dashboard Page Fixes**
- **File**: `app/page.tsx`
- **Changes**:
  - Added `hasCheckedCustomersRef` to prevent multiple checks
  - Integrated redirect debugger
  - Better console logging with [Dashboard] prefix

### 6. **Middleware Improvements**
- **File**: `middleware.ts`
- **Changes**:
  - Clearer logic for authenticated vs unauthenticated routes
  - Better console logging with [Middleware] prefix
  - /onboarding accessible to authenticated users only

## 🔍 How to Debug Redirect Loops

### Check Console Logs

Look for these prefixes:
- 🔒 **[Middleware]** - Route protection decisions
- 🔐 **[Auth Context]** - Authentication state changes
- 👤 **[Login Page]** - Login flow and redirects
- 🎯 **[Onboarding]** - Onboarding wizard progress
- 🏠 **[Dashboard]** - Dashboard loading and customer checks
- 🔀 **[REDIRECT]** - Every redirect attempt (RED BACKGROUND)

### Redirect Loop Detection

If you see this in console:
```
🔥🔥🔥 [REDIRECT LOOP DETECTED] 🔥🔥🔥
```

The system will:
1. Show an alert
2. Automatically redirect to /logout
3. Clear all sessions

### Manual Debugging Steps

1. **Open browser DevTools** (F12 or Cmd+Option+I)
2. **Go to Console tab**
3. **Clear console** (to see fresh logs)
4. **Try to login or navigate**
5. **Watch for red REDIRECT logs**
6. **Look for repeated patterns**

### What to Look For

1. **Repeated redirects to same page**:
   ```
   🔀 [REDIRECT] /login → /onboarding
   🔀 [REDIRECT] /onboarding → /
   🔀 [REDIRECT] / → /onboarding
   🔀 [REDIRECT] /onboarding → /  ← LOOP!
   ```

2. **Auth state inconsistency**:
   ```
   hasSession: true
   hasUser: false  ← This shouldn't happen!
   ```

3. **Multiple checks**:
   ```
   ⚠️ [Login Page] Already checked user setup, skipping
   ```
   This is GOOD - means the ref is working

## 🚪 Force Logout Steps

### Option 1: Use Logout Button
1. Go to `/login` page
2. Scroll down
3. Click "🚪 Forçar Logout Completo"

### Option 2: Direct URL
1. Navigate to `/logout` in browser
2. Wait for automatic cleanup

### Option 3: Manual Cleanup
Open browser console and run:
```javascript
// Sign out from Supabase
await window.supabase.auth.signOut()

// Clear storage
localStorage.clear()
sessionStorage.clear()

// Reload
window.location.href = '/login'
```

## 🐛 Common Issues

### Issue: Still getting redirect loop after logout
**Solution**:
1. Clear browser cache (Cmd+Shift+Delete / Ctrl+Shift+Delete)
2. Try incognito/private mode
3. Check if cookies are being blocked by browser

### Issue: "Already checked" logs but still redirecting
**Solution**:
- This means the ref is working but redirect is coming from different component
- Check which component is logging the redirect (look at [Component Name])
- Each component has its own ref, so multiple components can each redirect once

### Issue: No redirect logs appearing
**Solution**:
1. Make sure you're looking at Console tab (not Network, etc.)
2. Check console filter - should show "All levels"
3. Red REDIRECT logs might be filtered out if you're filtering by log level

## 📋 Next Steps If Still Failing

If redirect loop persists:

1. **Check console logs** - copy all logs that show:
   - 🔀 [REDIRECT] lines
   - 🔒 [Middleware] lines
   - 🔐 [Auth Context] lines

2. **Check Network tab**:
   - Look for repeated requests to same endpoint
   - Check response codes (should be 200, not 3xx redirects)

3. **Check Application tab**:
   - Look at Cookies - should have supabase cookies
   - Look at Local Storage - check for stale data

4. **Try these debugging commands** in console:
   ```javascript
   // Check auth state
   const { data } = await window.supabase.auth.getSession()
   console.log('Session:', data)

   // Check customer data
   const { data: customers } = await window.supabase
     .from('user_permissions')
     .select('*')
   console.log('Customers:', customers)
   ```

## 🔧 Prevention

The following protections are now in place:

1. ✅ **useRef flags** prevent multiple useEffect executions
2. ✅ **Redirect debugger** detects and stops loops automatically
3. ✅ **Better dependency arrays** prevent infinite re-renders
4. ✅ **Console logging** makes issues visible immediately
5. ✅ **Force logout** provides escape hatch for users
