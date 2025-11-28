"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Power, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface StartShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function StartShiftModal({ isOpen, onClose, onConfirm }: StartShiftModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Сброс состояния загрузки при открытии/закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      // Вызываем onConfirm и ждём результат
      await onConfirm();
      // Закрываем модалку только после успешного завершения
      onClose();
    } catch (error) {
      // Ошибка уже обработана в onConfirm (показан toast)
      // Оставляем модалку открытой, чтобы пользователь мог попробовать снова
      setIsLoading(false);
      console.error('Error starting shift:', error);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {/* Backdrop - z-index 9990 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={isLoading ? undefined : onClose}
        className="fixed inset-0 z-[9990] bg-black/45 backdrop-blur-sm"
      />

      {/* Modal Container - z-index 9999 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl p-6 max-w-md w-full pointer-events-auto"
        >
          {/* Заголовок */}
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
            {t("dashboard.start_shift") || "Начать смену?"}
          </h2>

          {/* Текст */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            {t("dashboard.start_shift_confirmation") || 
              "После начала смены будут доступны быстрые действия и данные смены начнут фиксироваться."}
          </p>

          {/* Кнопки */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-3)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("dashboard.cancel") || "Отмена"}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-[var(--success)] text-white rounded-lg hover:bg-[var(--success)]/90 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("dashboard.starting_shift") || "Запуск..."}
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  {t("dashboard.start_shift") || "Начать смену"}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

