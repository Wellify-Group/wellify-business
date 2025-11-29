"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore, { FormField } from "@/lib/store";
import { X, Power, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface ShiftClosingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShiftClosingForm({ isOpen, onClose, onSuccess }: ShiftClosingFormProps) {
  const { t } = useLanguage();
  const { currentShift, formConfig, currency, closeShift, resetCloseShiftError, currentUser, locations, isClosingShift, closeShiftError } = useStore();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Получаем схему формы из конфига
  const schema = formConfig.shiftClosingFormSchema || [];

  // Инициализация формы при открытии
  useEffect(() => {
    if (isOpen && schema.length > 0) {
      const initialData: Record<string, any> = {};
      schema.forEach((field) => {
        if (field.type === "checkbox") {
          initialData[field.id] = false;
        } else {
          initialData[field.id] = "";
        }
      });
      setFormData(initialData);
      setErrors({});
      setShowConfirm(false);
    }
  }, [isOpen, schema]);

  // Автозаполнение из текущей статистики смены
  useEffect(() => {
    if (currentShift && isOpen) {
      const autoFill: Record<string, any> = {};
      
      // Автозаполнение кассы
      const cashField = schema.find(f => f.id === "cash_actual");
      if (cashField && currentShift.totalRevenue) {
        autoFill["cash_actual"] = currentShift.totalRevenue.toString();
      }

      setFormData(prev => ({ ...prev, ...autoFill }));
    }
  }, [currentShift, isOpen, schema]);

  // Убрали useEffect, который ждал закрытия - теперь модалка закрывается сразу

  const validate = () => {
    const newErrors: Record<string, string> = {};

    schema.forEach((field) => {
      const value = formData[field.id];

      if (field.required) {
        if (field.type === "checkbox" && !value) {
          newErrors[field.id] = `Поле "${field.label}" обязательно для заполнения`;
        } else if (field.type !== "checkbox" && (!value || value.toString().trim() === "")) {
          newErrors[field.id] = `Поле "${field.label}" обязательно для заполнения`;
        }
      }

      if (field.type === "number" && value) {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
          newErrors[field.id] = `Поле "${field.label}" должно быть положительным числом`;
        }
      }

      if (field.type === "text_multiline" && value && value.length > 1000) {
        newErrors[field.id] = `Поле "${field.label}" не должно превышать 1000 символов`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (isClosingShift) return;

    // Показываем подтверждение, если есть обязательные поля
    const hasRequiredFields = schema.some(f => f.required);
    if (hasRequiredFields && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    // Преобразуем данные формы в формат для closeShift
    const cashField = schema.find(f => f.id === "cash_actual");
    const cardField = schema.find(f => f.id === "cashless_total");
    const guestsField = schema.find(f => f.id.includes("guest") || f.id.includes("guests"));
    const commentField = schema.find(f => f.type === "text_multiline");

    const cash = cashField ? Number(formData[cashField.id] || 0) : 0;
    const card = cardField ? Number(formData[cardField.id] || 0) : 0;
    const guests = guestsField ? Number(formData[guestsField.id] || 0) : undefined;
    const comment = commentField ? formData[commentField.id] : undefined;

    // Собираем checklist из checkbox полей
    const checklist = schema
      .filter(f => f.type === "checkbox" && formData[f.id])
      .map(f => f.id);

    // Закрываем модалку сразу (оптимистично)
    onClose();

    // Вызываем closeShift из стора с данными формы в фоне (не ждём ответа)
    closeShift({
      cash,
      card,
      guests,
      comment,
      checklist,
      closingFields: formData,
    }).catch((error) => {
      // Ошибка уже обработана в closeShift (откат в сторе)
      console.error('Error closing shift:', error);
    });
  };

  const handleClose = () => {
    if (isClosingShift) return;
    setFormData({});
    setErrors({});
    setShowConfirm(false);
    resetCloseShiftError(); // очищаем ошибку при закрытии модалки
    onClose();
  };

  // Обработка Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosingShift) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, isClosingShift]);

  // Если по каким-то причинам модалка оказалась открыта без смены - не рендерим
  // Проверка после всех хуков, чтобы не нарушать правила хуков
  if (!isOpen || !currentShift) {
    return null;
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] ?? "";
    const error = errors[field.id];

    switch (field.type) {
      case "number":
        return (
          <div key={field.id}>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || "0"}
                className={`w-full px-4 py-3 bg-card border rounded-lg text-foreground text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  error
                    ? "border-red-500"
                    : "border-border"
                }`}
              />
              {(field.id.includes("cash") || field.id.includes("revenue")) && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  {currency}
                </span>
              )}
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>
        );

      case "text":
        return (
          <div key={field.id}>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              maxLength={500}
              className={`w-full px-4 py-3 bg-card border rounded-lg text-foreground text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                error
                  ? "border-red-500"
                  : "border-border"
              }`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>
        );

      case "text_multiline":
        return (
          <div key={field.id}>
            <label className="block text-sm font-semibold text-neutral-800 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder || ""}
              rows={3}
              maxLength={1000}
              className={`w-full px-4 py-3 bg-card border rounded-lg text-foreground text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                error
                  ? "border-red-500"
                  : "border-border"
              }`}
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="flex items-start gap-3">
            <input
              type="checkbox"
              id={field.id}
              checked={value || false}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-border text-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
            <label
              htmlFor={field.id}
              className="flex-1 text-sm font-semibold text-neutral-800"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>
        );

      default:
        return null;
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
        className="fixed inset-0 z-[9990] bg-black/45 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Container - z-index 9999 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 flex-shrink-0">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {t("dashboard.close_shift") || "Завершение смены"}
            </h2>
            <button
              onClick={handleClose}
              disabled={isClosingShift}
              className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-6 overflow-y-auto flex-1 min-h-0">
            {/* Инструкция */}
            <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-lg p-4">
              <p className="text-sm text-[var(--warning)]">
                {t("dashboard.close_shift_instruction") || 
                  "Пожалуйста, заполните данные перед закрытием смены. После отправки изменения внести невозможно."}
              </p>
            </div>

            {/* Подтверждение */}
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-[var(--error)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--error)] mb-1">
                    {t("dashboard.confirm_close_shift") || "Вы уверены, что хотите закрыть смену?"}
                  </p>
                  <p className="text-xs text-[var(--error)]/80">
                    {t("dashboard.confirm_close_shift_warning") || "Данные изменить будет нельзя."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Ошибка из стора */}
            {closeShiftError && (
              <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg p-4">
                <p className="text-sm text-[var(--error)]">{closeShiftError}</p>
              </div>
            )}

            {/* Ошибки валидации формы */}
            {errors._general && !closeShiftError && (
              <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg p-4">
                <p className="text-sm text-[var(--error)]">{errors._general}</p>
              </div>
            )}

            {/* Поля формы */}
            <div className="space-y-4">
              {schema.map((field) => renderField(field))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 flex-shrink-0">
            <button
              onClick={handleClose}
              disabled={isClosingShift}
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-3)] rounded-lg transition-colors disabled:opacity-50"
            >
              {t("dashboard.cancel") || "Отмена"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isClosingShift}
              className="px-4 py-2 bg-[var(--error)] text-white rounded-xl hover:bg-[var(--error)]/90 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Power className="h-4 w-4" />
              {isClosingShift
                ? (t("dashboard.closing_shift") || "Закрываем...")
                : showConfirm
                ? (t("dashboard.confirm_close") || "Подтвердить закрытие")
                : (t("dashboard.close_shift") || "Завершить смену")}
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



