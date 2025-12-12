import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardKPICard } from '@/components/dashboard/DashboardKPICard';
import { FleetStatusCard } from '@/components/dashboard/FleetStatusCard';
import { OperationalAlertsCard } from '@/components/dashboard/OperationalAlertsCard';
import { ConsumptionStatsCard } from '@/components/dashboard/ConsumptionStatsCard';
import { FleetPerformanceChart } from '@/components/dashboard/FleetPerformanceChart';
import { ConsumptionChart } from '@/components/dashboard/ConsumptionChart';
import { DashboardMiniMap } from '@/components/dashboard/DashboardMiniMap';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { RoutesTable } from '@/components/dashboard/RoutesTable';
import { LastMovementList } from '@/components/dashboard/LastMovementList';
import { getVehicleStats } from '@/data/mockVehicles';
import { Truck, Route, Clock } from 'lucide-react';

const Index = () => {
  const stats = getVehicleStats();

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* FAIXA 0 - Cabeçalho */}
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da sua frota em tempo real</p>
        </div>

        {/* FAIXA 1 - KPIs Principais (6 Cards) */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <div className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            <DashboardKPICard
              title="Veículos Conectados"
              value={`${stats.connected}/${stats.total}`}
              subtitle={`${stats.offline} offline`}
              icon={<Truck className="w-6 h-6" />}
              trend={{ value: 12, direction: 'up' }}
              variant="primary"
            />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
            <DashboardKPICard
              title="Km Rodados Hoje"
              value={`${stats.totalKmToday.toLocaleString()} km`}
              subtitle="vs ontem"
              icon={<Route className="w-6 h-6" />}
              trend={{ value: 5, direction: 'up' }}
              variant="accent"
            />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <DashboardKPICard
              title="Horas Trabalhadas"
              value={`${stats.totalHoursToday.toFixed(1)} h`}
              subtitle="vs ontem"
              icon={<Clock className="w-6 h-6" />}
              trend={{ value: 3, direction: 'down' }}
              variant="amber"
            />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.25s' }}>
            <ConsumptionStatsCard
              consumptionPerKm={stats.avgConsumption}
              consumptionPerHour={stats.avgConsumptionPerHour}
              trend={{ value: 2, direction: 'down' }}
            />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <FleetStatusCard
              moving={stats.moving}
              stopped={stats.stopped + stats.idle}
              offline={stats.offline}
            />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.35s' }}>
            <OperationalAlertsCard
              blocked={stats.blockedCount}
              speeding={stats.speedingCount}
              maintenance={stats.maintenanceCount}
            />
          </div>
        </div>

        {/* FAIXA 2 - Gráficos + Mini-Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda - Gráficos */}
          <div className="lg:col-span-7 space-y-6">
            <div className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <FleetPerformanceChart />
            </div>
            <div className="animate-slide-in-up" style={{ animationDelay: '0.35s' }}>
              <ConsumptionChart />
            </div>
          </div>

          {/* Coluna Direita - Mini-Mapa */}
          <div className="lg:col-span-5 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <DashboardMiniMap />
          </div>
        </div>

        {/* FAIXA 3 - Listas (3 Colunas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="animate-slide-in-up" style={{ animationDelay: '0.45s' }}>
            <AlertsList />
          </div>
          <div className="animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
            <RoutesTable />
          </div>
          <div className="md:col-span-2 lg:col-span-1 animate-slide-in-up" style={{ animationDelay: '0.55s' }}>
            <LastMovementList />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
