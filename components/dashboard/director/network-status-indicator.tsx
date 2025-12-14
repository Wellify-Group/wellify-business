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
      color: 'text-[color:var(--color-success)]',
      bgColor: 'bg-[color:var(--color-success)]/10 dark:bg-[color:var(--color-success)]/20',
      borderColor: 'border-[color:var(--color-success)]/20 dark:border-[color:var(--color-success)]/30',
      badgeColor: 'bg-[color:var(--color-success)]'
    },
    risks: {
      text: 'Есть риски',
      description: 'Требуется внимание к некоторым показателям',
      icon: AlertTriangle,
      color: 'text-[color:var(--color-warning)]',
      bgColor: 'bg-[color:var(--color-warning)]/10 dark:bg-[color:var(--color-warning)]/20',
      borderColor: 'border-[color:var(--color-warning)]/20 dark:border-[color:var(--color-warning)]/30',
      badgeColor: 'bg-[color:var(--color-warning)]'
    },
    critical: {
      text: 'Критично',
      description: 'Обнаружены критические проблемы',
      icon: XCircle,
      color: 'text-[color:var(--color-danger)]',
      bgColor: 'bg-[color:var(--color-danger)]/10 dark:bg-[color:var(--color-danger)]/20',
      borderColor: 'border-[color:var(--color-danger)]/20 dark:border-[color:var(--color-danger)]/30',
      badgeColor: 'bg-[color:var(--color-danger)]'
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
          className={cn("text-sm px-3 py-1", config.badgeColor, "text-primary-foreground")}
        >
          {problemCount}
        </Badge>
      </div>
    </Card>
  );
}














