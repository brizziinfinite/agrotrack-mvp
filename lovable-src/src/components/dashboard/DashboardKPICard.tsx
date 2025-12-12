import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardKPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  variant: 'primary' | 'accent' | 'amber' | 'muted';
}

const variantStyles = {
  primary: 'bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20',
  accent: 'bg-gradient-to-br from-accent/15 to-accent/5 border-accent/20',
  amber: 'bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/20',
  muted: 'bg-gradient-to-br from-muted to-muted/80 border-border',
};

const iconStyles = {
  primary: 'bg-primary/20 text-primary',
  accent: 'bg-accent/20 text-accent',
  amber: 'bg-amber-500/20 text-amber-500',
  muted: 'bg-muted-foreground/20 text-muted-foreground',
};

export const DashboardKPICard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant,
}: DashboardKPICardProps) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border p-3 sm:p-5 h-full min-h-[120px] sm:min-h-[140px]
        transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
        ${variantStyles[variant]}
      `}
    >
      {/* Icon */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground pr-12">{title}</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{value}</p>
        
        <div className="flex items-center gap-2 text-sm">
          {trend && (
            <span
              className={`flex items-center gap-1 font-medium ${
                trend.direction === 'up' ? 'text-accent' : 'text-destructive'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {trend.value}%
            </span>
          )}
          <span className="text-muted-foreground">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};
