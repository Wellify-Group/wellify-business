"use client";

import { usePathname } from "next/navigation";
import { Send } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const TELEGRAM_BOT_USERNAME = "wellifybusinesssupport_bot";

function getTelegramLink() {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}`;
}

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Если нужно, можно скрывать кнопку на части страниц
  // Сейчас показываем везде:
  const isHidden = false;

  if (isHidden) return null;

  return (
    <a
      href={getTelegramLink()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
      style={{
        background: "var(--color-brand, #2563eb)",
        boxShadow:
          "0 10px 30px rgba(15, 23, 42, 0.45)",
      }}
      aria-label="Написать в поддержку в Telegram"
    >
      <Send className="h-5 w-5 text-white" />
    </a>
  );
}
