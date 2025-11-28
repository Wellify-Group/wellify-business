"use client";

import { useEffect, useState } from "react";

export const NavbarClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Обновляем раз в минуту, секунды не нужны
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // "пн.", "вт." → "Пн"
  const weekdayRaw = now.toLocaleDateString("ru-RU", { weekday: "short" });
  const weekday =
    weekdayRaw.charAt(0).toUpperCase() +
    weekdayRaw.slice(1).replace(".", "").slice(0, 2);

  return (
    <div className="navbar-clock">
      <span className="navbar-clock__time">{time}</span>
      <span className="navbar-clock__dot">•</span>
      <span className="navbar-clock__weekday">{weekday}</span>
    </div>
  );
};















