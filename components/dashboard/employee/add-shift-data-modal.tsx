"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";
import { X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddShiftDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddShiftDataModal({ isOpen, onClose }: AddShiftDataModalProps) {
  const { t } = useLanguage();
  const { currentShift, updateShiftStats, currency } = useStore();
  const [revenue, setRevenue] = useState("");
  const [checks, setChecks] = useState("");
  const [guests, setGuests] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Автозаполнение из текущей статистики смены
  const currentRevenue = currentShift?.totalRevenue || 0;
  const currentChecks = currentShift?.totalChecks || 0;
  const currentGuests = currentShift?.totalGuests || 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (revenue && (isNaN(Number(revenue)) || Number(revenue) < 0)) {
      newErrors.revenue = "Выручка должна быть положительным числом";
    }

    if (checks && (isNaN(Number(checks)) || Number(checks) < 0 || !Number.isInteger(Number(checks)))) {
      newErrors.checks = "Количество чеков должно быть целым положительным числом";
    }

    if (guests && (isNaN(Number(guests)) || Number(guests) < 0 || !Number.isInteger(Number(guests)))) {
      newErrors.guests = "Количество гостей должно быть целым положительным числом";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const stats: { totalRevenue?: number; totalChecks?: number; totalGuests?: number } = {};

      if (revenue) {
        stats.totalRevenue = Number(revenue);
      }
      if (checks) {
        stats.totalChecks = Number(checks);
      }
      if (guests) {
        stats.totalGuests = Number(guests);
      }

      await updateShiftStats(stats);

      // Очистка формы
      setRevenue("");
      setChecks("");
      setGuests("");
      setComment("");
      setErrors({});

      onClose();
    } catch (error) {
      console.error("Failed to update shift stats:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRevenue("");
    setChecks("");
    setGuests("");
    setComment("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 dark:bg-black/70"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-md mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {t("dashboard.add_shift_data") || "Внести данные"}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Выручка */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                {t("dashboard.revenue") || "Выручка"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder={currentRevenue > 0 ? currentRevenue.toString() : "0"}
                  className={`w-full px-4 py-3 bg-white dark:bg-zinc-950 border rounded-lg text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.revenue
                      ? "border-red-500"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                  {currency}
                </span>
              </div>
              {errors.revenue && (
                <p className="mt-1 text-sm text-red-500">{errors.revenue}</p>
              )}
            </div>

            {/* Количество чеков */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                {t("dashboard.checks_count") || "Количество чеков"}
              </label>
              <input
                type="number"
                value={checks}
                onChange={(e) => setChecks(e.target.value)}
                placeholder={currentChecks > 0 ? currentChecks.toString() : "0"}
                className={`w-full px-4 py-3 bg-white dark:bg-zinc-950 border rounded-lg text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.checks
                    ? "border-red-500"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              />
              {errors.checks && (
                <p className="mt-1 text-sm text-red-500">{errors.checks}</p>
              )}
            </div>

            {/* Количество гостей */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                {t("dashboard.guests_count") || "Количество гостей"}
              </label>
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder={currentGuests > 0 ? currentGuests.toString() : "0"}
                className={`w-full px-4 py-3 bg-white dark:bg-zinc-950 border rounded-lg text-zinc-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.guests
                    ? "border-red-500"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              />
              {errors.guests && (
                <p className="mt-1 text-sm text-red-500">{errors.guests}</p>
              )}
            </div>

            {/* Комментарий */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-white mb-2">
                {t("dashboard.comment") || "Комментарий"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-500 dark:placeholder:text-zinc-500"
                placeholder={t("dashboard.comment_placeholder") || "Дополнительная информация..."}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {t("dashboard.cancel") || "Отмена"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {t("dashboard.save") || "Сохранить"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}













