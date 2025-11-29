"use client";

export const runtime = 'nodejs';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useStore from "@/lib/store";
import { ShiftEvent, ShiftEventType } from "@/lib/shift-events";
import { ArrowLeft, Clock, DollarSign, ShoppingCart, CheckCircle2, AlertTriangle, X } from "lucide-react";

export default function ShiftJournalPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, locations, employees } = useStore();
  const shiftId = params.shiftId as string;

  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shift, setShift] = useState<any>(null);

  useEffect(() => {
    if (shiftId) {
      loadShiftData();
    }
  }, [shiftId]);

  const loadShiftData = async () => {
    setIsLoading(true);
    try {
      // Загружаем события
      const eventsResponse = await fetch(`/api/shift-events?shiftId=${shiftId}`);
      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        setEvents(eventsData.events || []);
      }

      // Загружаем метрики
      const metricsResponse = await fetch(`/api/shifts/${shiftId}/metrics?operational=true&financial=true&quality=true`);
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData);
      }

      // Загружаем данные смены
      const shiftsResponse = await fetch('/api/shifts');
      const shiftsData = await shiftsResponse.json();
      if (shiftsData.success) {
        const foundShift = shiftsData.shifts.find((s: any) => s.id === shiftId);
        setShift(foundShift);
      }
    } catch (error) {
      console.error('Error loading shift data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: ShiftEventType) => {
    switch (type) {
      case ShiftEventType.SHIFT_STARTED:
        return <Clock className="h-4 w-4 text-emerald-500" />;
      case ShiftEventType.ORDER_CREATED:
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case ShiftEventType.CHECKLIST_TASK_COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case ShiftEventType.PROBLEM_REPORTED:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case ShiftEventType.SHIFT_CLOSED:
        return <X className="h-4 w-4 text-zinc-500" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-400" />;
    }
  };

  const getEventDescription = (event: ShiftEvent) => {
    switch (event.type) {
      case ShiftEventType.SHIFT_STARTED:
        return "Смена начата";
      case ShiftEventType.ORDER_CREATED: {
        const payload = event.payload as any;
        return `Оформлен чек #${payload.order_id.slice(-4)} на ${payload.total_amount} ₴ (${payload.payment_method === 'cash' ? 'Наличные' : 'Карта'})`;
      }
      case ShiftEventType.ORDER_COMMENT_ADDED: {
        const payload = event.payload as any;
        return `Комментарий к заказу #${payload.order_id.slice(-4)}: ${payload.comment}`;
      }
      case ShiftEventType.CHECKLIST_TASK_COMPLETED: {
        const payload = event.payload as any;
        return `Выполнена задача: ${payload.task_name}`;
      }
      case ShiftEventType.PROBLEM_REPORTED: {
        const payload = event.payload as any;
        const severityLabels: Record<string, string> = {
          low: 'низкая',
          medium: 'средняя',
          high: 'высокая',
          critical: 'критическая',
        };
        return `Проблема: ${payload.description} (${severityLabels[payload.severity] || payload.severity} серьёзность)`;
      }
      case ShiftEventType.SHIFT_CLOSED:
        return "Смена закрыта";
      default:
        return "Событие";
    }
  };

  const employee = shift ? employees.find(e => e.id === shift.employeeId) : null;
  const location = shift ? locations.find(l => l.id === shift.locationId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Загрузка журнала смены...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Журнал смены #{shift?.readableNumber || shiftId.slice(-6)}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {employee?.name || 'Сотрудник'} • {location?.name || 'Точка'}
            </p>
          </div>
        </div>

        {/* Основные показатели */}
        {metrics?.basic && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Выручка</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {metrics.basic.total_revenue.toLocaleString()} ₴
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Чеков</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {metrics.basic.checks_count}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Чек-лист</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {Math.round(metrics.basic.tasks_completion_percent)}%
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Проблемы</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                {metrics.basic.problems_count}
              </div>
            </div>
          </div>
        )}

        {/* Хронология событий */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Хронология событий
          </h2>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                События не найдены
              </p>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {formatTime(event.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {getEventDescription(event)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Расширенные метрики будут добавлены позже на основе настроек */}
      </div>
    </div>
  );
}









