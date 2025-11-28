"use client";

import React, { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    fullDate: string;
    plan?: number;
  }>;
  currency: string;
  planData?: number[];
}

export const RevenueChart = React.memo(({ data, currency, planData }: RevenueChartProps) => {
  // Вычисляем максимальное значение для domain
  const maxRevenue = useMemo(() => {
    const revenueMax = Math.max(...data.map(d => d.revenue), 0);
    const planMax = planData ? Math.max(...planData, 0) : 0;
    const max = Math.max(revenueMax, planMax);
    return max > 0 ? Math.ceil(max * 1.15 / 1000) * 1000 : 1000; // Округляем до тысяч
  }, [data, planData]);

  // Форматируем данные с планом
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      plan: planData ? planData[index] : undefined
    }));
  }, [data, planData]);

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            domain={[0, maxRevenue]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
              }
              return value.toString();
            }}
            width={60}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                // Format date as DD.MM.YYYY
                let formattedDate = data.fullDate;
                try {
                  // Try to parse the date
                  let date: Date;
                  if (typeof data.fullDate === 'string') {
                    date = new Date(data.fullDate.split(' ')[0]);
                  } else {
                    date = new Date(data.fullDate);
                  }
                  if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('ru-RU', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    });
                  }
                } catch (e) {
                  // Use original if parsing fails
                }
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
                    <p className="text-sm font-semibold mb-2 text-foreground">{formattedDate}</p>
                    <p className="text-sm text-foreground font-medium mb-1">
                      Выручка: <span className="text-primary">{data.revenue.toLocaleString('ru-RU')} {currency}</span>
                    </p>
                    {data.plan !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        План: {data.plan.toLocaleString('ru-RU')} {currency}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
            position={{ y: -10 }}
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2, strokeDasharray: '3 3' }}
          />
          {planData && (
            <Line 
              type="monotone" 
              dataKey="plan" 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="План"
            />
          )}
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
            name="Выручка"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

RevenueChart.displayName = 'RevenueChart';

