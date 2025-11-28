"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LocationShiftData {
  locationId: string;
  locationName: string;
  shiftStatus: 'open' | 'closed' | 'not-opened';
  shiftTime?: string;
  managerName?: string;
  managerStatus?: 'on-shift' | 'not-assigned';
  revenue: number;
  plan: number;
  planPercent: number;
  activity: 'normal' | 'low' | 'suspicious';
  tasksStats?: {
    completed: number;
    total: number;
    completionPercent: number;
  } | null;
  activeShiftId?: string;
}

interface LocationsShiftsTableProps {
  data: LocationShiftData[];
  currency: string;
}

export function LocationsShiftsTable({ data, currency }: LocationsShiftsTableProps) {
  const getActivityIndicator = (activity: string) => {
    switch (activity) {
      case 'normal':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-amber-500" />;
      case 'suspicious':
        return <Minus className="h-4 w-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (activity: string) => {
    switch (activity) {
      case 'normal':
        return 'Норма';
      case 'low':
        return 'Низкая';
      case 'suspicious':
        return 'Подозрительная';
      default:
        return '-';
    }
  };

  return (
    <Card className="p-3">
      <h3 className="text-lg font-semibold text-foreground mb-3">Точки и смены</h3>
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="py-2 text-xs font-semibold">Точка</TableHead>
            <TableHead className="py-2 text-xs font-semibold">Смена</TableHead>
            <TableHead className="py-2 text-xs font-semibold">Менеджер</TableHead>
            <TableHead className="py-2 text-xs font-semibold">Выручка / План</TableHead>
            <TableHead className="py-2 text-xs font-semibold">Задачи</TableHead>
            <TableHead className="py-2 text-xs font-semibold">Активность</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Нет данных о точках
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={row.locationId} className="hover:bg-muted/50">
                <TableCell className="py-2">
                  <Link
                    href={`/dashboard/director/locations/${row.locationId}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{row.locationName}</span>
                  </Link>
                </TableCell>
                <TableCell className="py-2">
                  {row.shiftStatus === 'open' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-xs">Открыта</Badge>
                      {row.shiftTime && (
                        <span className="text-xs text-muted-foreground">{row.shiftTime}</span>
                      )}
                    </div>
                  )}
                  {row.shiftStatus === 'closed' && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Закрыта</Badge>
                      {row.shiftTime && (
                        <span className="text-xs text-muted-foreground">{row.shiftTime}</span>
                      )}
                    </div>
                  )}
                  {row.shiftStatus === 'not-opened' && (
                    <Badge variant="error" className="text-xs">Смена не открыта</Badge>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  {row.managerName ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{row.managerName}</span>
                      {row.managerStatus === 'on-shift' && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                      {row.managerStatus === 'not-assigned' && (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      <span className="text-sm text-rose-500 font-medium">Не назначен</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <div className="space-y-1.5 min-w-[120px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {row.revenue.toLocaleString('ru-RU')} {currency}
                      </span>
                      <span className="text-muted-foreground">
                        / {row.plan.toLocaleString('ru-RU')} {currency}
                      </span>
                    </div>
                    <Progress value={row.planPercent} />
                    <div className="text-xs text-muted-foreground">
                      {row.planPercent}%
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  {row.tasksStats && row.tasksStats.total > 0 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {row.tasksStats.completed} из {row.tasksStats.total} ({row.tasksStats.completionPercent}%)
                      </span>
                    </div>
                  ) : row.shiftStatus === 'open' ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : null}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    {getActivityIndicator(row.activity)}
                    <span className="text-sm text-muted-foreground">
                      {getActivityLabel(row.activity)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </Card>
  );
}


