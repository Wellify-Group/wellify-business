"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Language } from "@/lib/translations";
import { useLanguage } from "@/components/language-provider";
import { useInterfaceLanguageStore } from "@/lib/store/interfaceLanguageStore";
import { cn } from "@/lib/utils";

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ua", label: "UA" },
  { code: "ru", label: "RU" },
];

// Маппинг между старым типом Language и интерфейсным языком
const languageToInterfaceLang: Record<Language, "en" | "ru" | "uk"> = {
  en: "en",
  ua: "uk",
  ru: "ru",
};

interface LanguageSwitcherProps {
  variant?: "default" | "compact";
}

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const { setLang: setInterfaceLang } = useInterfaceLanguageStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // При первом рендере тоже синхронизируем стор интерфейсного языка
  useEffect(() => {
    setInterfaceLang(languageToInterfaceLang[language]);
  }, [language, setInterfaceLang]);

  const currentLang = languages.find((lang) => lang.code === language);
  const isCompact = variant === "compact";

  const handleChangeLanguage = (code: Language) => {
    if (language !== code) {
      setLanguage(code); // старый провайдер
      setInterfaceLang(languageToInterfaceLang[code]); // стор welcome/футера
      router.refresh();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={isCompact ? undefined : { scale: 1.05 }}
        whileTap={isCompact ? undefined : { scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center transition-colors",
          isCompact
            ? "h-8 w-8 flex items-center justify-center p-1.5 text-xs font-medium text-zinc-500 dark:text-[#c7d2fe] hover:opacity-70 transition-opacity"
            : "h-9 gap-2 rounded-lg border border-border bg-card/80 px-3 backdrop-blur-sm hover:bg-muted"
        )}
        aria-label="Change language"
      >
        {isCompact ? (
          <span className="text-xs font-medium text-slate-700 dark:text-[#c7d2fe]">
            {currentLang?.label}
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground">
            {currentLang?.label}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 z-[70] min-w-[140px] rounded-2xl border border-border/70 bg-card p-2 shadow-2xl ring-1 ring-black/5"
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleChangeLanguage(lang.code);
                }}
                className={`w-full rounded-xl px-4 py-2 text-left text-sm font-medium transition-colors ${
                  language === lang.code
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {lang.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}