"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, CheckCircle2, AlertCircle, Download, Lock } from "lucide-react";
import { downloadShiftReport } from "@/lib/shift-pdf-generator";

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CloseShiftModal({ isOpen, onClose, onSuccess }: CloseShiftModalProps) {
  const { t } = useLanguage();
  const { 
    currency, 
    formConfig, 
    currentShift, 
    endShift, 
    orders, 
    getOrdersSummary,
    locations,
    currentUser,
    shifts
  } = useStore();

  const ordersSummary = currentShift ? getOrdersSummary(currentShift.id) : null;

  // State for editable values
  const [cash, setCash] = useState("");
  const [card, setCard] = useState("");
  const [guests, setGuests] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingField, setEditingField] = useState<'cash' | 'card' | 'guests' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize values from orders summary
  useEffect(() => {
    if (isOpen && ordersSummary) {
      setCash(ordersSummary.byPaymentType.cash.toString());
      setCard((ordersSummary.byPaymentType.card + ordersSummary.byPaymentType.online).toString());
      setGuests(ordersSummary.guestsSum.toString());
    }
  }, [isOpen, ordersSummary]);

  // Load checklist
  useEffect(() => {
    if (isOpen) {
      const defaultChecklist: Record<string, boolean> = {
        cleanFloor: false,
        lightsOff: false,
        doorLocked: false,
        cashClosed: false,
        ordersChecked: false,
      };
      setChecklist(defaultChecklist);
    }
  }, [isOpen]);

  const handleEditField = (field: 'cash' | 'card' | 'guests') => {
    setEditingField(field);
    setFieldErrors({ ...fieldErrors, [field]: "" });
  };

  const handleSaveField = (field: 'cash' | 'card' | 'guests') => {
    const value = field === 'cash' ? cash : field === 'card' ? card : guests;
    const numValue = parseInt(value) || 0;
    
    if (numValue < 0) {
      setFieldErrors({ ...fieldErrors, [field]: t('dashboard.error_positive_number') || "Введите неотрицательное число" });
      return;
    }

    setEditingField(null);
    setFieldErrors({ ...fieldErrors, [field]: "" });
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: 'cash' | 'card' | 'guests') => {
    if (e.key === 'Enter') {
      handleSaveField(field);
    } else if (e.key === 'Escape') {
      setEditingField(null);
      // Reset to original value
      if (ordersSummary) {
        if (field === 'cash') setCash(ordersSummary.byPaymentType.cash.toString());
        if (field === 'card') setCard((ordersSummary.byPaymentType.card + ordersSummary.byPaymentType.online).toString());
        if (field === 'guests') setGuests(ordersSummary.guestsSum.toString());
      }
    }
  };

  const allChecklistChecked = Object.values(checklist).every(checked => checked);

  const handleConfirmClose = async () => {
    if (!currentShift) return;

    const cashNum = parseInt(cash) || 0;
    const cardNum = parseInt(card) || 0;
    const guestsNum = parseInt(guests) || 0;

    if (cashNum < 0 || cardNum < 0 || guestsNum < 0) {
      return;
    }

    if (!allChecklistChecked) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get notes array from currentShift, or create empty array
      const shiftNotes = currentShift.notes || [];
      
      await endShift({
        cash: cashNum,
        card: cardNum,
        guests: guestsNum,
        notes: shiftNotes.length > 0 ? shiftNotes : undefined,
        checklist: Object.entries(checklist)
          .filter(([_, checked]) => checked)
          .map(([key]) => key),
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to close shift:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const systemCash = ordersSummary?.byPaymentType.cash || 0;
  const systemCard = (ordersSummary?.byPaymentType.card || 0) + (ordersSummary?.byPaymentType.online || 0);
  const systemGuests = ordersSummary?.guestsSum || 0;
  const systemTotal = systemCash + systemCard;

  const currentCash = parseInt(cash) || 0;
  const currentCard = parseInt(card) || 0;
  const currentTotal = currentCash + currentCard;
  const currentGuests = parseInt(guests) || 0;

  const cashDiff = currentCash - systemCash;
  const cardDiff = currentCard - systemCard;
  const guestsDiff = currentGuests - systemGuests;

  // Handle download report
  const handleDownloadReport = () => {
    if (!currentShift) return;
    
    // Find the full shift data from shifts array
    const fullShift = shifts.find(s => s.id === currentShift.id);
    
    // Create a temporary shift object with current form values for the report
    // Use notes array from currentShift, or fallback to fullShift notes
    const shiftNotes = currentShift.notes || fullShift?.notes || [];
    
    const reportShift = {
      id: currentShift.id,
      employeeId: currentShift.employeeId,
      employeeName: currentUser?.name || fullShift?.employeeName || 'Unknown',
      date: fullShift?.date || Date.now(),
      revenueCash: currentCash,
      revenueCard: currentCard,
      guestCount: currentGuests || undefined,
      checkCount: fullShift?.checkCount,
      status: fullShift?.status || 'ok',
      anomalies: fullShift?.anomalies || [],
      notes: shiftNotes,
    };

    const location = currentShift.locationId 
      ? locations.find(l => l.id === currentShift.locationId) || null
      : null;

    downloadShiftReport({
      shift: reportShift,
      location: location,
      employee: currentUser,
      currency
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-black/98 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      >
        <div 
          className="bg-[var(--bg-primary)] rounded-[18px] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 0 40px rgba(0, 0, 0, 0.65)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-white" />
              <h2 className="text-[22px] font-bold text-white">
                {t("dashboard.close_shift_title") || "ЗАКРЫТИЕ СМЕНЫ"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-[#888]" />
            </button>
          </div>

          {/* Finances Block */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t("dashboard.finances_system") || "Финансы по системе"}
            </h3>
            
            {/* Cash */}
            <div 
              className="bg-[var(--surface-1)] rounded-[14px] p-[18px] border border-[var(--border-strong)] hover:border-[var(--success)]/25 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-[15px] text-white">
                  {t("dashboard.emp_cash") || "Наличные"} ({currency})
                </label>
                {editingField !== 'cash' && (
                  <button
                    onClick={() => handleEditField('cash')}
                    className="text-xs text-[var(--success)] hover:text-[var(--success)]/80 flex items-center gap-1 font-light"
                  >
                    <Edit2 className="h-3 w-3" />
                    {t("dashboard.edit") || "Изменить"}
                  </button>
                )}
              </div>
              {editingField === 'cash' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cash}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCash(val);
                    }}
                    onKeyDown={(e) => handleKeyPress(e, 'cash')}
                    onBlur={() => handleSaveField('cash')}
                    autoFocus
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--success)] rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-[#2bd38a]/50 focus:outline-none"
                  />
                  <div className="text-xs space-y-1">
                    <p className="text-zinc-400">
                      {t("dashboard.was_system") || "Было по системе"}: {systemCash.toLocaleString('ru-RU')} {currency}
                    </p>
                    {cashDiff !== 0 && (
                      <p className={cashDiff > 0 ? "text-emerald-400" : "text-rose-400"}>
                        {t("dashboard.difference") || "Разница"}: {cashDiff > 0 ? '+' : ''}{cashDiff.toLocaleString('ru-RU')} {currency}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[22px] font-bold text-white">
                    {currentCash.toLocaleString('ru-RU')} {currency}
                  </p>
                  {cashDiff !== 0 && (
                    <p className={`text-xs mt-1 ${cashDiff > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {t("dashboard.difference") || "Разница"}: {cashDiff > 0 ? '+' : ''}{cashDiff.toLocaleString('ru-RU')} {currency}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Card */}
            <div 
              className="bg-[var(--surface-1)] rounded-[14px] p-[18px] border border-[var(--border-strong)] hover:border-[var(--success)]/25 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-[15px] text-white">
                  {t("dashboard.emp_card") || "Карта"} ({currency})
                </label>
                {editingField !== 'card' && (
                  <button
                    onClick={() => handleEditField('card')}
                    className="text-xs text-[var(--success)] hover:text-[var(--success)]/80 flex items-center gap-1 font-light"
                  >
                    <Edit2 className="h-3 w-3" />
                    {t("dashboard.edit") || "Изменить"}
                  </button>
                )}
              </div>
              {editingField === 'card' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={card}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCard(val);
                    }}
                    onKeyDown={(e) => handleKeyPress(e, 'card')}
                    onBlur={() => handleSaveField('card')}
                    autoFocus
                    className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--success)] rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-[#2bd38a]/50 focus:outline-none"
                  />
                  <div className="text-xs space-y-1">
                    <p className="text-zinc-400">
                      {t("dashboard.was_system") || "Было по системе"}: {systemCard.toLocaleString('ru-RU')} {currency}
                    </p>
                    {cardDiff !== 0 && (
                      <p className={cardDiff > 0 ? "text-emerald-400" : "text-rose-400"}>
                        {t("dashboard.difference") || "Разница"}: {cardDiff > 0 ? '+' : ''}{cardDiff.toLocaleString('ru-RU')} {currency}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[22px] font-bold text-white">
                    {currentCard.toLocaleString('ru-RU')} {currency}
                  </p>
                  {cardDiff !== 0 && (
                    <p className={`text-xs mt-1 ${cardDiff > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {t("dashboard.difference") || "Разница"}: {cardDiff > 0 ? '+' : ''}{cardDiff.toLocaleString('ru-RU')} {currency}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-[var(--surface-1)] rounded-[14px] p-[18px] border border-[var(--border-strong)]">
              <label className="text-[15px] text-white mb-2 block">
                {t("dashboard.total") || "Итого"} ({currency})
              </label>
              <p className="text-[22px] font-bold text-[var(--success)]">
                {currentTotal.toLocaleString('ru-RU')} {currency}
              </p>
            </div>

            {/* Guests */}
            {formConfig.showGuests && (
              <div 
                className="bg-[var(--surface-1)] rounded-[14px] p-[18px] border border-[var(--border-strong)] hover:border-[var(--success)]/25 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[15px] text-white">
                    {t("dashboard.guests") || "Гостей"}
                  </label>
                  {editingField !== 'guests' && (
                    <button
                      onClick={() => handleEditField('guests')}
                      className="text-xs text-[var(--success)] hover:text-[var(--success)]/80 flex items-center gap-1 font-light"
                    >
                      <Edit2 className="h-3 w-3" />
                      {t("dashboard.edit") || "Изменить"}
                    </button>
                  )}
                </div>
                {editingField === 'guests' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={guests}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setGuests(val);
                      }}
                      onKeyDown={(e) => handleKeyPress(e, 'guests')}
                      onBlur={() => handleSaveField('guests')}
                      autoFocus
                      className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--success)] rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-[#2bd38a]/50 focus:outline-none"
                    />
                    <div className="text-xs space-y-1">
                      <p className="text-zinc-400">
                        {t("dashboard.was_system") || "Было по системе"}: {systemGuests}
                      </p>
                      {guestsDiff !== 0 && (
                        <p className={guestsDiff > 0 ? "text-emerald-400" : "text-rose-400"}>
                          {t("dashboard.difference") || "Разница"}: {guestsDiff > 0 ? '+' : ''}{guestsDiff}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[22px] font-bold text-white">{currentGuests}</p>
                    {guestsDiff !== 0 && (
                      <p className={`text-xs mt-1 ${guestsDiff > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {t("dashboard.difference") || "Разница"}: {guestsDiff > 0 ? '+' : ''}{guestsDiff}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-[18px] font-bold text-white mb-1">
                {t("dashboard.emp_closing_checklist") || "Чек-лист закрытия"}
              </h3>
              <p className="text-[14px] text-[#A0A0A0] mb-2">
                {t("dashboard.checklist_required_hint") || "Обязательно перед закрытием смены"}
              </p>
              <p className="text-[13px] text-[#f1c232] flex items-center gap-1 mb-4">
                <AlertCircle className="h-4 w-4" />
                {t("dashboard.checklist_all_required") || "Без выполнения всех пунктов смену закрыть нельзя."}
              </p>
            </div>
            <div className="space-y-[14px]">
              {[
                { key: 'cleanFloor', label: t("dashboard.checklist_clean") || "Чистый пол" },
                { key: 'lightsOff', label: t("dashboard.checklist_lights") || "Свет выключен" },
                { key: 'doorLocked', label: t("dashboard.checklist_door") || "Дверь закрыта" },
                { key: 'cashClosed', label: t("dashboard.checklist_cash") || "Касса закрыта" },
                { key: 'ordersChecked', label: t("dashboard.checklist_orders_checked") || "Сверка заказов с кассой выполнена" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 bg-[var(--surface-1)] rounded-[12px] px-[18px] py-[14px] cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={checklist[item.key] || false}
                      onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all ${
                        checklist[item.key]
                          ? 'bg-gradient-to-br from-[#2dd07f] to-[#0ba95b] border-none shadow-[0_0_8px_rgba(0,255,180,0.5)]'
                          : 'border-2 border-white/25 bg-transparent'
                      }`}
                    >
                      {checklist[item.key] && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-white flex-1">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 mb-6">
            <h3 className="text-sm font-semibold text-white mb-2">
              {t("dashboard.shift_comment") || "Комментарий к смене"}
            </h3>
            <div className="bg-[var(--surface-1)] rounded-[14px] p-[18px] border border-[var(--border-strong)]">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder:text-[#7b7b7b]"
                placeholder={t("dashboard.shift_comment_placeholder") || "Опишите расхождения, проблемы или особые ситуации..."}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleDownloadReport}
                className="flex-1 py-3 px-4 bg-transparent text-[#999] rounded-lg hover:text-[#ccc] transition-colors font-medium flex items-center justify-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                {t("dashboard.btn_download_report") || "Скачать отчет"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-transparent text-[#999] rounded-lg hover:text-[#ccc] transition-colors font-medium text-sm"
              >
                {t("dashboard.back_to_shift") || "Вернуться к смене"}
              </button>
            </div>
            <button
              onClick={handleConfirmClose}
              disabled={!allChecklistChecked || isSubmitting}
              className="w-full h-[52px] bg-gradient-to-r from-[#0ba95b] to-[#2dd07f] text-white rounded-[14px] hover:from-[#0ba95b]/90 hover:to-[#2dd07f]/90 transition-all font-bold disabled:bg-[#444] disabled:text-[#777] disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ boxShadow: '0 0 20px rgba(0,255,180,0.4)' }}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  {t("dashboard.submitting") || "Отправка..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  {t("dashboard.confirm_close_shift") || "Подтвердить и завершить смену"}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

