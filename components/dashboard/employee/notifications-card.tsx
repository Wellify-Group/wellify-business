"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";
import { AlertCircle, Bell } from "lucide-react";

export function NotificationsCard() {
  const { t } = useLanguage();
  const { messages, currentUser, employees, markMessageAsRead } = useStore();

  // Get unread messages
  const unreadMessages = useMemo(() => {
    if (!currentUser) return [];

    return messages
      .filter((msg) => msg.toId === currentUser.id && (!msg.isRead || !msg.readAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Показываем только последние 5
  }, [messages, currentUser]);

  const unreadCount = unreadMessages.length;

  const handleMarkAsRead = (messageId: string) => {
    markMessageAsRead(messageId);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} час назад`;
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const getSenderName = (fromId: string) => {
    const sender = employees.find((e) => e.id === fromId);
    if (!sender) return "Неизвестно";
    if (sender.role === "director") return "Директор";
    if (sender.role === "manager") return "Менеджер";
    return sender.name || "Сотрудник";
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          {t("dashboard.notifications") || "Уведомления"}
        </h3>
        {unreadCount > 0 && (
          <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Notifications List */}
      {unreadCount > 0 ? (
        <div className="space-y-3">
          {unreadMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-l-4 border-amber-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {getSenderName(msg.fromId)}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-500 flex-shrink-0">
                  {getTimeAgo(msg.createdAt)}
                </span>
              </div>
              <p className="text-sm text-zinc-900 dark:text-white line-clamp-2">
                {msg.text}
              </p>
              {!msg.isRead && (
                <button
                  onClick={() => handleMarkAsRead(msg.id)}
                  className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t("dashboard.mark_as_read") || "Отметить как прочитанное"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <Bell className="h-6 w-6 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 dark:text-neutral-400">
            {t("dashboard.no_notifications") || "Нет новых уведомлений"}
          </p>
        </div>
      )}
    </div>
  );
}

