"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

const TELEGRAM_BOT_URL = "https://t.me/wellifybusinesssupport_bot";

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  // Скрываем виджет на страницах дашборда
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const label = t("support.telegram_cta");
  const ariaLabel = t("support.btn_telegram");

  const handleClick = () => {
    window.open(TELEGRAM_BOT_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={ariaLabel}
      className="group fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full border-none outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand)]"
      style={{
        padding: 0,
        background: "transparent",
      }}
    >
      {/* Animated pill with text (desktop only) */}
      <motion.div
        className="hidden items-center rounded-full border px-4 py-2 text-sm font-medium overflow-hidden sm:flex"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border-subtle)",
          boxShadow: "var(--shadow-floating)",
          color: "var(--color-text-main)",
        }}
        initial={{ opacity: 0, x: 8, maxWidth: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : 8,
          maxWidth: isHovered ? 200 : 0,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <span className="whitespace-nowrap">{label}</span>
      </motion.div>

      {/* Circular button */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full transition-opacity hover:opacity-90"
        style={{
          background: "var(--color-brand)",
          boxShadow: "var(--shadow-floating)",
        }}
      >
        <Send className="h-5 w-5 text-white" />
      </div>
    </button>
  );
}
