'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Customer } from '@/lib/supabase-client'
import { useAuth } from './auth-context'

interface CustomerContextType {
  customers: Customer[]
  selectedCustomer: Customer | null
  setSelectedCustomer: (customer: Customer | null) => void
  loading: boolean
  refreshCustomers: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { supabaseUser } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomerState] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async () => {
    if (!supabaseUser) {
      console.log('📋 No supabase user, skipping customer fetch')
      setCustomers([])
      setSelectedCustomerState(null)
      setLoading(false)
      return
    }

    console.log('📋 Fetching customers for user:', supabaseUser.id)
    setLoading(true)

    try {
      // Get team memberships
      const { data: teamMembers, error: teamError } = await supabase
        .from('user_permissions')
        .select('customer_id, role')
        .eq('user_id', supabaseUser.id)

      if (teamError) throw teamError

      console.log('📋 Team memberships found:', teamMembers?.length || 0)

      if (!teamMembers || teamMembers.length === 0) {
        console.log('⚠️  User has no team memberships - needs onboarding')
        setCustomers([])
        setSelectedCustomerState(null)
        setLoading(false)
        return
      }

      // Get customers
      const customerIds = teamMembers.map(tm => tm.customer_id)
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds)
        .order('name')

      if (customersError) throw customersError

      setCustomers(customersData || [])

      // Restore selected customer from localStorage or select first
      const savedCustomerId = localStorage.getItem('selectedCustomerId')
      let customerToSelect = null

      if (savedCustomerId) {
        customerToSelect = customersData?.find(c => c.id === parseInt(savedCustomerId)) || null
      }

      if (!customerToSelect && customersData && customersData.length > 0) {
        customerToSelect = customersData[0]
      }

      setSelectedCustomerState(customerToSelect)
      if (customerToSelect) {
        localStorage.setItem('selectedCustomerId', customerToSelect.id.toString())
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
      setSelectedCustomerState(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [supabaseUser])

  const setSelectedCustomer = (customer: Customer | null) => {
    setSelectedCustomerState(customer)
    if (customer) {
      localStorage.setItem('selectedCustomerId', customer.id.toString())
    } else {
      localStorage.removeItem('selectedCustomerId')
    }
  }

  const refreshCustomers = async () => {
    await fetchCustomers()
  }

  return (
    <CustomerContext.Provider
      value={{
        customers,
        selectedCustomer,
        setSelectedCustomer,
        loading,
        refreshCustomers
      }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export const useCustomer = () => {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}
