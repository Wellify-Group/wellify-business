"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useStore, Order } from "@/lib/store";
import { MoreVertical, Edit, Trash2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderForm } from "./order-form";
import { OrdersSummary } from "./orders-summary";

interface EmployeeOrdersListProps {
  compact?: boolean;
}

export function EmployeeOrdersList({ compact = false }: EmployeeOrdersListProps) {
  const { t } = useLanguage();
  const { orders, currentShift, currency, addOrder, updateOrder, deleteOrder } = useStore();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Get orders for current shift
  const shiftOrders = currentShift && currentShift.status === 'active'
    ? orders.filter(order => order.shiftId === currentShift.id)
    : [];

  const canEdit = currentShift?.status === 'active';
  const isShiftActive = currentShift?.status === 'active';

  const handleOrderSubmit = (orderData: Omit<Order, 'id' | 'createdAt' | 'employeeId' | 'locationId' | 'shiftId'>) => {
    if (editingOrder) {
      updateOrder(editingOrder.id, orderData);
      setEditingOrder(null);
    } else {
      addOrder(orderData);
    }
    setShowOrderForm(false);
  };

  const handleDelete = (orderId: string) => {
    if (confirm(t('dashboard.order_delete_confirm') || 'Удалить заказ?')) {
      deleteOrder(orderId);
      setMenuOpenId(null);
    }
  };

  const getPaymentColor = (type: Order['paymentType']) => {
    switch (type) {
      case 'cash': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30';
      case 'card': return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30';
      case 'online': return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30';
      default: return 'text-zinc-500 dark:text-zinc-400 bg-zinc-500/10 dark:bg-zinc-500/20 border border-zinc-500/30';
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

  if (compact) {
    // Compact mode - just show list without header/actions
    if (!isShiftActive) return null;
    
    if (shiftOrders.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {t("dashboard.no_orders_yet_message_updated") || "Пока заказов нет. Нажмите 'Добавить заказ' сверху, когда появится первый гость."}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t("dashboard.current_shift_orders") || "Заказы текущей смены"}
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {shiftOrders
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((order) => {
                const orderTime = new Date(order.createdAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const orderNumber = order.id.slice(-3).toUpperCase();

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{orderTime}</span>
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">#{orderNumber}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{order.guestsCount} {t("dashboard.guests_short") || "г."}</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{order.amount.toLocaleString('ru-RU')} {currency}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPaymentColor(order.paymentType)}`}>
                        {getPaymentLabel(order.paymentType)}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === order.id ? null : order.id)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-white/10 rounded transition-colors"
                        >
                          <MoreVertical className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        </button>
                        {menuOpenId === order.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-10 min-w-[120px]">
                            <button
                              onClick={() => {
                                setEditingOrder(order);
                                setShowOrderForm(true);
                                setMenuOpenId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-2"
                            >
                              <Edit className="h-3 w-3" />
                              {t('dashboard.edit') || 'Изменить'}
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="w-full px-3 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t('dashboard.delete') || 'Удалить'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          {shiftOrders.length > 5 && (
            <button
              onClick={() => setShowSummary(true)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {t("dashboard.view_all_orders") || `Показать все (${shiftOrders.length})`}
            </button>
          )}
        </div>

        {/* Order Form Modal */}
        <AnimatePresence>
          {showOrderForm && (
            <OrderForm
              order={editingOrder}
              onClose={() => {
                setShowOrderForm(false);
                setEditingOrder(null);
              }}
              onSubmit={handleOrderSubmit}
            />
          )}
        </AnimatePresence>

        {/* Orders Summary Modal */}
        <AnimatePresence>
          {showSummary && (
            <OrdersSummary
              onClose={() => setShowSummary(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Full mode - original implementation
  const totalAmount = shiftOrders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <>
      <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4 transition-opacity shadow-sm ${
        !isShiftActive ? 'opacity-50 pointer-events-none' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {t("dashboard.orders_for_shift") || "Заказы за смену"}
          </h3>
          {isShiftActive && (
            <div className="flex items-center gap-2">
              {shiftOrders.length > 0 && (
                <button
                  onClick={() => setShowSummary(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t("dashboard.open_full_list") || "Открыть полный список"}
                </button>
              )}
            </div>
          )}
        </div>

        {!isShiftActive ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500 text-center py-8">
            {t("dashboard.start_shift_to_see_orders") || "Чтобы видеть заказы и итоги - начните смену"}
          </p>
        ) : shiftOrders.length > 0 ? (
          <>
            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("dashboard.time") || "Время"}</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("dashboard.order_number") || "№"}</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("dashboard.guests") || "Гостей"}</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("dashboard.amount") || "Сумма"}</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("dashboard.payment") || "Оплата"}</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400"></th>
                  </tr>
                </thead>
                <tbody>
                  {shiftOrders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((order) => {
                      const orderTime = new Date(order.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const orderNumber = order.id.slice(-3).toUpperCase();

                      return (
                        <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-2 px-3 text-sm text-zinc-600 dark:text-zinc-300">{orderTime}</td>
                          <td className="py-2 px-3 text-sm font-medium text-zinc-900 dark:text-white">#{orderNumber}</td>
                          <td className="py-2 px-3 text-sm text-zinc-600 dark:text-zinc-300">{order.guestsCount}</td>
                          <td className="py-2 px-3 text-sm font-bold text-zinc-900 dark:text-white">{order.amount.toLocaleString('ru-RU')} {currency}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentColor(order.paymentType)}`}>
                              {getPaymentLabel(order.paymentType)}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {canEdit && (
                              <div className="relative">
                                <button
                                  onClick={() => setMenuOpenId(menuOpenId === order.id ? null : order.id)}
                                  className="p-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded transition-colors"
                                >
                                  <MoreVertical className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                </button>
                                {menuOpenId === order.id && (
                                  <div className="absolute right-0 top-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-10 min-w-[120px]">
                                    <button
                                      onClick={() => {
                                        setEditingOrder(order);
                                        setShowOrderForm(true);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center gap-2"
                                    >
                                      <Edit className="h-3 w-3" />
                                      {t('dashboard.edit') || 'Изменить'}
                                    </button>
                                    <button
                                      onClick={() => handleDelete(order.id)}
                                      className="w-full px-3 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      {t('dashboard.delete') || 'Удалить'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 dark:border-zinc-700">
                    <td colSpan={3} className="py-3 px-3 text-sm font-semibold text-zinc-900 dark:text-white">
                      {t("dashboard.total") || "Итого"}
                    </td>
                    <td className="py-3 px-3 text-sm font-bold text-zinc-900 dark:text-white">
                      {totalAmount.toLocaleString('ru-RU')} {currency}
                    </td>
                    <td className="py-3 px-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {shiftOrders.length} {t("dashboard.orders") || "заказов"}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t("dashboard.no_orders_yet_message_updated") || "Пока заказов нет. Нажмите 'Добавить заказ' сверху справа, когда появится первый гость."}
            </p>
          </div>
        )}
      </div>

      {/* Order Form Modal */}
      <AnimatePresence>
        {showOrderForm && (
          <OrderForm
            order={editingOrder}
            onClose={() => {
              setShowOrderForm(false);
              setEditingOrder(null);
            }}
            onSubmit={handleOrderSubmit}
          />
        )}
      </AnimatePresence>

      {/* Orders Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <OrdersSummary
            onClose={() => setShowSummary(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
