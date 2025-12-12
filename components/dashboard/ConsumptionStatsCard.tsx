"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConsumptionStatsCardProps {
  consumptionPerKm: number;
  consumptionPerHour: number;
  trend?: { value: number; direction: "up" | "down" };
  className?: string;
}

export function ConsumptionStatsCard({ consumptionPerKm, consumptionPerHour, trend, className }: ConsumptionStatsCardProps) {
  const isUp = trend?.direction === "up";
  return (
    <Card className={cn("bg-[#0a1222] border border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] uppercase tracking-wide text-slate-300">Consumo</CardTitle>
        <CardDescription className="text-[11px] text-slate-500">Médias mockadas</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-slate-400">L/km</p>
          <p className="text-lg font-semibold text-slate-50">{consumptionPerKm.toFixed(1)}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-xs text-slate-400">L/h</p>
          <p className="text-lg font-semibold text-slate-50">{consumptionPerHour.toFixed(1)}</p>
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full border",
              isUp
                ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-200 border-rose-500/30"
            )}
          >
            {isUp ? "+" : "-"}
            {trend.value}%
          </span>
        )}
      </CardContent>
    </Card>
  );
}
