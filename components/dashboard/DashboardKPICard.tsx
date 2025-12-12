"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type Trend = {
  value: number
  direction: "up" | "down"
}

interface DashboardKPICardProps {
  title: string
  value: string
  subtitle?: string
  icon?: ReactNode
  trend?: Trend
  className?: string
}

export function DashboardKPICard({ title, value, subtitle, icon, trend, className }: DashboardKPICardProps) {
  const isUp = trend?.direction === "up"

  return (
    <Card
      className={cn(
        "bg-[#050816]/90 border border-white/5 rounded-2xl shadow-sm hover:shadow-lg hover:border-emerald-500/40 transition-all duration-200 backdrop-blur",
        className
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{title}</CardTitle>
          {subtitle && <CardDescription className="text-[11px] text-slate-500">{subtitle}</CardDescription>}
        </div>
        {icon && (
          <div className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(94,234,212,0.5),rgba(34,197,94,0.15)_60%,rgba(255,255,255,0.05))] border border-emerald-500/30 text-emerald-100 flex items-center justify-center shadow-inner">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-3xl font-semibold text-slate-50">{value}</div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full border",
              isUp
                ? "bg-emerald-500/15 text-emerald-100 border-emerald-500/40"
                : "bg-rose-500/10 text-rose-100 border-rose-500/40"
            )}
          >
            {isUp ? "+" : "-"}
            {trend.value}%
          </span>
        )}
      </CardContent>
    </Card>
  )
}
