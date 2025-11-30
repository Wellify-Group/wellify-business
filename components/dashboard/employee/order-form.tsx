"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Order } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface OrderFormProps {
  order?: Order | null;
  onClose: () => void;
  onSubmit: (orderData: Omit<Order, 'id' | 'createdAt' | 'employeeId' | 'locationId' | 'shiftId'>) => void;
}

export function OrderForm({ order, onClose, onSubmit }: OrderFormProps) {
  const { t } = useLanguage();
  const [orderType, setOrderType] = useState<Order['orderType']>(order?.orderType || 'hall');
  const [paymentType, setPaymentType] = useState<Order['paymentType']>(order?.paymentType || 'cash');
  const [amount, setAmount] = useState(order?.amount.toString() || "");
  const [guestsCount, setGuestsCount] = useState(order?.guestsCount || 1);
  const [comment, setComment] = useState(order?.comment || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = t('dashboard.error_amount_required') || "Введите сумму больше 0";
    }
    
    if (guestsCount < 1) {
      newErrors.guests = t('dashboard.error_guests_min') || "Количество гостей должно быть не менее 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      orderType,
      paymentType,
      amount: parseFloat(amount),
      guestsCount,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[99999] h-screen w-screen bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-[99999] h-screen w-screen flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-white dark:bg-surface-elevated border border-zinc-200 dark:border-white/10 rounded-2xl dark:shadow-[0_0_20px_rgba(0,0,0,0.45)] shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {order 
                ? (t("dashboard.edit_order") || "Изменить заказ")
                : (t("dashboard.new_order") || "Новый заказ")}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" />
            </button>
          </div>

          {/* Order Type - Segmented Control Style */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              {t("dashboard.order_type") || "Тип заказа"}
            </label>
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              {(['hall', 'delivery'] as Order['orderType'][]).filter(type => type === 'hall' || type === 'delivery').map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    orderType === type
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-transparent text-zinc-600 hover:bg-zinc-200 border border-zinc-200 dark:bg-transparent dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700'
                  }`}
                >
                  {type === 'hall' 
                    ? (t("dashboard.order_type_hall") || "Зал")
                    : (t("dashboard.order_type_delivery") || "Доставка")}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              {t("dashboard.payment_method") || "Способ оплаты"}
            </label>
            <div className="flex gap-2">
              {(['cash', 'card', 'online'] as Order['paymentType'][]).map((type) => (
                <button
                  key={type}
                  onClick={() => setPaymentType(type)}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    paymentType === type
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700'
                  }`}
                >
                  {type === 'cash'
                    ? (t("dashboard.payment_cash") || "Наличные")
                    : type === 'card'
                    ? (t("dashboard.payment_card") || "Карта")
                    : (t("dashboard.payment_online") || "Онлайн")}
                </button>
              ))}
            </div>
          </div>

          {/* Amount - Large Font */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              {t("dashboard.order_amount") || "Сумма заказа"} ({t("dashboard.currency") || "₴"})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
                setAmount(val);
                if (errors.amount) setErrors({ ...errors, amount: "" });
              }}
              className={`w-full px-4 py-4 bg-white dark:bg-zinc-900 border rounded-lg text-zinc-900 dark:text-white text-2xl font-bold focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-400 ${
                errors.amount ? 'border-rose-500' : 'border-zinc-300 dark:border-zinc-700'
              }`}
              placeholder="0"
            />
            {errors.amount && (
              <p className="text-xs text-rose-400 dark:text-rose-500 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Guests Count */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              {t("dashboard.guests_count") || "Количество гостей"}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={guestsCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setGuestsCount(Math.max(1, val));
                  if (errors.guests) setErrors({ ...errors, guests: "" });
                }}
                className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-center text-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={() => setGuestsCount(guestsCount + 1)}
                className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                +
              </button>
            </div>
            {errors.guests && (
              <p className="text-xs text-rose-400 dark:text-rose-500 mt-1">{errors.guests}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              {t("dashboard.comment") || "Комментарий"} ({t("dashboard.optional") || "необязательно"})
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-400"
              placeholder={t("dashboard.comment_placeholder") || "банкет, возврат, скидка..."}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
            >
              {t("dashboard.cancel") || "Отмена"}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-emerald-500/20"
            >
              {t("dashboard.save") || "Сохранить"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}


