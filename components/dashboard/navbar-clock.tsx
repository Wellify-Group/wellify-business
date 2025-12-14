"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export const NavbarClock = () => {
  const { language } = useLanguage();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Обновляем раз в минуту, секунды не нужны
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const localeMap: Record<string, string> = {
    ru: "ru-RU",
    ua: "uk-UA",
    uk: "uk-UA",
    en: "en-US",
  };

  const locale = localeMap[language] || "ru-RU";

  const time = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // "пн.", "вт." → "Пн"
  const weekdayRaw = now.toLocaleDateString(locale, { weekday: "short" });
  const weekday =
    weekdayRaw.charAt(0).toUpperCase() +
    weekdayRaw.slice(1).replace(".", "").slice(0, 2);

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
      <span className="tabular-nums">{time}</span>
      <span className="text-[var(--text-tertiary)]">•</span>
      <span className="text-[var(--text-secondary)]">{weekday}</span>
    </div>
  );
};















