"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { Trophy, Medal, Award, TrendingDown } from "lucide-react";
import { useMemo } from "react";

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const metric = params.metric as string;
  const { locations, shifts, currency } = useStore();

  // Calculate today's date range
  const today = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).getTime();
    return { start: startOfDay, end: endOfDay };
  }, []);

  // Get today's shifts
  const todayShifts = useMemo(() => {
    return shifts.filter(s => s.date >= today.start && s.date <= today.end);
  }, [shifts, today]);

  // Calculate metrics for each location
  const locationMetrics = useMemo(() => {
    return locations.map(location => {
      // Mock: assign shifts to locations
      const locShifts = todayShifts; // Simplified
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locCheckCount = locShifts.reduce((acc, s) => acc + (s.checkCount || 0), 0);
      const locPlanPercent = location.dailyPlan && location.dailyPlan > 0 
        ? Math.round((locRevenue / location.dailyPlan) * 100) 
        : 0;

      let value = 0;
      if (metric === 'revenue') value = locRevenue;
      else if (metric === 'plan_percent') value = locPlanPercent;
      else if (metric === 'check_count') value = locCheckCount;

      return {
        ...location,
        value,
        revenue: locRevenue,
        planPercent: locPlanPercent,
        checkCount: locCheckCount
      };
    }).sort((a, b) => b.value - a.value);
  }, [locations, todayShifts, metric]);

  const getMetricLabel = () => {
    switch (metric) {
      case 'revenue': return t('dashboard.metric_revenue') || 'Выручка';
      case 'plan_percent': return t('dashboard.metric_plan_percent') || 'Выполнение плана';
      case 'check_count': return t('dashboard.metric_check_count') || 'Количество чеков';
      default: return t('dashboard.metric_label') || 'Метрика';
    }
  };

  const formatValue = (val: number) => {
    if (metric === 'revenue') return `${val.toLocaleString('ru-RU')} ${currency}`;
    if (metric === 'plan_percent') return `${val}%`;
    return val.toString();
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-indigo-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-zinc-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-blue-600" />;
    return null;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-indigo-500/10 border-indigo-500/30 ring-2 ring-indigo-500/20';
    if (index === 1) return 'bg-zinc-400/10 border-zinc-400/30 ring-2 ring-zinc-400/20';
    if (index === 2) return 'bg-blue-600/10 border-blue-600/30 ring-2 ring-blue-600/20';
    return 'bg-card border-border';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Рейтинг: {getMetricLabel()}
        </h1>
        <p className="text-sm text-muted-foreground">
          Сортировка точек по производительности
        </p>
      </div>

      <div className="space-y-3">
        {locationMetrics.map((loc, index) => {
          const deviation = index > 0 
            ? ((loc.value - locationMetrics[0].value) / locationMetrics[0].value * 100).toFixed(1)
            : '0.0';

          return (
            <div
              key={loc.id}
              className={`p-4 rounded-xl border ${getRankStyle(index)} transition-all hover:shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{loc.name}</h3>
                    <p className="text-xs text-muted-foreground">{loc.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-foreground">
                    {formatValue(loc.value)}
                  </div>
                  {index > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <TrendingDown className="h-3 w-3" />
                      <span>{deviation}% от лидера</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}












