"use client";
import { useState, useEffect, useMemo } from "react";
import useStore from "@/lib/store";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function DayHeader() {
  const { locations, currentUser } = useStore();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const date = useMemo(() => {
    if (typeof window === 'undefined' || !mounted) return '';
    return new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [mounted]);

  const hasLocations = Array.isArray(locations) && locations.length > 0;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border/50">
      {/* Дата убрана - она уже отображается в навбаре */}
      
      {/* Location selector */}
      {hasLocations ? (
        <div className="relative">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Вся сеть</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      ) : (
        <div className="relative opacity-50 cursor-not-allowed">
          <select
            disabled
            value="all"
            className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-muted-foreground/60"
          >
            <option value="all">Вся сеть</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
        </div>
      )}

      {/* Period selector */}
      {hasLocations ? (
        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="today">Сегодня</option>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      ) : (
        <div className="relative opacity-50 cursor-not-allowed">
          <select
            disabled
            value="today"
            className="appearance-none bg-card border border-border rounded-lg px-3 py-1.5 pr-8 text-sm text-muted-foreground/60"
          >
            <option value="today">Сегодня</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
        </div>
      )}
    </div>
  );
}

