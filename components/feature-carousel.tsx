"use client";

import { AnimatePresence, animate, motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { ChevronLeft, ChevronRight, CheckCircle2, TrendingDown, Trophy, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function FeatureCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const totalSlides = 4;

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full">
      {/* Navigation Arrows */}
      <div className="absolute -left-4 top-1/2 z-10 -translate-y-1/2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevSlide}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-md shadow-lg transition-colors hover:bg-muted"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </motion.button>
      </div>
      <div className="absolute -right-4 top-1/2 z-10 -translate-y-1/2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextSlide}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-md shadow-lg transition-colors hover:bg-muted"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </motion.button>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          {currentSlide === 0 && <SlideSpeed key="speed" direction={direction} />}
          {currentSlide === 1 && <SlideControl key="control" direction={direction} />}
          {currentSlide === 2 && <SlideMotivation key="motivation" direction={direction} />}
          {currentSlide === 3 && <SlideAnomaly key="anomaly" direction={direction} />}
        </AnimatePresence>
      </div>

      {/* Slide Indicators */}
      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index
                ? "w-8 bg-foreground"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// SLIDE 1: The Cashier (Speed)
function SlideSpeed({ direction }: { direction: number }) {
  const { t, language } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [cashValue, setCashValue] = useState(0);
  const [cardValue, setCardValue] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cashControls = animate(0, 12500, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (value) => setCashValue(value),
    });
    const cardControls = animate(0, 34000, {
      duration: 1.2,
      delay: 0.1,
      ease: "easeOut",
      onUpdate: (value) => setCardValue(value),
    });

    return () => {
      cashControls.stop();
      cardControls.stop();
    };
  }, [cycleKey]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatAmount = (value: number) => {
    const amount = Math.round(value);
    return new Intl.NumberFormat(language === "ua" ? "uk-UA" : language === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency: language === "ua" ? "UAH" : "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleReset = () => {
    setCashValue(0);
    setCardValue(0);
    setCycleKey((prev) => prev + 1);
    setIsSuccess(false);
  };

  const handleFinish = () => {
    if (isSuccess) return;
    setIsSuccess(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleReset();
    }, 5000);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative p-6"
    >
      {/* Notification Toast - Above the card */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: -80, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute -top-20 right-0 z-50 flex max-w-xs items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-2xl backdrop-blur-xl"
          >
            <span>👤 Admin:</span>
            <span>{t("slide_notification_shift_closed")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 90 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <p className="text-2xl font-semibold text-card-foreground">
              {t("shift_closed")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("plan_met_notification")}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="space-y-6"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {t("slide_report_title")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-inner">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t("cash")}
                </p>
                <div className="mt-2 border-b border-border/50 bg-transparent pb-2">
                  <p className="font-mono text-3xl font-semibold text-card-foreground tabular-nums">
                    {formatAmount(cashValue)}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-inner">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t("card")}
                </p>
                <div className="mt-2 border-b border-border/50 bg-transparent pb-2">
                  <p className="font-mono text-3xl font-semibold text-card-foreground tabular-nums">
                    {formatAmount(cardValue)}
                  </p>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  "0 20px 45px rgba(79, 70, 229, 0.35)",
                  "0 25px 55px rgba(14, 165, 233, 0.45)",
                ],
              }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.6 }}
              onClick={handleFinish}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-6 py-4 text-lg font-semibold text-white shadow-lg"
            >
              {t("slide_report_btn")}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// SLIDE 2: The Director (Analytics)
function SlideControl({ direction }: { direction: number }) {
  const { t } = useLanguage();
  const [lineProgress, setLineProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const controls = animate(0, 100, {
      duration: 2,
      ease: "easeInOut",
      onUpdate: (value) => {
        setLineProgress(value);
      },
    });

    return () => controls.stop();
  }, []);

  // Chart data points - realistic zigzag pattern ending high
  const points = [
    { x: 0, y: 100 },
    { x: 20, y: 60 },
    { x: 40, y: 80 },
    { x: 60, y: 40 },
    { x: 80, y: 90 },
    { x: 100, y: 70 },
  ];

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${100 - point.y}`)
    .join(" ");

  // Для предотвращения проблем с гидратацией: на сервере используем начальную точку
  const visiblePoints = mounted 
    ? points.filter((point) => point.x <= lineProgress)
    : [points[0]]; // На сервере показываем только первую точку
  
  const visiblePath = visiblePoints.length > 0
    ? visiblePoints
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${100 - point.y}`)
        .join(" ")
    : `M ${points[0].x} ${100 - points[0].y}`; // Fallback на первую точку

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative p-6"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t("label_director")}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-card-foreground">
            {t("slide_analytics_title")}
          </h3>
        </div>

        <div className="relative h-64 rounded-2xl border border-border bg-card/50 p-4 shadow-inner">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            preserveAspectRatio="none"
            suppressHydrationWarning
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
              />
            ))}
            {/* Full path (gray, behind) */}
            <path
              d={pathData}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            {/* Animated path (primary color) */}
            <path
              d={visiblePath}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {visiblePoints.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={100 - point.y}
                r="1.5"
                fill="hsl(var(--primary))"
              />
            ))}
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

// SLIDE 3: The Ranking (Motivation)
function SlideMotivation({ direction }: { direction: number }) {
  const { t } = useLanguage();
  const names = t<string[]>("employee_names");

  const employees = [
    { name: names[0] || "Anna", score: 100, medal: "🥇" },
    { name: names[1] || "Dmitry", score: 92, medal: "🥈" },
    { name: names[2] || "Maxim", score: 88, medal: "🥉" },
  ];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative p-6"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t("label_staff")}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-card-foreground">
            {t("slide_staff_title")}
          </h3>
        </div>

        <div className="space-y-3">
          {employees.map((employee, index) => (
            <motion.div
              key={employee.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="grid grid-cols-[80px_1fr_50px_30px] items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
                {employee.medal}
              </div>
              <div>
                <p className="font-semibold text-card-foreground">{employee.name}</p>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${employee.score}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground text-right">
                {employee.score}%
              </span>
              <div className="flex justify-center">
                {index === 0 && (
                  <Trophy className="h-6 w-6 text-indigo-500" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-gradient-to-r from-indigo-50 to-violet-50 p-4 dark:from-indigo-950/20 dark:to-violet-950/20">
          <p className="text-sm font-medium text-card-foreground">
            {t("slide_staff_motivation")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("slide_staff_motivation_sub")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// SLIDE 4: The Watchdog (Anomalies)
function SlideAnomaly({ direction }: { direction: number }) {
  const { t } = useLanguage();
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing((prev) => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative p-6"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t("label_alert")}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-card-foreground">
            {t("slide_anomaly_title")}
          </h3>
        </div>

        <motion.div
          animate={{
            scale: isPulsing ? [1, 1.05, 1] : 1,
            boxShadow: isPulsing
              ? [
                  "0 0 0 0 rgba(239, 68, 68, 0.4)",
                  "0 0 0 10px rgba(239, 68, 68, 0)",
                  "0 0 0 0 rgba(239, 68, 68, 0)",
                ]
              : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="rounded-2xl border-2 border-red-500 bg-red-50 p-6 shadow-xl dark:bg-red-950/20"
        >
          <div className="flex items-start gap-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-red-900 dark:text-red-100">
                {t("slide_anomaly_title")}
              </h4>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {t("slide_anomaly_text")}
              </p>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  {t("slide_anomaly_investigate")}
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="rounded-xl border border-border bg-card/60 p-4">
          <p className="text-xs text-muted-foreground">
            💡 {t("slide_anomaly_helper")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
