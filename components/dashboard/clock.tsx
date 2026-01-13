"use client";

import { useEffect, useState } from "react";

export const Clock = () => {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted || !time) {
    return (
      <span 
        className="text-xs font-mono text-muted-foreground mr-4"
        suppressHydrationWarning
      >
        --:--:--
      </span>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <span 
      className="text-xs font-mono text-muted-foreground mr-4"
      suppressHydrationWarning
    >
      {formatTime(time)}
    </span>
  );
};















