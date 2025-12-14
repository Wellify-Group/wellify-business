"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { ChevronRight, AlertTriangle, Circle } from "lucide-react";

// Тип данных для строки таблицы (то, что ты собираешь в DirectorDashboard)
export interface LocationShiftData {
  locationId: string;
  locationName: string;
  shiftStatus: "open" | "closed" | "not-opened";
  shiftTime?: string;
  managerName?: string;
  managerStatus?: "on-shift" | "not-assigned";
  revenue: number;
  plan: number;
  planPercent: number;
  activity: "normal" | "low" | "suspicious";
  tasksStats:
    | {
        completed: number;
        total: number;
        completionPercent: number;
      }
    | null;
  activeShiftId?: string;
}

interface LocationsShiftsTableProps {
  data: LocationShiftData[];
  currency: string;
}

export function LocationsShiftsTable({
  data,
  currency,
}: LocationsShiftsTableProps) {
  const router = useRouter();
  const { t, language } = useLanguage();

  const formatCurrency = (value: number) =>
    value.toLocaleString(language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const getShiftStatusLabel = (status: LocationShiftData["shiftStatus"]) => {
    switch (status) {
      case "open":
        return t("dashboard.shift_status_open") || "Смена открыта";
      case "closed":
        return t("dashboard.shift_status_closed") || "Смена закрыта";
      case "not-opened":
      default:
        return t("dashboard.shift_status_not_opened") || "Смена не открыта";
    }
  };

  const getShiftStatusBadgeClass = (
    status: LocationShiftData["shiftStatus"],
  ) => {
    switch (status) {
      case "open":
        return "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border-[color:var(--color-success)]/30";
      case "closed":
        return "bg-muted/50 text-muted-foreground border-border/50";
      case "not-opened":
      default:
        return "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30";
    }
  };

  const getActivityDotClass = (activity: LocationShiftData["activity"]) => {
    switch (activity) {
      case "normal":
        return "text-[color:var(--color-success)]";
      case "low":
        return "text-[color:var(--color-warning)]";
      case "suspicious":
      default:
        return "text-[color:var(--color-danger)]";
    }
  };

  const getActivityLabel = (activity: LocationShiftData["activity"]) => {
    switch (activity) {
      case "normal":
        return t("dashboard.activity_normal") || "Нормальная активность";
      case "low":
        return t("dashboard.activity_low") || "Низкая активность";
      case "suspicious":
      default:
        return t("dashboard.activity_suspicious") || "Подозрительная активность";
    }
  };

  const handleRowClick = (row: LocationShiftData) => {
    // Клик по строке ведёт на страницу точки
    router.push(`/dashboard/director/locations/${row.locationId}`);
  };

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("dashboard.table_locations_shifts") || "Точки и смены сегодня"}
          </h2>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          {t("dashboard.table_locations_count") || "Точек"}: {data.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--surface-2)]/80">
            <tr className="text-xs text-[var(--text-tertiary)]">
              <th className="px-4 py-2 text-left font-medium">
                {t("dashboard.col_location") || "Точка"}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("dashboard.col_manager") || "Менеджер"}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("dashboard.col_shift") || "Смена"}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t("dashboard.col_revenue") || "Выручка"}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t("dashboard.col_plan") || "План, %"}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("dashboard.col_activity") || "Активность"}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t("dashboard.col_tasks") || "Задачи смены"}
              </th>
              <th className="px-4 py-2" />
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-xs text-muted-foreground"
                >
                  {t("dashboard.no_locations_today") ||
                    "На сегодня нет активных точек или смен."}
                </td>
              </tr>
            )}

            {data.map((row) => (
              <tr
                key={row.locationId}
                className="group cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleRowClick(row)}
              >
                {/* Точка */}
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {row.locationName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ID: {row.locationId}
                    </span>
                  </div>
                </td>

                {/* Менеджер */}
                <td className="px-4 py-3 align-top">
                  {row.managerName ? (
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {row.managerName}
                      </span>
                      {row.managerStatus && (
                        <span className="text-xs text-muted-foreground">
                          {row.managerStatus === "on-shift"
                            ? t("dashboard.manager_on_shift") || "На смене"
                            : t("dashboard.manager_not_assigned") ||
                              "Не на смене"}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-[color:var(--color-warning)]">
                      <AlertTriangle className="h-3 w-3" />
                      <span>
                        {t("dashboard.no_manager_short") || "Менеджер не назначен"}
                      </span>
                    </div>
                  )}
                </td>

                {/* Статус смены */}
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        getShiftStatusBadgeClass(row.shiftStatus),
                      ].join(" ")}
                    >
                      {getShiftStatusLabel(row.shiftStatus)}
                    </span>
                    {row.shiftTime && (
                      <span className="text-xs text-muted-foreground">
                        {row.shiftTime}
                      </span>
                    )}
                  </div>
                </td>

                {/* Выручка */}
                <td className="px-4 py-3 align-top text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(row.revenue)} {currency}
                    </span>
                    {row.plan > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {t("dashboard.plan_short") || "план"}:{" "}
                        {formatCurrency(row.plan)} {currency}
                      </span>
                    )}
                  </div>
                </td>

                {/* Выполнение плана */}
                <td className="px-4 py-3 align-top text-right">
                  {row.plan > 0 ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {row.planPercent}%
                      </span>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.planPercent >= 95
                              ? "bg-[color:var(--color-success)]"
                              : row.planPercent >= 70
                              ? "bg-[color:var(--color-warning)]"
                              : "bg-[color:var(--color-danger)]"
                          }`}
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, row.planPercent),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("dashboard.no_plan") || "План не задан"}
                    </span>
                  )}
                </td>

                {/* Активность */}
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2 text-xs">
                    <Circle className={`h-2.5 w-2.5 ${getActivityDotClass(row.activity)}`} />
                    <span className="text-muted-foreground">
                      {getActivityLabel(row.activity)}
                    </span>
                  </div>
                </td>

                {/* Задачи смены */}
                <td className="px-4 py-3 align-top">
                  {row.tasksStats ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        {t("dashboard.tasks_completed") || "Выполнено"}:{" "}
                        {row.tasksStats.completed}/{row.tasksStats.total}
                      </span>
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, row.tasksStats.completionPercent),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("dashboard.no_tasks_stats") ||
                        "Нет данных по задачам смены"}
                    </span>
                  )}
                </td>

                {/* Стрелка */}
                <td className="px-3 py-3 align-top text-right">
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// На всякий случай даём и default-экспорт,
// чтобы не сломать старые импорты, если где-то они были.
export default LocationsShiftsTable;
