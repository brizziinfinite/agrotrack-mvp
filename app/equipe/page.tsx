'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useCustomer } from '@/contexts/customer-context'
import { usePermissions } from '@/contexts/permissions-context'
import { supabase } from '@/lib/supabase-client'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, Plus, Edit, Trash2, Crown, UserCog, Eye, Shield, AlertCircle, X, Mail, Phone as PhoneIcon, MapPin } from 'lucide-react'

// Phone formatting utility
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
}

const unformatPhone = (value: string): string => value.replace(/\D/g, '')

interface TeamMemberData {
  id: number
  user_id: string
  role: string
  can_edit_devices: boolean
  can_delete_devices: boolean
  can_manage_team: boolean
  can_view_history: boolean
  user: {
    name: string
    email: string
    phone: string | null
    whatsapp_opt_in: boolean
  }
  property_access: Array<{
    property_id: number
    property: {
      id: number
      name: string
    }
  }>
}

const roleConfig = {
  owner: { label: 'Dono', icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  manager: { label: 'Gerente', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  operator: { label: 'Operador', icon: UserCog, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  viewer: { label: 'Visitante', icon: Eye, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
}

export default function EquipePage() {
  const router = useRouter()
  const { supabaseUser } = useAuth()
  const { selectedCustomer } = useCustomer()
  const { isOwner } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([])
  const [properties, setProperties] = useState<Array<{ id: number; name: string }>>([])
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMemberData | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState(true)
  const [formRole, setFormRole] = useState<'manager' | 'operator' | 'viewer'>('operator')
  const [formProperties, setFormProperties] = useState<number[]>([])
  const [formCanEdit, setFormCanEdit] = useState(true)
  const [formCanDelete, setFormCanDelete] = useState(false)
  const [formCanView, setFormCanView] = useState(true)
  const [saving, setSaving] = useState(false)

  // Redirect if not owner
  useEffect(() => {
    if (!isOwner && !loading) {
      router.push('/')
    }
  }, [isOwner, loading, router])

  // Fetch team members and properties
  useEffect(() => {
    if (!selectedCustomer) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch team members with user data and property access
        const { data: members, error: membersError } = await supabase
          .from('user_permissions')
          .select(`
            *,
            user:users!user_permissions_user_id_fkey (
              name,
              email,
              phone,
              whatsapp_opt_in
            ),
            property_access (
              property_id,
              property:properties (
                id,
                name
              )
            )
          `)
          .eq('customer_id', selectedCustomer.id)
          .order('created_at', { ascending: true })

        if (membersError) throw membersError

        setTeamMembers(members || [])

        // Fetch properties
        const { data: props, error: propsError } = await supabase
          .from('properties')
          .select('id, name')
          .eq('customer_id', selectedCustomer.id)
          .order('name')

        if (propsError) throw propsError

        setProperties(props || [])

      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCustomer])

  const handleOpenModal = (member?: TeamMemberData) => {
    if (member) {
      setEditingMember(member)
      setFormName(member.user.name)
      setFormEmail(member.user.email)
      setFormPhone(member.user.phone ? formatPhone(member.user.phone) : '')
      setFormWhatsapp(member.user.whatsapp_opt_in)
      setFormRole(member.role as any)
      setFormProperties(member.property_access?.map(pa => pa.property_id) || [])
      setFormCanEdit(member.can_edit_devices)
      setFormCanDelete(member.can_delete_devices)
      setFormCanView(member.can_view_history)
    } else {
      setEditingMember(null)
      setFormName('')
      setFormEmail('')
      setFormPhone('')
      setFormWhatsapp(true)
      setFormRole('operator')
      setFormProperties([])
      setFormCanEdit(true)
      setFormCanDelete(false)
      setFormCanView(true)
    }
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMember(null)
    setError('')
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)

    try {
      // Validation
      if (!formName.trim()) throw new Error('Nome é obrigatório')
      if (!formEmail.trim()) throw new Error('Email é obrigatório')
      const phoneNumbers = unformatPhone(formPhone)
      if (formPhone && phoneNumbers.length !== 11) {
        throw new Error('Celular deve ter 11 dígitos')
      }
      // All roles except owner need at least one property assigned
      if (formProperties.length === 0) {
        throw new Error('Selecione pelo menos uma propriedade')
      }

      if (editingMember) {
        // Update existing member
        const { error: updateError } = await supabase
          .from('user_permissions')
          .update({
            role: formRole,
            can_edit_devices: formCanEdit,
            can_delete_devices: formCanDelete,
            can_manage_team: false,
            can_view_history: formCanView
          })
          .eq('id', editingMember.id)

        if (updateError) throw updateError

        // Update user data
        const { error: userError } = await supabase
          .from('users')
          .update({
            name: formName,
            phone: phoneNumbers || null,
            whatsapp_opt_in: formWhatsapp
          })
          .eq('id', editingMember.user_id)

        if (userError) throw userError

        // Update property access
        // Delete old access
        await supabase
          .from('property_access')
          .delete()
          .eq('team_member_id', editingMember.id)

        // Insert new access
        if (formProperties.length > 0) {
          const accessRecords = formProperties.map(propId => ({
            team_member_id: editingMember.id,
            property_id: propId
          }))

          const { error: accessError } = await supabase
            .from('property_access')
            .insert(accessRecords)

          if (accessError) throw accessError
        }

        // Refresh data
        window.location.reload()
      } else {
        // Create new member - first check if user exists
        let userId = null

        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', formEmail.toLowerCase())
          .single()

        if (existingUser) {
          userId = existingUser.id
        } else {
          // Create invite - in a real app, you'd send an email/SMS
          // For now, we'll just create a placeholder
          throw new Error('Convites por email ainda não implementados. Use um email de usuário existente.')
        }

        // Create team member
        const { data: newMember, error: memberError } = await supabase
          .from('user_permissions')
          .insert({
            customer_id: selectedCustomer!.id,
            user_id: userId,
            role: formRole,
            can_edit_devices: formCanEdit,
            can_delete_devices: formCanDelete,
            can_manage_team: false,
            can_view_history: formCanView
          })
          .select()
          .single()

        if (memberError) throw memberError

        // Add property access
        if (formProperties.length > 0) {
          const accessRecords = formProperties.map(propId => ({
            team_member_id: newMember.id,
            property_id: propId
          }))

          const { error: accessError } = await supabase
            .from('property_access')
            .insert(accessRecords)

          if (accessError) throw accessError
        }

        // Refresh data
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handleDelete = async (memberId: number) => {
    if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return

    try {
      // Delete property access first
      await supabase
        .from('property_access')
        .delete()
        .eq('team_member_id', memberId)

      // Delete team member
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      // Refresh
      setTeamMembers(teamMembers.filter(m => m.id !== memberId))
    } catch (err: any) {
      alert('Erro ao remover membro: ' + err.message)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando equipe...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              Gerenciar Equipe
            </h2>
            <p className="text-gray-600">
              Adicione membros e gerencie permissões de acesso
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Card className="mb-8">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>
                  {teamMembers.length} {teamMembers.length === 1 ? 'membro' : 'membros'} cadastrados
                </CardDescription>
              </div>
              <Button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {teamMembers.map((member) => {
                  const roleInfo = roleConfig[member.role as keyof typeof roleConfig]
                  const RoleIcon = roleInfo.icon

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {member.user.name}
                            </h3>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${roleInfo.bg} ${roleInfo.color} ${roleInfo.border} border`}>
                              <RoleIcon className="h-3 w-3" />
                              {roleInfo.label}
                            </div>
                            {member.user.whatsapp_opt_in && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                <PhoneIcon className="h-3 w-3" />
                                WhatsApp
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.user.email}
                            </span>
                            {member.user.phone && (
                              <span className="flex items-center gap-1">
                                <PhoneIcon className="h-3 w-3" />
                                {formatPhone(member.user.phone)}
                              </span>
                            )}
                          </div>
                          {member.property_access && member.property_access.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {member.property_access.map((pa) => (
                                <span
                                  key={pa.property_id}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                                >
                                  {pa.property.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {member.role !== 'owner' && member.user_id !== supabaseUser?.id && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {teamMembers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum membro cadastrado ainda.</p>
                    <p className="text-sm mt-2">
                      Adicione membros à sua equipe para começar.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
                </CardTitle>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={saving || !!editingMember}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={saving || !!editingMember}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Celular</Label>
                <Input
                  id="phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  disabled={saving}
                />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="whatsapp"
                  checked={formWhatsapp}
                  onCheckedChange={(checked) => setFormWhatsapp(checked as boolean)}
                  disabled={saving}
                />
                <Label htmlFor="whatsapp" className="text-sm cursor-pointer">
                  Enviar convite por WhatsApp
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Função *</Label>
                <div className="space-y-2">
                  {['manager', 'operator', 'viewer'].map((role) => {
                    const roleInfo = roleConfig[role as keyof typeof roleConfig]
                    const RoleIcon = roleInfo.icon
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formRole === role
                            ? `${roleInfo.border} ${roleInfo.bg}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={formRole === role}
                          onChange={(e) => setFormRole(e.target.value as any)}
                          disabled={saving}
                          className="sr-only"
                        />
                        <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{roleInfo.label}</div>
                          <div className="text-xs text-gray-500">
                            {role === 'manager' && 'Acesso a múltiplas propriedades'}
                            {role === 'operator' && 'Pode visualizar e editar'}
                            {role === 'viewer' && 'Apenas visualização'}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Acesso às Propriedades *</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {properties.map((prop) => (
                    <label
                      key={prop.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <Checkbox
                        checked={formProperties.includes(prop.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormProperties([...formProperties, prop.id])
                          } else {
                            setFormProperties(formProperties.filter(id => id !== prop.id))
                          }
                        }}
                        disabled={saving}
                      />
                      <span className="text-sm">{prop.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formCanEdit}
                      onCheckedChange={(checked) => setFormCanEdit(checked as boolean)}
                      disabled={saving}
                    />
                    <span className="text-sm">Pode editar máquinas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formCanDelete}
                      onCheckedChange={(checked) => setFormCanDelete(checked as boolean)}
                      disabled={saving}
                    />
                    <span className="text-sm">Pode deletar máquinas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formCanView}
                      onCheckedChange={(checked) => setFormCanView(checked as boolean)}
                      disabled={saving}
                    />
                    <span className="text-sm">Pode ver histórico</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {saving ? 'Salvando...' : editingMember ? 'Salvar Alterações' : 'Adicionar Membro'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
