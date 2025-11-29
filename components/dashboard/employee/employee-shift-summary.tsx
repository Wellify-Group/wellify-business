"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";

export function EmployeeShiftSummary() {
  const { t } = useLanguage();
  const { orders, currentShift, currency, getOrdersSummary } = useStore();

  const summary = useMemo(() => {
    if (!currentShift || currentShift.status !== 'active') {
      return null;
    }
    return getOrdersSummary(currentShift.id);
  }, [orders, currentShift, getOrdersSummary]);

  const isShiftActive = currentShift?.status === 'active';

  return (
    <div className={`bg-zinc-900/50 border border-white/10 rounded-xl p-5 space-y-4 transition-opacity ${
      !isShiftActive ? 'opacity-50 pointer-events-none' : ''
    }`}>
      <h3 className="text-base font-bold text-white">
        {t("dashboard.shift_summary_short") || "Краткие итоги смены"}
      </h3>
      
      {!isShiftActive ? (
        <p className="text-sm text-zinc-500 text-center py-4">
          {t("dashboard.start_shift_to_see_summary") || "Чтобы видеть заказы и итоги - начните смену"}
        </p>
      ) : summary ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("dashboard.revenue_for_shift") || "Выручка за смену"}</span>
            <span className="text-lg font-bold text-white">{summary.totalAmount.toLocaleString('ru-RU')} {currency}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("dashboard.orders_for_shift_count") || "Заказов за смену"}</span>
            <span className="text-lg font-bold text-white">{summary.ordersCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t("dashboard.guests_for_shift") || "Гостей за смену"}</span>
            <span className="text-lg font-bold text-white">{summary.guestsSum}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-400 text-center py-4">
          {t("dashboard.summary_will_appear") || "Итоги появятся после завершения смены"}
        </p>
      )}
    </div>
  );
}
