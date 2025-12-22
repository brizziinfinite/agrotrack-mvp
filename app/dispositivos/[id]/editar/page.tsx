'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tractor, Save, ArrowLeft, Loader2 } from 'lucide-react'
import { deviceIconOptions } from '@/lib/device-icons'

interface DeviceApi {
  id: number
  name: string
  uniqueId: string
  category: string
  model?: string
  attributes?: {
    m2m?: string
    plate?: string
    color?: string
    iccid?: string
    speedIdealMax?: number
    speedHighMax?: number
    speedExtremeName?: string
  }
}

export default function EditarMaquinaPage() {
  const router = useRouter()
  const params = useParams()
  const deviceId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    uniqueId: '',
    category: 'default',
    model: '',
    m2m: '',
    plate: '',
    color: '',
    iccid: '',
    speedIdealMax: '',
    speedHighMax: '',
    speedExtremeName: 'Extrema'
  })

  // Carregar dados do dispositivo
  useEffect(() => {
    async function loadDevice() {
      try {
        const response = await fetch('/api/traccar/devices')
        const result = await response.json()

        if (result.success) {
          const device = (result.data as DeviceApi[]).find((d) => d.id === Number(deviceId))
          
          if (device) {
            setFormData({
              id: device.id.toString(),
              name: device.name || '',
              uniqueId: device.uniqueId || '',
              category: device.category || 'tractor',
              model: device.model || '',
              m2m: device.attributes?.m2m || '',
              plate: device.attributes?.plate || '',
              color: device.attributes?.color || '',
              iccid: device.attributes?.iccid || '',
              speedIdealMax: device.attributes?.speedIdealMax?.toString() || '',
              speedHighMax: device.attributes?.speedHighMax?.toString() || '',
              speedExtremeName: device.attributes?.speedExtremeName || 'Extrema'
            })
          } else {
            setError('Dispositivo não encontrado')
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dispositivo'
        setError(message)
      } finally {
        setLoadingData(false)
      }
    }

    loadDevice()
  }, [deviceId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/traccar/devices/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          id: Number(formData.id)
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(result.error)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar dispositivo'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados do dispositivo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Botão Voltar */}
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <Tractor className="h-6 w-6 text-white" />
              </div>
              Editar Dispositivo
            </h2>
            <p className="text-gray-600">
              Atualize as informações do dispositivo
            </p>
          </div>

          {/* Formulário */}
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
              <CardTitle>Informações do Dispositivo</CardTitle>
              <CardDescription>
                Edite os dados do dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Nome do Dispositivo *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Trator John Deere"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                {/* IMEI */}
                <div className="space-y-2">
                  <Label htmlFor="uniqueId" className="text-sm font-medium text-gray-700">
                    IMEI / Identificador Único *
                  </Label>
                  <Input
                    id="uniqueId"
                    type="text"
                    placeholder="Ex: 868683050247859"
                    value={formData.uniqueId}
                    onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Número IMEI do rastreador (15 dígitos)
                  </p>
                </div>

                {/* ICCID */}
                <div className="space-y-2">
                  <Label htmlFor="iccid" className="text-sm font-medium text-gray-700">
                    ICCID
                  </Label>
                  <Input
                    id="iccid"
                    type="text"
                    placeholder="Ex: 8955..."
                    value={formData.iccid}
                    onChange={(e) => setFormData({ ...formData, iccid: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* M2M */}
                <div className="space-y-2">
                  <Label htmlFor="m2m" className="text-sm font-medium text-gray-700">
                    Número M2M
                  </Label>
                  <Input
                    id="m2m"
                    type="text"
                    placeholder="Ex: 8955170600123456789"
                    value={formData.m2m}
                    onChange={(e) => setFormData({ ...formData, m2m: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Número do chip M2M do rastreador
                  </p>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Tipo de dispositivo
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {deviceIconOptions.map((option) => {
                  const selected = formData.category === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: option.value })}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                        selected
                          ? 'border-green-500 bg-green-50 shadow-sm'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{option.emoji}</span>
                      <span className="text-sm font-medium text-gray-800">{option.label}</span>
                    </button>
                  )
                })}
              </div>
                </div>

                {/* Modelo */}
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium text-gray-700">
                    Modelo (Opcional)
                  </Label>
                  <Input
                    id="model"
                    type="text"
                    placeholder="Ex: 6125J"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* Placa */}
                <div className="space-y-2">
                  <Label htmlFor="plate" className="text-sm font-medium text-gray-700">
                    Placa
                  </Label>
                  <Input
                    id="plate"
                    type="text"
                    placeholder="Ex: ABC-1234"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    className="w-full"
                    maxLength={8}
                  />
                </div>

                {/* Cor */}
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm font-medium text-gray-700">
                    Cor
                  </Label>
                  <select
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Branco">⚪ Branco</option>
                    <option value="Preto">⚫ Preto</option>
                    <option value="Prata">⚪ Prata</option>
                    <option value="Cinza">🔘 Cinza</option>
                    <option value="Vermelho">🔴 Vermelho</option>
                    <option value="Azul">🔵 Azul</option>
                    <option value="Verde">🟢 Verde</option>
                    <option value="Amarelo">🟡 Amarelo</option>
                    <option value="Laranja">🟠 Laranja</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Regras de Velocidade */}
                <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">Regras de velocidade (km/h)</span>
                    <span className="text-xs text-gray-500">Personalize por dispositivo</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Ideal (até)</Label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.speedIdealMax}
                        onChange={(e) => setFormData({ ...formData, speedIdealMax: e.target.value })}
                        placeholder="ex: 80"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                      />
                      <p className="text-xs text-green-700">Cor verde</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Alta (até)</Label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.speedHighMax}
                        onChange={(e) => setFormData({ ...formData, speedHighMax: e.target.value })}
                        placeholder="ex: 100"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="text-xs text-amber-700">Cor amarela</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Nome da faixa acima da alta</Label>
                      <input
                        type="text"
                        value={formData.speedExtremeName}
                        onChange={(e) => setFormData({ ...formData, speedExtremeName: e.target.value })}
                        placeholder="Extrema"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                      <p className="text-xs text-rose-700">Padrão: Extrema</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Exemplo: Carro 110/130; trator 6/10. Faixa extrema é acima do valor de alta.</p>
                </div>

                {/* Mensagens */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">
                      ✅ Dispositivo atualizado com sucesso! Redirecionando...
                    </p>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/')}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
