'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase-client'
import { logRedirect } from '@/lib/redirect-debugger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tractor, Building2, MapPin, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'

// Phone and document formatting utilities
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

const formatDocument = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  } else {
    // CNPJ: 00.000.000/0000-00
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
  }
}

const unformat = (value: string): string => value.replace(/\D/g, '')

const iconOptions = [
  { emoji: '🚜', label: 'Trator' },
  { emoji: '🚛', label: 'Caminhão' },
  { emoji: '🚐', label: 'Van' },
  { emoji: '🚙', label: 'Carro' },
  { emoji: '🏍️', label: 'Moto' },
  { emoji: '🐄', label: 'Gado' },
  { emoji: '🐴', label: 'Cavalo' },
  { emoji: '📦', label: 'Equipamento' },
]

export default function OnboardingPage() {
  console.log('🎯 [Onboarding] ========================================')
  console.log('🎯 [Onboarding] PAGE COMPONENT RENDERING')
  console.log('🎯 [Onboarding] ========================================')

  const router = useRouter()
  const { user, supabaseUser, loading: authLoading } = useAuth()

  console.log('🎯 [Onboarding] Initial state:', {
    hasUser: !!user,
    hasSupabaseUser: !!supabaseUser,
    authLoading,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  })

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Customer data
  const [customerName, setCustomerName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappOptIn, setWhatsappOptIn] = useState(true)

  // Step 2: Property data
  const [propertyName, setPropertyName] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [propertyCity, setPropertyCity] = useState('')
  const [propertyState, setPropertyState] = useState('')
  const [propertySize, setPropertySize] = useState('')

  // Step 3: Tracker data
  const [skipTracker, setSkipTracker] = useState(false)
  const [trackerName, setTrackerName] = useState('')
  const [trackerImei, setTrackerImei] = useState('')
  const [trackerIcon, setTrackerIcon] = useState('🚜')
  const hasCheckedCustomerRef = useRef(false)

  // Check if user already has a customer
  useEffect(() => {
    const checkExistingCustomer = async () => {
      // Prevent multiple checks
      if (hasCheckedCustomerRef.current) {
        console.log('⚠️ [Onboarding] Already checked for existing customer, skipping')
        return
      }

      console.log('🎯 [Onboarding] Checking if user has existing customer...', {
        hasUser: !!supabaseUser,
        userId: supabaseUser?.id,
        authLoading
      })

      if (!supabaseUser) {
        console.log('⚠️ [Onboarding] No supabase user found')
        return
      }

      hasCheckedCustomerRef.current = true

      const { data: teamMembers, error } = await supabase
        .from('user_permissions')
        .select('customer_id')
        .eq('user_id', supabaseUser.id)

      if (error) {
        console.error('❌ [Onboarding] Error checking team memberships:', error)
        return
      }

      console.log('🎯 [Onboarding] Team memberships check:', {
        count: teamMembers?.length || 0,
        teamMembers
      })

      if (teamMembers && teamMembers.length > 0) {
        // User already has a customer, redirect to dashboard
        console.log('✅ [Onboarding] User has customer - redirecting to /')
        const canRedirect = logRedirect('/', 'Onboarding - User Has Customer', {
          hasSession: true,
          hasUser: !!supabaseUser,
          hasCustomer: true
        })
        if (canRedirect) {
          router.push('/')
        }
      } else {
        console.log('🆕 [Onboarding] User has no customer - staying on onboarding page')
      }
    }

    if (!authLoading && supabaseUser) {
      checkExistingCustomer()
    }
  }, [supabaseUser, authLoading, router])

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.phone) {
      setPhone(formatPhone(user.phone))
    }
    if (user?.whatsapp_opt_in !== undefined) {
      setWhatsappOptIn(user.whatsapp_opt_in)
    }
  }, [user])

  const validateStep1 = () => {
    if (!customerName.trim()) {
      setError('Nome da empresa/fazenda é obrigatório')
      return false
    }
    const documentNumbers = unformat(document)
    if (documentNumbers.length !== 11 && documentNumbers.length !== 14) {
      setError('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
      return false
    }
    const phoneNumbers = unformat(phone)
    if (phoneNumbers.length !== 11) {
      setError('Celular deve ter 11 dígitos: (XX) XXXXX-XXXX')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!propertyName.trim()) {
      setError('Nome da fazenda é obrigatório')
      return false
    }
    if (!propertyAddress.trim()) {
      setError('Endereço é obrigatório')
      return false
    }
    if (!propertyCity.trim()) {
      setError('Cidade é obrigatória')
      return false
    }
    if (!propertyState.trim()) {
      setError('Estado é obrigatório')
      return false
    }
    if (propertySize && (isNaN(Number(propertySize)) || Number(propertySize) <= 0)) {
      setError('Tamanho deve ser um número positivo')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (skipTracker) return true

    if (!trackerName.trim()) {
      setError('Nome da máquina é obrigatório')
      return false
    }
    if (!trackerImei.trim()) {
      setError('IMEI do rastreador é obrigatório')
      return false
    }
    if (trackerImei.length < 15) {
      setError('IMEI deve ter pelo menos 15 caracteres')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError('')

    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return

    if (step < 4) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setError('')
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    console.log('🎯 [Onboarding] Starting onboarding completion...')
    setLoading(true)
    setError('')

    try {
      if (!supabaseUser) {
        console.error('❌ [Onboarding] No authenticated user')
        throw new Error('Usuário não autenticado')
      }

      console.log('🎯 [Onboarding] Creating customer...')
      // 1. Create Customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerName,
          email: supabaseUser.email,
          phone: unformat(phone),
          document: unformat(document),
          whatsapp_opt_in: whatsappOptIn,
          plan_type: 'trial',
          plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days trial
        })
        .select()
        .single()

      if (customerError) {
        console.error('❌ [Onboarding] Customer creation error:', customerError)
        throw customerError
      }

      console.log('✅ [Onboarding] Customer created:', customer.id)

      // 2. Create Team Member (Owner)
      const { error: teamMemberError } = await supabase
        .from('user_permissions')
        .insert({
          customer_id: customer.id,
          user_id: supabaseUser.id,
          role: 'owner',
          can_edit_devices: true,
          can_delete_devices: true,
          can_manage_team: true,
          can_view_history: true
        })

      if (teamMemberError) {
        console.error('❌ [Onboarding] Team member creation error:', teamMemberError)
        throw teamMemberError
      }

      console.log('✅ [Onboarding] Team member created')

      // 3. Create Property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          customer_id: customer.id,
          name: propertyName,
          address: propertyAddress,
          city: propertyCity,
          state: propertyState,
          size_hectares: propertySize ? Number(propertySize) : null
        })
        .select()
        .single()

      if (propertyError) {
        console.error('❌ [Onboarding] Property creation error:', propertyError)
        throw propertyError
      }

      console.log('✅ [Onboarding] Property created:', property.id)

      // 4. Create Tracker if not skipped
      if (!skipTracker) {
        console.log('🎯 [Onboarding] Creating tracker device...')
        // First create device in Traccar
        const traccarResponse = await fetch('/api/traccar/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trackerName,
            uniqueId: trackerImei,
            category: 'tractor'
          })
        })

        if (!traccarResponse.ok) {
          const errorData = await traccarResponse.json()
          throw new Error(errorData.error || 'Erro ao criar dispositivo no Traccar')
        }

        const { device: traccarDevice } = await traccarResponse.json()

        // Then create device record linking to property
        const { error: deviceError } = await supabase
          .from('devices')
          .insert({
            property_id: property.id,
            traccar_device_id: traccarDevice.id,
            traccar_unique_id: trackerImei,
            name: trackerName
          })

        if (deviceError) {
          console.error('❌ [Onboarding] Device creation error:', deviceError)
          throw deviceError
        }

        console.log('✅ [Onboarding] Device created')

        // Create device metadata
        await supabase
          .from('device_metadata')
          .insert({
            device_id: traccarDevice.id,
            traccar_unique_id: trackerImei,
            name: trackerName,
            icone: trackerIcon,
            cor: '#10b981',
            tipo: 'veiculo'
          })
      }

      // Success! Redirect to dashboard
      console.log('✅ [Onboarding] Onboarding completed successfully! Redirecting to /')
      const canRedirect = logRedirect('/', 'Onboarding - Completed Successfully', {
        hasSession: true,
        hasUser: !!supabaseUser,
        hasCustomer: true
      })
      if (canRedirect) {
        router.push('/')
      }
    } catch (err: any) {
      console.error('❌ [Onboarding] Onboarding error:', err)
      setError(err.message || 'Erro ao concluir cadastro')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step
                      ? 'bg-green-600 text-white'
                      : s === step
                      ? 'bg-green-600 text-white ring-4 ring-green-200'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      s < step ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Dados</span>
            <span>Fazenda</span>
            <span>Rastreador</span>
            <span>Concluir</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg mb-4">
              {step === 1 && <Building2 className="h-8 w-8 text-white" />}
              {step === 2 && <MapPin className="h-8 w-8 text-white" />}
              {step === 3 && <Tractor className="h-8 w-8 text-white" />}
              {step === 4 && <CheckCircle2 className="h-8 w-8 text-white" />}
            </div>
            <CardTitle className="text-2xl">
              {step === 1 && 'Dados da Empresa'}
              {step === 2 && 'Primeira Fazenda'}
              {step === 3 && 'Primeiro Rastreador'}
              {step === 4 && 'Tudo Pronto!'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Informações básicas sobre sua empresa ou fazenda principal'}
              {step === 2 && 'Cadastre sua primeira propriedade no sistema'}
              {step === 3 && 'Adicione seu primeiro rastreador GPS (opcional)'}
              {step === 4 && 'Seu cadastro foi concluído com sucesso'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Step 1: Customer Data */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome da Empresa/Fazenda *</Label>
                  <Input
                    id="customerName"
                    placeholder="Fazenda Santa Inês"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">CPF ou CNPJ *</Label>
                  <Input
                    id="document"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={document}
                    onChange={(e) => setDocument(formatDocument(e.target.value))}
                    disabled={loading}
                    maxLength={18}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Celular *</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    disabled={loading}
                    maxLength={15}
                  />
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="whatsapp"
                    checked={whatsappOptIn}
                    onCheckedChange={(checked) => setWhatsappOptIn(checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="whatsapp" className="text-sm leading-relaxed cursor-pointer">
                    Aceito receber notificações no WhatsApp
                  </Label>
                </div>
              </div>
            )}

            {/* Step 2: Property Data */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyName">Nome da Fazenda *</Label>
                  <Input
                    id="propertyName"
                    placeholder="Fazenda Boa Vista"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyAddress">Endereço Completo *</Label>
                  <Input
                    id="propertyAddress"
                    placeholder="Rod. BR-153, Km 45"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyCity">Cidade *</Label>
                    <Input
                      id="propertyCity"
                      placeholder="Presidente Prudente"
                      value={propertyCity}
                      onChange={(e) => setPropertyCity(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyState">Estado *</Label>
                    <Input
                      id="propertyState"
                      placeholder="SP"
                      value={propertyState}
                      onChange={(e) => setPropertyState(e.target.value.toUpperCase())}
                      disabled={loading}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertySize">Tamanho (hectares)</Label>
                  <Input
                    id="propertySize"
                    type="number"
                    placeholder="1000"
                    value={propertySize}
                    onChange={(e) => setPropertySize(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">Opcional - pode ser preenchido depois</p>
                </div>
              </div>
            )}

            {/* Step 3: Tracker Data */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="skipTracker"
                    checked={skipTracker}
                    onCheckedChange={(checked) => setSkipTracker(checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="skipTracker" className="text-sm leading-relaxed cursor-pointer">
                    Pular esta etapa - vou adicionar rastreadores depois
                  </Label>
                </div>

                {!skipTracker && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="trackerName">Nome da Máquina *</Label>
                      <Input
                        id="trackerName"
                        placeholder="Trator John Deere"
                        value={trackerName}
                        onChange={(e) => setTrackerName(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trackerImei">IMEI do Rastreador *</Label>
                      <Input
                        id="trackerImei"
                        placeholder="123456789012345"
                        value={trackerImei}
                        onChange={(e) => setTrackerImei(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-gray-500">
                        Número de identificação único do rastreador GPS
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Ícone da Máquina</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {iconOptions.map((option) => (
                          <button
                            key={option.emoji}
                            type="button"
                            onClick={() => setTrackerIcon(option.emoji)}
                            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                              trackerIcon === option.emoji
                                ? 'border-green-600 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                            }`}
                            disabled={loading}
                          >
                            <div className="text-3xl mb-1">{option.emoji}</div>
                            <div className="text-xs text-gray-600">{option.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Completion */}
            {step === 4 && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Cadastro Concluído!
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Sua conta foi configurada com sucesso. Você já pode começar a monitorar suas máquinas.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customerName}</p>
                      <p className="text-sm text-gray-500">Cliente cadastrado</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{propertyName}</p>
                      <p className="text-sm text-gray-500">Propriedade criada</p>
                    </div>
                  </div>
                  {!skipTracker && (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                        ✓
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{trackerName}</p>
                        <p className="text-sm text-gray-500">Rastreador configurado</p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-600/30"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Finalizando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Ir para o Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-600/30"
                >
                  {step === 3 ? 'Revisar' : 'Próximo'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
