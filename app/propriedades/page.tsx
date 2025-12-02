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
import { MapPin, Plus, Edit, Trash2, AlertCircle, X, Building2, Tractor } from 'lucide-react'

interface PropertyData {
  id: number
  name: string
  address: string | null
  city: string | null
  state: string | null
  size_hectares: number | null
  created_at: string
  device_count?: number
}

export default function PropriedadesPage() {
  const router = useRouter()
  const { selectedCustomer } = useCustomer()
  const { isOwner } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState<PropertyData | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formState, setFormState] = useState('')
  const [formSize, setFormSize] = useState('')
  const [saving, setSaving] = useState(false)

  // Redirect if not owner
  useEffect(() => {
    if (!isOwner && !loading) {
      router.push('/')
    }
  }, [isOwner, loading, router])

  // Fetch properties
  useEffect(() => {
    if (!selectedCustomer) return

    const fetchProperties = async () => {
      setLoading(true)
      try {
        const { data: props, error: propsError } = await supabase
          .from('properties')
          .select('*')
          .eq('customer_id', selectedCustomer.id)
          .order('name')

        if (propsError) throw propsError

        // Get device count for each property
        const propsWithCount = await Promise.all(
          (props || []).map(async (prop) => {
            const { count } = await supabase
              .from('devices')
              .select('*', { count: 'exact', head: true })
              .eq('property_id', prop.id)

            return { ...prop, device_count: count || 0 }
          })
        )

        setProperties(propsWithCount)
      } catch (err: any) {
        console.error('Error fetching properties:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [selectedCustomer])

  const handleOpenModal = (property?: PropertyData) => {
    if (property) {
      setEditingProperty(property)
      setFormName(property.name)
      setFormAddress(property.address || '')
      setFormCity(property.city || '')
      setFormState(property.state || '')
      setFormSize(property.size_hectares ? property.size_hectares.toString() : '')
    } else {
      setEditingProperty(null)
      setFormName('')
      setFormAddress('')
      setFormCity('')
      setFormState('')
      setFormSize('')
    }
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProperty(null)
    setError('')
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)

    try {
      // Validation
      if (!formName.trim()) throw new Error('Nome da fazenda é obrigatório')
      if (!formCity.trim()) throw new Error('Cidade é obrigatória')
      if (!formState.trim()) throw new Error('Estado é obrigatório')
      if (formSize && (isNaN(Number(formSize)) || Number(formSize) <= 0)) {
        throw new Error('Tamanho deve ser um número positivo')
      }

      const propertyData = {
        customer_id: selectedCustomer!.id,
        name: formName,
        address: formAddress || null,
        city: formCity,
        state: formState.toUpperCase(),
        size_hectares: formSize ? Number(formSize) : null
      }

      if (editingProperty) {
        // Update
        const { error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingProperty.id)

        if (updateError) throw updateError

        // Update local state
        setProperties(properties.map(p =>
          p.id === editingProperty.id ? { ...p, ...propertyData } : p
        ))
      } else {
        // Create
        const { data: newProperty, error: createError } = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single()

        if (createError) throw createError

        // Add to local state
        setProperties([...properties, { ...newProperty, device_count: 0 }])
      }

      handleCloseModal()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (propertyId: number, deviceCount: number) => {
    if (deviceCount > 0) {
      alert('Não é possível deletar uma propriedade com rastreadores cadastrados. Remova os rastreadores primeiro.')
      return
    }

    if (!confirm('Tem certeza que deseja deletar esta propriedade?')) return

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error

      setProperties(properties.filter(p => p.id !== propertyId))
    } catch (err: any) {
      alert('Erro ao deletar propriedade: ' + err.message)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando propriedades...</p>
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
              <Building2 className="h-8 w-8 text-green-600" />
              Gerenciar Propriedades
            </h2>
            <p className="text-gray-600">
              Cadastre e gerencie suas fazendas e propriedades
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6 flex justify-end">
            <Button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Propriedade
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Card
                key={property.id}
                className="hover:shadow-lg transition-all border-none shadow-md overflow-hidden"
              >
                <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{property.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {property.city}, {property.state}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {property.address && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Endereço:</span> {property.address}
                    </div>
                  )}
                  {property.size_hectares && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Tamanho:</span> {property.size_hectares} hectares
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <Tractor className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        {property.device_count} {property.device_count === 1 ? 'rastreador' : 'rastreadores'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(property)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(property.id, property.device_count || 0)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {properties.length === 0 && (
              <div className="col-span-full">
                <Card className="border-2 border-dashed">
                  <CardContent className="text-center py-12">
                    <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium text-gray-900 mb-2">Nenhuma propriedade cadastrada</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Adicione sua primeira fazenda ou propriedade ao sistema.
                    </p>
                    <Button
                      onClick={() => handleOpenModal()}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Propriedade
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingProperty ? 'Editar Propriedade' : 'Nova Propriedade'}
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
                <Label htmlFor="name">Nome da Fazenda *</Label>
                <Input
                  id="name"
                  placeholder="Fazenda Santa Inês"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rod. BR-153, Km 45"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder="Presidente Prudente"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    placeholder="SP"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value.toUpperCase())}
                    disabled={saving}
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Tamanho (hectares)</Label>
                <Input
                  id="size"
                  type="number"
                  placeholder="1000"
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                  disabled={saving}
                />
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
                  {saving ? 'Salvando...' : editingProperty ? 'Salvar Alterações' : 'Criar Propriedade'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
