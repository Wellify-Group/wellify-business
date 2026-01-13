"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useStore from "@/lib/store";
import { ArrowLeft, Clock, DollarSign, User, MapPin, CheckCircle2, AlertTriangle, Camera, FileText, MessageSquare, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ShiftDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { shifts, employees, locations, currency } = useStore();
  const shiftId = params.shiftId as string;

  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);

  // Find shift
  const shift = useMemo(() => {
    return shifts.find(s => s.id === shiftId);
  }, [shifts, shiftId]);

  const employee = useMemo(() => {
    if (!shift) return null;
    return employees.find(e => e.id === shift.employeeId);
  }, [shift, employees]);

  const location = useMemo(() => {
    if (!shift) return null;
    return locations.find(l => l.id === shift.locationId);
  }, [shift, locations]);

  const hasProblems = shift?.status === 'issue';
  const revenue = shift ? shift.revenueCash + shift.revenueCard : 0;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarkAsReviewed = async () => {
    setIsMarkingReviewed(true);
    // TODO: Implement API call to mark shift as reviewed
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    setIsReviewed(true);
    setIsMarkingReviewed(false);
  };

  if (!shift) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Смена не найдена</p>
          <button
            onClick={() => router.push('/dashboard/director/shifts')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Вернуться к списку смен
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/director/shifts')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Смена #{shift.readableNumber || shiftId.slice(-6)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(shift.date)}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {hasProblems ? (
            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Требует внимания
            </span>
          ) : (
            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              OK
            </span>
          )}
        </div>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Employee */}
        <div className="bg-card p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Сотрудник</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {employee?.name || employee?.fullName || shift.employeeName || "Неизвестный сотрудник"}
          </p>
        </div>

        {/* Location */}
        <div className="bg-card p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Точка</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {location?.name || "Неизвестная точка"}
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-card p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-muted-foreground">Итого выручка</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {revenue.toLocaleString('ru-RU')} {currency}
          </p>
        </div>
      </div>

      {/* Timing Info */}
      {shift.clockIn && (
        <div className="bg-card p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Время работы</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Начало</p>
              <p className="text-sm font-semibold text-foreground">
                {formatTime(shift.clockIn)}
              </p>
            </div>
            {shift.clockOut && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Окончание</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatTime(shift.clockOut)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      <div className="bg-card p-5 border border-border rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Выручка</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Наличные</p>
            <p className="text-lg font-semibold text-foreground">
              {shift.revenueCash.toLocaleString('ru-RU')} {currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Терминал</p>
            <p className="text-lg font-semibold text-foreground">
              {shift.revenueCard.toLocaleString('ru-RU')} {currency}
            </p>
          </div>
          {shift.guestCount !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Гости</p>
              <p className="text-lg font-semibold text-foreground">
                {shift.guestCount}
              </p>
            </div>
          )}
          {shift.checkCount !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Чеков</p>
              <p className="text-lg font-semibold text-foreground">
                {shift.checkCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Problems Block */}
      {hasProblems && shift.anomalies && shift.anomalies.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              Проблемы
            </span>
          </div>
          <div className="space-y-2">
            {shift.anomalies.map((anomaly: string, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-sm text-red-600 dark:text-red-400">
                  {anomaly}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes/Comments */}
      {shift.notes && shift.notes.length > 0 && (
        <div className="bg-card p-5 border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Комментарии сотрудника</span>
          </div>
          <div className="space-y-3">
            {shift.notes.map((note: { text: string; time: string }, idx: number) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(note.time)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{note.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Reports (Mock - TODO: implement actual photo loading) */}
      <div className="bg-card p-5 border border-border rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Фото-отчёты</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {hasProblems ? (
            <p className="text-red-600 dark:text-red-400">
              Фото-отчёты отсутствуют или требуют проверки
            </p>
          ) : (
            <p>Фото-отчёты загружены и проверены</p>
          )}
        </div>
        {/* TODO: Add actual photo gallery when available */}
      </div>

      {/* Mark as Reviewed Action */}
      {hasProblems && !isReviewed && (
        <div className="bg-card p-5 border border-border rounded-xl">
          <button
            onClick={handleMarkAsReviewed}
            disabled={isMarkingReviewed}
            className="w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isMarkingReviewed ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Отметить как проверено
              </>
            )}
          </button>
        </div>
      )}

      {isReviewed && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Смена отмечена как проверенная
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
