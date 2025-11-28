"use client";

import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";
import { X, Power, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { createPortal } from "react-dom";

interface ConfirmEndShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmEndShiftModal({ isOpen, onClose, onConfirm }: ConfirmEndShiftModalProps) {
  const { t } = useLanguage();
  const { currentShift, currency, getOrdersSummary, orders } = useStore();

  // Вычисляем статистику смены
  const shiftSummary = useMemo(() => {
    if (!currentShift) return null;
    
    const ordersSummary = getOrdersSummary(currentShift.id);
    const totalRevenue = currentShift.totalRevenue || 
      (ordersSummary?.byPaymentType.cash || 0) + 
      (ordersSummary?.byPaymentType.card || 0) + 
      (ordersSummary?.byPaymentType.online || 0);
    const totalChecks = currentShift.totalChecks || ordersSummary?.ordersCount || 0;
    
    // Вычисляем длительность смены
    const startTime = new Date(currentShift.startTime);
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      totalRevenue,
      totalChecks,
      duration: { hours, minutes },
    };
  }, [currentShift, getOrdersSummary, orders]);

  // Если по каким-то причинам модалка оказалась открыта без смены - не рендерим
  // Проверка после всех хуков, чтобы не нарушать правила хуков
  if (!isOpen || !currentShift) {
    return null;
  }

  const modalContent = (
    <AnimatePresence>
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 flex-shrink-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {t("dashboard.end_shift_confirm") || "Закончить смену?"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            {/* Краткое резюме смены */}
            {shiftSummary && (
              <div className="bg-[var(--surface-3)] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Clock className="h-4 w-4" />
                  <span>
                    {shiftSummary.duration.hours > 0 
                      ? `${shiftSummary.duration.hours} ч ${shiftSummary.duration.minutes} мин`
                      : `${shiftSummary.duration.minutes} мин`
                    }
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">
                      {t("dashboard.revenue") || "Выручка"}
                    </p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {shiftSummary.totalRevenue.toLocaleString('ru-RU')} {currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">
                      {t("dashboard.checks_count") || "Чеков"}
                    </p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {shiftSummary.totalChecks}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-[var(--text-secondary)]">
              {t("dashboard.end_shift_confirm_text") || "Вы уверены, что хотите завершить смену? После завершения вы сможете скачать отчёт."}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-3)] rounded-lg transition-colors"
            >
              {t("dashboard.cancel") || "Отмена"}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-[var(--success)] text-white rounded-lg hover:bg-[var(--success)]/90 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Power className="h-4 w-4" />
              {t("dashboard.end_shift") || "Закончить смену"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  // Рендерим через портал в body для правильного позиционирования
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}

