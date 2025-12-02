'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCustomer } from '@/contexts/customer-context'
import { supabase } from '@/lib/supabase-client'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Settings, User, Bell, Building2, AlertCircle, Save } from 'lucide-react'

// Phone formatting utility
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

const unformatPhone = (value: string): string => value.replace(/\D/g, '')

const formatDocument = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    // CPF
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
  } else {
    // CNPJ
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
  }
}

export default function ConfiguracoesPage() {
  const { user, supabaseUser } = useAuth()
  const { selectedCustomer, refreshCustomers } = useCustomer()
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'customer'>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Account form
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Customer form
  const [customerName, setCustomerName] = useState('')
  const [customerDocument, setCustomerDocument] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  // Notifications form
  const [whatsappNotifications, setWhatsappNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [silentStart, setSilentStart] = useState('22:00')
  const [silentEnd, setSilentEnd] = useState('07:00')

  useEffect(() => {
    if (user) {
      setFullName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone ? formatPhone(user.phone) : '')
      setWhatsappNotifications(user.whatsapp_opt_in)
    }
  }, [user])

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.name)
      setCustomerDocument(selectedCustomer.document ? formatDocument(selectedCustomer.document) : '')
      setCustomerPhone(selectedCustomer.phone ? formatPhone(selectedCustomer.phone) : '')
      setCustomerEmail(selectedCustomer.email || '')
    }
  }, [selectedCustomer])

  const handleSaveAccount = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!fullName.trim()) throw new Error('Nome é obrigatório')
      const phoneNumbers = unformatPhone(phone)
      if (phone && phoneNumbers.length !== 11) {
        throw new Error('Celular deve ter 11 dígitos')
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: fullName,
          phone: phoneNumbers || null
        })
        .eq('id', supabaseUser!.id)

      if (updateError) throw updateError

      setSuccess('Dados da conta atualizados com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCustomer = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!customerName.trim()) throw new Error('Nome da empresa é obrigatório')
      const phoneNumbers = unformatPhone(customerPhone)
      if (customerPhone && phoneNumbers.length !== 11) {
        throw new Error('Celular deve ter 11 dígitos')
      }
      const docNumbers = unformatPhone(customerDocument)
      if (customerDocument && docNumbers.length !== 11 && docNumbers.length !== 14) {
        throw new Error('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          name: customerName,
          email: customerEmail || null,
          phone: phoneNumbers || null,
          document: docNumbers || null
        })
        .eq('id', selectedCustomer!.id)

      if (updateError) throw updateError

      await refreshCustomers()
      setSuccess('Dados da empresa atualizados com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          whatsapp_opt_in: whatsappNotifications
        })
        .eq('id', supabaseUser!.id)

      if (updateError) throw updateError

      setSuccess('Preferências de notificação atualizadas!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Settings className="h-8 w-8 text-green-600" />
              Configurações
            </h2>
            <p className="text-gray-600">
              Gerencie suas preferências e informações da conta
            </p>
          </div>

          {(error || success) && (
            <div className={`mb-6 p-4 rounded-lg border flex items-start gap-2 ${
              error
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                error ? 'text-red-600' : 'text-green-600'
              }`} />
              <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
                {error || success}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'account'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Minha Conta
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'customer'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Empresa
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'notifications'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="h-4 w-4 inline mr-2" />
              Notificações
            </button>
          </div>

          {/* Account Tab */}
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Celular</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveAccount}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Tab */}
          {activeTab === 'customer' && (
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>
                  Informações da empresa ou fazenda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome da Empresa/Fazenda</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerDocument">CPF/CNPJ</Label>
                  <Input
                    id="customerDocument"
                    value={customerDocument}
                    onChange={(e) => setCustomerDocument(formatDocument(e.target.value))}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    maxLength={18}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email da Empresa</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefone da Empresa</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveCustomer}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Gerencie como você recebe notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="whatsapp"
                      checked={whatsappNotifications}
                      onCheckedChange={(checked) => setWhatsappNotifications(checked as boolean)}
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <Label htmlFor="whatsapp" className="cursor-pointer font-medium">
                        Notificações no WhatsApp
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Receba alertas sobre suas máquinas e eventos importantes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="email"
                      checked={emailNotifications}
                      onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <Label htmlFor="email" className="cursor-pointer font-medium">
                        Notificações por Email
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Receba resumos diários e relatórios por email
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Horário de Silêncio</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Defina um período em que você não deseja receber notificações
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="silentStart">Início</Label>
                      <Input
                        id="silentStart"
                        type="time"
                        value={silentStart}
                        onChange={(e) => setSilentStart(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="silentEnd">Término</Label>
                      <Input
                        id="silentEnd"
                        type="time"
                        value={silentEnd}
                        onChange={(e) => setSilentEnd(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Preferências'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
