"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Banknote, Loader2 } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useRef, useEffect } from "react";

interface BasketItem {
  id: number | string;
  name: string;
  price: number;
  qty: number;
  comment?: string;
}

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: 'card' | 'cash', comment?: string) => Promise<void>;
  items: BasketItem[];
  totalAmount: number;
  currentPaymentMethod: 'card' | 'cash';
  currency?: string;
  isLoading?: boolean;
}

export function OrderConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  totalAmount,
  currentPaymentMethod,
  currency = "₴",
  isLoading = false,
}: OrderConfirmationModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>(currentPaymentMethod);
  const [comment, setComment] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Update payment method when currentPaymentMethod changes
  useEffect(() => {
    setPaymentMethod(currentPaymentMethod);
  }, [currentPaymentMethod]);

  // Reset comment when modal opens
  useEffect(() => {
    if (isOpen) {
      // при открытии модалки сбрасываем комментарий
      setComment("");
    }
  }, [isOpen]);

  // Close on outside click
  useClickOutside([modalRef], () => onClose(), isOpen);

  const handleConfirm = async () => {
    await onConfirm(paymentMethod, comment.trim() || undefined);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - z-index 9990 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9990] bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container - z-index 9999 */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Подтвердите заказ
                </h2>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors text-[var(--text-secondary)] disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scroll">
                {/* Items List */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                    Позиции заказа
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-3 bg-[var(--surface-3)] rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {item.name}
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)] mt-1">
                            {item.price.toLocaleString()} {currency} × {item.qty}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] ml-4">
                          {(item.price * item.qty).toLocaleString()} {currency}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-[var(--border-color)] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-[var(--text-primary)]">
                      Итого:
                    </span>
                    <span className="text-2xl font-bold text-[var(--text-primary)]">
                      {totalAmount.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                    Способ оплаты
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      disabled={isLoading}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
                        paymentMethod === 'card'
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'
                      } disabled:opacity-50`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Карта</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      disabled={isLoading}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition ${
                        paymentMethod === 'cash'
                          ? 'bg-[var(--success)] border-[var(--success)] text-white'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'
                      } disabled:opacity-50`}
                    >
                      <Banknote className="h-4 w-4" />
                      <span className="font-medium">Наличные</span>
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-1">
                  <label className="block text-xs text-[var(--text-tertiary)]">
                    Комментарий к заказу (необязательно)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={isLoading}
                    placeholder="Например, имя клиента или особенности заказа"
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none disabled:opacity-50 min-h-[80px] text-sm"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Обработка...</span>
                    </>
                  ) : (
                    <span>Оформить</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

