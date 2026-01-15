"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { X } from "lucide-react";

// Step Configuration for Director Dashboard
const directorDashboardSteps = [
  { 
    id: 0, 
    target: null, 
    title: "Панель управления бизнесом",
    description: "Это обзор всей сети. Здесь вы сразу видите выручку, проблемы и активность точек."
  },
  { 
    id: 1, 
    target: "tour-critical-problems", 
    position: "left",
    title: "Контроль проблем",
    description: "Этот блок показывает всё, что требует немедленного внимания: неоткрытые смены, ошибки, отсутствие менеджеров."
  },
  { 
    id: 2, 
    target: "tour-metrics", 
    position: "bottom",
    title: "Ключевые показатели",
    description: "Выручка, план, средний чек и количество гостей — всё в одном месте."
  },
  { 
    id: 3, 
    target: "tour-locations-table", 
    position: "top",
    title: "Управление точками",
    description: "Каждая точка — это отдельный операционный центр со сменами, персоналом и отчётами."
  },
  { 
    id: 4, 
    target: "app-sidebar", 
    position: "right",
    title: "Разделы системы",
    description: "Слева — основные разделы: точки, персонал, смены, склад и отчёты."
  },
  { 
    id: 5, 
    target: null, 
    title: "Вы готовы к работе",
    description: "Теперь вы видите бизнес целиком. Начните с добавления первой точки."
  },
];

// Step Configuration for Employee (Simplified)
const employeeSteps = [
  { id: 0, target: null }, // Welcome (Center)
  { id: 1, target: "employee-shift-form", position: "left" }, // My Shift
  { id: 2, target: "employee-location-card", position: "right" }, // Location Info
  { id: 3, target: "employee-notifications", position: "left" }, // Communication
  { id: 4, target: null }, // Finish (Center)
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps = {}) {
  const { t } = useLanguage();
  const { completeTour, currentUser } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  // Determine which steps to use based on role
  const isEmployee = currentUser?.role === 'employee';
  const steps = isEmployee ? employeeSteps : directorDashboardSteps;

  // Find target element position
  useEffect(() => {
    const step = steps[currentStep];
    if (!step.target) {
      setTargetRect(null); // Center mode
      return;
    }

    const element = document.getElementById(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll into view if needed
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStep, steps]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleSkip]);

  const handleSkip = useCallback(() => {
    if (onComplete) {
      onComplete();
    } else {
      completeTour();
    }
  }, [onComplete, completeTour]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  }, [currentStep, steps.length, handleSkip]);

  // Calculate Spotlight Style
  const spotlightStyle = targetRect
    ? {
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)", // Dark overlay
      }
    : {
        // If no target (Center steps), make the "hole" invisible or full screen dark
        top: "50%",
        left: "50%",
        width: 0,
        height: 0,
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
      };

  // Calculate Card Position relative to Spotlight
  const getCardPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%", x: "-50%", y: "-50%" }; // Center

    const step = steps[currentStep] as any;
    const gap = 20;

    if (step.position === "right") {
      return { top: targetRect.top, left: targetRect.right + gap, x: 0, y: 0 };
    }
    if (step.position === "bottom") {
      return { top: targetRect.bottom + gap, left: targetRect.left, x: 0, y: 0 };
    }
    if (step.position === "top") {
      return { top: targetRect.top - gap, left: targetRect.left, x: 0, y: "-100%" };
    }
    if (step.position === "left") {
      return { top: targetRect.top, left: targetRect.left - gap, x: "-100%", y: 0 };
    }
    if (step.position === "bottom-left") {
       return { top: targetRect.bottom + gap, left: targetRect.right, x: "-100%", y: 0 };
    }
    return { top: "50%", left: "50%", x: "-50%", y: "-50%" };
  };

  const cardPos = getCardPosition();
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const step = steps[currentStep] as any;

  // Get step content
  const getStepTitle = () => {
    if (isEmployee) {
      if (currentStep === 0) return t("dashboard.tour_welcome") || "Добро пожаловать!";
      if (currentStep === 1) return t("dashboard.tour_emp_shift") || "Моя смена";
      if (currentStep === 2) return t("dashboard.tour_emp_loc") || "Информация о точке";
      if (currentStep === 3) return t("dashboard.tour_emp_chat") || "Общение";
      return t("dashboard.tour_finish") || "Готово!";
    }
    return step.title || `Шаг ${currentStep + 1}`;
  };

  const getStepDescription = () => {
    if (isEmployee) {
      if (currentStep === 0) return t("dashboard.tour_welcome_desc") || "Добро пожаловать в WELLIFY business! Этот краткий тур покажет вам основные функции.";
      if (currentStep === 1) return t("dashboard.tour_emp_shift") || "Моя смена - Начинайте/завершайте смену здесь. Введите выручку и чек-лист.";
      if (currentStep === 2) return t("dashboard.tour_emp_loc") || "Информация о точке - Посмотрите правила и контакты менеджера.";
      if (currentStep === 3) return t("dashboard.tour_emp_chat") || "Общение - Читайте задачи и сообщайте о проблемах.";
      return t("dashboard.tour_finish_desc") || "Отличной смены! Не забудьте закрыть смену перед уходом.";
    }
    return step.description || "";
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Spotlight Element (The "Hole") */}
      <motion.div
        className="absolute rounded-lg pointer-events-none transition-all duration-500 ease-in-out ring-2 ring-white/80 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
        initial={false}
        animate={spotlightStyle}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />

      {/* The Card */}
      <motion.div
        className="absolute bg-white dark:bg-zinc-900 text-foreground p-6 rounded-2xl w-[400px] shadow-2xl border border-border"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          top: cardPos.top, 
          left: cardPos.left,
          x: cardPos.x, 
          y: cardPos.y 
        }}
        transition={{ duration: 0.4, type: "spring" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title + Close */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold leading-tight">
            {getStepTitle()}
          </h3>
          <button 
            onClick={handleSkip} 
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          {getStepDescription()}
        </p>

        {/* Progress Indicator */}
        <div className="mb-4 flex gap-1">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Footer: Buttons */}
        <div className="flex justify-between items-center">
          <button 
            onClick={handleSkip} 
            className="text-sm text-muted-foreground hover:text-foreground font-medium px-2 transition-colors"
          >
            {isLastStep ? "Закрыть" : "Пропустить"}
          </button>
          
          <button 
            onClick={handleNext} 
            className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-bold shadow-lg transform hover:scale-105 transition-all"
          >
            {isFirstStep ? "Начать" : 
             isLastStep ? "Начать работу" : 
             "Далее"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
