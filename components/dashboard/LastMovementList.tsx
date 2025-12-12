'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type MovementItem = {
  name: string
  time: string
  speed: string
  distance: string
  driver: string
  status: 'em movimento' | 'ocioso' | 'offline'
}

const statusBadgeStyles: Record<MovementItem['status'], string> = {
  'em movimento': 'bg-emerald-500/20 text-emerald-200',
  ocioso: 'bg-amber-500/20 text-amber-200',
  offline: 'bg-rose-500/20 text-rose-200'
}

export interface LastMovementListProps {
  items: MovementItem[]
  className?: string
}

export function LastMovementList({ items, className }: LastMovementListProps) {
  return (
    <Card className={cn('bg-[#050816] border border-white/5 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white">Último Movimento</CardTitle>
        <CardDescription className="text-sm text-slate-400">Veículos mais recentes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  item.status === 'em movimento' ? 'bg-emerald-400' : item.status === 'ocioso' ? 'bg-amber-400' : 'bg-rose-500'
                )}
              />
              <div>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-[12px] text-slate-400">
                  {item.driver} · {item.speed}
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-100">{item.distance}</p>
              <p>{item.time}</p>
              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border', statusBadgeStyles[item.status])}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
