"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary" | "success" | "warning" | "error";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground",
      outline: "border border-border bg-transparent",
      secondary: "bg-secondary text-secondary-foreground",
      success: "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border border-[color:var(--color-success)]/20",
      warning: "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border border-[color:var(--color-warning)]/20",
      error: "bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] border border-[color:var(--color-danger)]/20",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };















