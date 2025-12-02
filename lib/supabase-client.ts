import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  phone_country_code: string | null
  avatar_url: string | null
  whatsapp_opt_in: boolean
  created_at: string
}

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  document: string | null
  whatsapp_opt_in: boolean
  plan_type: string
  plan_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: number
  customer_id: number
  name: string
  address: string | null
  city: string | null
  state: string | null
  size_hectares: number | null
  created_at: string
  updated_at: string
}

export interface Device {
  id: number
  property_id: number
  traccar_device_id: number
  traccar_unique_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface UserPermission {
  id: number
  customer_id: number
  user_id: string
  role: 'owner' | 'manager' | 'operator' | 'viewer'
  can_edit_devices: boolean
  can_delete_devices: boolean
  can_manage_team: boolean
  can_view_history: boolean
  created_at: string
  updated_at: string
}

// Alias for backwards compatibility
export type TeamMember = UserPermission

export interface PropertyAccess {
  id: number
  team_member_id: number
  property_id: number
  created_at: string
}
