-- ============================================
-- AGROTRACK SAAS - COMPLETE DATABASE SCHEMA
-- Execute this script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  phone VARCHAR(20),
  phone_country_code VARCHAR(10),
  avatar_url TEXT,
  whatsapp_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow anon users to insert (for registration)
DROP POLICY IF EXISTS "Allow anon insert for registration" ON public.users;
CREATE POLICY "Allow anon insert for registration"
ON public.users FOR INSERT
TO anon
WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================
-- 2. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  document VARCHAR(20), -- CPF or CNPJ
  whatsapp_opt_in BOOLEAN DEFAULT false,
  plan_type VARCHAR(50) DEFAULT 'free', -- free, basic, pro, enterprise
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see customers they're members of
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers"
ON public.customers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.customer_id = customers.id
    AND team_members.user_id = auth.uid()
  )
);

-- Only owners can insert/update customers
DROP POLICY IF EXISTS "Owners can insert customers" ON public.customers;
CREATE POLICY "Owners can insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be restricted by team_members

DROP POLICY IF EXISTS "Owners can update customers" ON public.customers;
CREATE POLICY "Owners can update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.customer_id = customers.id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'owner'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_document ON public.customers(document);

-- ============================================
-- 3. TEAM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- owner, manager, operator, viewer
  can_edit_devices BOOLEAN DEFAULT false,
  can_delete_devices BOOLEAN DEFAULT false,
  can_manage_team BOOLEAN DEFAULT false,
  can_view_history BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(customer_id, user_id)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
CREATE POLICY "Users can view team members"
ON public.team_members FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT customer_id FROM public.team_members
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can manage team" ON public.team_members;
CREATE POLICY "Owners can manage team"
ON public.team_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.customer_id = team_members.customer_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'owner'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_customer ON public.team_members(customer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- ============================================
-- 4. PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.properties (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  size_hectares NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view properties" ON public.properties;
CREATE POLICY "Users can view properties"
ON public.properties FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT customer_id FROM public.team_members
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can manage properties" ON public.properties;
CREATE POLICY "Owners can manage properties"
ON public.properties FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.customer_id = properties.customer_id
    AND team_members.user_id = auth.uid()
    AND team_members.role = 'owner'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_customer ON public.properties(customer_id);

-- ============================================
-- 5. PROPERTY ACCESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_access (
  id BIGSERIAL PRIMARY KEY,
  team_member_id BIGINT NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  property_id BIGINT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(team_member_id, property_id)
);

-- Enable RLS
ALTER TABLE public.property_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view property access" ON public.property_access;
CREATE POLICY "Users can view property access"
ON public.property_access FOR SELECT
TO authenticated
USING (
  team_member_id IN (
    SELECT id FROM public.team_members
    WHERE customer_id IN (
      SELECT customer_id FROM public.team_members
      WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Owners can manage property access" ON public.property_access;
CREATE POLICY "Owners can manage property access"
ON public.property_access FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.team_members tm2 ON tm2.customer_id = tm.customer_id
    WHERE tm2.id = property_access.team_member_id
    AND tm.user_id = auth.uid()
    AND tm.role = 'owner'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_access_team_member ON public.property_access(team_member_id);
CREATE INDEX IF NOT EXISTS idx_property_access_property ON public.property_access(property_id);

-- ============================================
-- 6. DEVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.devices (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  traccar_device_id INTEGER NOT NULL UNIQUE,
  traccar_unique_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view devices" ON public.devices;
CREATE POLICY "Users can view devices"
ON public.devices FOR SELECT
TO authenticated
USING (
  property_id IN (
    SELECT property_id FROM public.property_access
    WHERE team_member_id IN (
      SELECT id FROM public.team_members
      WHERE user_id = auth.uid()
    )
  )
  OR
  property_id IN (
    SELECT id FROM public.properties
    WHERE customer_id IN (
      SELECT customer_id FROM public.team_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'manager')
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_devices_property ON public.devices(property_id);
CREATE INDEX IF NOT EXISTS idx_devices_traccar_id ON public.devices(traccar_device_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Customers trigger
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Team members trigger
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Properties trigger
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Devices trigger
DROP TRIGGER IF EXISTS update_devices_updated_at ON public.devices;
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.users IS 'User profiles linked to auth.users';
COMMENT ON TABLE public.customers IS 'Companies/farms in the multi-tenant system';
COMMENT ON TABLE public.team_members IS 'Team members with roles and permissions';
COMMENT ON TABLE public.properties IS 'Properties/farms belonging to customers';
COMMENT ON TABLE public.property_access IS 'Property-level access control for team members';
COMMENT ON TABLE public.devices IS 'GPS tracking devices linked to properties';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
