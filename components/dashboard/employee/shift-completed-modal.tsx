"use client";

import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { X, Download, Share2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { downloadShiftReport } from "@/lib/shift-pdf-generator";
import { createPortal } from "react-dom";

interface ShiftCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string | null;
}

export function ShiftCompletedModal({ isOpen, onClose, shiftId }: ShiftCompletedModalProps) {
  const { t } = useLanguage();
  const { lastClosedShiftId, shifts, locations, currentUser, currency } = useStore();
  const [copied, setCopied] = useState(false);

  // Находим завершённую смену
  const completedShift = shiftId 
    ? shifts.find(s => s.id === shiftId) 
    : lastClosedShiftId 
      ? shifts.find(s => s.id === lastClosedShiftId)
      : null;

  const location = completedShift?.locationId 
    ? locations.find(l => l.id === completedShift.locationId) || null
    : null;

  const handleDownloadPDF = () => {
    if (!completedShift || !currentUser) return;

    downloadShiftReport({
      shift: completedShift,
      location,
      employee: currentUser,
      currency,
    });
  };

  const handleCopyLink = () => {
    if (!shiftId && !lastClosedShiftId) return;
    
    const reportId = shiftId || lastClosedShiftId;
    const reportUrl = `${window.location.origin}/api/shift-report/${reportId}`;
    
    navigator.clipboard.writeText(reportUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 dark:bg-black/50 pointer-events-auto"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {t("dashboard.shift_completed") || "Смена завершена"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t("dashboard.shift_completed_text") || "Вы можете скачать отчёт по смене или отправить его в выбранный канал."}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {t("dashboard.report_pdf_format") || "Отчёт формируется в формате PDF."}
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
            {/* Скачать PDF */}
            <button
              onClick={handleDownloadPDF}
              className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t("dashboard.download_pdf") || "Скачать PDF"}
            </button>

            {/* Поделиться */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t("dashboard.copied") || "Скопировано"}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t("dashboard.copy_link") || "Скопировать ссылку"}
                  </>
                )}
              </button>
            </div>

            {/* Кнопка Готово */}
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              {t("dashboard.done") || "Готово"}
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

