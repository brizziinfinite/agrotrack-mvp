'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type AlertSeverity = 'critico' | 'atencao'

export type AlertItem = {
  title: string
  detail: string
  severity: AlertSeverity
  icon: LucideIcon
}

const severityBadgeStyles: Record<AlertSeverity, string> = {
  critico: 'bg-rose-500/20 text-rose-200',
  atencao: 'bg-amber-500/20 text-amber-200'
}

export interface AlertsListProps {
  items: AlertItem[]
  className?: string
}

export function AlertsList({ items, className }: AlertsListProps) {
  return (
    <Card className={cn('bg-[#0b1220]/80 border border-white/5 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm', className)}>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm text-white">Alertas Ativos</CardTitle>
            <CardDescription className="text-xs text-slate-400">{items.length} alertas pendentes</CardDescription>
          </div>
          <button className="text-[11px] text-emerald-300 hover:text-emerald-200">Ver todos</button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        {items.map((alert) => {
          const Icon = alert.icon
          return (
            <div
              key={alert.title}
              className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2.5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-emerald-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{alert.title}</p>
                  <p className="text-[11px] text-slate-400 leading-tight">{alert.detail}</p>
                </div>
              </div>
              <Badge className={severityBadgeStyles[alert.severity]}>
                {alert.severity === 'critico' ? 'Crítico' : 'Atenção'}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
