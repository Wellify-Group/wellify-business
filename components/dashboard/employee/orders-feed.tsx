"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore, { Order } from "@/lib/store";

export function OrdersFeed() {
  const { t } = useLanguage();
  const { orders, currentShift, currency } = useStore();

  const shiftOrders = useMemo(() => {
    if (!currentShift || currentShift.status !== 'active') return [];
    return orders
      .filter(order => order.shiftId === currentShift.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); // Последние 10 заказов
  }, [orders, currentShift]);

  const getPaymentLabel = (type: Order['paymentType']) => {
    switch (type) {
      case 'cash': return t('dashboard.payment_cash') || 'Наличные';
      case 'card': return t('dashboard.payment_card') || 'Карта';
      case 'online': return t('dashboard.payment_online') || 'Онлайн';
      default: return type;
    }
  };

  const isShiftActive = currentShift?.status === 'active';

  if (!isShiftActive) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
          {t("dashboard.orders_feed") || "ЛЕНТА ПОСЛЕДНИХ ЗАКАЗОВ"}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
          {t("dashboard.start_shift_to_see_orders") || "Начните смену, чтобы видеть заказы"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
        {t("dashboard.orders_feed") || "ЛЕНТА ПОСЛЕДНИХ ЗАКАЗОВ"}
      </h3>

      {shiftOrders.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
          {t("dashboard.no_orders_yet") || "Пока заказов нет"}
        </p>
      ) : (
        <div className="space-y-2">
          {shiftOrders.map((order) => {
            const orderTime = new Date(order.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {orderTime}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {order.amount.toLocaleString('ru-RU')} {currency}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    {getPaymentLabel(order.paymentType)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


