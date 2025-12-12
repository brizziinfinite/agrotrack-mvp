import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockConsumptionData } from '@/data/mockVehicles';

export const ConsumptionChart = () => {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Consumo Semanal</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">Consumo estimado de combustível (litros) vs quilometragem</p>
      </div>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockConsumptionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              formatter={(value: number, name: string) => [
                name === 'consumption' ? `${value} L` : `${value} km`,
                name === 'consumption' ? 'Consumo' : 'Km',
              ]}
            />
            <Legend
              formatter={(value) => (value === 'consumption' ? 'Consumo (L)' : 'Km')}
              wrapperStyle={{ paddingTop: 20 }}
            />
            <Bar
              dataKey="consumption"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="km"
              fill="hsl(var(--accent))"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
