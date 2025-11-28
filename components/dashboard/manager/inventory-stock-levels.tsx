"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";
import { IngredientStockLevel, IngredientUnit } from "@/lib/store";
import { cn } from "@/lib/utils";

interface InventoryStockLevelsProps {
  companyId: string;
  pointId: string;
  daysForAverage?: number;
}

export function InventoryStockLevels({
  companyId,
  pointId,
  daysForAverage = 7,
}: InventoryStockLevelsProps) {
  const [levels, setLevels] = useState<IngredientStockLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStockLevels();
  }, [companyId, pointId, daysForAverage]);

  const loadStockLevels = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ingredients/stock-levels?companyId=${companyId}&pointId=${pointId}&days=${daysForAverage}`
      );
      const data = await response.json();
      
      if (data.success) {
        setLevels(data.levels);
      }
    } catch (err) {
      console.error("Error loading stock levels:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatUnit = (unit: IngredientUnit): string => {
    const units: Record<IngredientUnit, string> = {
      g: 'г',
      kg: 'кг',
      ml: 'мл',
      l: 'л',
      pcs: 'шт',
    };
    return units[unit] || unit;
  };

  const formatDaysLeft = (daysLeft: number | null): string => {
    if (daysLeft === null || daysLeft === Infinity) {
      return "∞";
    }
    if (daysLeft < 1) {
      return "< 1 дня";
    }
    return `${daysLeft.toFixed(1)} дн.`;
  };

  const criticalItems = levels.filter(l => l.status === 'critical');
  const lowItems = levels.filter(l => l.status === 'low');
  const okItems = levels.filter(l => l.status === 'ok');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Загрузка остатков...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn("p-4", criticalItems.length > 0 && "border-destructive")}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("w-5 h-5", criticalItems.length > 0 ? "text-destructive" : "text-muted-foreground")} />
            <div>
              <div className="text-2xl font-bold">{criticalItems.length}</div>
              <div className="text-sm text-muted-foreground">Критично</div>
            </div>
          </div>
        </Card>
        
        <Card className={cn("p-4", lowItems.length > 0 && "border-orange-500")}>
          <div className="flex items-center gap-2">
            <TrendingDown className={cn("w-5 h-5", lowItems.length > 0 ? "text-orange-500" : "text-muted-foreground")} />
            <div>
              <div className="text-2xl font-bold">{lowItems.length}</div>
              <div className="text-sm text-muted-foreground">Мало</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{okItems.length}</div>
              <div className="text-sm text-muted-foreground">ОК</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Таблица остатков */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Остатки и прогноз</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Ингредиент</th>
                <th className="text-left p-3">Ед. измерения</th>
                <th className="text-left p-3">Текущий остаток</th>
                <th className="text-left p-3">Дней запаса</th>
                <th className="text-left p-3">Средний расход/день</th>
                <th className="text-left p-3">Статус</th>
              </tr>
            </thead>
            <tbody>
              {levels
                .sort((a, b) => {
                  // Сначала критические, потом мало, потом ОК
                  const statusOrder = { critical: 0, low: 1, ok: 2 };
                  return statusOrder[a.status] - statusOrder[b.status];
                })
                .map((level) => (
                  <tr
                    key={level.ingredient_id}
                    className={cn(
                      "border-b hover:bg-muted/50",
                      level.status === 'critical' && "bg-destructive/10"
                    )}
                  >
                    <td className="p-3 font-medium">{level.ingredient_name}</td>
                    <td className="p-3 text-muted-foreground">
                      {formatUnit(level.unit)}
                    </td>
                    <td className="p-3">
                      {level.current_stock.toFixed(2)} {formatUnit(level.unit)}
                    </td>
                    <td className="p-3">
                      {formatDaysLeft(level.days_left ?? null)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {level.avg_daily_consumption
                        ? `${level.avg_daily_consumption.toFixed(2)} ${formatUnit(level.unit)}/день`
                        : "Нет расхода"}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          level.status === 'critical'
                            ? 'error'
                            : level.status === 'low'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {level.status === 'critical'
                          ? 'Критично'
                          : level.status === 'low'
                          ? 'Мало'
                          : 'ОК'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              {levels.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Нет данных об остатках
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Рекомендации по закупкам */}
      {criticalItems.length > 0 && (
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Требуется срочная закупка</h3>
              <ul className="space-y-1">
                {criticalItems.map((item) => {
                  const targetDays = 7;
                  const recommendedQty = item.avg_daily_consumption
                    ? Math.max(0, item.avg_daily_consumption * targetDays - item.current_stock)
                    : 0;

                  return (
                    <li key={item.ingredient_id} className="text-sm">
                      <strong>{item.ingredient_name}</strong>: рекомендуется закупить{" "}
                      <strong>
                        {recommendedQty.toFixed(2)} {formatUnit(item.unit)}
                      </strong>
                      {item.current_stock <= 0 && " (остаток на нуле)"}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}







