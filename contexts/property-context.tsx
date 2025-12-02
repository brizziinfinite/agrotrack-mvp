'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Property } from '@/lib/supabase-client'
import { useAuth } from './auth-context'
import { useCustomer } from './customer-context'

interface PropertyContextType {
  properties: Property[]
  selectedProperty: Property | null
  setSelectedProperty: (property: Property | null) => void
  loading: boolean
  refreshProperties: () => Promise<void>
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined)

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { supabaseUser } = useAuth()
  const { selectedCustomer } = useCustomer()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedPropertyState] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProperties = async () => {
    if (!supabaseUser || !selectedCustomer) {
      setProperties([])
      setSelectedPropertyState(null)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // Get team member to check role
      const { data: teamMember } = await supabase
        .from('user_permissions')
        .select('role, id')
        .eq('user_id', supabaseUser.id)
        .eq('customer_id', selectedCustomer.id)
        .single()

      if (!teamMember) {
        setProperties([])
        setSelectedPropertyState(null)
        setLoading(false)
        return
      }

      if (teamMember.role === 'owner') {
        // Owners see all properties
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('customer_id', selectedCustomer.id)
          .order('name')

        if (error) throw error
        setProperties(data || [])
      } else {
        // Other roles see only allowed properties
        const { data: propertyAccess } = await supabase
          .from('property_access')
          .select('property_id')
          .eq('team_member_id', teamMember.id)

        const propertyIds = propertyAccess?.map(pa => pa.property_id) || []

        if (propertyIds.length === 0) {
          setProperties([])
          setSelectedPropertyState(null)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .in('id', propertyIds)
          .eq('customer_id', selectedCustomer.id)
          .order('name')

        if (error) throw error
        setProperties(data || [])
      }

      // Restore selected property from localStorage or select first
      const savedPropertyId = localStorage.getItem(`selectedPropertyId_${selectedCustomer.id}`)
      let propertyToSelect = null

      if (savedPropertyId) {
        propertyToSelect = properties.find(p => p.id === parseInt(savedPropertyId)) || null
      }

      if (!propertyToSelect && properties.length > 0) {
        propertyToSelect = properties[0]
      }

      setSelectedPropertyState(propertyToSelect)
      if (propertyToSelect) {
        localStorage.setItem(`selectedPropertyId_${selectedCustomer.id}`, propertyToSelect.id.toString())
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
      setProperties([])
      setSelectedPropertyState(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [supabaseUser, selectedCustomer])

  const setSelectedProperty = (property: Property | null) => {
    setSelectedPropertyState(property)
    if (property && selectedCustomer) {
      localStorage.setItem(`selectedPropertyId_${selectedCustomer.id}`, property.id.toString())
    }
  }

  const refreshProperties = async () => {
    await fetchProperties()
  }

  return (
    <PropertyContext.Provider
      value={{
        properties,
        selectedProperty,
        setSelectedProperty,
        loading,
        refreshProperties
      }}
    >
      {children}
    </PropertyContext.Provider>
  )
}

export const useProperty = () => {
  const context = useContext(PropertyContext)
  if (context === undefined) {
    throw new Error('useProperty must be used within a PropertyProvider')
  }
  return context
}
