# Supabase Database Setup Guide

## Issue: User Registration Error

**Error:** "Error creating user profile: {}"

**Cause:** The `users` table and other SaaS tables don't exist in the database, or RLS policies are blocking inserts.

---

## Solution: Execute Database Migration

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `qmylzsunvftjlacuzhjm`
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script

1. Open the file `supabase-saas-schema.sql` in this project
2. Copy **ALL** the SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Step 3: Verify Tables Were Created

After running the script, verify the tables exist:

```sql
-- Run this query to check all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- ✅ `users`
- ✅ `customers`
- ✅ `team_members`
- ✅ `properties`
- ✅ `property_access`
- ✅ `devices`
- ✅ `device_metadata` (from previous migration)

### Step 4: Verify RLS Policies

Run this query to check RLS policies:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

You should see policies for all tables, including:
- `Allow anon insert for registration` on `users` table (critical for registration)

---

## What the Migration Does

### 1. Creates Users Table
- Links to `auth.users` table via foreign key
- Stores user profile information (name, phone, WhatsApp opt-in)
- **Allows anonymous inserts** for registration (critical!)

### 2. Creates Multi-Tenant Structure
- `customers` - Companies/farms
- `team_members` - Users with roles (owner, manager, operator, viewer)
- `properties` - Farms/locations
- `property_access` - Property-level permissions
- `devices` - GPS tracking devices

### 3. Sets Up RLS (Row Level Security)
- Users can only see their own data
- Team members can only access their customer's data
- Owners have full control over their customers
- Property access is granular per team member

---

## Testing Registration After Migration

### Step 1: Clear Browser Data
1. Open browser DevTools (F12)
2. Go to Application > Storage > Clear site data
3. Refresh the page

### Step 2: Try Registering a New Account
1. Go to http://localhost:3000/register
2. Fill in the form:
   - Email: test@example.com
   - Password: TestPassword123!
   - Full Name: Test User
   - Phone: (11) 98765-4321
   - Check WhatsApp opt-in
3. Click "Criar Conta"

### Step 3: Check Console Logs

**Success logs (expected):**
```
✅ Auth user created: [uuid]
✅ User profile created successfully
```

**Error logs (if still failing):**
```
❌ Profile creation error: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

If you see errors, copy the **full error object** from the console and share it for debugging.

---

## Common Issues

### Issue 1: "relation 'public.users' does not exist"
**Solution:** The migration wasn't executed. Run the SQL script again.

### Issue 2: "new row violates row-level security policy"
**Solution:** The RLS policy for anon inserts is missing. Run this:
```sql
DROP POLICY IF EXISTS "Allow anon insert for registration" ON public.users;
CREATE POLICY "Allow anon insert for registration"
ON public.users FOR INSERT
TO anon
WITH CHECK (true);
```

### Issue 3: "duplicate key value violates unique constraint"
**Solution:** The email or user ID already exists. Try a different email.

### Issue 4: Tables created but registration still fails
**Solution:** Check if the `update_updated_at_column()` function exists:
```sql
-- Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';
```

---

## Code Changes Made

### File: `contexts/auth-context.tsx`

**Improvements:**
1. ✅ Better error logging (shows full error object)
2. ✅ Explicit `created_at` and `updated_at` timestamps
3. ✅ Console logs for debugging each step
4. ✅ Descriptive error messages with hints
5. ✅ Handles null phone numbers correctly

**Key changes:**
- Line 125-139: Explicit timestamp and null handling
- Line 141-147: Detailed error logging
- Line 153-155: Better error message formatting

---

## Next Steps After Migration

1. ✅ Test user registration
2. ✅ Test user login
3. ✅ Test onboarding wizard (/onboarding)
4. ✅ Create first customer and property
5. ✅ Add team members
6. ✅ Test permissions

---

## Support

If you continue to see errors after running the migration:

1. **Copy the full error from console** (right-click > Copy object)
2. **Run this diagnostic query** in Supabase SQL Editor:
   ```sql
   -- Check users table structure
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'users'
   ORDER BY ordinal_position;

   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```
3. **Share the results** for further debugging

---

## Database Schema Diagram

```
auth.users (Supabase Auth)
    ↓
public.users (Profile)
    ↓
team_members ←→ customers
    ↓              ↓
property_access  properties
    ↓              ↓
    └──────→ devices
```
