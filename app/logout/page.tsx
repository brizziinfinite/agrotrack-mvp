'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const forceLogout = async () => {
      console.log('🚪 [FORCE LOGOUT] Starting complete logout...')

      try {
        // 1. Sign out from Supabase
        console.log('🚪 [FORCE LOGOUT] Signing out from Supabase...')
        await supabase.auth.signOut()

        // 2. Clear localStorage
        console.log('🚪 [FORCE LOGOUT] Clearing localStorage...')
        localStorage.clear()

        // 3. Clear sessionStorage
        console.log('🚪 [FORCE LOGOUT] Clearing sessionStorage...')
        sessionStorage.clear()

        // 4. Clear all cookies
        console.log('🚪 [FORCE LOGOUT] Clearing cookies...')
        const cookies = document.cookie.split(';')
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i]
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
        }

        console.log('✅ [FORCE LOGOUT] Complete! Redirecting to /login...')

        // 5. Force reload to /login to clear all state
        window.location.href = '/login?logout=success'
      } catch (error) {
        console.error('❌ [FORCE LOGOUT] Error during logout:', error)
        // Force redirect anyway
        window.location.href = '/login?logout=error'
      }
    }

    forceLogout()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Desconectando...</p>
        <p className="text-gray-500 text-sm mt-2">Limpando todas as sessões e dados</p>
      </div>
    </div>
  )
}
