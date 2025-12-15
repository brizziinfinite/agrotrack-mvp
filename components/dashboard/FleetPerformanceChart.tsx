'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type PerformancePoint = {
  label: string
  km: number
  hours: number
}

interface FleetPerformanceChartProps {
  data?: PerformancePoint[]
  className?: string
}

const defaultData: PerformancePoint[] = [
  { label: 'Seg', km: 420, hours: 28 },
  { label: 'Ter', km: 460, hours: 30 },
  { label: 'Qua', km: 480, hours: 32 },
  { label: 'Qui', km: 510, hours: 34 },
  { label: 'Sex', km: 495, hours: 33 },
  { label: 'Sáb', km: 380, hours: 25 },
  { label: 'Dom', km: 310, hours: 22 }
]

export function FleetPerformanceChart({ data = defaultData, className }: FleetPerformanceChartProps) {
  const maxKm = Math.max(...data.map((d) => d.km), 1)
  const maxHours = Math.max(...data.map((d) => d.hours), 1)

  const pointsKm = data
    .map((d, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * 100
      const y = 100 - (d.km / maxKm) * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const pointsHours = data
    .map((d, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * 100
      const y = 100 - (d.hours / maxHours) * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <Card className={cn('bg-[#0b1220]/80 border border-white/5 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3 px-4 pt-4">
        <div>
          <CardTitle className="text-sm text-white">Desempenho da Frota</CardTitle>
          <CardDescription className="text-xs text-slate-400">Km rodados x Horas trabalhadas</CardDescription>
        </div>
        <div className="flex gap-2">
          {['Semana', 'Mês', 'Ano'].map((range, idx) => (
            <button
              key={range}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-medium border transition',
                idx === 0
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100'
                  : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative h-[280px] rounded-xl border border-white/5 bg-[#0a1222]/80 overflow-hidden">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-slate-700/50">
            {[20, 40, 60, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.4" strokeDasharray="2 2" />
            ))}
          </svg>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.5"
              points={pointsKm}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              points={pointsHours}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-slate-200">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Km
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Horas
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
