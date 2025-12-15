"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, History, Activity, Map, MapPin, Tractor, UserRound, Wrench, FileText } from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: Activity },
  { label: "Mapa", href: "/mapa", icon: Map },
  { label: "Dispositivos", href: "/dispositivos", icon: Tractor },
  { label: "Histórico", href: "/historico", icon: History },
  { label: "Cercas", href: "/cercas", icon: MapPin },
  { label: "Motoristas", href: "/motoristas", icon: UserRound },
  { label: "Manutenção", href: "/manutencao", icon: Wrench },
  { label: "Relatórios", href: "/relatorios", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const activeHref = useMemo(() => {
    const current = menuItems.find((item) => pathname === item.href || pathname.startsWith(item.href));
    return current?.href ?? null;
  }, [pathname]);

  return (
    <aside
      className={cn(
        "h-screen bg-[#050814] border-r border-white/5 flex flex-col transition-[width] duration-300 ease-in-out shadow-[0_10px_50px_-25px_rgba(0,0,0,0.8)]",
        collapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Topo */}
      <div className="h-14 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Activity className="h-5 w-5 text-slate-950" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-white leading-none">AgroTrack</p>
              <p className="text-[11px] text-slate-400">Fazenda Santa Inês</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="h-8 w-8 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition"
          aria-label="Alternar sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 mt-4 space-y-1 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref ? pathname.startsWith(item.href) : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm transition border",
                collapsed ? "justify-center gap-0" : "gap-3",
                isActive
                  ? "bg-primary/10 text-primary border-primary/30 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.7)]"
                  : "text-slate-300 hover:bg-white/5 border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-3 border-t border-white/5">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white flex items-center justify-center text-sm font-semibold">
            AT
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-medium text-white">Sistema ativo</p>
              <p className="text-[11px] text-slate-400">Monitorando frota</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
