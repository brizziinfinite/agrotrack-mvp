'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Check,
  ArrowLeft,
  Car,
  CarFront,
  Truck,
  Bike,
  Bus,
  Tractor,
  Droplets,
  Wheat,
  Waves,
  PersonStanding,
  Dog,
  Ship
} from 'lucide-react'

const vehicleTypes = [
  { value: 'car', label: 'Carro', Icon: Car },
  { value: 'pickup', label: 'Caminhonete', Icon: CarFront },
  { value: 'truck', label: 'Caminhão', Icon: Truck },
  { value: 'motorcycle', label: 'Moto', Icon: Bike },
  { value: 'bus', label: 'Ônibus', Icon: Bus },
  { value: 'tractor', label: 'Trator', Icon: Tractor },
  { value: 'sprayer', label: 'Pulverizador', Icon: Droplets },
  { value: 'harvester', label: 'Colheitadora', Icon: Wheat },
  { value: 'bicycle', label: 'Bicicleta', Icon: Bike },
  { value: 'boat', label: 'Barco', Icon: Ship },
  { value: 'jetski', label: 'Jet Ski', Icon: Waves },
  { value: 'person', label: 'Pessoa', Icon: PersonStanding },
  { value: 'animal', label: 'Animal', Icon: Dog }
] as const

export default function NovaMaquinaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const [formData, setFormData] = useState({
    name: '',
    uniqueId: '',
    category: 'car',
    model: '',
    m2m: '',
    plate: '',
    color: '',
    iccid: '',
    speedIdealMax: '',
    speedHighMax: '',
    speedExtremeName: 'Extrema'
  })

  function validateStep(currentStep: 1 | 2) {
    if (currentStep === 1 && !formData.name.trim()) {
      setError('Nome é obrigatório')
      return false
    }
    if (currentStep === 2 && !formData.uniqueId.trim()) {
      setError('IMEI é obrigatório')
      return false
    }
    setError(null)
    return true
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep(2)
    }
  }

  function handlePrev() {
    setStep(1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep(step)) return
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/traccar/devices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        setError(result.error)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar dispositivo'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a111c] text-slate-100 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-4xl bg-[#0d1523] border border-[#1f2735] text-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold">Novo Dispositivo/Veículo</CardTitle>
          <CardDescription className="text-slate-400">
            Complete as etapas para cadastrar um novo veículo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Indicador de etapas */}
          <div className="flex items-center gap-6 justify-center">
            {[1, 2].map((s) => {
              const active = step === s
              const completed = step > s
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${
                      active
                        ? 'bg-[#0bc2d8] border-[#0bc2d8] text-slate-950'
                        : completed
                          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
                          : 'bg-[#121c2b] border-[#1f2937] text-slate-400'
                    }`}
                  >
                    {completed ? <Check className="h-5 w-5" /> : s}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold">
                      {s === 1 ? 'Dados do Veículo' : 'Dispositivo e Configurações'}
                    </p>
                    <p className="text-xs text-slate-500">{`Etapa ${s} de 2${s === 1 ? ' • * Nome é obrigatório' : ' • * IMEI é obrigatório'}`}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-slate-200">
                      Nome/Identificação *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ex: Fiorino #01"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plate" className="text-sm text-slate-200">
                      Placa
                    </Label>
                    <Input
                      id="plate"
                      type="text"
                      placeholder="ABC-1234"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                      className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                      maxLength={8}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-sm text-slate-200">
                      Modelo
                    </Label>
                    <Input
                      id="model"
                      type="text"
                      placeholder="Fiat Fiorino 2022"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm text-slate-200">
                      Cor
                    </Label>
                    <Input
                      id="color"
                      type="text"
                      placeholder="Branco"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-slate-200">Tipo de Veículo</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {vehicleTypes.map((option) => {
                      const selected = formData.category === option.value
                      const Icon = option.Icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: option.value })}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                            selected
                              ? 'border-[#0bc2d8] bg-[#0bc2d8]/15 text-[#0bc2d8]'
                              : 'border-[#1f2735] bg-[#0b1320] text-slate-200 hover:border-[#0bc2d8]/40'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uniqueId" className="text-sm text-slate-200">
                    IMEI do Rastreador *
                  </Label>
                  <Input
                    id="uniqueId"
                    type="text"
                    placeholder="867730051234567"
                    value={formData.uniqueId}
                    onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                    className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">Número de identificação único do rastreador (15-17 dígitos)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iccid" className="text-sm text-slate-200">
                      ICCID
                    </Label>
                    <Input
                      id="iccid"
                      type="text"
                      placeholder="89550000123456789012"
                      value={formData.iccid}
                      onChange={(e) => setFormData({ ...formData, iccid: e.target.value })}
                      className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m2m" className="text-sm text-slate-200">
                      Nº Chip M2M
                    </Label>
                    <Input
                      id="m2m"
                      type="text"
                      placeholder="+5511999990000"
                      value={formData.m2m}
                      onChange={(e) => setFormData({ ...formData, m2m: e.target.value })}
                      className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speedHighMax" className="text-sm text-slate-200">
                    Velocidade Máxima (km/h)
                  </Label>
                  <Input
                    id="speedHighMax"
                    type="number"
                    placeholder="80"
                    value={formData.speedHighMax}
                    onChange={(e) => setFormData({ ...formData, speedHighMax: e.target.value })}
                    className="bg-[#0b1320] border-[#1f2735] text-slate-100 placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">Alerta será gerado quando ultrapassar esta velocidade</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#1f2735] flex flex-wrap justify-end gap-3">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="border-[#1f2735] text-slate-100 bg-[#0b1320]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dispositivos')}
                className="border-[#1f2735] text-slate-100 bg-[#0b1320]"
              >
                Cancelar
              </Button>
              {step === 1 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#0bc2d8] text-slate-950 hover:brightness-110"
                >
                  Próximo
                </Button>
              )}
              {step === 2 && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0bc2d8] text-slate-950 hover:brightness-110"
                >
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </Button>
              )}
            </div>

            {error && (
              <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                Dispositivo salvo com sucesso! Redirecionando...
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
