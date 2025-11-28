"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Calendar } from "lucide-react";

import { Location } from "@/lib/store";

interface RevenueChartBlockProps {
  dayData: Array<{
    date: string;
    revenue: number;
    fullDate: string;
  }>;
  weekData: Array<{
    date: string;
    revenue: number;
    fullDate: string;
  }>;
  monthData: Array<{
    date: string;
    revenue: number;
    fullDate: string;
  }>;
  yearData: Array<{
    date: string;
    revenue: number;
    fullDate: string;
  }>;
  currency: string;
  totalPlan: number;
  locations: Location[];
}

export function RevenueChartBlock({
  dayData,
  weekData,
  monthData,
  yearData,
  currency,
  totalPlan,
  locations
}: RevenueChartBlockProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const dataMap = {
    day: dayData,
    week: weekData,
    month: monthData,
    year: yearData
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate plan data for current period
  const planData = useMemo(() => {
    const data = dataMap[period];
    if (period === 'day') {
      // For day, distribute plan across hours
      return data.map(() => totalPlan / 24);
    } else if (period === 'week') {
      // For week, daily plan
      return data.map(() => totalPlan);
    } else if (period === 'month') {
      // For month, daily plan
      return data.map(() => totalPlan);
    } else {
      // For year, monthly plan (sum of all locations)
      return data.map(() => totalPlan * 30); // Approximate monthly
    }
  }, [period, totalPlan, dataMap]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const date = new Date(e.target.value);
      setStartDate(date);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const date = new Date(e.target.value);
      setEndDate(date);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Выручка</h3>
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Calendar className="h-4 w-4" />
              {startDate && endDate 
                ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                : startDate 
                ? `${formatDate(startDate)} - ...`
                : 'Выбрать период'}
            </button>
            {showCalendar && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCalendar(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-lg shadow-xl p-4 space-y-3 min-w-[280px]">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">От</label>
                    <input
                      type="date"
                      onChange={handleStartDateChange}
                      value={startDate ? startDate.toISOString().split('T')[0] : ''}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">До</label>
                    <input
                      type="date"
                      onChange={handleEndDateChange}
                      value={endDate ? endDate.toISOString().split('T')[0] : ''}
                      min={startDate ? startDate.toISOString().split('T')[0] : undefined}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-4 h-9">
            <TabsTrigger value="day" className="text-xs">День</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">Неделя</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Месяц</TabsTrigger>
            <TabsTrigger value="year" className="text-xs">Год</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-4">
            <RevenueChart 
              data={dataMap[period]} 
              currency={currency}
              planData={planData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}


