"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkStatusIndicatorProps {
  status: 'normal' | 'risks' | 'critical';
  problemCount: number;
}

export function NetworkStatusIndicator({ status, problemCount }: NetworkStatusIndicatorProps) {
  const statusConfig = {
    normal: {
      text: 'День в норме',
      description: 'Все показатели находятся в пределах нормы',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      badgeColor: 'bg-emerald-500'
    },
    risks: {
      text: 'Есть риски',
      description: 'Требуется внимание к некоторым показателям',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      badgeColor: 'bg-amber-500'
    },
    critical: {
      text: 'Критично',
      description: 'Обнаружены критические проблемы',
      icon: XCircle,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-950/20',
      borderColor: 'border-rose-200 dark:border-rose-800',
      badgeColor: 'bg-rose-500'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const problemText = problemCount === 0 
    ? 'Проблем нет' 
    : problemCount === 1 
    ? '1 проблема требует внимания'
    : `${problemCount} проблемы требуют внимания`;

  return (
    <Card className={cn(
      "p-4 border-2",
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon className={cn("h-6 w-6", config.color)} />
          <div>
            <h2 className="text-xl font-bold text-foreground">{config.text}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {problemText}
            </p>
          </div>
        </div>
        <Badge 
          className={cn("text-sm px-3 py-1", config.badgeColor, "text-white")}
        >
          {problemCount}
        </Badge>
      </div>
    </Card>
  );
}














