"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { X } from "lucide-react";

// Step Configuration for Director/Manager
const directorSteps = [
  { id: 0, target: null }, // Welcome (Center)
  { id: 1, target: "dashboard-header", position: "bottom" },
  { id: 2, target: "app-sidebar", position: "right" },
  { id: 3, target: "nav-overview", position: "right" },
  { id: 4, target: "nav-locations", position: "right" },
  { id: 5, target: "nav-staff", position: "right" },
  { id: 6, target: "nav-shifts", position: "right" },
  { id: 7, target: "nav-builder", position: "right" },
  { id: 8, target: "btn-fullscreen", position: "top" },
  { id: 9, target: "user-profile-trigger", position: "bottom-left" }, // Settings
  { id: 10, target: null }, // Finish (Center)
];

// Step Configuration for Employee (Simplified)
const employeeSteps = [
  { id: 0, target: null }, // Welcome (Center)
  { id: 1, target: "employee-shift-form", position: "left" }, // My Shift
  { id: 2, target: "employee-location-card", position: "right" }, // Location Info
  { id: 3, target: "employee-notifications", position: "left" }, // Communication
  { id: 4, target: null }, // Finish (Center)
];

export function OnboardingTour() {
  const { t } = useLanguage();
  const { completeTour, currentUser } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  // Determine which steps to use based on role
  const isEmployee = currentUser?.role === 'employee';
  const steps = isEmployee ? employeeSteps : directorSteps;

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
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleSkip = () => {
    completeTour();
  };

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
        // If no target (Center steps 0 and 10), make the "hole" invisible or full screen dark
        top: "50%",
        left: "50%",
        width: 0,
        height: 0,
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
      };

  // Calculate Card Position relative to Spotlight
  const getCardPosition = () => {
    if (!targetRect) return { top: "50%", left: "50%", x: "-50%", y: "-50%" }; // Center

    const step = steps[currentStep];
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
    if (step.position === "bottom-left") {
       return { top: targetRect.bottom + gap, left: targetRect.right, x: "-100%", y: 0 };
    }
    return { top: "50%", left: "50%", x: "-50%", y: "-50%" };
  };

  const cardPos = getCardPosition();
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

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
        className="absolute bg-white dark:bg-zinc-900 text-foreground p-6 rounded-2xl w-[360px] shadow-2xl border border-border"
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
            {isEmployee 
              ? (currentStep === 0 
                  ? (t("dashboard.tour_welcome") || "Добро пожаловать!")
                  : currentStep === 1
                  ? (t("dashboard.tour_emp_shift") || "Моя смена")
                  : currentStep === 2
                  ? (t("dashboard.tour_emp_loc") || "Информация о точке")
                  : currentStep === 3
                  ? (t("dashboard.tour_emp_chat") || "Общение")
                  : (t("dashboard.tour_finish") || "Готово!"))
              : t(`dashboard.tour_${currentStep}_title`)}
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
          {isEmployee
            ? (currentStep === 0
                ? (t("dashboard.tour_welcome_desc") || "Добро пожаловать в WELLIFY business! Этот краткий тур покажет вам основные функции.")
                : currentStep === 1
                ? (t("dashboard.tour_emp_shift") || "Моя смена - Начинайте/завершайте смену здесь. Введите выручку и чек-лист.")
                : currentStep === 2
                ? (t("dashboard.tour_emp_loc") || "Информация о точке - Посмотрите правила и контакты менеджера.")
                : currentStep === 3
                ? (t("dashboard.tour_emp_chat") || "Общение - Читайте задачи и сообщайте о проблемах.")
                : (t("dashboard.tour_finish_desc") || "Отличной смены! Не забудьте закрыть смену перед уходом."))
            : t(`dashboard.tour_${currentStep}_desc`)}
        </p>

        {/* Footer: Buttons */}
        <div className="flex justify-between items-center">
          <button 
            onClick={handleSkip} 
            className="text-sm text-muted-foreground hover:text-foreground font-medium px-2 transition-colors"
          >
            {t('dashboard.tour_btn_skip')}
          </button>
          
          <button 
            onClick={handleNext} 
            className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-bold shadow-lg transform hover:scale-105 transition-all"
          >
            {currentStep === 0 ? t('dashboard.tour_btn_start') : 
             currentStep === steps.length - 1 ? t('dashboard.tour_btn_finish') : 
             t('dashboard.tour_btn_next')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
