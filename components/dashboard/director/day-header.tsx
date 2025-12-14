"use client";
import { useState } from "react";
import useStore from "@/lib/store";
import { ChevronDown } from "lucide-react";

export function DayHeader() {
  const { locations, currentUser } = useStore();
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("today");

  const date = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const hasLocations = locations.length > 0;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border/50">
      <div>
        <p className={cn(
          "text-sm",
          hasLocations ? "text-muted-foreground" : "text-muted-foreground/60"
        )}>{date}</p>
      </div>
      
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

