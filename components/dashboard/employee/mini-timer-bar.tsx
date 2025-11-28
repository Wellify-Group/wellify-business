"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Collapse } from "@/components/ui/collapse";

export function MiniTimerBar() {
  const { t } = useLanguage();
  const { currentShift } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [shiftDuration, setShiftDuration] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const shiftStatus = currentShift?.status === 'active' ? 'active' : 'idle';
  const shiftStartTime = currentShift ? new Date(currentShift.startTime) : null;

  // Timer calculation
  useEffect(() => {
    if (shiftStatus === 'active' && shiftStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - shiftStartTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setShiftDuration({ hours, minutes, seconds });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [shiftStatus, shiftStartTime]);

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const formatStartTime = () => {
    if (!shiftStartTime) return null;
    return shiftStartTime.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (shiftStatus !== 'active' || !shiftStartTime) {
    return null;
  }

  return (
    <>
      {/* Мини-плашка под навбаром */}
      <div className="h-10 bg-white dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-white/6 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-mono text-zinc-900 dark:text-white">
            {formatTime(shiftDuration.hours, shiftDuration.minutes, shiftDuration.seconds)}
          </span>
          {formatStartTime() && (
            <>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("dashboard.shift_start_time") || "Початок зміни"}: {formatStartTime()}
              </span>
            </>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          {isExpanded 
            ? (t("dashboard.collapse_timer") || "Згорнути")
            : (t("dashboard.show_timer") || "Показати таймер")
          }
          {isExpanded ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>

      {/* Раскрытая полоска (80px высота) */}
      <Collapse isOpen={isExpanded} className="bg-white dark:bg-zinc-900/50 border-b border-zinc-200/60 dark:border-white/6">
        <div className="h-20 flex flex-col items-center justify-center px-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            <span className="text-2xl font-mono font-medium text-zinc-900 dark:text-white">
              {formatTime(shiftDuration.hours, shiftDuration.minutes, shiftDuration.seconds)}
            </span>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("dashboard.time_on_shift") || "Час на зміні"}
          </span>
        </div>
      </Collapse>
    </>
  );
}


