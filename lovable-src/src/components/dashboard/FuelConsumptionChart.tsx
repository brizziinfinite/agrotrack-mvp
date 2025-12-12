import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockFuelConsumptionData } from '@/data/mockVehicles';
import { TrendingUp, TrendingDown, Fuel } from 'lucide-react';

type PeriodType = 'week' | 'month' | 'year';

const periodLabels: Record<PeriodType, { current: string; previous: string }> = {
  week: { current: 'Esta Semana', previous: 'Semana Anterior' },
  month: { current: 'Este Mês', previous: 'Mês Anterior' },
  year: { current: 'Este Ano', previous: 'Ano Anterior' },
};

export const FuelConsumptionChart = () => {
  const [period, setPeriod] = useState<PeriodType>('month');
  
  const data = mockFuelConsumptionData[period];
  
  // Calculate totals and variation
  const currentTotal = data.reduce((sum, item) => sum + item.current, 0);
  const previousTotal = data.reduce((sum, item) => sum + item.previous, 0);
  const variation = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  const isPositiveVariation = variation > 0;
  
  // Estimated cost (R$ 6,00 per liter average)
  const estimatedCost = currentTotal * 6;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Consumo de Combustível</h3>
          <p className="text-sm text-muted-foreground">Comparação com período anterior</p>
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
      <div className="mb-4 flex flex-wrap gap-4 rounded-xl bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Fuel className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold text-foreground">{currentTotal.toLocaleString('pt-BR')} L</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isPositiveVariation ? 'bg-destructive/10' : 'bg-emerald-500/10'
          }`}>
            {isPositiveVariation ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">vs {periodLabels[period].previous}</p>
            <p className={`text-sm font-semibold ${
              isPositiveVariation ? 'text-destructive' : 'text-emerald-500'
            }`}>
              {isPositiveVariation ? '+' : ''}{variation.toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <span className="text-sm">💰</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Custo Estimado</p>
            <p className="text-sm font-semibold text-foreground">
              R$ {estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}L`}
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
                const label = name === 'current' ? periodLabels[period].current : periodLabels[period].previous;
                return [`${value} L`, label];
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10 }}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground">
                  {value === 'current' ? periodLabels[period].current : periodLabels[period].previous}
                </span>
              )}
            />
            {/* Previous Period Line - Dashed */}
            <Area
              type="monotone"
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              dot={false}
            />
            {/* Current Period Line - Solid with fill */}
            <Area
              type="monotone"
              dataKey="current"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#currentGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
