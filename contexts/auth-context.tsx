'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, User } from '@/lib/supabase-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: SignUpData) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface SignUpData {
  email: string
  password: string
  name: string
  phone: string
  whatsappOptIn: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch user profile from users table
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setUser(data)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 [Auth Context] Initializing auth...')
      const { data: { session } } = await supabase.auth.getSession()

      console.log('🔐 [Auth Context] Session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      })

      if (session?.user) {
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id)
      }

      setLoading(false)
      console.log('🔐 [Auth Context] Initialization complete')
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [Auth Context] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        })

        if (session?.user) {
          setSupabaseUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setSupabaseUser(null)
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [Auth Context] Signing in user:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ [Auth Context] Sign in error:', error.message)
        return { error: error.message }
      }

      console.log('✅ [Auth Context] Sign in successful:', data.user?.id)

      if (data.user) {
        await fetchUserProfile(data.user.id)
      }

      return { error: null }
    } catch (err: any) {
      console.error('❌ [Auth Context] Unexpected sign in error:', err)
      return { error: err.message || 'Erro ao fazer login' }
    }
  }

  const signUp = async ({ email, password, name, phone, whatsappOptIn }: SignUpData) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (authError) {
        console.error('❌ Auth signup error:', authError)
        return { error: authError.message }
      }

      if (!authData.user) {
        console.error('❌ No user data returned from signup')
        return { error: 'Erro ao criar usuário' }
      }

      console.log('✅ Auth user created:', authData.user.id)

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          phone: phone || null,
          phone_country_code: null,
          avatar_url: null,
          whatsapp_opt_in: whatsappOptIn
        })

      if (profileError) {
        console.error('❌ Profile creation error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })

        // Note: Auth user was created but profile creation failed
        // User will need to complete onboarding or contact support
        console.warn('⚠️  Auth user created but profile creation failed. User ID:', authData.user.id)

        return {
          error: `Erro ao criar perfil: ${profileError.message}${profileError.hint ? ` (Dica: ${profileError.hint})` : ''}`
        }
      }

      console.log('✅ User profile created successfully')
      return { error: null }
    } catch (err: any) {
      console.error('❌ Unexpected signup error:', err)
      return { error: err.message || 'Erro ao criar conta' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSupabaseUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    if (supabaseUser) {
      await fetchUserProfile(supabaseUser.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
