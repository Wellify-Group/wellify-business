"use client";

import { usePathname } from "next/navigation";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { appConfig } from "@/lib/config/appConfig";

const collapsedWidth = 48;
const expandedWidth = 210;

const buttonVariants = {
  collapsed: {
    width: collapsedWidth,
    paddingLeft: 0,
    paddingRight: 0,
  },
  expanded: {
    width: expandedWidth,
    paddingLeft: 16,
    paddingRight: 16,
  },
};

const iconVariants = {
  collapsed: {
    opacity: 1,
    scale: 1,
  },
  expanded: {
    opacity: 0,
    scale: 0.7,
  },
};

const textVariants = {
  collapsed: {
    opacity: 0,
    x: 8,
  },
  expanded: {
    opacity: 1,
    x: 0,
  },
};

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Скрываем виджет на страницах дашборда и на странице подтверждения email
  if (pathname?.startsWith("/dashboard") || pathname === "/auth/email-confirmed") {
    return null;
  }

  const label = t("support.telegram_cta");
  const ariaLabel = t("support.btn_telegram");

  const handleClick = () => {
    const telegramBotUrl = `https://t.me/${appConfig.telegramBotUsername}`;
    window.open(telegramBotUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className="fixed bottom-6 right-10 z-[9999] flex h-12 items-center justify-center rounded-full border-none outline-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand)]"
      style={{
        background: "var(--color-brand)",
        boxShadow: "var(--shadow-floating)",
        color: "white",
        transformOrigin: "right center",
      }}
      initial="collapsed"
      whileHover="expanded"
      whileFocus="expanded"
      variants={buttonVariants}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        mass: 0.8,
      }}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Icon */}
        <motion.span
          variants={iconVariants}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          className="absolute flex items-center justify-center"
          style={{
            pointerEvents: "none",
          }}
        >
          <Send className="h-5 w-5" />
        </motion.span>

        {/* Text label */}
        <motion.span
          variants={textVariants}
          transition={{
            duration: 0.2,
            ease: "easeOut",
          }}
          className="absolute text-sm font-medium whitespace-nowrap"
          style={{
            pointerEvents: "none",
          }}
        >
          {label}
        </motion.span>
      </div>
    </motion.button>
  );
}
