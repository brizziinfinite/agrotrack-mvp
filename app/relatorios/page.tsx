'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FileText, Download, Calendar, Route, Clock, Gauge, Fuel, MapPin, X } from 'lucide-react'

type ReportType = {
  id: string
  title: string
  description: string
  icon: typeof FileText
  color: string
}

const reportTypes: ReportType[] = [
  {
    id: 'trips',
    title: 'Viagens',
    description: 'Relatório completo de todas as viagens realizadas',
    icon: Route,
    color: 'from-emerald-500/10 via-emerald-500/5 to-transparent text-emerald-300'
  },
  {
    id: 'stops',
    title: 'Paradas',
    description: 'Análise detalhada de paradas e tempo ocioso',
    icon: MapPin,
    color: 'from-amber-500/10 via-amber-500/5 to-transparent text-amber-300'
  },
  {
    id: 'speed',
    title: 'Velocidade',
    description: 'Histórico de velocidade e infrações',
    icon: Gauge,
    color: 'from-rose-500/10 via-rose-500/5 to-transparent text-rose-300'
  },
  {
    id: 'hours',
    title: 'Horas Trabalhadas',
    description: 'Controle de jornada e horas extras',
    icon: Clock,
    color: 'from-cyan-500/10 via-cyan-500/5 to-transparent text-cyan-300'
  },
  {
    id: 'fuel',
    title: 'Consumo',
    description: 'Análise de consumo de combustível estimado',
    icon: Fuel,
    color: 'from-sky-500/10 via-sky-500/5 to-transparent text-sky-300'
  }
]

const recentReports = [
  { id: 'r1', name: 'Viagens_Janeiro_2024.pdf', date: '15/01/2024', size: '2.4 MB' },
  { id: 'r2', name: 'Consumo_Semanal_S02.xlsx', date: '14/01/2024', size: '845 KB' },
  { id: 'r3', name: 'Velocidade_Frota_2024.pdf', date: '12/01/2024', size: '1.8 MB' },
  { id: 'r4', name: 'Horas_Trabalhadas_Dez.xlsx', date: '02/01/2024', size: '632 KB' }
]

export default function RelatoriosPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    vehicles: 'all',
    format: 'pdf'
  })

  const handleGenerateReport = async () => {
    if (!formData.startDate || !formData.endDate) {
      window.alert('Selecione o período do relatório')
      return
    }

    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    window.alert(`Relatório de ${selectedReport?.title} gerado com sucesso!`)
    setIsGenerating(false)
    setSelectedReport(null)
    setFormData({ startDate: '', endDate: '', vehicles: 'all', format: 'pdf' })
  }

  const handleDownload = (reportName: string) => {
    window.alert(`Download iniciado: ${reportName}`)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="w-full">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-50">Relatórios</h1>
          <p className="text-slate-400">Gere e baixe relatórios detalhados da sua frota</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon
            return (
              <Card
                key={report.id}
                className="relative overflow-hidden border border-white/5 bg-[#0b1220] rounded-2xl p-5 shadow-[0_14px_40px_rgba(0,0,0,0.35)] hover:border-emerald-500/30 transition"
              >
                <div className={cn('absolute inset-0 opacity-70 bg-gradient-to-br', report.color)} />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-100">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-50 mb-1">{report.title}</h3>
                    <p className="text-sm text-slate-400 mb-3 leading-relaxed">{report.description}</p>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setSelectedReport(report)}>
                      <Calendar className="w-4 h-4" />
                      Gerar Relatório
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Card className="border border-white/5 bg-[#0b1220] rounded-2xl p-5 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Relatórios Recentes</h3>
              <p className="text-sm text-slate-400">Seus últimos relatórios gerados</p>
            </div>
          </div>

          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-50">{report.name}</p>
                    <p className="text-sm text-slate-400">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(report.name)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
            <button
              type="button"
              aria-label="Fechar"
              className="absolute top-3 right-3 h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-slate-200 hover:bg-white/10"
              onClick={() => setSelectedReport(null)}
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xl font-semibold text-slate-50">Gerar Relatório de {selectedReport.title}</h3>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Início *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Fim *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicles">Veículos</Label>
                <select
                  id="vehicles"
                  className="w-full rounded-md border border-white/10 bg-[#0f1729] px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                  value={formData.vehicles}
                  onChange={(e) => setFormData({ ...formData, vehicles: e.target.value })}
                >
                  <option value="all">Todos os veículos</option>
                  <option value="active">Apenas ativos</option>
                  <option value="inactive">Apenas inativos</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Formato</Label>
                <select
                  id="format"
                  className="w-full rounded-md border border-white/10 bg-[#0f1729] px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                >
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerateReport} disabled={isGenerating}>
                  {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  )
}
