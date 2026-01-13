"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { FileText, Calendar, DollarSign, AlertTriangle, CheckCircle2, MapPin, ChevronDown, Filter, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type PeriodFilter = "today" | "yesterday" | "week" | "custom";
type StatusFilter = "all" | "ok" | "issues";

export default function ShiftsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { shifts, employees, currency, locations } = useStore();
  
  // Filters
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Calculate date range based on period filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    switch (periodFilter) {
      case "today":
        return { start: today.getTime(), end: todayEnd.getTime() };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return { start: yesterday.getTime(), end: yesterdayEnd.getTime() };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return { start: weekStart.getTime(), end: todayEnd.getTime() };
      case "custom":
        // For now, same as week
        const customStart = new Date(today);
        customStart.setDate(customStart.getDate() - 7);
        return { start: customStart.getTime(), end: todayEnd.getTime() };
      default:
        return { start: 0, end: Date.now() };
    }
  }, [periodFilter]);

  // Filter shifts
  const filteredShifts = useMemo(() => {
    if (!shifts || shifts.length === 0) return [];
    
    let filtered = [...shifts];
    
    // Filter by date range
    filtered = filtered.filter(shift => 
      shift.date >= dateRange.start && shift.date <= dateRange.end
    );
    
    // Filter by location
    if (locationFilter !== "all") {
      filtered = filtered.filter(shift => shift.locationId === locationFilter);
    }
    
    // Filter by status
    if (statusFilter === "ok") {
      filtered = filtered.filter(shift => shift.status === 'ok');
    } else if (statusFilter === "issues") {
      filtered = filtered.filter(shift => shift.status === 'issue');
    }
    
    return filtered.sort((a, b) => b.date - a.date);
  }, [shifts, dateRange, locationFilter, statusFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalShifts = filteredShifts.length;
    const totalRevenue = filteredShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
    const problematicShifts = filteredShifts.filter(s => s.status === 'issue').length;
    
    return { totalShifts, totalRevenue, problematicShifts };
  }, [filteredShifts]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case "today": return "Сегодня";
      case "yesterday": return "Вчера";
      case "week": return "Неделя";
      case "custom": return "Произвольно";
      default: return "Период";
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Смены и отчёты</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Контроль смен по всей сети
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="today">Сегодня</option>
              <option value="yesterday">Вчера</option>
              <option value="week">Неделя</option>
              <option value="custom">Произвольно</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Все точки</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Все</option>
              <option value="ok">Без проблем</option>
              <option value="issues">С проблемами</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Shifts */}
        <div className="bg-card p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Всего смен</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{metrics.totalShifts}</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-card p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Общая выручка</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {metrics.totalRevenue.toLocaleString('ru-RU')} {currency}
          </p>
        </div>

        {/* Problematic Shifts */}
        <div className={cn(
          "bg-card p-5 border rounded-xl",
          metrics.problematicShifts > 0 
            ? "border-red-500/50 bg-red-500/5" 
            : "border-border"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className={cn(
              "h-5 w-5",
              metrics.problematicShifts > 0 ? "text-red-500" : "text-muted-foreground"
            )} />
            <span className="text-sm text-muted-foreground">Проблемные смены</span>
          </div>
          <p className={cn(
            "text-3xl font-bold",
            metrics.problematicShifts > 0 ? "text-red-500" : "text-foreground"
          )}>
            {metrics.problematicShifts}
          </p>
        </div>
      </div>

      {/* Shifts List */}
      {filteredShifts.length > 0 ? (
        <div className="space-y-4">
          {filteredShifts.map((shift) => {
            const employee = employees.find(e => e.id === shift.employeeId);
            const location = locations.find(l => l.id === shift.locationId);
            const revenue = shift.revenueCash + shift.revenueCard;
            const hasProblems = shift.status === 'issue';

            return (
              <ShiftCard
                key={shift.id}
                shift={shift}
                employee={employee}
                location={location}
                revenue={revenue}
                currency={currency}
                hasProblems={hasProblems}
                formatDate={formatDate}
                formatTime={formatTime}
                onClick={() => router.push(`/dashboard/director/shifts/${shift.id}`)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            За выбранный период смен нет
          </p>
        </div>
      )}
    </div>
  );
}

// Shift Card Component
function ShiftCard({
  shift,
  employee,
  location,
  revenue,
  currency,
  hasProblems,
  formatDate,
  formatTime,
  onClick,
}: {
  shift: any;
  employee: any;
  location: any;
  revenue: number;
  currency: string;
  hasProblems: boolean;
  formatDate: (timestamp: number) => string;
  formatTime: (timestamp: number) => string;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "bg-card border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer hover:border-primary/30",
        hasProblems ? "border-red-500/50 bg-red-500/5" : "border-border"
      )}
    >
      {/* Header: Date, Location, Employee */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {hasProblems ? (
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {formatDate(shift.date)}
                </span>
                {shift.clockIn && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(new Date(shift.clockIn).getTime())}
                    {shift.clockOut && ` - ${formatTime(new Date(shift.clockOut).getTime())}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap ml-8">
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{location.name}</span>
              </div>
            )}
            {employee && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>{employee.name || employee.fullName || "Неизвестный сотрудник"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="ml-4 shrink-0">
          {hasProblems ? (
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Проблемы
            </span>
          ) : (
            <span className="px-3 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              OK
            </span>
          )}
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4 ml-8">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Наличные</p>
          <p className="text-sm font-semibold text-foreground">
            {shift.revenueCash.toLocaleString('ru-RU')} {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Терминал</p>
          <p className="text-sm font-semibold text-foreground">
            {shift.revenueCard.toLocaleString('ru-RU')} {currency}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Итого</p>
          <p className="text-base font-bold text-foreground">
            {revenue.toLocaleString('ru-RU')} {currency}
          </p>
        </div>
      </div>

      {/* Problems Preview */}
      {hasProblems && shift.anomalies && shift.anomalies.length > 0 && (
        <div className="ml-8 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
            Обнаружены проблемы:
          </p>
          <div className="flex flex-wrap gap-2">
            {shift.anomalies.slice(0, 3).map((anomaly: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-md text-xs bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
              >
                {anomaly}
              </span>
            ))}
            {shift.anomalies.length > 3 && (
              <span className="px-2 py-1 rounded-md text-xs bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                +{shift.anomalies.length - 3} ещё
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
