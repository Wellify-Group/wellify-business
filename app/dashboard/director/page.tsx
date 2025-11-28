"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";
import { DayHeader } from "@/components/dashboard/director/day-header";
import { KPICard } from "@/components/dashboard/director/kpi-card";
import { ProblemCenter } from "@/components/dashboard/director/problem-center";
import { LocationsShiftsTable } from "@/components/dashboard/director/locations-shifts-table";
import { RevenueChartBlock } from "@/components/dashboard/director/revenue-chart-block";
import { EventJournal } from "@/components/dashboard/director/event-journal";
import { NetworkStatusIndicator } from "@/components/dashboard/director/network-status-indicator";
import { QuickActions } from "@/components/dashboard/director/quick-actions";
import { Problem, createProblemFromSource } from "@/lib/problem-types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function DirectorDashboard() {
  const { t } = useLanguage();
  const { locations, shifts, currency, employees, currentUser, hasSeenTour } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string;
    message: string;
    time: number;
    type: 'finance' | 'incident' | 'personnel' | 'other';
  }>>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Store refs for current data to use in interval
  const shiftsRef = useRef(shifts);
  const employeesRef = useRef(employees);
  const locationsRef = useRef(locations);
  const existingEventsRef = useRef<Set<string>>(new Set());

  // Update refs when data changes
  useEffect(() => {
    shiftsRef.current = shifts;
    employeesRef.current = employees;
    locationsRef.current = locations;
  }, [shifts, employees, locations]);

  // Generate events
  useEffect(() => {
    const generateEvents = () => {
      const events: Array<{
        id: string;
        message: string;
        time: number;
        type: 'finance' | 'incident' | 'personnel' | 'other';
      }> = [];
      const newEventIds = new Set<string>();

      // Recent shifts
      [...shiftsRef.current]
        .sort((a, b) => b.date - a.date)
        .slice(0, 5)
        .forEach(shift => {
          const employee = employeesRef.current.find(e => e.id === shift.employeeId);
          if (shift.clockOut && shift.status === 'ok') {
            const eventId = shift.id;
            if (!existingEventsRef.current.has(eventId)) {
              events.push({
                id: eventId,
                message: `${t('dashboard.shift_completed') || 'Смена сотрудника'} ${employee?.name || shift.employeeName} ${t('dashboard.shift_completed_suffix') || 'завершена.'}`,
                time: shift.date,
                type: 'personnel'
              });
              newEventIds.add(eventId);
            }
          }
        });

      // Plan updates
      locationsRef.current.forEach(loc => {
        if (loc.dailyPlan && loc.dailyPlan > 0) {
          const eventId = `plan-${loc.id}`;
          if (!existingEventsRef.current.has(eventId)) {
            events.push({
              id: eventId,
              message: `${t('dashboard.plan_updated') || 'План по точке'} ${loc.name} ${t('dashboard.plan_updated_suffix') || 'обновлён менеджером.'}`,
              time: Date.now() - Math.random() * 86400000,
              type: 'finance'
            });
            newEventIds.add(eventId);
          }
        }
      });

      // New employees
      employeesRef.current
        .filter(e => e.role === 'employee' && e.status === 'active')
        .slice(0, 1)
        .forEach(emp => {
          const eventId = `emp-${emp.id}`;
          if (!existingEventsRef.current.has(eventId)) {
            events.push({
              id: eventId,
              message: `В систему добавлен новый сотрудник.`,
              time: Date.now() - Math.random() * 2 * 86400000,
              type: 'personnel'
            });
            newEventIds.add(eventId);
          }
        });

      newEventIds.forEach(id => existingEventsRef.current.add(id));
      const allEvents = [...recentEvents, ...events].sort((a, b) => b.time - a.time);
      return allEvents.slice(0, 10);
    };

    setRecentEvents(generateEvents());

    const interval = setInterval(() => {
      setRecentEvents(prevEvents => {
        const events: Array<{
          id: string;
          message: string;
          time: number;
          type: 'finance' | 'incident' | 'personnel' | 'other';
        }> = [];
        const newEventIds = new Set<string>();

        [...shiftsRef.current]
          .sort((a, b) => b.date - a.date)
          .slice(0, 5)
          .forEach(shift => {
            const employee = employeesRef.current.find(e => e.id === shift.employeeId);
            if (shift.clockOut && shift.status === 'ok') {
              const eventId = shift.id;
              if (!existingEventsRef.current.has(eventId)) {
                events.push({
                  id: eventId,
                  message: `${t('dashboard.shift_completed') || 'Смена сотрудника'} ${employee?.name || shift.employeeName} ${t('dashboard.shift_completed_suffix') || 'завершена.'}`,
                  time: shift.date,
                  type: 'personnel'
                });
                newEventIds.add(eventId);
              }
            }
          });

        newEventIds.forEach(id => existingEventsRef.current.add(id));
        const allEvents = [...prevEvents, ...events].sort((a, b) => b.time - a.time);
        return allEvents.slice(0, 10);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // === DATE CALCULATIONS ===
  const today = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).getTime();
    return { start: startOfDay, end: endOfDay };
  }, []);

  const todayShifts = useMemo(() => {
    return shifts.filter(s => s.date >= today.start && s.date <= today.end);
  }, [shifts, today]);

  // === KPI CALCULATIONS ===
  const totalRevenue = useMemo(() => {
    return todayShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
  }, [todayShifts]);

  const totalCheckCount = useMemo(() => {
    return todayShifts.reduce((acc, s) => acc + (s.checkCount || 0), 0);
  }, [todayShifts]);

  const totalGuestCount = useMemo(() => {
    return todayShifts.reduce((acc, s) => acc + (s.guestCount || 0), 0);
  }, [todayShifts]);

  const avgCheck = useMemo(() => {
    return totalCheckCount > 0 ? totalRevenue / totalCheckCount : 0;
  }, [totalRevenue, totalCheckCount]);

  const totalPlan = useMemo(() => {
    return locations.reduce((acc, loc) => acc + (loc.dailyPlan || 0), 0);
  }, [locations]);

  const planPercent = useMemo(() => {
    return totalPlan > 0 ? Math.round((totalRevenue / totalPlan) * 100) : 0;
  }, [totalRevenue, totalPlan]);

  // Previous day comparison
  const yesterdayRevenue = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    const yesterdayShifts = shifts.filter(s => 
      s.date >= yesterday.getTime() && s.date <= yesterdayEnd.getTime()
    );
    return yesterdayShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
  }, [shifts]);

  const revenueChangePercent = yesterdayRevenue > 0
    ? Math.round(((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : 0;

  // Calculate yesterday metrics for comparison
  const yesterdayShifts = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    return shifts.filter(s => 
      s.date >= yesterday.getTime() && s.date <= yesterdayEnd.getTime()
    );
  }, [shifts]);

  const yesterdayCheckCount = useMemo(() => {
    return yesterdayShifts.reduce((acc, s) => acc + (s.checkCount || 0), 0);
  }, [yesterdayShifts]);

  const yesterdayGuestCount = useMemo(() => {
    return yesterdayShifts.reduce((acc, s) => acc + (s.guestCount || 0), 0);
  }, [yesterdayShifts]);

  const yesterdayAvgCheck = useMemo(() => {
    return yesterdayCheckCount > 0 ? yesterdayRevenue / yesterdayCheckCount : 0;
  }, [yesterdayRevenue, yesterdayCheckCount]);

  const checkCountChange = totalCheckCount > 0 && yesterdayCheckCount > 0
    ? Math.round(((totalCheckCount - yesterdayCheckCount) / yesterdayCheckCount) * 100)
    : 0;

  const guestCountChange = totalGuestCount > 0 && yesterdayGuestCount > 0
    ? Math.round(((totalGuestCount - yesterdayGuestCount) / yesterdayGuestCount) * 100)
    : 0;

  const avgCheckChange = avgCheck > 0 && yesterdayAvgCheck > 0
    ? Math.round(((avgCheck - yesterdayAvgCheck) / yesterdayAvgCheck) * 100)
    : 0;

  // === NOTIFICATIONS ===
  const notifications = useMemo(() => {
    const issues: Array<{
      id: string;
      message: string;
      href?: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    locations.forEach(loc => {
      if (!loc.managerId) {
        issues.push({
          id: `loc-no-manager-${loc.id}`,
          message: `На точке ${loc.name} отсутствует назначенный менеджер.`,
          href: `/dashboard/director/locations/${loc.id}`,
          priority: 'high'
        });
      }

      const locShifts = todayShifts.filter(s => s.locationId === loc.id);
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locPlanPercent = loc.dailyPlan && loc.dailyPlan > 0
        ? Math.round((locRevenue / loc.dailyPlan) * 100)
        : 0;

      if (locPlanPercent < 70 && loc.dailyPlan && loc.dailyPlan > 0) {
        issues.push({
          id: `loc-low-activity-${loc.id}`,
          message: `Зафиксирована низкая операционная активность на точке ${loc.name}.`,
          href: `/dashboard/director/locations/${loc.id}`,
          priority: 'medium'
        });
      }
    });

    const employeesWithShifts = new Set(todayShifts.map(s => s.employeeId));
    employees
      .filter(e => e.role === 'employee' && e.status === 'active' && !employeesWithShifts.has(e.id))
      .forEach(emp => {
        issues.push({
          id: `emp-no-report-${emp.id}`,
          message: `У сотрудника ${emp.name} отсутствует отчёт за сегодня.`,
          href: `/dashboard/director/staff#${emp.id}`,
          priority: 'medium'
        });
      });

    todayShifts.filter(s => s.status === 'issue').forEach(shift => {
      const location = locations.find(l => l.id === shift.locationId);
      issues.push({
        id: `shift-issue-${shift.id}`,
        message: `Обнаружено несоответствие кассы на точке ${location?.name || 'неизвестная точка'}.`,
        href: `/dashboard/director/shifts?shiftId=${shift.id}`,
        priority: 'high'
      });
    });

    return issues;
  }, [locations, todayShifts, employees]);

  // Network temperature status
  const networkStatus = useMemo(() => {
    if (planPercent >= 90 && notifications.filter(n => n.priority === 'high').length === 0) {
      return 'normal';
    }
    if (planPercent >= 70 && notifications.filter(n => n.priority === 'high').length <= 2) {
      return 'risks';
    }
    return 'critical';
  }, [planPercent, notifications]);

  // === TASKS STATS STATE ===
  const [tasksStats, setTasksStats] = useState<Record<string, { total: number; completed: number; completionPercent: number }>>({});

  // Загружаем статистику задач для активных смен
  useEffect(() => {
    const loadTasksStats = async () => {
      const activeShifts = todayShifts.filter(s => !s.clockOut);
      const stats: Record<string, { total: number; completed: number; completionPercent: number }> = {};

      await Promise.all(
        activeShifts.map(async (shift) => {
          try {
            const response = await fetch(`/api/shifts/${shift.id}/tasks/stats`);
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                stats[shift.id] = {
                  total: data.total,
                  completed: data.completed,
                  completionPercent: data.completionPercent,
                };
              }
            }
          } catch (error) {
            console.error(`Error loading tasks stats for shift ${shift.id}:`, error);
          }
        })
      );

      setTasksStats(stats);
    };

    if (todayShifts.length > 0) {
      loadTasksStats();
    }
  }, [todayShifts]);

  // === LOCATIONS AND SHIFTS DATA ===
  const locationsShiftsData = useMemo(() => {
    return locations.map(loc => {
      const locShifts = todayShifts.filter(s => s.locationId === loc.id);
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locPlanPercent = loc.dailyPlan && loc.dailyPlan > 0
        ? Math.round((locRevenue / loc.dailyPlan) * 100)
        : 0;

      const activeShift = locShifts.find(s => !s.clockOut);
      const manager = loc.managerId ? employees.find(e => e.id === loc.managerId) : null;

      let activity: 'normal' | 'low' | 'suspicious' = 'normal';
      if (locPlanPercent < 70 && loc.dailyPlan && loc.dailyPlan > 0) {
        activity = 'low';
      }
      if (locShifts.some(s => s.status === 'issue')) {
        activity = 'suspicious';
      }

      const formatTime = (timestamp?: string) => {
        if (!timestamp) return undefined;
        return new Date(timestamp).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      // Получаем статистику задач для активной смены
      const shiftTasksStats = activeShift ? tasksStats[activeShift.id] : null;

      return {
        locationId: loc.id,
        locationName: loc.name,
        shiftStatus: activeShift ? 'open' : (locShifts.length > 0 ? 'closed' : 'not-opened') as 'open' | 'closed' | 'not-opened',
        shiftTime: activeShift
          ? `${formatTime(activeShift.clockIn)} - в процессе`
          : locShifts.length > 0 && locShifts[0].clockOut
          ? `${formatTime(locShifts[0].clockIn)} - ${formatTime(locShifts[0].clockOut)}`
          : undefined,
        managerName: manager?.name,
        managerStatus: manager ? (activeShift ? 'on-shift' : 'not-assigned') as 'on-shift' | 'not-assigned' : undefined,
        revenue: locRevenue,
        plan: loc.dailyPlan || 0,
        planPercent: locPlanPercent,
        activity,
        tasksStats: shiftTasksStats ? {
          completed: shiftTasksStats.completed,
          total: shiftTasksStats.total,
          completionPercent: shiftTasksStats.completionPercent,
        } : null,
        activeShiftId: activeShift?.id,
      };
    });
  }, [locations, todayShifts, employees, tasksStats]);

  // === ATTENTION REQUIRED DATA ===
  const attentionItems = useMemo(() => {
    const items: Problem[] = [];
    const seenProblems = new Set<string>(); // Для дедупликации

    // LOW_PLAN_PERFORMANCE - Finance issues
    locations.forEach(loc => {
      const locShifts = todayShifts.filter(s => s.locationId === loc.id);
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locPlanPercent = loc.dailyPlan && loc.dailyPlan > 0
        ? Math.round((locRevenue / loc.dailyPlan) * 100)
        : 0;

      if (locPlanPercent < 70 && loc.dailyPlan && loc.dailyPlan > 0) {
        const problemKey = `finance-low-${loc.id}`;
        if (!seenProblems.has(problemKey)) {
          const problemData = createProblemFromSource('LOW_PLAN_PERFORMANCE', {
            locationId: loc.id,
            locationName: loc.name,
            planPercent: locPlanPercent
          });
          items.push({
            ...problemData,
            id: problemKey,
            status: 'open',
            createdAt: new Date().toISOString()
          });
          seenProblems.add(problemKey);
        }
      }
    });

    // EMPLOYEE_MISSED_REPORT - Personnel issues
    const employeesWithShifts = new Set(todayShifts.map(s => s.employeeId));
    employees
      .filter(e => e.role === 'employee' && e.status === 'active' && !employeesWithShifts.has(e.id))
      .forEach(emp => {
        const problemData = createProblemFromSource('EMPLOYEE_MISSED_REPORT', {
          employeeId: emp.id,
          employeeName: emp.name
        });
        items.push({
          ...problemData,
          id: `personnel-no-report-${emp.id}`,
          status: 'open',
          createdAt: new Date().toISOString()
        });
      });

    // CASH_DISCREPANCY - Operations issues (cash discrepancy)
    todayShifts.filter(s => s.status === 'issue').forEach(shift => {
      const location = locations.find(l => l.id === shift.locationId);
      const problemData = createProblemFromSource('CASH_DISCREPANCY', {
        locationId: shift.locationId,
        locationName: location?.name || 'неизвестная',
        shiftId: shift.id
      });
      items.push({
        ...problemData,
        id: `operations-issue-${shift.id}`,
        status: 'open',
        createdAt: new Date().toISOString()
      });
    });

    // NO_MANAGER_ASSIGNED - Operations issues
    locations.forEach(loc => {
      if (!loc.managerId) {
        const problemKey = `operations-no-manager-${loc.id}`;
        if (!seenProblems.has(problemKey)) {
          const problemData = createProblemFromSource('NO_MANAGER_ASSIGNED', {
            locationId: loc.id,
            locationName: loc.name
          });
          items.push({
            ...problemData,
            id: problemKey,
            status: 'open',
            createdAt: new Date().toISOString()
          });
          seenProblems.add(problemKey);
        }
      }
    });

    // LOW_ACTIVITY - Operations issues (low activity)
    locations.forEach(loc => {
      const locShifts = todayShifts.filter(s => s.locationId === loc.id);
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locPlanPercent = loc.dailyPlan && loc.dailyPlan > 0
        ? Math.round((locRevenue / loc.dailyPlan) * 100)
        : 0;

      // LOW_ACTIVITY отличается от LOW_PLAN_PERFORMANCE тем, что это операционная проблема
      // Добавляем только если уже нет LOW_PLAN_PERFORMANCE для этой точки
      if (locPlanPercent < 70 && loc.dailyPlan && loc.dailyPlan > 0) {
        const problemKey = `operations-low-activity-${loc.id}`;
        const hasPlanProblem = seenProblems.has(`finance-low-${loc.id}`);
        if (!hasPlanProblem && !seenProblems.has(problemKey)) {
          const problemData = createProblemFromSource('LOW_ACTIVITY', {
            locationId: loc.id,
            locationName: loc.name,
            planPercent: locPlanPercent
          });
          items.push({
            ...problemData,
            id: problemKey,
            status: 'open',
            createdAt: new Date().toISOString()
          });
          seenProblems.add(problemKey);
        }
      }
    });

    return items;
  }, [locations, todayShifts, employees]);

  // === REVENUE CHART DATA ===
  const revenueChartData = useMemo(() => {
    const now = new Date();
    
    // Day data (by hours)
    const dayData = Array.from({ length: 24 }, (_, i) => {
      const hourStart = new Date(now);
      hourStart.setHours(i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(i, 59, 59, 999);
      
      const hourShifts = shifts.filter(s => 
        s.date >= hourStart.getTime() && s.date <= hourEnd.getTime()
      );
      const hourRevenue = hourShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      
      return {
        date: `${i}:00`,
        revenue: hourRevenue,
        fullDate: hourStart.toLocaleDateString('ru-RU')
      };
    });

    // Week data
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayShifts = shifts.filter(s => 
        s.date >= date.getTime() && s.date <= dayEnd.getTime()
      );
      const dayRevenue = dayShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      
      return {
        date: date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        fullDate: date.toLocaleDateString('ru-RU')
      };
    });

    // Month data
    const monthData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayShifts = shifts.filter(s => 
        s.date >= date.getTime() && s.date <= dayEnd.getTime()
      );
      const dayRevenue = dayShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      
      return {
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        revenue: dayRevenue,
        fullDate: date.toLocaleDateString('ru-RU')
      };
    });

    // Year data (by months)
    const yearData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now);
      date.setMonth(date.getMonth() - (11 - i));
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      const monthEnd = new Date(date);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthShifts = shifts.filter(s => 
        s.date >= date.getTime() && s.date <= monthEnd.getTime()
      );
      const monthRevenue = monthShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      
      return {
        date: date.toLocaleDateString('ru-RU', { month: 'short' }),
        revenue: monthRevenue,
        fullDate: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
      };
    });

    return { dayData, weekData, monthData, yearData };
  }, [shifts]);

  if (locations.length === 0) {
    return (
      <div className="space-y-6">
        <DayHeader />
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border border-border rounded-xl">
          <div className="text-center max-w-md space-y-6">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Добро пожаловать
            </h1>
            <p className="text-muted-foreground mb-6">
              Создайте первую торговую точку для начала работы
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 h-full overflow-y-auto">
      {!hasSeenTour && <OnboardingTour />}
      
      {/* Header */}
      <DayHeader />

      {/* Quick Actions */}
      <QuickActions />

      {/* Network Status Indicator */}
      <NetworkStatusIndicator 
        status={networkStatus} 
        problemCount={attentionItems.length + notifications.length}
      />

      {/* KPI Cards - Grouped */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        {/* Left group: Revenue metrics */}
        <KPICard
          label={t('dashboard.revenue_today') || 'Выручка за сегодня'}
          value={totalRevenue > 0 ? `${totalRevenue.toLocaleString('ru-RU')} ${currency}` : '—'}
          subtitle={totalRevenue > 0 && revenueChangePercent !== 0 ? (
            <div className="flex items-center gap-1">
              {revenueChangePercent > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
              <span className={revenueChangePercent > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {revenueChangePercent > 0 ? '+' : ''}{revenueChangePercent}%
              </span>
              <span className="text-muted-foreground">к вчера</span>
            </div>
          ) : totalRevenue > 0 ? `Вчера: ${yesterdayRevenue.toLocaleString('ru-RU')} ${currency}` : undefined}
        />
        <KPICard
          label={t('dashboard.plan_today') || 'План на сегодня'}
          value={totalPlan > 0 ? `${totalPlan.toLocaleString('ru-RU')} ${currency}` : '—'}
        />
        <KPICard
          label="Выполнение плана"
          value={totalPlan > 0 ? `${planPercent}%` : '—'}
          status={totalPlan > 0 ? (planPercent >= 95 ? 'success' : planPercent >= 80 ? 'warning' : 'error') : 'neutral'}
        />
        
        {/* Right group: Check metrics */}
        <KPICard
          label="Средний чек"
          value={avgCheck > 0 ? `${Math.round(avgCheck).toLocaleString('ru-RU')} ${currency}` : '—'}
          subtitle={avgCheck > 0 && avgCheckChange !== 0 ? (
            <div className="flex items-center gap-1">
              {avgCheckChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
              <span className={avgCheckChange > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {avgCheckChange > 0 ? '+' : ''}{avgCheckChange}%
              </span>
            </div>
          ) : undefined}
        />
        <KPICard
          label="Количество чеков"
          value={totalCheckCount > 0 ? totalCheckCount : '—'}
          subtitle={totalCheckCount > 0 && checkCountChange !== 0 ? (
            <div className="flex items-center gap-1">
              {checkCountChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
              <span className={checkCountChange > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {checkCountChange > 0 ? '+' : ''}{checkCountChange}%
              </span>
            </div>
          ) : undefined}
        />
        <KPICard
          label="Количество гостей"
          value={totalGuestCount > 0 ? totalGuestCount : '—'}
          subtitle={totalGuestCount > 0 && guestCountChange !== 0 ? (
            <div className="flex items-center gap-1">
              {guestCountChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
              <span className={guestCountChange > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {guestCountChange > 0 ? '+' : ''}{guestCountChange}%
              </span>
            </div>
          ) : undefined}
        />
      </div>

      {/* Locations & Shifts + Problem Center */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <LocationsShiftsTable
            data={locationsShiftsData}
            currency={currency}
          />
        </div>
        <div className="xl:col-span-4">
          <ProblemCenter
            networkStatus={networkStatus}
            notifications={notifications}
            problems={attentionItems}
          />
        </div>
      </div>

      {/* Revenue Chart */}
      <RevenueChartBlock
        dayData={revenueChartData.dayData}
        weekData={revenueChartData.weekData}
        monthData={revenueChartData.monthData}
        yearData={revenueChartData.yearData}
        currency={currency}
        totalPlan={totalPlan}
        locations={locations}
      />

      {/* Event Journal */}
      <EventJournal events={recentEvents} />
    </div>
  );
}
