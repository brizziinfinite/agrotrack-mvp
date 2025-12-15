"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"

type Trend = {
  value: number
  direction: "up" | "down"
  label?: string
}

interface DashboardKPICardProps {
  title: string
  value: string
  subtitle?: string
  icon?: ReactNode
  trend?: Trend
  className?: string
  iconClassName?: string
}

const shellClass =
  "relative overflow-hidden rounded-xl border border-white/5 bg-[#0b1220]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm min-h-[170px]"

export function DashboardKPICard({ title, value, subtitle, icon, trend, className, iconClassName }: DashboardKPICardProps) {
  const isUp = trend?.direction === "up"

  return (
    <Card className={cn(shellClass, className)}>
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.12),transparent_42%),radial-gradient(circle_at_85%_0%,rgba(46,204,149,0.12),transparent_32%)]" />
      <CardHeader className="pb-1 relative space-y-1 px-4 pt-4">
        <CardTitle className="text-[11px] uppercase tracking-[0.14em] text-white/65 pr-12">{title}</CardTitle>
        {icon && (
          <div
            className={cn(
              "absolute top-3 right-3 h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-50 flex items-center justify-center shadow-none",
              iconClassName
            )}
          >
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="relative px-4 pb-4 pt-1 flex flex-col gap-2">
        <div className="text-2xl font-semibold text-white leading-tight">{value}</div>
        <div className="flex items-center gap-3 text-[11px]">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border text-[11px]",
                isUp ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border-rose-500/20"
              )}
            >
              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend.direction === "up" ? "+" : "-"}
              {trend.value}%
              {trend.label && <span className="text-white/50 font-normal">{trend.label}</span>}
            </span>
          )}
          {subtitle && <span className="text-white/60 text-[11px] font-medium">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
