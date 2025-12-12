import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Route, Clock } from 'lucide-react';

type PeriodType = 'week' | 'month' | 'year';

const periodLabels: Record<PeriodType, { current: string; previous: string }> = {
  week: { current: 'Esta Semana', previous: 'Semana Anterior' },
  month: { current: 'Este Mês', previous: 'Mês Anterior' },
  year: { current: 'Este Ano', previous: 'Ano Anterior' },
};

// Mock data for fleet performance
const mockFleetPerformanceData = {
  week: [
    { period: 'Seg', kmCurrent: 850, kmPrevious: 780, hoursCurrent: 45, hoursPrevious: 42 },
    { period: 'Ter', kmCurrent: 920, kmPrevious: 850, hoursCurrent: 52, hoursPrevious: 48 },
    { period: 'Qua', kmCurrent: 780, kmPrevious: 820, hoursCurrent: 38, hoursPrevious: 40 },
    { period: 'Qui', kmCurrent: 1050, kmPrevious: 950, hoursCurrent: 61, hoursPrevious: 55 },
    { period: 'Sex', kmCurrent: 990, kmPrevious: 920, hoursCurrent: 55, hoursPrevious: 50 },
    { period: 'Sáb', kmCurrent: 450, kmPrevious: 480, hoursCurrent: 28, hoursPrevious: 30 },
    { period: 'Dom', kmCurrent: 280, kmPrevious: 320, hoursCurrent: 15, hoursPrevious: 18 },
  ],
  month: [
    { period: 'Sem 1', kmCurrent: 4200, kmPrevious: 3800, hoursCurrent: 220, hoursPrevious: 200 },
    { period: 'Sem 2', kmCurrent: 4800, kmPrevious: 4200, hoursCurrent: 260, hoursPrevious: 240 },
    { period: 'Sem 3', kmCurrent: 3900, kmPrevious: 4100, hoursCurrent: 195, hoursPrevious: 210 },
    { period: 'Sem 4', kmCurrent: 5100, kmPrevious: 4600, hoursCurrent: 280, hoursPrevious: 250 },
  ],
  year: [
    { period: 'Jan', kmCurrent: 18500, kmPrevious: 17200, hoursCurrent: 920, hoursPrevious: 880 },
    { period: 'Fev', kmCurrent: 17800, kmPrevious: 16500, hoursCurrent: 890, hoursPrevious: 850 },
    { period: 'Mar', kmCurrent: 19200, kmPrevious: 18100, hoursCurrent: 980, hoursPrevious: 920 },
    { period: 'Abr', kmCurrent: 18900, kmPrevious: 17800, hoursCurrent: 950, hoursPrevious: 900 },
    { period: 'Mai', kmCurrent: 20500, kmPrevious: 19200, hoursCurrent: 1050, hoursPrevious: 980 },
    { period: 'Jun', kmCurrent: 19800, kmPrevious: 18500, hoursCurrent: 1010, hoursPrevious: 950 },
    { period: 'Jul', kmCurrent: 18200, kmPrevious: 17500, hoursCurrent: 920, hoursPrevious: 890 },
    { period: 'Ago', kmCurrent: 21000, kmPrevious: 19800, hoursCurrent: 1080, hoursPrevious: 1020 },
    { period: 'Set', kmCurrent: 20200, kmPrevious: 18900, hoursCurrent: 1040, hoursPrevious: 970 },
    { period: 'Out', kmCurrent: 21500, kmPrevious: 20100, hoursCurrent: 1100, hoursPrevious: 1040 },
    { period: 'Nov', kmCurrent: 19500, kmPrevious: 18200, hoursCurrent: 990, hoursPrevious: 930 },
    { period: 'Dez', kmCurrent: 20800, kmPrevious: 19500, hoursCurrent: 1060, hoursPrevious: 1000 },
  ],
};

export const FleetPerformanceChart = () => {
  const [period, setPeriod] = useState<PeriodType>('month');
  
  const data = mockFleetPerformanceData[period];
  
  // Calculate totals and variations for Km
  const kmCurrentTotal = data.reduce((sum, item) => sum + item.kmCurrent, 0);
  const kmPreviousTotal = data.reduce((sum, item) => sum + item.kmPrevious, 0);
  const kmVariation = kmPreviousTotal > 0 ? ((kmCurrentTotal - kmPreviousTotal) / kmPreviousTotal) * 100 : 0;
  
  // Calculate totals and variations for Hours
  const hoursCurrentTotal = data.reduce((sum, item) => sum + item.hoursCurrent, 0);
  const hoursPreviousTotal = data.reduce((sum, item) => sum + item.hoursPrevious, 0);
  const hoursVariation = hoursPreviousTotal > 0 ? ((hoursCurrentTotal - hoursPreviousTotal) / hoursPreviousTotal) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Desempenho da Frota</h3>
          <p className="text-sm text-muted-foreground">Veículos (Km) vs Máquinas (Horas)</p>
        </div>
        
        {/* Period Filter */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['week', 'month', 'year'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-4 grid grid-cols-1 xs:grid-cols-2 gap-3">
        {/* Km Stats */}
        <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-cyan-500/10 p-2.5 sm:p-3 border border-cyan-500/20">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-cyan-500/20 flex-shrink-0">
            <Route className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Km Rodados</p>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">{kmCurrentTotal.toLocaleString('pt-BR')}</p>
              <div className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-medium ${
                kmVariation >= 0 ? 'text-emerald-500' : 'text-destructive'
              }`}>
                {kmVariation >= 0 ? (
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                <span>{kmVariation >= 0 ? '+' : ''}{kmVariation.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hours Stats */}
        <div className="flex items-center gap-2 sm:gap-3 rounded-xl bg-amber-500/10 p-2.5 sm:p-3 border border-amber-500/20">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-500/20 flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Horas Trabalhadas</p>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">{hoursCurrentTotal.toLocaleString('pt-BR')}h</p>
              <div className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-medium ${
                hoursVariation >= 0 ? 'text-emerald-500' : 'text-destructive'
              }`}>
                {hoursVariation >= 0 ? (
                  <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                <span>{hoursVariation >= 0 ? '+' : ''}{hoursVariation.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Km Chart */}
        <div className="h-52">
          <p className="text-xs font-medium text-cyan-500 mb-2 flex items-center gap-1">
            <Route className="h-3 w-3" /> Quilômetros
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="kmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number, name: string) => {
                  const label = name === 'kmCurrent' ? periodLabels[period].current : periodLabels[period].previous;
                  return [`${value.toLocaleString('pt-BR')} km`, label];
                }}
              />
              <Area
                type="monotone"
                dataKey="kmPrevious"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="kmCurrent"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#kmGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hours Chart */}
        <div className="h-52">
          <p className="text-xs font-medium text-amber-500 mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Horas
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                tickFormatter={(value) => `${value}h`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number, name: string) => {
                  const label = name === 'hoursCurrent' ? periodLabels[period].current : periodLabels[period].previous;
                  return [`${value.toLocaleString('pt-BR')} h`, label];
                }}
              />
              <Area
                type="monotone"
                dataKey="hoursPrevious"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="hoursCurrent"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#hoursGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-cyan-500 rounded"></div>
          <span>{periodLabels[period].current}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
          <span>{periodLabels[period].previous}</span>
        </div>
      </div>
    </div>
  );
};
