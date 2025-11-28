"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { useMemo } from "react";
import { MapPin, Users, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LocationAnalyticsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const locationId = params.id as string;
  const { locations, shifts, employees, currency, weather } = useStore();

  const location = useMemo(() => {
    return locations.find(loc => loc.id === locationId);
  }, [locations, locationId]);

  // Get assigned staff
  const assignedStaff = useMemo(() => {
    return employees.filter(emp => emp.assignedPointId === locationId);
  }, [employees, locationId]);

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

  const locationRevenue = useMemo(() => {
    return todayShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
  }, [todayShifts]);

  const planPercent = useMemo(() => {
    if (!location?.dailyPlan || location.dailyPlan === 0) return 0;
    return Math.round((locationRevenue / location.dailyPlan) * 100);
  }, [locationRevenue, location?.dailyPlan]);

  // Mock data for charts
  const revenueData = useMemo(() => {
    return [
      { day: 'Пн', revenue: locationRevenue * 0.8, plan: location?.dailyPlan || 0 },
      { day: 'Вт', revenue: locationRevenue * 0.9, plan: location?.dailyPlan || 0 },
      { day: 'Ср', revenue: locationRevenue * 0.85, plan: location?.dailyPlan || 0 },
      { day: 'Чт', revenue: locationRevenue * 0.95, plan: location?.dailyPlan || 0 },
      { day: 'Пт', revenue: locationRevenue, plan: location?.dailyPlan || 0 },
      { day: 'Сб', revenue: locationRevenue * 1.1, plan: location?.dailyPlan || 0 },
      { day: 'Вс', revenue: locationRevenue * 0.7, plan: location?.dailyPlan || 0 },
    ];
  }, [locationRevenue, location?.dailyPlan]);

  const hourlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      hour: `${9 + i}:00`,
      traffic: Math.floor(Math.random() * 30) + 10
    }));
  }, []);

  if (!location) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Локация не найдена</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/dashboard/director/locations"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Назад к точкам
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{location.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location.address}</span>
        </div>
      </div>

      {/* Weather History */}
      <div className="bg-card p-4 border border-border rounded-xl">
        <h3 className="text-sm font-semibold text-foreground mb-3">Погода сегодня</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono text-foreground">{weather.temp}°C</span>
          <span className="text-muted-foreground">Влажность: {weather.humidity}%</span>
          <span className="text-muted-foreground capitalize">{weather.condition}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">{t('dashboard.revenue_today_label') || 'Выручка сегодня'}</p>
          <p className="text-2xl font-bold text-foreground">
            {locationRevenue.toLocaleString('ru-RU')} {currency}
          </p>
        </div>
        <div className="bg-card p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Выполнение плана</p>
          <p className={`text-2xl font-bold ${
            planPercent >= 90 ? 'text-emerald-500' : planPercent < 80 ? 'text-rose-500' : 'text-blue-500'
          }`}>
            {planPercent}%
          </p>
        </div>
        <div className="bg-card p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Команда</p>
          <p className="text-2xl font-bold text-foreground">
            {assignedStaff.length} чел.
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Plan */}
        <div className="bg-card p-6 border border-border rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('dashboard.revenue_vs_plan') || 'Выручка vs План'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name={t('dashboard.metric_revenue') || 'Выручка'} />
              <Bar dataKey="plan" fill="hsl(var(--muted))" name={t('dashboard.plan') || 'План'} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Traffic */}
        <div className="bg-card p-6 border border-border rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Почасовая посещаемость
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="traffic" stroke="hsl(var(--primary))" strokeWidth={2} name="Посетители" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team */}
      <div className="bg-card p-6 border border-border rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Команда сегодня
        </h3>
        {assignedStaff.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedStaff.map(employee => (
              <div key={employee.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 font-bold">
                  {employee.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{employee.name}</p>
                  {employee.jobTitle && (
                    <p className="text-xs text-muted-foreground">{employee.jobTitle}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет назначенных сотрудников
          </p>
        )}
      </div>
    </div>
  );
}











