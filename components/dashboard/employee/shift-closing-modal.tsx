"use client";

import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, TrendingUp, Clock, Sparkles } from "lucide-react";

interface ShiftClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ShiftClosingModal({ isOpen, onClose, onConfirm }: ShiftClosingModalProps) {
  const { t } = useLanguage();
  const { currentShift, orders, getOrdersSummary, currency } = useStore();

  if (!isOpen || !currentShift) return null;

  const ordersSummary = getOrdersSummary(currentShift.id);
  const totalRevenue = ordersSummary 
    ? ordersSummary.byPaymentType.cash + ordersSummary.byPaymentType.card + ordersSummary.byPaymentType.online
    : 0;

  // Format end time
  const endTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Format start time
  const startTime = currentShift.startTime 
    ? new Date(currentShift.startTime).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Calculate if on time (within 5 minutes of scheduled time)
  const isOnTime = true; // TODO: Compare with scheduled start time
  const ordersCount = ordersSummary?.ordersCount || 0;
  const yesterdayOrders = 12; // TODO: Get from history
  const isBetterThanYesterday = ordersCount > yesterdayOrders;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/98 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div 
          className="rounded-[18px] p-6 w-full max-w-[420px]"
          style={{ 
            backgroundColor: 'var(--color-surface)',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.65)' 
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <h2 className="text-[20px] font-bold text-white">
                {t("dashboard.shift_ended_at") || "Смена завершена в"} {endTime}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-[#888]" />
            </button>
          </div>

          {/* Comparison Stats */}
          <div className="space-y-4 mb-6">
            {/* Arrival Time */}
            {startTime && (
              <div className="flex items-center gap-3 p-4 bg-[var(--color-card)] rounded-[14px] border border-white/8">
                <Clock className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-white">
                    {t("dashboard.you_arrived_at") || "Вы пришли в"} {startTime}
                  </p>
                  {isOnTime && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-md">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("dashboard.on_time") || "Вовремя"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Orders Count */}
            <div className="flex items-center gap-3 p-4 bg-[var(--color-card)] rounded-[14px] border border-white/8">
              <TrendingUp className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-white">
                  {t("dashboard.total_orders") || "Всего заказов"}: <span className="font-medium">{ordersCount}</span>
                </p>
                {isBetterThanYesterday && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-md">
                    🚀 {t("dashboard.better_than_yesterday") || "Лучше, чем вчера"}
                  </span>
                )}
              </div>
            </div>

            {/* Revenue */}
            <div 
              className="p-4 rounded-[14px] border border-white/8 relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0b4631, #0d6243 40%, #0ba95b 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">
                    {t("dashboard.revenue") || "Выручка"}
                  </p>
                  <p className="text-2xl font-bold text-white mb-1">
                    {totalRevenue.toLocaleString('ru-RU')} {currency}
                  </p>
                  <p className="text-sm text-white/90 font-medium">
                    {t("dashboard.good_job") || "Хорошая работа!"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={onConfirm}
            className="w-full h-[52px] bg-gradient-to-r from-[#0ba95b] to-[#2dd07f] text-white rounded-[14px] hover:from-[#0ba95b]/90 hover:to-[#2dd07f]/90 transition-all font-bold flex items-center justify-center gap-2"
            style={{ boxShadow: '0 0 20px rgba(0,255,180,0.4)' }}
          >
            <CheckCircle2 className="h-5 w-5" />
            {t("dashboard.confirm_close") || "Подтвердить закрытие"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

