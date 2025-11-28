"use client";

import { User } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Crown, Star } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface HeroStaffCardProps {
  employee: User;
  onClick?: () => void;
  size?: 'default' | 'large';
}

export function HeroStaffCard({ employee, onClick, size = 'default' }: HeroStaffCardProps) {
  const { t } = useLanguage();
  
  // Determine status
  const isActive = employee.status === 'active';
  const isOnShift = employee.assignedPointId !== null; // Simplified - in real app check if currently on shift
  
  // Get initials for placeholder
  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const cardSize = size === 'large' ? 'w-48' : 'w-40';
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900 hover:border-indigo-500/50 transition-all cursor-pointer group",
        cardSize,
        "aspect-[3/4]"
      )}
    >
      {/* Background Image or Gradient Placeholder */}
      {employee.avatar || (employee as any).photo || (employee as any).photoUrl ? (
        <img
          src={employee.avatar || (employee as any).photo || (employee as any).photoUrl}
          alt={employee.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
          <span className="text-4xl font-bold text-white/80">{initials}</span>
        </div>
      )}

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div
          className={cn(
            "px-3 py-1.5 text-xs font-semibold backdrop-blur-md border-b border-white/10 flex items-center gap-2",
            isOnShift
              ? "bg-emerald-500/80 text-white"
              : isActive
              ? "bg-zinc-800/80 text-zinc-300"
              : "bg-rose-500/80 text-white"
          )}
        >
          {/* Online Status Dot */}
          {employee.isOnline ? (
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
          ) : (
            <span className="w-2 h-2 bg-zinc-500 rounded-full"></span>
          )}
          <span>
            {isOnShift
              ? t("dashboard.staff_on_shift") || "На смене"
              : isActive
              ? "OFF"
              : "LATE"}
          </span>
        </div>
      </div>

      {/* Bottom Nameplate */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-md p-3 border-t border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate text-sm">{employee.name}</p>
            <p className="text-xs text-zinc-300 mt-0.5">
              {employee.jobTitle || (employee.role === 'manager' ? t("dashboard.role_manager") : t("dashboard.role_staff"))}
            </p>
          </div>
          {employee.role === 'manager' && (
            <Crown className="h-4 w-4 text-indigo-400 flex-shrink-0" />
          )}
          {employee.rating && employee.rating >= 90 && (
            <Star className="h-4 w-4 text-indigo-400 fill-indigo-400 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

