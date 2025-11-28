"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";

export function RevenueCard() {
  const { t } = useLanguage();
  const { orders, currentShift, currency, getOrdersSummary } = useStore();

  const summary = useMemo(() => {
    if (!currentShift || currentShift.status !== 'active') {
      return {
        totalAmount: 0,
        byPaymentType: { cash: 0, card: 0, online: 0 },
      };
    }
    return getOrdersSummary(currentShift.id);
  }, [orders, currentShift, getOrdersSummary]);

  const isShiftActive = currentShift?.status === 'active';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
        {t("dashboard.revenue_for_shift") || "КАРТОЧКА: ВЫРУЧКА ЗА СМЕНУ"}
      </h3>
      
      <div className="space-y-3">
        <div className="text-3xl font-bold text-zinc-900 dark:text-white">
          {summary.totalAmount.toLocaleString('ru-RU')} {currency}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Наличные:</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {summary.byPaymentType.cash.toLocaleString('ru-RU')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400">Карта:</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {summary.byPaymentType.card.toLocaleString('ru-RU')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


