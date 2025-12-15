"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock3, Fuel as FuelIcon, Link2 } from "lucide-react";

interface ConsumptionStatsCardProps {
  consumptionPerKm: number;
  consumptionPerHour: number;
  trend?: { value: number; direction: "up" | "down"; label?: string };
  className?: string;
  gradientClass?: string;
}

const shellClass =
  "relative overflow-hidden rounded-xl border border-white/5 bg-[#0b1220]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm min-h-[170px]";

export function ConsumptionStatsCard({
  consumptionPerKm,
  consumptionPerHour,
  trend,
  className,
  gradientClass
}: ConsumptionStatsCardProps) {
  const isUp = trend?.direction === "up";

  return (
    <Card className={cn(shellClass, className, gradientClass)}>
      <CardHeader className="pb-1 relative px-4 pt-4">
        <CardTitle className="text-[11px] uppercase tracking-[0.14em] text-white/65 pr-12">Consumo</CardTitle>
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full border border-white/10 bg-white/5 text-slate-50 flex items-center justify-center">
          <FuelIcon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3 px-4 pb-4">
        <div className="flex items-center gap-3 text-2xl font-semibold text-white leading-none">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-200">
            <Link2 className="h-4 w-4" />
          </span>
          <span>{consumptionPerKm.toFixed(2)}</span>
          <span className="text-sm font-medium text-white/70">L/km</span>
        </div>
        <div className="flex items-center gap-3 text-xl font-semibold text-white leading-none">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-200">
            <Clock3 className="h-4 w-4" />
          </span>
          <span>{consumptionPerHour.toFixed(1)}</span>
          <span className="text-sm font-medium text-white/70">L/h</span>
        </div>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mt-1",
              isUp
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
            )}
          >
            {isUp ? "+" : "-"}
            {trend.value}%
            {trend.label && <span className="text-white/60 font-normal">{trend.label}</span>}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
