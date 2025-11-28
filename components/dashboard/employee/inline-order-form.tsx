"use client";

import { useState, KeyboardEvent } from "react";
import { useLanguage } from "@/components/language-provider";
import { Order } from "@/lib/store";
import { Plus } from "lucide-react";

interface InlineOrderFormProps {
  onSubmit: (orderData: Omit<Order, 'id' | 'createdAt' | 'employeeId' | 'locationId' | 'shiftId'>) => void;
}

export function InlineOrderForm({ onSubmit }: InlineOrderFormProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<Order['paymentType']>('card');

  const handleSubmit = () => {
    const amountNum = parseFloat(amount.replace(",", "."));
    if (!amount || amountNum <= 0) return;

    onSubmit({
      orderType: 'hall',
      paymentType,
      amount: amountNum,
      guestsCount: 1,
    });

    // Сброс формы
    setAmount("");
    setPaymentType('card');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
        {t("dashboard.new_order_input") || "ВВОД НОВОГО ЗАКАЗА"}
      </h3>

      <div className="space-y-3">
        {/* Поле суммы */}
        <div>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
              setAmount(val);
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-xl font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="1 250 ₴"
          />
        </div>

        {/* Выбор способа оплаты */}
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentType('cash')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              paymentType === 'cash'
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {t("dashboard.payment_cash") || "Наличные"}
          </button>
          <button
            onClick={() => setPaymentType('card')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors ${
              paymentType === 'card'
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {t("dashboard.payment_card") || "Карта"}
          </button>
        </div>

        {/* Кнопка добавления */}
        <button
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount.replace(",", ".")) <= 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("dashboard.add_order") || "ДОБАВИТЬ ЗАКАЗ (ENTER)"}
        </button>
      </div>
    </div>
  );
}










