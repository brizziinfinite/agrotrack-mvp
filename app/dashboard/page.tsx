"use client"

import { AlertsList, type AlertItem } from "@/components/dashboard/AlertsList"
import { ConsumptionChart } from "@/components/dashboard/ConsumptionChart"
import { ConsumptionStatsCard } from "@/components/dashboard/ConsumptionStatsCard"
import { DashboardKPICard } from "@/components/dashboard/DashboardKPICard"
import { DashboardMiniMap } from "@/components/dashboard/DashboardMiniMap"
import { FleetPerformanceChart } from "@/components/dashboard/FleetPerformanceChart"
import { FleetStatusCard } from "@/components/dashboard/FleetStatusCard"
import { LastMovementList, type MovementItem } from "@/components/dashboard/LastMovementList"
import { OperationalAlertsCard } from "@/components/dashboard/OperationalAlertsCard"
import { RoutesTable, type RouteItem } from "@/components/dashboard/RoutesTable"
import { AlertTriangle, Clock, Fuel, Route, Timer, Truck, Wrench } from "lucide-react"

function getVehicleStats() {
  return {
    total: 8,
    connected: 7,
    offline: 1,
    totalKmToday: 599,
    totalHoursToday: 41.2,
    avgConsumption: 3.4,
    avgConsumptionPerHour: 12.8,
    moving: 4,
    stopped: 3,
    idle: 0,
    blockedCount: 1,
    speedingCount: 2,
    maintenanceCount: 2,
  }
}

const alerts: AlertItem[] = [
  { title: "Troca de óleo próxima - 500km restantes", detail: "Truck #02 · há 1h", severity: "critico", icon: Wrench },
  { title: "Nível de combustível baixo (30%)", detail: "Trator #04 · há 30min", severity: "critico", icon: Fuel },
  { title: "Veículo parado com motor ligado", detail: "Truck #03 · há 15min", severity: "atencao", icon: Timer },
  { title: "Revisão programada vencida", detail: "Truck #06 · há 1 dia", severity: "critico", icon: AlertTriangle },
  { title: "Nível crítico de combustível (20%)", detail: "Truck #06 · há 2h", severity: "critico", icon: Fuel },
]

const popularRoutes: RouteItem[] = [
  { rank: 1, route: "São Paulo → Campinas", trips: 28, km: 2520 },
  { rank: 2, route: "Rio → São Paulo", trips: 22, km: 9460 },
  { rank: 3, route: "Curitiba → Florianópolis", trips: 18, km: 5400 },
  { rank: 4, route: "BH → Vitória", trips: 15, km: 7680 },
  { rank: 5, route: "Porto Alegre → Curitiba", trips: 12, km: 8640 },
]

const lastMovements: MovementItem[] = [
  { name: "ABC-1234", time: "08:27", speed: "45 km/h", distance: "87 km", driver: "Carlos Silva", status: "em movimento" },
  { name: "DEF-5678", time: "08:01", speed: "0 km/h", distance: "156 km", driver: "João Oliveira", status: "ocioso" },
  { name: "GHI-9012", time: "09:16", speed: "62 km/h", distance: "134 km", driver: "Pedro Santos", status: "em movimento" },
  { name: "JKL-3456", time: "09:53", speed: "0 km/h", distance: "12 km", driver: "Marcos Lima", status: "offline" },
  { name: "MNO-7890", time: "10:49", speed: "38 km/h", distance: "67 km", driver: "Ana Costa", status: "em movimento" },
]

export default function DashboardPage() {
  const stats = getVehicleStats()

  return (
    <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden">
      <div className="min-h-full w-full bg-gradient-to-b from-[#050816] via-[#050816] to-[#030412]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(59,169,255,0.04),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.05),transparent_32%)]" />

        {/* Conteúdo */}
        <div className="relative mx-auto w-full max-w-6xl min-w-0 px-3 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-8 space-y-6">
          {/* Cabeçalho */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.28em] text-emerald-400/80">OPERAÇÕES</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-50">Dashboard</h1>
            <p className="text-sm text-slate-400">Visão geral da sua frota em tempo real</p>
          </div>

          {/* Faixa 1: KPIs (mobile = 1 coluna) */}
          <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <DashboardKPICard
              title="Veículos Conectados"
              value={`${stats.connected}/${stats.total}`}
              subtitle={`${stats.offline} offline`}
              icon={<Truck className="h-4 w-4" />}
              trend={{ value: 12, direction: "up", label: "vs ontem" }}
              className="min-h-[140px] sm:min-h-[170px] w-full min-w-0"
            />
            <DashboardKPICard
              title="Km Rodados Hoje"
              value={`${stats.totalKmToday} km`}
              subtitle="vs ontem"
              icon={<Route className="h-4 w-4" />}
              trend={{ value: 5, direction: "up" }}
              className="min-h-[140px] sm:min-h-[170px] w-full min-w-0"
            />
            <DashboardKPICard
              title="Horas Trabalhadas"
              value={`${stats.totalHoursToday.toFixed(1)} h`}
              subtitle="vs ontem"
              icon={<Clock className="h-4 w-4" />}
              trend={{ value: 3, direction: "down", label: "vs ontem" }}
              className="min-h-[140px] sm:min-h-[170px] w-full min-w-0"
            />
            <ConsumptionStatsCard
              consumptionPerKm={stats.avgConsumption}
              consumptionPerHour={stats.avgConsumptionPerHour}
              trend={{ value: 2, direction: "down", label: "vs semana" }}
              className="min-h-[140px] sm:min-h-[170px] w-full min-w-0"
            />
            <FleetStatusCard
              moving={stats.moving}
              stopped={stats.stopped + stats.idle}
              offline={stats.offline}
              className="min-h-[140px] sm:min-h-[170px] w-full min-w-0"
            />
            <OperationalAlertsCard
              blocked={stats.blockedCount}
              speeding={stats.speedingCount}
              maintenance={stats.maintenanceCount}
              className="min-h-[140px] sm:min-h-[170px] w-full min-w-0"
            />
          </div>

          {/* Faixa 2: Gráficos + Mini mapa */}
          <div className="grid min-w-0 grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
            <div className="min-w-0 lg:col-span-7 space-y-3 sm:space-y-4">
              <FleetPerformanceChart />
              <ConsumptionChart />
            </div>
            <div className="min-w-0 lg:col-span-5">
              <DashboardMiniMap />
            </div>
          </div>

          {/* Faixa 3: Listas */}
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <AlertsList items={alerts} />
            <RoutesTable items={popularRoutes} />
            <LastMovementList items={lastMovements} className="md:col-span-2 lg:col-span-1" />
          </div>
        </div>
      </div>
    </div>
  )
}
