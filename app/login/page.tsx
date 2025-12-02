'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tractor, Mail, Lock, AlertCircle } from 'lucide-react'
import { logRedirect } from '@/lib/redirect-debugger'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, supabaseUser, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(false)
  const hasCheckedRef = useRef(false)

  // Redirect if already logged in - check if user needs onboarding
  useEffect(() => {
    const checkUserSetup = async () => {
      // Prevent multiple checks
      if (hasCheckedRef.current) {
        console.log('⚠️ [Login Page] Already checked user setup, skipping')
        return
      }

      if (!authLoading && supabaseUser && !checkingSetup) {
        hasCheckedRef.current = true
        setCheckingSetup(true)
        console.log('👤 [Login Page] User authenticated, checking setup...', {
          userId: supabaseUser.id,
          email: supabaseUser.email
        })

        try {
          // Check if user has any customer association
          const { data: teamMember, error: teamError } = await supabase
            .from('user_permissions')
            .select('customer_id')
            .eq('user_id', supabaseUser.id)
            .limit(1)
            .maybeSingle()

          if (teamError) {
            console.error('❌ [Login Page] Error checking team membership:', teamError)
          }

          console.log('👤 [Login Page] Team member check:', {
            hasTeamMember: !!teamMember,
            customerId: teamMember?.customer_id
          })

          if (!teamMember) {
            console.log('🆕 [Login Page] New user - redirecting to /onboarding')
            const canRedirect = logRedirect('/onboarding', 'Login Page - New User', {
              hasSession: true,
              hasUser: !!supabaseUser,
              hasCustomer: false
            })
            if (canRedirect) {
              router.push('/onboarding')
            }
          } else {
            console.log('✅ [Login Page] User has customer - redirecting to /')
            const canRedirect = logRedirect('/', 'Login Page - Has Customer', {
              hasSession: true,
              hasUser: !!supabaseUser,
              hasCustomer: true
            })
            if (canRedirect) {
              router.push('/')
            }
          }
        } catch (err) {
          console.error('❌ [Login Page] Error during setup check:', err)
          // On error, try dashboard anyway
          const canRedirect = logRedirect('/', 'Login Page - Error Recovery', {
            hasSession: true,
            hasUser: !!supabaseUser,
            hasCustomer: false
          })
          if (canRedirect) {
            router.push('/')
          }
        } finally {
          setCheckingSetup(false)
        }
      }
    }

    checkUserSetup()
  }, [supabaseUser, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔐 Attempting login...')
    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      console.error('❌ Login failed:', signInError)
      setError(signInError)
      setLoading(false)
    } else {
      console.log('✅ Login successful, checking if user needs onboarding...')

      // Check if user has customer/property setup
      // If not, redirect to onboarding
      // The useEffect will handle the redirect when supabaseUser is set
    }
  }

  if (authLoading || checkingSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {checkingSetup ? 'Verificando configuração...' : 'Carregando...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
            <Tractor className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            AgroTrack
          </CardTitle>
          <CardDescription className="text-base">
            Entre com sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-600/30"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <a
                  href="/register"
                  className="font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                  Criar conta
                </a>
              </p>
            </div>

            {/* Force Logout Button */}
            <div className="text-center pt-4 border-t mt-4">
              <p className="text-xs text-gray-500 mb-2">
                Problemas com login? Clique abaixo para limpar todas as sessões
              </p>
              <a
                href="/logout"
                className="inline-block px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                🚪 Forçar Logout Completo
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
