import { Lock, Gauge, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OperationalAlertsCardProps {
  blocked: number;
  speeding: number;
  maintenance: number;
}

export const OperationalAlertsCard = ({ blocked, speeding, maintenance }: OperationalAlertsCardProps) => {
  const navigate = useNavigate();

  const items = [
    {
      label: 'Bloqueados',
      value: blocked,
      icon: Lock,
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive/10',
      filter: 'blocked',
    },
    {
      label: 'Excesso Veloc.',
      value: speeding,
      icon: Gauge,
      colorClass: 'text-orange-500',
      bgClass: 'bg-orange-500/10',
      filter: 'speeding',
    },
    {
      label: 'Manutenção',
      value: maintenance,
      icon: Wrench,
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-500/10',
      filter: 'maintenance',
    },
  ];

  return (
    <div
      className="
        relative overflow-hidden rounded-2xl border p-3 sm:p-5 h-full min-h-[120px] sm:min-h-[140px]
        bg-gradient-to-br from-muted to-muted/80 border-border
        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 sm:mb-4">
        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-destructive/10">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
        </div>
        <span className="text-xs sm:text-sm font-medium text-foreground">Alertas Operacionais</span>
      </div>

      {/* Items */}
      <div className="space-y-1 sm:space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.filter}
              onClick={() => navigate(`/mapa?filter=${item.filter}`)}
              className="
                w-full flex items-center justify-between p-1.5 sm:p-2 rounded-lg
                hover:bg-background/50 transition-colors cursor-pointer
                group text-left
              "
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg ${item.bgClass}`}>
                  <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${item.colorClass}`} />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </div>
              <span className={`text-base sm:text-lg font-bold ${item.colorClass}`}>
                {item.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
