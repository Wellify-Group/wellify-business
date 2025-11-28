"use client";

import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function ImportantNotificationCard() {
  const { t } = useLanguage();

  // TODO: Загружать реальные уведомления из API/store
  const notification = {
    text: "Проверка через час",
    isImportant: true,
  };

  if (!notification) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
            {t("dashboard.important_notification") || "ВАЖНОЕ УВЕДОМЛЕНИЕ !"}
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {notification.text}
          </p>
        </div>
      </div>
    </div>
  );
}










