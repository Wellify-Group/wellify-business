"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";

type ShiftStatus = 'idle' | 'active' | 'closed' | 'closing';

interface ShiftMetricsProps {
  shiftStatus: ShiftStatus;
}

export function ShiftMetrics({ shiftStatus }: ShiftMetricsProps) {
  const { t } = useLanguage();
  const { 
    currency, 
    formConfig, 
    currentShift, 
    orders, 
    getOrdersSummary,
  } = useStore();

  // Auto-fill from orders
  const ordersSummary = useMemo(() => {
    if (!currentShift) return null;
    return getOrdersSummary(currentShift.id);
  }, [orders, currentShift, getOrdersSummary]);

  // Получаем статистику смены
  const totalRevenue = currentShift?.totalRevenue || (ordersSummary?.byPaymentType?.cash || 0) + (ordersSummary?.byPaymentType?.card || 0) + (ordersSummary?.byPaymentType?.online || 0) || 0;
  const totalChecks = currentShift?.totalChecks || ordersSummary?.ordersCount || 0;
  const totalGuests = currentShift?.totalGuests || ordersSummary?.guestsSum || 0;

  // План и прогресс
  const planValue = formConfig.shiftPlanValue || 20000;
  const completionPercent = planValue > 0 ? Math.min((totalRevenue / planValue) * 100, 100) : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
        {t("dashboard.shift_data") || "Дані зміни"}
      </h3>
      
      <div className="space-y-0">
        {/* Виручка */}
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("dashboard.revenue") || "Виручка"}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {shiftStatus === 'active' ? totalRevenue.toLocaleString('uk-UA') : '0'}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500">{currency}</span>
          </div>
        </div>

        {/* Кількість чеків */}
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("dashboard.checks_count") || "Чеків"}
          </span>
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">
            {shiftStatus === 'active' ? totalChecks : '0'}
          </span>
        </div>

        {/* Кількість гостей */}
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("dashboard.guests") || "Гостей"}
          </span>
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">
            {shiftStatus === 'active' ? totalGuests : '0'}
          </span>
        </div>

        {/* Виконання плану */}
        <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("dashboard.plan_completion") || "Виконання плану"}
          </span>
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">
            {shiftStatus === 'active' ? `${completionPercent.toFixed(0)}%` : '0%'}
          </span>
        </div>

        {/* План на день */}
        {planValue > 0 && (
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("dashboard.plan_for_day") || "План на день"}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                {planValue.toLocaleString('uk-UA')}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-500">{currency}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

