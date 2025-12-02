# REDIRECT LOOP DEBUGGING INSTRUCTIONS

## ✅ CHANGES MADE

### 1. **Fixed Middleware** ✅
- **Removed the redirect** that sent authenticated users from `/login` to `/`
- Middleware NOW:
  - Blocks unauthenticated users from protected pages
  - Allows authenticated users EVERYWHERE (including /login and /onboarding)
  - Does NOT interfere with page-level redirect logic

### 2. **Added Extensive Logging** ✅
All pages now have detailed console logs:
- 🔒 `[Middleware]` - Every request
- 📄 `[Onboarding Layout]` - Layout rendering
- 🎯 `[Onboarding]` - Page rendering and state
- 👤 `[Login Page]` - Login flow
- 🔀 `[REDIRECT]` - Every redirect attempt

## 🧪 HOW TO TEST

### Step 1: Open Browser Console
1. Open Chrome/Firefox DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. **Clear the console** (to start fresh)
4. Make sure "All levels" is selected (not just errors)

### Step 2: Attempt Login
1. Navigate to `http://localhost:3000/login`
2. Enter your credentials
3. Click "Entrar"
4. **WATCH THE CONSOLE** - don't look at the page yet!

### Step 3: Read the Logs

You should see a sequence like this:

```
🔒 [Middleware] ========================================
🔒 [Middleware] REQUEST: /login
🔒 [Middleware] State: { path: '/login', hasSession: false, ... }
🔒 [Middleware] Allowing unauthenticated user to access auth page

👤 [Login Page] Form submitted
🔐 [Auth Context] Signing in user: [email]
✅ [Auth Context] Sign in successful: [userId]

👤 [Login Page] User authenticated, checking setup...
👤 [Login Page] Team member check: { hasTeamMember: false, ... }
🆕 [Login Page] New user - redirecting to /onboarding

🔀 [REDIRECT] /login → /onboarding  <-- THIS IS THE REDIRECT
  trigger: "Login Page - New User"

🔒 [Middleware] ========================================
🔒 [Middleware] REQUEST: /onboarding
🔒 [Middleware] State: { path: '/onboarding', hasSession: true, userId: 'xxx', ... }
🔒 [Middleware] Allowing authenticated user to access /onboarding

📄 [Onboarding Layout] ========================================
📄 [Onboarding Layout] LAYOUT RENDERING

🎯 [Onboarding] ========================================
🎯 [Onboarding] PAGE COMPONENT RENDERING
🎯 [Onboarding] Initial state: { hasUser: true, hasSupabaseUser: true, ... }
```

### Step 4: Identify the Problem

**Look for these patterns:**

#### ✅ GOOD - Working correctly:
```
🔀 [REDIRECT] /login → /onboarding
🔒 [Middleware] REQUEST: /onboarding
🔒 [Middleware] Allowing authenticated user to access /onboarding
🎯 [Onboarding] PAGE COMPONENT RENDERING
```
→ User stays on /onboarding ✅

#### ❌ BAD - Redirect loop:
```
🔀 [REDIRECT] /login → /onboarding
🔒 [Middleware] REQUEST: /onboarding
🔒 [Middleware] Redirecting unauthenticated user to /login  ← PROBLEM!
```
→ This means session is lost between pages

OR:
```
🎯 [Onboarding] PAGE COMPONENT RENDERING
✅ [Onboarding] User has customer - redirecting to /
🔀 [REDIRECT] /onboarding → /
🏠 [Dashboard] No customers found, redirecting to /onboarding
🔀 [REDIRECT] / → /onboarding
```
→ This is a loop between dashboard and onboarding

OR:
```
🔀 [REDIRECT] /login → /onboarding
🔒 [Middleware] Redirecting authenticated user from auth page to /  ← OLD BUG
```
→ This means middleware fix didn't take effect (restart server)

## 🔍 WHAT TO LOOK FOR

### 1. **Session Loss**
If you see:
```
🔒 [Middleware] State: { hasSession: false, ... }
```
When trying to access /onboarding AFTER logging in, it means:
- Cookies aren't being set properly
- Session isn't persisting between pages
- **FIX**: Check Supabase configuration, check browser cookie settings

### 2. **Middleware Interfering**
If you see:
```
🔒 [Middleware] Redirecting authenticated user from auth page to /
```
It means the middleware fix didn't apply.
- **FIX**: Restart the Next.js dev server

### 3. **Auth State Not Loading**
If you see:
```
🎯 [Onboarding] Initial state: { hasSupabaseUser: false, authLoading: true, ... }
```
And it stays loading forever, it means:
- AuthProvider is stuck
- **FIX**: Check AuthContext initialization

### 4. **Multiple Redirects**
If you see the SAME redirect happen multiple times:
```
🔀 [REDIRECT] /onboarding → /
🔀 [REDIRECT] /onboarding → /
🔀 [REDIRECT] /onboarding → /
```
It means useEffect is running multiple times.
- **FIX**: Check if `hasCheckedRef` is working

## 🚑 EMERGENCY FIXES

### If Still Stuck in Loop:

1. **Force Logout**
   - Click "🚪 Forçar Logout Completo" on login page
   - Or go to: `http://localhost:3000/logout`

2. **Restart Dev Server**
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

3. **Clear Browser Data**
   - Open DevTools
   - Application tab → Storage → Clear site data
   - Or use Incognito mode

4. **Check Supabase Setup**
   - Make sure `.env.local` has correct Supabase credentials
   - Test Supabase connection independently

## 📊 COPY LOGS

If the issue persists, **copy all console logs** from:
1. The moment you click "Entrar"
2. Until the loop stabilizes or completes

Look for the pattern and share:
- Where does the redirect start?
- Where does it end up?
- What's causing each redirect?

## ✅ EXPECTED BEHAVIOR

After login, you should see:
1. ✅ Login page detects auth
2. ✅ Checks for customer → NONE
3. ✅ Redirects to `/onboarding`
4. ✅ Middleware allows access
5. ✅ Onboarding page loads
6. ✅ User sees wizard (stays on page!)
7. ✅ User completes wizard
8. ✅ Redirects to `/` (dashboard)
9. ✅ Dashboard loads
10. ✅ User sees dashboard (stays on page!)

---

**Next Step**: Open the browser, open console, try to login, and share the console logs!
