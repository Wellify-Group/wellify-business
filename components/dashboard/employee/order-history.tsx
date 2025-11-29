"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "lucide-react";
import useStore, { Order } from "@/lib/store";
import { OrderDetailsModal } from "./order-details-modal";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useRef } from "react";

interface OrderHistoryProps {
  compact?: boolean;
}

export function OrderHistory({ compact = false }: OrderHistoryProps) {
  const { orders, currentShift, currency } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Фильтруем заказы только текущей смены
  const currentShiftOrders = useMemo(() => {
    if (!currentShift) return [];
    return (orders || [])
      .filter((order) => order.shiftId === currentShift.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentShift]);

  useClickOutside([menuRef], () => setIsOpen(false), isOpen);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
    setIsOpen(false);
  };

  // Форматируем время заказа
  const formatOrderTime = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Извлекаем номер заказа
  const getOrderNumber = (orderId: string) => {
    return orderId.replace('order-', '').slice(-4).toUpperCase();
  };

  // Форматируем список позиций для краткого отображения
  const formatItemsPreview = (order: Order) => {
    if (order.items && order.items.length > 0) {
      return order.items
        .map((item) => `${item.name} ×${item.quantity}`)
        .join(', ');
    }
    // Если items нет, пытаемся извлечь из comment
    if (order.comment) {
      const parts = order.comment.split(',').map(p => p.trim());
      return parts.slice(0, 3).join(', ') + (parts.length > 3 ? '...' : '');
    }
    return 'Позиции не указаны';
  };

  if (compact) {
    // Компактный режим - кнопка в меню профиля
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mb-1"
        >
          <List className="h-4 w-4" />
          <span>История заказов</span>
        </button>

        {/* Выпадающее меню с историей */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-[9998]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed right-4 top-20 w-80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-[9999] max-h-[calc(100vh-120px)] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    История заказов
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto custom-scroll p-2">
                  {currentShiftOrders.length === 0 ? (
                    <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
                      Заказов пока нет
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentShiftOrders.map((order) => (
                        <button
                          key={order.id}
                          onClick={() => handleOrderClick(order)}
                          className="w-full text-left p-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              #{getOrderNumber(order.id)} — {formatOrderTime(order.createdAt)}
                            </span>
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                              {order.amount.toLocaleString()} {currency}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-900 dark:text-white mb-1 line-clamp-2">
                            {formatItemsPreview(order)}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {order.paymentType === 'card' ? 'Карта' : order.paymentType === 'cash' ? 'Наличные' : 'Онлайн'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Modal с деталями */}
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
          currency={currency}
        />
      </>
    );
  }

  // Полный режим - отдельный блок на экране
  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <List className="h-4 w-4" />
            История заказов
          </h3>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto custom-scroll">
          {currentShiftOrders.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Заказов пока нет
            </div>
          ) : (
            currentShiftOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => handleOrderClick(order)}
                className="w-full text-left p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-border/50"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{getOrderNumber(order.id)} — {formatOrderTime(order.createdAt)}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {order.amount.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="text-xs text-foreground mb-1 line-clamp-2">
                  {formatItemsPreview(order)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {order.paymentType === 'card' ? 'Карта' : order.paymentType === 'cash' ? 'Нал' : 'Онлайн'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Modal с деталями */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
        currency={currency}
      />
    </>
  );
}

