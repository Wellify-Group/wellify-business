"use client";

import { useMemo } from "react";
import useStore from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { X, Clock, DollarSign, Camera, FileText, MessageCircle, MapPin, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { downloadShiftReport } from "@/lib/shift-pdf-generator";

interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: number; // Timestamp
  locationId?: string | null;
}

// Extended shift data with time tracking (mock data for demo)
interface ExtendedShift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: number;
  revenueCash: number;
  revenueCard: number;
  guestCount?: number;
  checkCount?: number;
  status: 'ok' | 'issue';
  anomalies: string[];
  notes?: { text: string; time: string; }[];
  // Extended fields (mock data)
  startTime?: { actual: string; planned: string };
  endTime?: { actual: string; planned: string };
  zReportPhoto?: string;
  pointPhoto?: string;
}

export function ShiftDetailsModal({ isOpen, onClose, selectedDate, locationId }: ShiftDetailsModalProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { shifts, employees, locations, currency, openMessageComposer } = useStore();

  // Find shifts for the selected date
  const dayShifts = useMemo(() => {
    const date = new Date(selectedDate);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(date.setHours(23, 59, 59, 999)).getTime();

    let filteredShifts = shifts.filter(
      shift => shift.date >= startOfDay && shift.date <= endOfDay
    );

    // Filter by location if provided
    if (locationId) {
      filteredShifts = filteredShifts.filter(shift => {
        const employee = employees.find(e => e.id === shift.employeeId);
        return employee?.assignedPointId === locationId;
      });
    }

    // Add mock time tracking data
    return filteredShifts.map(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      
      // Generate mock time data based on shift date
      const shiftDate = new Date(shift.date);
      const plannedStart = new Date(shiftDate);
      plannedStart.setHours(9, 0, 0);
      const actualStart = new Date(plannedStart);
      actualStart.setMinutes(actualStart.getMinutes() - 5); // 5 minutes early

      const plannedEnd = new Date(shiftDate);
      plannedEnd.setHours(21, 0, 0);
      const actualEnd = new Date(plannedEnd);
      actualEnd.setMinutes(actualEnd.getMinutes() - 10); // 10 minutes early

      return {
        ...shift,
        startTime: {
          actual: actualStart.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          planned: plannedStart.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        },
        endTime: {
          actual: actualEnd.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          planned: plannedEnd.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        },
        zReportPhoto: shift.notes?.some(n => n.text.includes('photo')) ? '/api/placeholder/300/200' : undefined,
        pointPhoto: '/api/placeholder/300/200'
      } as ExtendedShift;
    });
  }, [shifts, selectedDate, locationId, employees]);

  // Get location name
  const location = useMemo(() => {
    if (locationId) {
      return locations.find(loc => loc.id === locationId);
    }
    // If no location specified, try to get from first shift's employee
    if (dayShifts.length > 0) {
      const firstShift = dayShifts[0];
      const employee = employees.find(e => e.id === firstShift.employeeId);
      if (employee?.assignedPointId) {
        return locations.find(loc => loc.id === employee.assignedPointId);
      }
    }
    return null;
  }, [locationId, locations, dayShifts, employees]);

  // Format date
  const formattedDate = useMemo(() => {
    const date = new Date(selectedDate);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [selectedDate]);

  // Get time status badge
  const getTimeStatus = (actual: string, planned: string) => {
    const [actualHours, actualMinutes] = actual.split(':').map(Number);
    const [plannedHours, plannedMinutes] = planned.split(':').map(Number);
    const actualTime = actualHours * 60 + actualMinutes;
    const plannedTime = plannedHours * 60 + plannedMinutes;
    const diff = actualTime - plannedTime;

    if (Math.abs(diff) <= 5) {
      return { label: 'Вовремя', color: 'bg-emerald-500/20 text-emerald-500' };
    } else if (diff < 0) {
      return { label: 'Опоздание', color: 'bg-rose-500/20 text-rose-500' };
    } else {
      return { label: 'Ранний приход', color: 'bg-blue-500/20 text-blue-500' };
    }
  };

  const getEndTimeStatus = (actual: string, planned: string) => {
    const [actualHours, actualMinutes] = actual.split(':').map(Number);
    const [plannedHours, plannedMinutes] = planned.split(':').map(Number);
    const actualTime = actualHours * 60 + actualMinutes;
    const plannedTime = plannedHours * 60 + plannedMinutes;
    const diff = actualTime - plannedTime;

    if (Math.abs(diff) <= 5) {
      return { label: 'Вовремя', color: 'bg-emerald-500/20 text-emerald-500' };
    } else if (diff < 0) {
      return { label: 'Ранний уход', color: 'bg-rose-500/20 text-rose-500' };
    } else {
      return { label: 'Задержка', color: 'bg-blue-500/20 text-blue-500' };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {formattedDate}
              </h2>
              {location && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{location.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Download PDF Button */}
              {dayShifts.length > 0 && (
                <button
                  onClick={() => {
                    // Download PDF for the first shift (or all shifts if needed)
                    const firstShift = dayShifts[0];
                    const employee = employees.find(e => e.id === firstShift.employeeId);
                    downloadShiftReport({
                      shift: firstShift,
                      location: location || null,
                      employee: employee || null,
                      currency
                    });
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Скачать PDF"
                >
                  <Download className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {dayShifts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Нет смен за этот день</p>
              </div>
            ) : (
              dayShifts.map((shift) => {
                const employee = employees.find(e => e.id === shift.employeeId);
                const totalRevenue = shift.revenueCash + shift.revenueCard;
                const startStatus = shift.startTime ? getTimeStatus(shift.startTime.actual, shift.startTime.planned) : null;
                const endStatus = shift.endTime ? getEndTimeStatus(shift.endTime.actual, shift.endTime.planned) : null;

                return (
                  <div
                    key={shift.id}
                    className={`p-5 rounded-xl border ${
                      shift.status === 'issue'
                        ? 'border-rose-500/50 bg-rose-500/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    {/* Employee Info */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${
                        shift.status === 'issue'
                          ? 'bg-rose-500/20 text-rose-500'
                          : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {(employee?.name || shift.employeeName || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {employee?.name || shift.employeeName}
                        </h3>
                        {employee?.jobTitle && (
                          <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
                        )}
                      </div>
                      {shift.status === 'issue' ? (
                        <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>

                    {/* Time Tracking */}
                    <div className="space-y-3 mb-5">
                      {shift.startTime && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <span className="text-emerald-500 text-sm">🟢</span>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Начало смены</p>
                              <p className="text-base font-semibold text-foreground">
                                {shift.startTime.actual} <span className="text-muted-foreground text-sm font-normal">(План: {shift.startTime.planned})</span>
                              </p>
                            </div>
                          </div>
                          {startStatus && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${startStatus.color}`}>
                              {startStatus.label}
                            </span>
                          )}
                        </div>
                      )}

                      {shift.endTime && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                              <span className="text-rose-500 text-sm">🔴</span>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Окончание смены</p>
                              <p className="text-base font-semibold text-foreground">
                                {shift.endTime.actual} <span className="text-muted-foreground text-sm font-normal">(План: {shift.endTime.planned})</span>
                              </p>
                            </div>
                          </div>
                          {endStatus && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${endStatus.color}`}>
                              {endStatus.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Financials */}
                    <div className="mb-5 p-4 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-semibold text-foreground">Финансы</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Наличные</p>
                          <p className="text-base font-semibold text-foreground">
                            {shift.revenueCash.toLocaleString('ru-RU')} {currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Карта</p>
                          <p className="text-base font-semibold text-foreground">
                            {shift.revenueCard.toLocaleString('ru-RU')} {currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Итого</p>
                          <p className="text-lg font-bold text-foreground">
                            {totalRevenue.toLocaleString('ru-RU')} {currency}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Evidence Photos */}
                    {(shift.zReportPhoto || shift.pointPhoto) && (
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-sm font-semibold text-foreground">Доказательства</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {shift.zReportPhoto && (
                            <div className="relative group">
                              <div className="aspect-video rounded-lg bg-muted overflow-hidden border border-border">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                  <FileText className="h-8 w-8 text-indigo-400" />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-center">Z-Отчет</p>
                            </div>
                          )}
                          {shift.pointPhoto && (
                            <div className="relative group">
                              <div className="aspect-video rounded-lg bg-muted overflow-hidden border border-border">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                                  <Camera className="h-8 w-8 text-emerald-400" />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-center">Фото точки</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Anomalies */}
                    {shift.anomalies.length > 0 && (
                      <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <p className="text-xs font-semibold text-rose-500 mb-2">Аномалии:</p>
                        <ul className="space-y-1">
                          {shift.anomalies.map((anomaly, idx) => (
                            <li key={idx} className="text-sm text-rose-400">• {anomaly}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button
                        onClick={() => {
                          downloadShiftReport({
                            shift,
                            location: location || null,
                            employee: employee || null,
                            currency
                          });
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors font-medium"
                        title="Скачать PDF"
                      >
                        <Download className="h-4 w-4" />
                        <span>Скачать PDF</span>
                      </button>
                      <Link
                        href={`/dashboard/director/shifts?shiftId=${shift.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Полный отчёт</span>
                      </Link>
                      <button
                        onClick={() => {
                          openMessageComposer(shift.employeeId);
                          onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors font-medium"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Написать</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}







