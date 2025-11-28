"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Clock, Camera, DollarSign, MapPin, User } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  const { shifts, employees, locations, currency } = useStore();

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => b.date - a.date);
  }, [shifts]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Лента активности
        </h1>
        <p className="text-sm text-muted-foreground">
          Все события и закрытые смены
        </p>
      </div>

      <div className="space-y-4">
        {sortedShifts.map(shift => {
          const employee = employees.find(e => e.id === shift.employeeId);
          const shiftRevenue = shift.revenueCash + shift.revenueCard;
          const hasPhoto = Array.isArray(shift.notes) 
            ? shift.notes.some(note => note.text?.toLowerCase().includes('photo'))
            : false;
          const assignedLocation = locations.find(loc => 
            employee?.assignedPointId === loc.id
          );

          return (
            <div
              key={shift.id}
              className={`p-4 sm:p-6 rounded-xl border transition-all ${
                shift.status === 'issue'
                  ? 'bg-rose-500/5 border-rose-500/20'
                  : 'bg-card border-border hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${
                  shift.status === 'issue' 
                    ? 'bg-rose-500/20 text-rose-500'
                    : 'bg-emerald-500/20 text-emerald-500'
                }`}>
                  {(employee?.name || shift.employeeName || '?')[0].toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link
                        href="/dashboard/director/staff"
                        className="text-base font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {employee?.name || shift.employeeName}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        закрыл смену
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(shift.date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(shift.date).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {assignedLocation && (
                    <Link
                      href={`/dashboard/director/locations/${assignedLocation.id}`}
                      className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs hover:bg-indigo-500/20 transition-colors"
                    >
                      <MapPin className="h-3 w-3" />
                      {assignedLocation.name}
                    </Link>
                  )}

                  {/* Photo Thumbnail */}
                  {hasPhoto && (
                    <div className="mb-3 p-2 bg-emerald-500/10 rounded-lg inline-flex items-center gap-2">
                      <Camera className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-emerald-500 font-medium whitespace-nowrap">Z-Report загружен</span>
                    </div>
                  )}

                  {/* Revenue */}
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-indigo-500" />
                    <span className="font-semibold text-foreground">
                      {shiftRevenue.toLocaleString('ru-RU')} {currency}
                    </span>
                    {shift.checkCount && (
                      <span className="text-muted-foreground">
                        • {shift.checkCount} чеков
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedShifts.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет активности</p>
        </div>
      )}
    </div>
  );
}










