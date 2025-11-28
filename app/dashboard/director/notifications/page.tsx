"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { ConversationManager } from "@/components/dashboard/conversation-manager";
import Link from "next/link";
import { 
  AlertTriangle, 
  CheckCircle2,
  MapPin,
  Users,
  FileText,
  ExternalLink,
  MessageCircle,
  X,
  Filter
} from "lucide-react";

type NotificationType = 'location' | 'employee' | 'shift' | 'cash' | 'other';
type NotificationStatus = 'актуально' | 'решено';

interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  date: number;
  locationId?: string;
  employeeId?: string;
  shiftId?: string;
  locationName?: string;
  employeeName?: string;
}

export default function NotificationsPage() {
  const { t } = useLanguage();
  const { locations, shifts, employees, currency, openConversation } = useStore();
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

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

  // === BUILD NOTIFICATIONS ===
  const allNotifications = useMemo(() => {
    const notifications: Notification[] = [];
    
    // Location problems
    locations.forEach(loc => {
      if (!loc.managerId) {
        notifications.push({
          id: `loc-no-manager-${loc.id}`,
          type: 'location',
          status: resolvedIds.has(`loc-no-manager-${loc.id}`) ? 'решено' : 'актуально',
          message: `На точке ${loc.name} отсутствует назначенный менеджер.`,
          date: Date.now(),
          locationId: loc.id,
          locationName: loc.name
        });
      }
      
      const locShifts = todayShifts.filter(s => s.locationId === loc.id);
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locPlanPercent = loc.dailyPlan && loc.dailyPlan > 0 
        ? Math.round((locRevenue / loc.dailyPlan) * 100) 
        : 0;
      
      if (!loc.dailyPlan || loc.dailyPlan === 0) {
        notifications.push({
          id: `loc-no-plan-${loc.id}`,
          type: 'location',
          status: resolvedIds.has(`loc-no-plan-${loc.id}`) ? 'решено' : 'актуально',
          message: `Для точки ${loc.name} не установлен план на текущий день.`,
          date: Date.now(),
          locationId: loc.id,
          locationName: loc.name
        });
      }

      if (locPlanPercent < 70 && loc.dailyPlan && loc.dailyPlan > 0) {
        notifications.push({
          id: `loc-low-activity-${loc.id}`,
          type: 'location',
          status: resolvedIds.has(`loc-low-activity-${loc.id}`) ? 'решено' : 'актуально',
          message: `Зафиксирована низкая операционная активность на точке ${loc.name}.`,
          date: Date.now(),
          locationId: loc.id,
          locationName: loc.name
        });
      }
    });

    // Employees without reports
    const employeesWithShifts = new Set(todayShifts.map(s => s.employeeId));
    employees
      .filter(e => e.role === 'employee' && e.status === 'active' && !employeesWithShifts.has(e.id))
      .forEach(emp => {
        notifications.push({
          id: `emp-no-report-${emp.id}`,
          type: 'employee',
          status: resolvedIds.has(`emp-no-report-${emp.id}`) ? 'решено' : 'актуально',
          message: `У сотрудника ${emp.name} отсутствует отчёт за сегодня.`,
          date: Date.now(),
          employeeId: emp.id,
          employeeName: emp.name
        });
      });

    // Shift issues (cash discrepancies)
    todayShifts.filter(s => s.status === 'issue').forEach(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      const location = locations.find(l => l.id === shift.locationId);
      const expectedRevenue = location?.dailyPlan || 0;
      const actualRevenue = shift.revenueCash + shift.revenueCard;
      const difference = actualRevenue - expectedRevenue;
      
      notifications.push({
        id: `shift-cash-${shift.id}`,
        type: 'cash',
        status: resolvedIds.has(`shift-cash-${shift.id}`) ? 'решено' : 'актуально',
        message: `Обнаружено несоответствие кассы на точке ${location?.name || 'неизвестная точка'} (разница ${difference > 0 ? '+' : ''}${difference.toLocaleString('ru-RU')} ${currency}).`,
        date: shift.date,
        locationId: shift.locationId,
        employeeId: shift.employeeId,
        shiftId: shift.id,
        locationName: location?.name,
        employeeName: employee?.name
      });
    });

    return notifications.sort((a, b) => b.date - a.date);
  }, [locations, todayShifts, employees, currency, resolvedIds]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter(notif => {
      if (statusFilter !== 'all' && notif.status !== statusFilter) return false;
      if (typeFilter !== 'all' && notif.type !== typeFilter) return false;
      return true;
    });
  }, [allNotifications, statusFilter, typeFilter]);

  const handleResolve = (id: string) => {
    setResolvedIds(prev => new Set([...prev, id]));
  };

  const getManagerContact = (locationId?: string) => {
    if (!locationId) return null;
    const location = locations.find(l => l.id === locationId);
    if (!location?.managerId) return null;
    const manager = employees.find(e => e.id === location.managerId);
    return manager;
  };

  const getEmployeeContact = (employeeId?: string) => {
    if (!employeeId) return null;
    return employees.find(e => e.id === employeeId);
  };

  const handleContactManager = (notif: Notification, manager: any) => {
    const conversationId = `manager:${manager.id}`;
    openConversation(
      conversationId,
      'manager',
      manager.id,
      manager.name,
      {
        notificationMessage: notif.message,
        locationName: notif.locationName
      },
      `/dashboard/director/staff#${manager.id}`
    );
  };

  const handleContactEmployee = (notif: Notification, employee: any) => {
    const conversationId = `employee:${employee.id}`;
    openConversation(
      conversationId,
      'employee',
      employee.id,
      employee.name,
      {
        notificationMessage: notif.message,
        locationName: notif.locationName
      },
      `/dashboard/director/staff#${employee.id}`
    );
  };

  return (
    <>
      <ConversationManager />
      <div className="bg-background space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">{t('dashboard.notifications_title') || t('dashboard.dashboard_notifications') || 'Уведомления'}</h1>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Статус:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as NotificationStatus | 'all')}
                className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
              >
                <option value="all">{t('dashboard.dashboard_all') || 'Все'}</option>
                <option value="актуально">{t('dashboard.status_actual') || 'Актуально'}</option>
                <option value="решено">{t('dashboard.status_resolved') || 'Решено'}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Тип:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                className="text-sm border border-border rounded px-2 py-1 bg-background text-foreground"
              >
                <option value="all">Все</option>
                <option value="location">{t('dashboard.location_label') || 'Точка'}</option>
                <option value="employee">{t('dashboard.employee_label') || 'Сотрудник'}</option>
                <option value="cash">{t('dashboard.type_cash') || 'Касса'}</option>
                <option value="shift">{t('dashboard.shift_label') || 'Смена'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Нет уведомлений</p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const manager = getManagerContact(notif.locationId);
              const employee = getEmployeeContact(notif.employeeId);

              return (
                <div
                  key={notif.id}
                  className={`bg-card border rounded-lg p-4 ${
                    notif.status === 'решено' 
                      ? 'border-emerald-500/20 bg-emerald-500/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Left: Icon */}
                    <div className={`p-3 rounded-lg flex-shrink-0 ${
                      notif.type === 'location' ? 'bg-blue-500/10' :
                      notif.type === 'employee' ? 'bg-purple-500/10' :
                      notif.type === 'cash' ? 'bg-rose-500/10' :
                      'bg-gray-500/10'
                    }`}>
                      {notif.type === 'location' && <MapPin className="h-5 w-5 text-blue-500" />}
                      {notif.type === 'employee' && <Users className="h-5 w-5 text-purple-500" />}
                      {notif.type === 'cash' && <FileText className="h-5 w-5 text-rose-500" />}
                      {notif.type === 'shift' && <FileText className="h-5 w-5 text-gray-500" />}
                    </div>

                    {/* Center: Message and Date */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground mb-1">
                        {notif.message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notif.date).toLocaleDateString('ru-RU')} в {new Date(notif.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <div className="flex flex-col items-end gap-2">
                        {/* Location actions */}
                        {notif.type === 'location' && notif.locationId && (
                          <>
                            <Link
                              href={`/dashboard/director/locations/${notif.locationId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Перейти к точке
                            </Link>
                            {manager && (
                              <button
                                onClick={() => handleContactManager(notif, manager)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Связаться с менеджером
                              </button>
                            )}
                            {!manager && (
                              <Link
                                href={`/dashboard/director/locations/${notif.locationId}?action=edit`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                              >
                                <Users className="h-3 w-3" />
                                Назначить менеджера
                              </Link>
                            )}
                          </>
                        )}

                        {/* Employee actions */}
                        {notif.type === 'employee' && notif.employeeId && employee && (
                          <>
                            <Link
                              href={`/dashboard/director/staff#${notif.employeeId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Открыть профиль сотрудника
                            </Link>
                            <button
                              onClick={() => handleContactEmployee(notif, employee)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Связаться с сотрудником
                            </button>
                          </>
                        )}

                        {/* Cash/Shift actions */}
                        {(notif.type === 'cash' || notif.shiftId) && notif.shiftId && (
                          <>
                            <Link
                              href={`/dashboard/director/shifts?shiftId=${notif.shiftId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Открыть смену
                            </Link>
                            {employee && (
                              <button
                                onClick={() => handleContactEmployee(notif, employee)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Связаться с сотрудником
                              </button>
                            )}
                            {manager && (
                              <button
                                onClick={() => handleContactManager(notif, manager)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded border border-border transition-colors"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Связаться с менеджером
                              </button>
                            )}
                          </>
                        )}

                        {/* Resolve button */}
                        {notif.status === 'актуально' && (
                          <button
                            onClick={() => handleResolve(notif.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded border border-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Отметить как решённое
                          </button>
                        )}

                        {/* Restore button */}
                        {notif.status === 'решено' && (
                          <button
                            onClick={() => {
                              const newResolved = new Set(resolvedIds);
                              newResolved.delete(notif.id);
                              setResolvedIds(newResolved);
                            }}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title="Вернуть в актуальные"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
