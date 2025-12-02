'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, UserPermission } from '@/lib/supabase-client'
import { useAuth } from './auth-context'
import { useCustomer } from './customer-context'

interface PermissionsContextType {
  permissions: UserPermission | null
  propertyIds: number[]
  isOwner: boolean
  isManager: boolean
  isOperator: boolean
  isViewer: boolean
  canEditDevices: boolean
  canDeleteDevices: boolean
  canManageTeam: boolean
  canViewHistory: boolean
  hasPropertyAccess: (propertyId: number) => boolean
  loading: boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { supabaseUser } = useAuth()
  const { selectedCustomer } = useCustomer()
  const [permissions, setPermissions] = useState<UserPermission | null>(null)
  const [propertyIds, setPropertyIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    if (!supabaseUser || !selectedCustomer) {
      setPermissions(null)
      setPropertyIds([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // Get team member record
      const { data: teamMember, error: teamError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .eq('customer_id', selectedCustomer.id)
        .single()

      if (teamError) throw teamError

      setPermissions(teamMember)

      // Get property access
      if (teamMember.role !== 'owner') {
        const { data: propertyAccess, error: accessError } = await supabase
          .from('property_access')
          .select('property_id')
          .eq('team_member_id', teamMember.id)

        if (accessError) throw accessError

        setPropertyIds(propertyAccess?.map(pa => pa.property_id) || [])
      } else {
        // Owners have access to all properties - we'll fetch them when needed
        setPropertyIds([])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setPermissions(null)
      setPropertyIds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [supabaseUser, selectedCustomer])

  const refreshPermissions = async () => {
    await fetchPermissions()
  }

  const hasPropertyAccess = (propertyId: number): boolean => {
    if (!permissions) return false
    if (permissions.role === 'owner') return true
    return propertyIds.includes(propertyId)
  }

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        propertyIds,
        isOwner: permissions?.role === 'owner',
        isManager: permissions?.role === 'manager',
        isOperator: permissions?.role === 'operator',
        isViewer: permissions?.role === 'viewer',
        canEditDevices: permissions?.can_edit_devices || false,
        canDeleteDevices: permissions?.can_delete_devices || false,
        canManageTeam: permissions?.can_manage_team || false,
        canViewHistory: permissions?.can_view_history || false,
        hasPropertyAccess,
        loading,
        refreshPermissions
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider')
  }
  return context
}
