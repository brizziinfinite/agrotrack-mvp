"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FleetStatusCardProps {
  moving: number;
  stopped: number;
  offline: number;
  className?: string;
}

const statusStyles = [
  { label: "Em movimento", color: "bg-emerald-500", text: "text-emerald-100" },
  { label: "Parados", color: "bg-amber-400", text: "text-amber-100" },
  { label: "Offline", color: "bg-rose-500", text: "text-rose-100" },
];

export function FleetStatusCard({ moving, stopped, offline, className }: FleetStatusCardProps) {
  const values = [moving, stopped, offline];

  return (
    <Card className={cn("bg-[#0a1222] border border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] uppercase tracking-wide text-slate-300">Status da Frota</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusStyles.map((item, idx) => (
          <div key={item.label} className="flex items-center justify-between text-sm text-slate-100">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <span className="text-slate-200 text-sm">{item.label}</span>
            </div>
            <span className="font-semibold text-base">{values[idx]}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
