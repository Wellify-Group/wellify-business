"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  rounded?: "default" | "full";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", isLoading, rounded = "default", children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const roundedStyles = {
      default: "rounded-lg",
      full: "rounded-full",
    };
    
    const variants = {
      default: "bg-card border border-border text-card-foreground hover:bg-muted",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border bg-transparent text-foreground hover:bg-muted",
      ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      success: "bg-green-600 text-white hover:bg-green-700",
      warning: "bg-yellow-600 text-white hover:bg-yellow-700",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        className={cn(
          baseStyles,
          roundedStyles[rounded],
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Загрузка...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

// PrimaryButton - переиспользуемый компонент для CTA кнопок
export interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, isLoading, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="primary"
        size="md"
        rounded="full"
        isLoading={isLoading}
        disabled={disabled}
        className={cn("px-6 py-3 text-sm font-medium", className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
PrimaryButton.displayName = "PrimaryButton";

export { Button, PrimaryButton };









