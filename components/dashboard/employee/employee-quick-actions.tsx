"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore, { Order } from "@/lib/store";
import { ShoppingCart, AlertTriangle, Package } from "lucide-react";
import { OrderForm } from "./order-form";
import { ProblemReportModal } from "./problem-report-modal";

interface EmployeeQuickActionsProps {
  shiftStatus: 'idle' | 'active' | 'closed' | 'closing';
}

export function EmployeeQuickActions({ shiftStatus }: EmployeeQuickActionsProps) {
  const { t } = useLanguage();
  const { addOrder, currentShift, currentUser, savedLocationId } = useStore();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);

  const isDisabled = shiftStatus !== 'active';

  const handleOrderSubmit = (orderData: Omit<Order, 'id' | 'createdAt' | 'employeeId' | 'locationId' | 'shiftId'>) => {
    if (!currentShift || !currentUser || !savedLocationId) return;
    
    addOrder({
      ...orderData,
    });
    setShowOrderForm(false);
  };

  const handleProblem = () => {
    setShowProblemModal(true);
  };

  const handleWriteOff = () => {
    // TODO: Implement write-off
    console.log("Write-off");
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm h-full">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-5">
          {t("dashboard.quick_actions") || "Быстрые действия"}
        </h3>
        
        {/* Кнопки в одной строке, занимают всю ширину карточки */}
        <div className="grid grid-cols-3 gap-4">
          {/* Продажа - зелёная */}
          <button
            onClick={() => setShowOrderForm(true)}
            disabled={isDisabled}
            className={`w-full px-4 py-5 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              isDisabled
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{t("dashboard.sale") || "Продажа"}</span>
          </button>

          {/* Проблема - жёлтая/оранжевая */}
          <button
            onClick={handleProblem}
            disabled={isDisabled}
            className={`w-full px-4 py-5 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              isDisabled
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span>{t("dashboard.problem") || "Проблема"}</span>
          </button>

          {/* Списание - красная */}
          <button
            onClick={handleWriteOff}
            disabled={isDisabled}
            className={`w-full px-4 py-5 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              isDisabled
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                : 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm hover:shadow-md'
            }`}
          >
            <Package className="h-5 w-5" />
            <span>{t("dashboard.write_off") || "Списание"}</span>
          </button>
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <OrderForm
          order={null}
          onClose={() => setShowOrderForm(false)}
          onSubmit={handleOrderSubmit}
        />
      )}

      {/* Problem Report Modal */}
      <ProblemReportModal
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
      />
    </>
  );
}

