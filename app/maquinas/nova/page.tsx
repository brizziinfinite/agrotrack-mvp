'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react'
import MachineIcon, { MACHINE_ICONS } from '@/components/machine-icon'
import ImageUpload from '@/components/image-upload'

// Categorias de ícones
const ICON_CATEGORIES = {
  agricolas: {
    label: 'Agrícolas',
    icons: ['trator', 'colhedeira', 'pulverizador', 'pacarregadeira', '🏗️', '🌱', '🚚']
  },
  veiculos: {
    label: 'Veículos',
    icons: ['🚗', '🚙', '🚌', '🚐', '🏍️', '🛻']
  },
  aquaticos: {
    label: 'Aquáticos',
    icons: ['🚤', '⛵', '🛥️', '🏊', '🚣', '🛶']
  },
  animais: {
    label: 'Animais',
    icons: ['🐄', '🐴', '🐕', '🐱', '🐑', '🐖', '🐓', '🐐']
  },
  outros: {
    label: 'Outros',
    icons: ['aviao', '📦', '🔧', '⚙️', '🎒', '🔋', '📍', '⭐', '🔶']
  }
}

type FormSection = 'basico' | 'aparencia' | 'detalhes'
type DeviceType = 'veiculo' | 'animal' | 'equipamento' | 'outro'

export default function NovoRastreadorPage() {
  const router = useRouter()
  const [currentSection, setCurrentSection] = useState<FormSection>('basico')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Dados básicos
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [imei, setImei] = useState('')
  const [telefone, setTelefone] = useState('')

  // Aparência
  const [icone, setIcone] = useState('trator')
  const [cor, setCor] = useState('#10b981') // verde padrão
  const [foto, setFoto] = useState('')
  const [photoTab, setPhotoTab] = useState<'upload' | 'url'>('upload')

  // Detalhes
  const [tipo, setTipo] = useState<DeviceType>('veiculo')
  const [placa, setPlaca] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [raca, setRaca] = useState('')
  const [idade, setIdade] = useState('')
  const [peso, setPeso] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [fornecedor, setFornecedor] = useState('')

  // Validações
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateIMEI = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length !== 15) {
      setErrors(prev => ({ ...prev, imei: 'IMEI deve ter exatamente 15 dígitos' }))
      return false
    }
    setErrors(prev => {
      const { imei, ...rest } = prev
      return rest
    })
    return true
  }

  const validatePlaca = (value: string) => {
    const placaRegex = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i
    if (value && !placaRegex.test(value)) {
      setErrors(prev => ({ ...prev, placa: 'Formato inválido (ABC-1234 ou ABC1D23)' }))
      return false
    }
    setErrors(prev => {
      const { placa, ...rest } = prev
      return rest
    })
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica
    if (!nome.trim()) {
      setErrors({ nome: 'Nome é obrigatório' })
      setCurrentSection('basico')
      return
    }

    if (!imei.trim()) {
      setErrors({ imei: 'IMEI é obrigatório' })
      setCurrentSection('basico')
      return
    }

    if (!validateIMEI(imei)) {
      setCurrentSection('basico')
      return
    }

    if (tipo === 'veiculo' && placa && !validatePlaca(placa)) {
      setCurrentSection('detalhes')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/devices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Dados básicos para o Traccar
          name: nome,
          uniqueId: imei,
          phone: telefone,

          // Metadados para o Supabase
          metadata: {
            descricao,
            icone,
            cor,
            foto,
            tipo,
            placa,
            marca,
            modelo,
            ano,
            raca,
            idade,
            peso,
            numeroSerie,
            fornecedor
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setErrors({ submit: result.error || 'Erro ao salvar rastreador' })
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erro ao conectar com o servidor' })
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Rastreador adicionado!
          </h2>
          <p className="text-gray-600 mb-4">
            {nome} foi cadastrado com sucesso
          </p>
          <div className="mb-4 flex justify-center">
            <MachineIcon name={icone} size={80} />
          </div>
          <p className="text-sm text-gray-500">
            Redirecionando para o dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-600/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Adicionar Novo Rastreador
                </h1>
                <p className="text-gray-600">
                  Configure um novo dispositivo GPS no AgroTrack
                </p>
              </div>
            </div>
          </div>

          {/* Navegação por abas */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setCurrentSection('basico')}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                currentSection === 'basico'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-white text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              📝 Informações Básicas
            </button>
            <button
              onClick={() => setCurrentSection('aparencia')}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                currentSection === 'aparencia'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-white text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              🎨 Aparência
            </button>
            <button
              onClick={() => setCurrentSection('detalhes')}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                currentSection === 'detalhes'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-white text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              📋 Detalhes Específicos
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Seção 1: Informações Básicas */}
            {currentSection === 'basico' && (
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Dados essenciais do rastreador GPS
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome/Identificação <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.nome ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ex: Trator John Deere 01"
                    />
                    {errors.nome && (
                      <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Ex: Trator usado para plantio de soja"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IMEI do Rastreador <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={imei}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setImei(value)
                        if (value.length === 15) validateIMEI(value)
                      }}
                      maxLength={15}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono ${
                        errors.imei ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Digite os 15 dígitos do IMEI"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {imei.length}/15 dígitos
                    </p>
                    {errors.imei && (
                      <p className="text-red-500 text-sm mt-1">{errors.imei}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone do Chip M2M <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ex: +55 11 98765-4321"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentSection('aparencia')}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/30"
                  >
                    Próximo: Aparência →
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Seção 2: Aparência */}
            {currentSection === 'aparencia' && (
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                  <CardTitle>Personalização Visual</CardTitle>
                  <CardDescription>
                    Escolha como o rastreador será exibido no sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Preview */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                      Preview
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      {/* Ícone ou Foto */}
                      {foto ? (
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                          <img
                            src={foto}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="h-20 w-20 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: cor }}
                        >
                          <MachineIcon name={icone} size={48} />
                        </div>
                      )}

                      <div>
                        <p className="font-semibold text-lg text-gray-900">
                          {nome || 'Nome do Rastreador'}
                        </p>
                        <Badge
                          className="mt-1"
                          style={{ backgroundColor: cor }}
                        >
                          Online
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Ícones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Escolha um Ícone <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-4">
                      {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
                        <div key={key}>
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            {category.label}
                          </p>
                          <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                            {category.icons.map((icon) => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() => setIcone(icon)}
                                className={`h-12 w-12 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                                  icone === icon
                                    ? 'bg-green-600 shadow-lg ring-2 ring-green-600 ring-offset-2'
                                    : 'bg-white hover:bg-green-50 border border-gray-200'
                                }`}
                              >
                                <MachineIcon
                                  name={icon}
                                  size={32}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seletor de Cor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor Principal
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={cor}
                        onChange={(e) => setCor(e.target.value)}
                        className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cor}
                        onChange={(e) => setCor(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                        placeholder="#10b981"
                      />
                    </div>
                    <div className="grid grid-cols-8 gap-2 mt-3">
                      {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCor(color)}
                          className={`h-10 rounded-lg transition-all hover:scale-110 ${
                            cor === color ? 'ring-2 ring-gray-900 ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Upload de Foto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Foto do Rastreador <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => setPhotoTab('upload')}
                        className={`px-4 py-2 font-medium transition-all ${
                          photoTab === 'upload'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        📤 Upload de Arquivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoTab('url')}
                        className={`px-4 py-2 font-medium transition-all ${
                          photoTab === 'url'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        🔗 URL Externa
                      </button>
                    </div>

                    {/* Conteúdo das Tabs */}
                    {photoTab === 'upload' ? (
                      <ImageUpload
                        onUploadSuccess={(url) => setFoto(url)}
                        currentImage={foto}
                      />
                    ) : (
                      <input
                        type="url"
                        value={foto}
                        onChange={(e) => setFoto(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://exemplo.com/foto.jpg"
                      />
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentSection('basico')}
                      className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSection('detalhes')}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/30"
                    >
                      Próximo: Detalhes →
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seção 3: Detalhes */}
            {currentSection === 'detalhes' && (
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                  <CardTitle>Detalhes Específicos</CardTitle>
                  <CardDescription>
                    Informações adicionais baseadas no tipo de rastreador
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Tipo de Dispositivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de Dispositivo
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { value: 'veiculo', label: 'Veículo', icon: '🚗' },
                        { value: 'animal', label: 'Animal', icon: '🐄' },
                        { value: 'equipamento', label: 'Equipamento', icon: '🔧' },
                        { value: 'outro', label: 'Outro', icon: '📦' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTipo(option.value as DeviceType)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            tipo === option.value
                              ? 'border-green-600 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="text-3xl mb-2">{option.icon}</div>
                          <div className="text-sm font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campos específicos para Veículo */}
                  {tipo === 'veiculo' && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-3">
                        Informações do Veículo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Placa
                          </label>
                          <input
                            type="text"
                            value={placa}
                            onChange={(e) => {
                              const value = e.target.value.toUpperCase()
                              setPlaca(value)
                              if (value) validatePlaca(value)
                            }}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.placa ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="ABC-1234"
                          />
                          {errors.placa && (
                            <p className="text-red-500 text-xs mt-1">{errors.placa}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Marca
                          </label>
                          <input
                            type="text"
                            value={marca}
                            onChange={(e) => setMarca(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: John Deere"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Modelo
                          </label>
                          <input
                            type="text"
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: 5075E"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ano
                          </label>
                          <input
                            type="text"
                            value={ano}
                            onChange={(e) => setAno(e.target.value.replace(/\D/g, ''))}
                            maxLength={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="2024"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos específicos para Animal */}
                  {tipo === 'animal' && (
                    <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm font-medium text-amber-900 mb-3">
                        Informações do Animal
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Raça
                          </label>
                          <input
                            type="text"
                            value={raca}
                            onChange={(e) => setRaca(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: Nelore"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Idade
                          </label>
                          <input
                            type="text"
                            value={idade}
                            onChange={(e) => setIdade(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: 3 anos"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Peso
                          </label>
                          <input
                            type="text"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: 450 kg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos específicos para Equipamento */}
                  {tipo === 'equipamento' && (
                    <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-900 mb-3">
                        Informações do Equipamento
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Série
                          </label>
                          <input
                            type="text"
                            value={numeroSerie}
                            onChange={(e) => setNumeroSerie(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: SN123456789"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fornecedor
                          </label>
                          <input
                            type="text"
                            value={fornecedor}
                            onChange={(e) => setFornecedor(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Ex: AgriTech Solutions"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{errors.submit}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentSection('aparencia')}
                      className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="h-5 w-5" />
                          Salvar Rastreador
                        </>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
