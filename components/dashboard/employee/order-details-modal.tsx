"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Banknote } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useRef } from "react";
import { Order, OrderItem } from "@/lib/store";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  currency?: string;
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  currency = "₴",
}: OrderDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside([modalRef], () => onClose(), isOpen);

  if (!isOpen || !order) return null;

  // Парсим items из comment, если items не переданы напрямую
  const items: OrderItem[] = order.items || [];
  
  // Если items нет, пытаемся извлечь из comment
  let parsedItems: OrderItem[] = [];
  if (items.length === 0 && order.comment) {
    // Простой парсинг формата "Название xКоличество"
    const parts = order.comment.split(',').map(p => p.trim());
    parsedItems = parts.map((part, idx) => {
      const match = part.match(/(.+?)\s*x\s*(\d+)/);
      if (match) {
        const name = match[1].trim();
        const quantity = parseInt(match[2], 10);
        // Приблизительная цена (если не можем определить, используем среднюю)
        const estimatedPrice = order.amount / parts.length / quantity;
        return {
          id: idx,
          name,
          quantity,
          unitPrice: estimatedPrice,
          totalPrice: estimatedPrice * quantity,
        };
      }
      return {
        id: idx,
        name: part,
        quantity: 1,
        unitPrice: order.amount / parts.length,
        totalPrice: order.amount / parts.length,
      };
    });
  }

  const displayItems = items.length > 0 ? items : parsedItems;

  // Форматируем дату и время
  const orderTime = new Date(order.createdAt);
  const timeString = orderTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateString = orderTime.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const fullDateTime = `${dateString} ${timeString}`;

  // Извлекаем номер заказа из id (последние 4 цифры или весь id)
  const orderNumber = order.id.replace('order-', '').slice(-4).toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Чек #{orderNumber}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Время: {fullDateTime}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scroll">
                {/* Items Table */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Позиции заказа
                  </h3>
                  {displayItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Товар
                            </th>
                            <th className="text-center py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Кол-во
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Цена
                            </th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              Сумма
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-zinc-100 dark:border-zinc-800/50"
                            >
                              <td className="py-2 px-3 text-sm text-zinc-900 dark:text-white">
                                {item.name}
                              </td>
                              <td className="py-2 px-3 text-sm text-center text-zinc-600 dark:text-zinc-400">
                                {item.quantity}
                              </td>
                              <td className="py-2 px-3 text-sm text-right text-zinc-600 dark:text-zinc-400">
                                {item.unitPrice.toLocaleString()} {currency}
                              </td>
                              <td className="py-2 px-3 text-sm text-right font-semibold text-zinc-900 dark:text-white">
                                {item.totalPrice.toLocaleString()} {currency}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
                      Позиции не указаны
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <div className="flex items-center gap-2">
                    {order.paymentType === 'card' ? (
                      <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                      <Banknote className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    )}
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Оплата:
                    </span>
                    <span className="text-sm text-zinc-900 dark:text-white">
                      {order.paymentType === 'card' ? 'Карта' : order.paymentType === 'cash' ? 'Наличные' : 'Онлайн'}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Статус:
                    </span>
                    <span className="text-sm text-zinc-900 dark:text-white ml-2">
                      Завершён
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Итого:
                    </span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {order.amount.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                {/* Comment if exists */}
                {order.comment && displayItems.length > 0 && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {order.comment}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer with Close Button */}
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

