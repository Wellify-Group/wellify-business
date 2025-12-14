"use client";

import useStore from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { Sun, Cloud, CloudRain, Snowflake } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

export function WeatherWidget() {
  const { weather } = useStore();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const weatherIcon = useMemo(() => {
    switch (weather.condition) {
      case 'sunny':
        return <Sun className="h-4 w-4 text-orange-500" />;
      case 'cloudy':
        return <Cloud className="h-4 w-4 text-zinc-400" />;
      case 'rainy':
        return <CloudRain className="h-4 w-4 text-blue-400" />;
      case 'snow':
        return <Snowflake className="h-4 w-4 text-blue-300" />;
      default:
        return <Sun className="h-4 w-4 text-orange-500" />;
    }
  }, [weather.condition]);

  const weatherLabel = useMemo(() => {
    const condition = weather.condition === 'rainy' ? 'rain' : weather.condition;
    return t(`dashboard.weather_${condition}`) || weather.condition;
  }, [weather.condition, t]);

  // Prevent hydration mismatch by not rendering temperature until mounted
  if (!mounted) {
    return (
      <div className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
        <div className="w-4 h-4 flex items-center justify-center">
          {weatherIcon}
        </div>
        <span className="tabular-nums">--°C</span>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
      <div className="w-4 h-4 flex items-center justify-center">
        {weatherIcon}
      </div>
      <span className="tabular-nums" suppressHydrationWarning>{weather.temp}°C</span>
    </div>
  );
}





