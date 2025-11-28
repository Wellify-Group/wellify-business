"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";
import { X, AlertTriangle } from "lucide-react";

interface ProblemReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProblemReportModal({ isOpen, onClose }: ProblemReportModalProps) {
  const { t } = useLanguage();
  const { currentShift, currentUser, savedLocationId } = useStore();
  
  const [category, setCategory] = useState<'product_out' | 'equipment_failure' | 'wrong_order' | 'rude_client' | 'work_issue'>('product_out');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryLabels: Record<string, string> = {
    product_out: "Закончился продукт",
    equipment_failure: "Поломка оборудования",
    wrong_order: "Неправильный заказ",
    rude_client: "Грубый клиент",
    work_issue: "Проблема с работой",
  };

  const handleSubmit = async () => {
    if (!description.trim() || !currentShift || !currentUser || !savedLocationId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/shift-events/problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: currentUser.businessId,
          point_id: savedLocationId,
          shift_id: currentShift.id,
          employee_id: currentUser.id,
          category,
          category_label: categoryLabels[category],
          severity,
          description: description.trim(),
        }),
      });

      if (response.ok) {
        // Сброс формы
        setDescription("");
        setCategory('product_out');
        setSeverity('medium');
        onClose();
      } else {
        console.error('Failed to report problem');
      }
    } catch (error) {
      console.error('Error reporting problem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - z-index 9990 */}
      <div 
        className="fixed inset-0 z-[9990] bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container - z-index 9999 */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl w-full max-w-md pointer-events-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
              Сообщить о проблеме
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Категория
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)]"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Серьезность
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)]"
              >
                <option value="low">Низкая</option>
                <option value="medium">Средняя</option>
                <option value="high">Высокая</option>
                <option value="critical">Критическая</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите проблему..."
                rows={4}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--surface-3)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-3)] disabled:opacity-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !description.trim()}
                className="flex-1 px-4 py-2 bg-[var(--warning)] text-white rounded-lg hover:bg-[var(--warning)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Отправка..." : "Отправить"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}



