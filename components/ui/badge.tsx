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
      success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      error: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
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















