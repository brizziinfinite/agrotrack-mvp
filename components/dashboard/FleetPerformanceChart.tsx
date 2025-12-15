'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type PerformancePoint = {
  label: string
  km: number
  hours: number
}

interface FleetPerformanceChartProps {
  data?: PerformancePoint[]
  previousData?: PerformancePoint[]
  className?: string
}

type RangeKey = 'Semana' | 'Mês' | 'Ano'

const dataByRange: Record<RangeKey, { current: PerformancePoint[]; previous: PerformancePoint[] }> = {
  Semana: {
    current: [
      { label: 'Seg', km: 420, hours: 28 },
      { label: 'Ter', km: 460, hours: 30 },
      { label: 'Qua', km: 480, hours: 32 },
      { label: 'Qui', km: 510, hours: 34 },
      { label: 'Sex', km: 495, hours: 33 },
      { label: 'Sáb', km: 380, hours: 25 },
      { label: 'Dom', km: 310, hours: 22 }
    ],
    previous: [
      { label: 'Seg', km: 395, hours: 27 },
      { label: 'Ter', km: 440, hours: 29 },
      { label: 'Qua', km: 455, hours: 31 },
      { label: 'Qui', km: 500, hours: 33 },
      { label: 'Sex', km: 470, hours: 32 },
      { label: 'Sáb', km: 360, hours: 24 },
      { label: 'Dom', km: 300, hours: 21 }
    ]
  },
  'Mês': {
    current: [
      { label: 'Sem 1', km: 3200, hours: 210 },
      { label: 'Sem 2', km: 3400, hours: 220 },
      { label: 'Sem 3', km: 3100, hours: 205 },
      { label: 'Sem 4', km: 3600, hours: 230 }
    ],
    previous: [
      { label: 'Sem 1', km: 3000, hours: 205 },
      { label: 'Sem 2', km: 3300, hours: 215 },
      { label: 'Sem 3', km: 2950, hours: 198 },
      { label: 'Sem 4', km: 3450, hours: 225 }
    ]
  },
  'Ano': {
    current: [
      { label: 'Jan', km: 13200, hours: 820 },
      { label: 'Fev', km: 11800, hours: 760 },
      { label: 'Mar', km: 12500, hours: 800 },
      { label: 'Abr', km: 12900, hours: 815 },
      { label: 'Mai', km: 13500, hours: 840 },
      { label: 'Jun', km: 12200, hours: 785 },
      { label: 'Jul', km: 14000, hours: 860 },
      { label: 'Ago', km: 13700, hours: 850 },
      { label: 'Set', km: 13100, hours: 830 },
      { label: 'Out', km: 12800, hours: 810 },
      { label: 'Nov', km: 13600, hours: 855 },
      { label: 'Dez', km: 14200, hours: 870 }
    ],
    previous: [
      { label: 'Jan', km: 12500, hours: 800 },
      { label: 'Fev', km: 11500, hours: 740 },
      { label: 'Mar', km: 12000, hours: 780 },
      { label: 'Abr', km: 12400, hours: 790 },
      { label: 'Mai', km: 13000, hours: 820 },
      { label: 'Jun', km: 11800, hours: 760 },
      { label: 'Jul', km: 13400, hours: 840 },
      { label: 'Ago', km: 13000, hours: 820 },
      { label: 'Set', km: 12700, hours: 810 },
      { label: 'Out', km: 12400, hours: 790 },
      { label: 'Nov', km: 13000, hours: 820 },
      { label: 'Dez', km: 13800, hours: 850 }
    ]
  }
}

export function FleetPerformanceChart({ data, previousData, className }: FleetPerformanceChartProps) {
  const [range, setRange] = useState<RangeKey>('Semana')
  const { current, previous } = useMemo(() => {
    if (data) {
      return { current: data, previous: previousData ?? [] }
    }
    return dataByRange[range]
  }, [data, previousData, range])

  const maxKm = Math.max(...current.map((d) => d.km), ...(previous.map((d) => d.km)), 1)
  const maxHours = Math.max(...current.map((d) => d.hours), ...(previous.map((d) => d.hours)), 1)
  const prevMaxKm = Math.max(...previous.map((d) => d.km), ...(current.map((d) => d.km)), 1)
  const prevMaxHours = Math.max(...previous.map((d) => d.hours), ...(current.map((d) => d.hours)), 1)

  const pointsKm = current
    .map((d, idx) => {
      const x = (idx / Math.max(current.length - 1, 1)) * 100
      const y = 100 - (d.km / maxKm) * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const pointsHours = current
    .map((d, idx) => {
      const x = (idx / Math.max(current.length - 1, 1)) * 100
      const y = 100 - (d.hours / maxHours) * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const pointsPrevKm = previous.length
    ? previous
    .map((d, idx) => {
      const x = (idx / Math.max(previous.length - 1, 1)) * 100
      const y = 100 - (d.km / prevMaxKm) * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
    : ''

  const pointsPrevHours = previous.length
    ? previous
    .map((d, idx) => {
      const x = (idx / Math.max(previous.length - 1, 1)) * 100
      const y = 100 - (d.hours / prevMaxHours) * 100
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
    : ''

  return (
    <Card className={cn('bg-[#0b1220]/80 border border-white/5 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3 px-4 pt-4">
        <div>
          <CardTitle className="text-sm text-white">Desempenho da Frota</CardTitle>
          <CardDescription className="text-xs text-slate-400">Km rodados x Horas trabalhadas</CardDescription>
        </div>
        <div className="flex gap-2">
          {(['Semana', 'Mês', 'Ano'] as RangeKey[]).map((rangeKey) => (
            <button
              key={rangeKey}
              onClick={() => setRange(rangeKey)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-medium border transition',
                range === rangeKey
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100'
                  : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
              )}
            >
              {rangeKey}
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
            {pointsPrevKm && (
              <polyline
                fill="none"
                stroke="#67e8f9"
                strokeWidth="1.3"
                strokeDasharray="3 3"
                points={pointsPrevKm}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.5"
              points={pointsKm}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pointsPrevHours && (
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.3"
                strokeDasharray="3 3"
                points={pointsPrevHours}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
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
            {previous.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-200" />
                Km (ant.)
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Horas
            </span>
            {previous.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-200" />
                Horas (ant.)
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
