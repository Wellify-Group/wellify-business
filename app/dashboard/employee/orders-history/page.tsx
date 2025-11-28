"use client";

import { useMemo, useState } from "react";
import { useStore, Order } from "@/lib/store";
import { OrderDetailsModal } from "@/components/dashboard/employee/order-details-modal";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EmployeeOrdersHistoryPage() {
  const { orders, currentShift, currentUser, currency } = useStore();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Фильтруем заказы только текущей смены и текущего сотрудника
  const currentShiftOrders = useMemo(() => {
    if (!currentShift || !currentUser) return [];
    
    return (orders || [])
      .filter((order) => 
        order.shiftId === currentShift.id && 
        order.employeeId === currentUser.id
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentShift, currentUser]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
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

  // Получаем текст способа оплаты
  const getPaymentMethodText = (paymentType: Order['paymentType']) => {
    switch (paymentType) {
      case 'cash':
        return 'Наличные';
      case 'card':
        return 'Карта';
      case 'online':
        return 'Онлайн';
      default:
        return paymentType;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 dark:bg-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад</span>
          </button>
          
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            История заказов
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Текущая смена
          </p>
        </div>

        {/* Orders List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {currentShiftOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                За текущую смену ещё нет заказов.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {currentShiftOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                      #{getOrderNumber(order.id)}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {formatOrderTime(order.createdAt)}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                      {order.amount.toLocaleString()} {currency}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {getPaymentMethodText(order.paymentType)}
                    </span>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-5 h-5 text-zinc-400 dark:text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        currency={currency}
      />
    </div>
  );
}

