"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ShieldAlert, TrafficCone, Wrench } from "lucide-react";

interface OperationalAlertsCardProps {
  blocked: number;
  speeding: number;
  maintenance: number;
  className?: string;
}

const rows = [
  { label: "Bloqueados", icon: ShieldAlert, color: "text-rose-300", bg: "bg-rose-500/10" },
  { label: "Excesso de velocidade", icon: TrafficCone, color: "text-amber-200", bg: "bg-amber-500/10" },
  { label: "Manutenção", icon: Wrench, color: "text-sky-200", bg: "bg-sky-500/10" },
];

export function OperationalAlertsCard({ blocked, speeding, maintenance, className }: OperationalAlertsCardProps) {
  const values = [blocked, speeding, maintenance];

  return (
    <Card className={cn("bg-[#0a1222] border border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] uppercase tracking-wide text-slate-300">Alertas Operacionais</CardTitle>
        <CardDescription className="text-[11px] text-slate-500">Monitoramento imediato</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row, idx) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center justify-between text-sm text-slate-100">
              <div className="flex items-center gap-2">
                <span className={cn("h-8 w-8 rounded-full flex items-center justify-center", row.bg)}>
                  <Icon className={cn("h-4 w-4", row.color)} />
                </span>
                <span className="text-slate-200 text-sm">{row.label}</span>
              </div>
              <span className="font-semibold text-base">{values[idx]}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
