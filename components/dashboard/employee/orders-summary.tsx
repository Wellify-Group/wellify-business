"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/components/language-provider";
import { useStore, Order } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Filter } from "lucide-react";

interface OrdersSummaryProps {
  onClose: () => void;
}

export function OrdersSummary({ onClose }: OrdersSummaryProps) {
  const { t } = useLanguage();
  const { orders, currentShift, currency, getOrdersSummary } = useStore();
  const [typeFilter, setTypeFilter] = useState<'all' | Order['orderType']>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | Order['paymentType']>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const shiftOrders = useMemo(() => {
    if (!currentShift) return [];
    
    let filtered = orders.filter(order => order.shiftId === currentShift.id);
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === typeFilter);
    }
    
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentType === paymentFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(query) ||
        order.comment?.toLowerCase().includes(query)
      );
    }
    
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, currentShift, typeFilter, paymentFilter, searchQuery]);

  const summary = currentShift ? getOrdersSummary(currentShift.id) : {
    totalAmount: 0,
    ordersCount: 0,
    guestsSum: 0,
    avgCheck: 0,
    byPaymentType: { cash: 0, card: 0, online: 0 },
  };

  const getOrderTypeLabel = (type: Order['orderType']) => {
    switch (type) {
      case 'hall': return t('dashboard.order_type_hall') || 'Зал';
      case 'takeaway': return t('dashboard.order_type_takeaway') || 'Самовывоз';
      case 'delivery': return t('dashboard.order_type_delivery') || 'Доставка';
      default: return type;
    }
  };

  const getPaymentLabel = (type: Order['paymentType']) => {
    switch (type) {
      case 'cash': return t('dashboard.payment_cash') || 'Наличные';
      case 'card': return t('dashboard.payment_card') || 'Карта';
      case 'online': return t('dashboard.payment_online') || 'Онлайн';
      default: return type;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {t("dashboard.orders_summary") || "Итоги и список заказов"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-400" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="p-6 bg-zinc-800/50 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t("dashboard.shift_summary") || "Итоги за смену"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-zinc-400 mb-1">{t("dashboard.total_revenue") || "Выручка"}</p>
                <p className="text-xl font-bold text-white">{summary.totalAmount.toLocaleString('ru-RU')} {currency}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">{t("dashboard.orders_count") || "Заказов"}</p>
                <p className="text-xl font-bold text-white">{summary.ordersCount}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">{t("dashboard.guests") || "Гостей"}</p>
                <p className="text-xl font-bold text-white">{summary.guestsSum}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">{t("dashboard.avg_check") || "Средний чек"}</p>
                <p className="text-xl font-bold text-white">{summary.avgCheck.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {currency}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs text-zinc-400 mb-2">{t("dashboard.by_payment") || "По оплате"}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">{t("dashboard.payment_cash") || "Наличные"}</span>
                    <span className="text-white font-medium">{summary.byPaymentType.cash.toLocaleString('ru-RU')} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">{t("dashboard.payment_card") || "Карта"}</span>
                    <span className="text-white font-medium">{summary.byPaymentType.card.toLocaleString('ru-RU')} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300">{t("dashboard.payment_online") || "Онлайн"}</span>
                    <span className="text-white font-medium">{summary.byPaymentType.online.toLocaleString('ru-RU')} {currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="p-6 border-b border-white/10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("dashboard.search_orders") || "Поиск по номеру или комментарию..."}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-zinc-400 flex items-center gap-2">
                <Filter className="h-3 w-3" />
                {t("dashboard.filter_by_type") || "Тип:"}
              </span>
              {(['all', 'hall', 'takeaway', 'delivery'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === type
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {type === 'all' 
                    ? (t("dashboard.all") || "Все")
                    : getOrderTypeLabel(type)}
                </button>
              ))}
              <span className="text-xs text-zinc-400 ml-2 flex items-center gap-2">
                {t("dashboard.payment") || "Оплата:"}
              </span>
              {(['all', 'cash', 'card', 'online'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setPaymentFilter(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    paymentFilter === type
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {type === 'all' 
                    ? (t("dashboard.all") || "Все")
                    : getPaymentLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="flex-1 overflow-y-auto p-6">
            {shiftOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">#</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">{t("dashboard.time") || "Время"}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">{t("dashboard.amount") || "Сумма"}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">{t("dashboard.order_type") || "Тип"}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">{t("dashboard.payment") || "Оплата"}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">{t("dashboard.guests") || "Гости"}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">{t("dashboard.comment") || "Комментарий"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftOrders.map((order, index) => {
                      const orderTime = new Date(order.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const orderNumber = order.id.slice(-3).toUpperCase();

                      return (
                        <tr key={order.id} className="border-b border-white/5 hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-white">#{orderNumber}</td>
                          <td className="py-3 px-4 text-sm text-zinc-300">{orderTime}</td>
                          <td className="py-3 px-4 text-sm font-bold text-white">{order.amount.toLocaleString('ru-RU')} {currency}</td>
                          <td className="py-3 px-4 text-sm text-zinc-300">{getOrderTypeLabel(order.orderType)}</td>
                          <td className="py-3 px-4 text-sm text-zinc-300">{getPaymentLabel(order.paymentType)}</td>
                          <td className="py-3 px-4 text-sm text-zinc-300">{order.guestsCount}</td>
                          <td className="py-3 px-4 text-sm text-zinc-400">
                            {order.comment ? (
                              <span title={order.comment} className="cursor-help">
                                {order.comment.length > 20 ? order.comment.slice(0, 20) + '...' : order.comment}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-zinc-400">
                  {t("dashboard.no_orders_found") || "Заказы не найдены"}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}











