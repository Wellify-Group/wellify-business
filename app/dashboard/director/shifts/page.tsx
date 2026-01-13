"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { FileText, Calendar, DollarSign, Users, AlertTriangle, CheckCircle2, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShiftsPage() {
  const { t } = useLanguage();
  const { shifts, employees, currency, locations } = useStore();
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");

  // Фильтруем смены по выбранной локации
  const filteredShifts = useMemo(() => {
    let filtered = [...shifts];
    
    if (selectedLocationId !== "all") {
      filtered = filtered.filter(shift => shift.locationId === selectedLocationId);
    }
    
    return filtered.sort((a, b) => b.date - a.date);
  }, [shifts, selectedLocationId]);

  // Группируем смены по локациям для общего обзора
  const shiftsByLocation = useMemo(() => {
    const grouped: Record<string, typeof shifts> = {};
    
    shifts.forEach(shift => {
      const locationId = shift.locationId || "unknown";
      if (!grouped[locationId]) {
        grouped[locationId] = [];
      }
      grouped[locationId].push(shift);
    });
    
    return grouped;
  }, [shifts]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getShiftRevenue = (shift: typeof shifts[0]) => {
    return shift.revenueCash + shift.revenueCard;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Location Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.nav_shifts")}
          </p>
          
          {/* Location Filter */}
          <div className="relative">
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-10 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[180px]"
            >
              <option value="all">Вся сеть</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Stats Summary - показываем общую статистику или по выбранной локации */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card p-4 sm:p-6 border border-border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              <span className="text-sm text-muted-foreground">
                {selectedLocationId === "all" ? "Всего смен" : "Смен в точке"}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{filteredShifts.length}</p>
          </div>
          <div className="bg-card p-4 sm:p-6 border border-border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-muted-foreground">
                {selectedLocationId === "all" ? "Общая выручка" : "Выручка точки"}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {filteredShifts.reduce((acc, s) => acc + getShiftRevenue(s), 0).toLocaleString('ru-RU')} {currency}
            </p>
          </div>
          <div className="bg-card p-4 sm:p-6 border border-border rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span className="text-sm text-muted-foreground">Проблемные смены</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {filteredShifts.filter(s => s.status === 'issue').length}
            </p>
          </div>
        </div>

        {/* Если выбрана конкретная локация, показываем детали по ней */}
        {selectedLocationId !== "all" && (
          <div className="bg-card p-4 border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {locations.find(l => l.id === selectedLocationId)?.name || "Неизвестная локация"}
              </span>
            </div>
          </div>
        )}

        {/* Shifts List */}
        <div className="space-y-4">
          {filteredShifts.map((shift) => {
            const employee = employees.find(e => e.id === shift.employeeId);
            const revenue = getShiftRevenue(shift);

            return (
              <div
                key={shift.id}
                className={`bg-card p-4 sm:p-6 border rounded-xl shadow-sm transition-colors ${
                  shift.status === 'issue'
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : 'border-border hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {shift.status === 'issue' ? (
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground">
                          {employee?.name || shift.employeeName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(shift.date)}
                          </p>
                          {shift.locationId && selectedLocationId === "all" && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {locations.find(l => l.id === shift.locationId)?.name || "Неизвестная локация"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Наличные</p>
                        <p className="text-sm font-semibold text-foreground">
                          {shift.revenueCash.toLocaleString('ru-RU')} {currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Карта</p>
                        <p className="text-sm font-semibold text-foreground">
                          {shift.revenueCard.toLocaleString('ru-RU')} {currency}
                        </p>
                      </div>
                      {shift.guestCount !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Гости</p>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {shift.guestCount}
                          </p>
                        </div>
                      )}
                      {shift.checkCount !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Чеков</p>
                          <p className="text-sm font-semibold text-foreground">
                            {shift.checkCount}
                          </p>
                        </div>
                      )}
                    </div>

                    {shift.status === 'issue' && shift.anomalies.length > 0 && (
                      <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                        <p className="text-xs font-semibold text-rose-500 mb-1">Обнаружены проблемы:</p>
                        <ul className="text-xs text-rose-400 space-y-1">
                          {shift.anomalies.map((anomaly, idx) => (
                            <li key={idx}>• {anomaly}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs text-muted-foreground mb-1">Итого</p>
                    <p className="text-xl font-bold text-foreground">
                      {revenue.toLocaleString('ru-RU')} {currency}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredShifts.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {selectedLocationId === "all" 
                ? "Нет зарегистрированных смен" 
                : "Нет смен для выбранной точки"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

