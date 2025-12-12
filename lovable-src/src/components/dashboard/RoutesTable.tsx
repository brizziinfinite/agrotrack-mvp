import { mockRouteData } from '@/data/mockVehicles';
import { ArrowRight } from 'lucide-react';

export const RoutesTable = () => {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Rotas Mais Usadas</h3>
        <p className="text-sm text-muted-foreground">Top 5 rotas da semana</p>
      </div>

      <div className="space-y-3">
        {mockRouteData.map((route, index) => (
          <div
            key={route.route}
            className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary">#{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{route.route}</p>
              </div>
              <p className="text-xs text-muted-foreground">{route.trips} viagens</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{route.km} km</p>
              <p className="text-xs text-muted-foreground">total</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
