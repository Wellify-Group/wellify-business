"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export const NavbarClock = () => {
  const { language } = useLanguage();
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    // Обновляем раз в минуту, секунды не нужны
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!mounted || !now) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="tabular-nums font-medium text-foreground">--:--</span>
        <span className="text-muted-foreground/60">---</span>
        <span className="hidden lg:inline text-muted-foreground/60 text-xs">---</span>
      </div>
    );
  }

  const localeMap: Record<string, string> = {
    ru: "ru-RU",
    ua: "uk-UA",
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

  // Форматируем дату согласно языку
  const formattedDate = now.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="tabular-nums font-medium text-foreground" suppressHydrationWarning>{time}</span>
      <span className="text-muted-foreground/60" suppressHydrationWarning>{weekday}</span>
      <span className="hidden lg:inline text-muted-foreground/60 text-xs" suppressHydrationWarning>{formattedDate}</span>
    </div>
  );
};















