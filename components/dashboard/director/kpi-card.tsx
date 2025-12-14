"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string | React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export function KPICard({ label, value, subtitle, status, className }: KPICardProps) {
  const statusColors = {
    success: 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border-[color:var(--color-success)]/20',
    warning: 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/20',
    error: 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] border-[color:var(--color-danger)]/20',
    neutral: 'bg-muted/50 text-muted-foreground border-border/50'
  };

  return (
    <Card className={cn("p-3", className)}>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold text-foreground tabular-nums">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {subtitle}
          </div>
        )}
        {status && (
          <div className="mt-1">
            {status === 'success' && (
              <Badge variant="success" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                В норме
              </Badge>
            )}
            {status === 'warning' && (
              <Badge variant="warning" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Внимание
              </Badge>
            )}
            {status === 'error' && (
              <Badge variant="error" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Критично
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

