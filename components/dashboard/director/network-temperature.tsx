"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NetworkTemperatureProps {
  status: 'normal' | 'risks' | 'critical';
  notifications: Array<{
    id: string;
    message: string;
    href?: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export function NetworkTemperature({ status, notifications }: NetworkTemperatureProps) {
  const statusConfig = {
    normal: {
      text: 'День в норме',
      description: 'Все показатели находятся в пределах нормы',
      icon: CheckCircle2,
      color: 'text-emerald-500'
    },
    risks: {
      text: 'Есть риски',
      description: 'Требуется внимание к некоторым показателям',
      icon: AlertTriangle,
      color: 'text-amber-500'
    },
    critical: {
      text: 'Критично',
      description: 'Обнаружены критические проблемы',
      icon: XCircle,
      color: 'text-rose-500'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        {/* Left: Status */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Icon className={cn("h-5 w-5", config.color)} />
            <h3 className="text-lg font-semibold text-foreground">{config.text}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* Right: Notifications */}
        <div className="flex-1 space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет активных уведомлений</p>
          ) : (
            notifications.slice(0, 5).map(notif => (
              <Link
                key={notif.id}
                href={notif.href || '/dashboard/director/notifications'}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted transition-colors group"
              >
                <AlertTriangle className={cn(
                  "h-4 w-4 flex-shrink-0 mt-0.5",
                  notif.priority === 'high' ? 'text-rose-500' :
                  notif.priority === 'medium' ? 'text-amber-500' :
                  'text-blue-500'
                )} />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors flex-1">
                  {notif.message}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}















