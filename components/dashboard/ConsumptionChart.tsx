'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ConsumptionChartProps {
  weeklyConsumption?: number[]
  weeklyKm?: number[]
  className?: string
}

const defaultConsumption = [120, 480, 320, 430, 280, 220, 360]
const defaultKm = [240, 520, 410, 540, 460, 300, 420]

export function ConsumptionChart({
  weeklyConsumption = defaultConsumption,
  weeklyKm = defaultKm,
  className
}: ConsumptionChartProps) {
  const maxValue = Math.max(...weeklyConsumption, ...weeklyKm, 1)

  return (
    <Card className={cn('bg-[#0b1220]/80 border border-white/5 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm', className)}>
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-sm text-white">Consumo Semanal</CardTitle>
        <CardDescription className="text-xs text-slate-400">Consumo estimado (L) vs quilometragem</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="h-56 rounded-xl border border-white/5 bg-[#0a1222]/80 px-4 py-4">
          <div className="flex h-full items-end gap-3">
            {weeklyConsumption.map((value, idx) => {
              const kmValue = weeklyKm[idx] ?? 0
              const heightCons = Math.max(8, (value / maxValue) * 100)
              const heightKm = Math.max(6, (kmValue / maxValue) * 100)
              return (
                <div key={idx} className="flex flex-col items-center justify-end gap-2 flex-1">
                  <div className="w-full max-w-[28px] rounded-md bg-emerald-400" style={{ height: `${heightCons}%` }} />
                  <div className="w-full max-w-[28px] rounded-md bg-cyan-400/70" style={{ height: `${heightKm}%` }} />
                  <span className="text-[11px] text-slate-400">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][idx]}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-200">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Consumo (L)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Km
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
