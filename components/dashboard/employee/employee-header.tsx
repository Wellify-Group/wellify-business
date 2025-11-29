"use client";

import { User as UserIcon, LogOut, Globe, Moon, ListChecks } from "lucide-react";
import useStore, { useUIStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { Logo } from "@/components/logo";
import { useTheme } from "next-themes";
import { Language } from "@/lib/translations";
import { StartShiftModal } from "./start-shift-modal";
import { ConfirmEndShiftModal } from "./confirm-end-shift-modal";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { Collapse } from "@/components/ui/collapse";

interface EmployeeHeaderProps {
  onCloseShift?: () => void;
  onStartShift?: () => void;
  locationName?: string;
}

export function EmployeeHeader({ onCloseShift, onStartShift, locationName }: EmployeeHeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const { locale, setLocale } = useUIStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { 
    currentUser, 
    currentShift, 
    messages, 
    locations, 
    savedLocationId, 
    openLocationInfo, 
    startShift, 
    logout, 
    isClosingShift,
    shiftEndTime,
    finishShift
  } = useStore();
  const fetchCurrentShift = useStore((state) => state.fetchCurrentShift);
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [showConfirmEndShiftModal, setShowConfirmEndShiftModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const [isLocaleOpen, setIsLocaleOpen] = useState(false);

  const localeLabel = locale === 'ru' ? 'RU' : locale === 'uk' ? 'UA' : 'EN';

  // Синхронизация locale с language provider при загрузке
  useEffect(() => {
    if (locale === 'uk' && language !== 'ua') {
      setLanguage('ua' as Language);
    } else if (locale !== 'uk' && language !== locale) {
      setLanguage(locale as Language);
    }
  }, []); // Только при монтировании

  // При монтировании загружаем текущую смену с сервера
  useEffect(() => {
    if (currentUser?.id && typeof fetchCurrentShift === "function") {
      fetchCurrentShift();
    }
  }, [currentUser?.id, fetchCurrentShift]);

  // Determine shift status (idle = not started)
  const shiftStatus = currentShift?.status === 'active' 
    ? 'active' 
    : currentShift?.status === 'closed' 
    ? 'finished' 
    : 'not_started';

  // Get role label - use jobTitle if available, otherwise use translation or fallback
  const roleLabel = currentUser?.jobTitle || (t('role_employee') || "Сотрудник");
  
  // Mount check for theme - prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // If theme is 'system' and we have resolvedTheme, convert to explicit theme
    // This ensures that after first toggle, theme is always explicit (not 'system')
    if (theme === "system" && resolvedTheme) {
      // Don't change theme automatically, just ensure it's ready
      // User will set explicit theme when they toggle
    }
  }, [theme, resolvedTheme]);

  // Determine if dark theme is active
  // Use resolvedTheme to get the actual theme (handles 'system' theme)
  // If resolvedTheme is not available yet, check theme directly
  const isDark = mounted && (
    resolvedTheme === "dark" || 
    (resolvedTheme === undefined && theme === "dark")
  );


  // Handle theme toggle with instant update
  // Always toggle between 'light' and 'dark', never 'system'
  const handleThemeToggle = () => {
    if (!mounted) return; // Prevent toggle before hydration
    
    // Use resolvedTheme if available (handles 'system' theme), otherwise use theme
    const currentTheme = resolvedTheme || theme;
    
    // Determine new theme: if current is dark, switch to light, otherwise to dark
    // Default to 'dark' if we can't determine current theme
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    // Мгновенное применение темы напрямую к DOM для синхронного обновления
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      if (newTheme === "dark") {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    }
    
    // Всегда устанавливаем явную тему (никогда 'system')
    setTheme(newTheme);
  };

  // Handle locale change
  const handleLocaleChange = (newLocale: "ru" | "uk" | "en") => {
    setLocale(newLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wellify_locale", newLocale);
    }
    // Также обновляем language provider для совместимости
    if (newLocale === 'uk') {
      setLanguage('ua' as Language); // language provider использует 'ua'
    } else {
      setLanguage(newLocale as Language);
    }
    router.refresh();
    // Опционально: сворачиваем список языков после выбора
    // setIsLocaleOpen(false);
  };

  // Format shift start time
  const formatStartTime = () => {
    if (!currentShift?.startTime) return null;
    const startTime = new Date(currentShift.startTime);
    return startTime.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startTime = formatStartTime();

  // Get location schedule (if available)
  const assignedLocation = locations.find(loc => loc.id === (savedLocationId || currentUser?.assignedPointId));
  const shiftSchedule = assignedLocation?.schedule?.workingHours || "";

  const handlePowerClick = () => {
    if (shiftStatus === 'active') {
      // Проверяем наличие активной смены перед открытием модалки
      if (!currentShift) {
        console.warn('Cannot open close shift modal: no active shift');
        return;
      }
      // Показываем модалку подтверждения вместо сразу открытия формы
      setShowConfirmEndShiftModal(true);
    } else if (shiftStatus === 'not_started' || shiftStatus === 'finished') {
      setShowStartShiftModal(true);
    }
  };

  const handleConfirmEndShift = async () => {
    setShowConfirmEndShiftModal(false);
    
    // Вызываем finishShift из store (по спецификации)
    try {
      await finishShift();
      toastSuccess(t('dashboard.shift_finished_success') || 'Смена успешно завершена');
      
      // Опционально: вызываем колбэк, если он передан
      if (onCloseShift) {
        onCloseShift();
      }
    } catch (error: any) {
      console.error('Error finishing shift:', error);
      toastError(error?.message || t('dashboard.error_finish_shift') || 'Не удалось завершить смену');
    }
  };

  const handleConfirmStartShift = async () => {
    // Определяем locationId: используем savedLocationId или assignedPointId из currentUser
    const locationId = savedLocationId || currentUser?.assignedPointId;
    const employeeId = currentUser?.id;

    // Диагностика: выводим в консоль для отладки
    console.log('handleConfirmStartShift context', { 
      employeeId, 
      locationId, 
      savedLocationId, 
      assignedPointId: currentUser?.assignedPointId,
      companyId: currentUser?.businessId 
    });

    if (!locationId || !employeeId) {
      const errorMsg = t('dashboard.error_missing_location_or_user') || 'Отсутствует ID точки или пользователя';
      console.error('Cannot start shift: missing IDs', { locationId, employeeId });
      toastError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      await startShift(locationId, employeeId);
      
      // Показываем успешное уведомление
      toastSuccess(t('dashboard.shift_started_success') || 'Смена успешно начата');
      
      if (onStartShift) {
        onStartShift();
      }
    } catch (error: any) {
      const errorMsg = error?.message || t('dashboard.error_start_shift') || 'Не удалось начать смену. Попробуйте ещё раз или обратитесь к администратору.';
      toastError(errorMsg);
      // Пробрасываем ошибку дальше для обработки в модалке
      throw error;
    }
  };

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate menu position
  useEffect(() => {
    function updateMenuPosition() {
      if (profileButtonRef.current) {
        const rect = profileButtonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 12, // опущено на 2px ниже (было 10, стало 12)
          right: window.innerWidth - rect.right
        });
      }
    }

    if (isProfileMenuOpen && profileButtonRef.current) {
      updateMenuPosition();
      
      // Update position on scroll/resize
      window.addEventListener("scroll", updateMenuPosition, true);
      window.addEventListener("resize", updateMenuPosition);
      
      return () => {
        window.removeEventListener("scroll", updateMenuPosition, true);
        window.removeEventListener("resize", updateMenuPosition);
      };
    }
  }, [isProfileMenuOpen]);

  // Close profile menu on outside click
  useClickOutside(
    [profileButtonRef as React.RefObject<HTMLElement>, menuRef],
    () => setIsProfileMenuOpen(false),
    isProfileMenuOpen
  );


  const handleLogout = () => {
    // Check if shift is active - prevent logout if needed
    if (shiftStatus === 'active') {
      // Option a: Prevent logout with active shift
      alert(t('dashboard.cannot_logout_active_shift') || 'Нельзя выйти, пока смена не завершена');
      setIsProfileMenuOpen(false);
      return;
    }
    
    logout();
    router.push("/login");
  };

  // Форматирование информации о смене для правой части навбара
  const getShiftInfo = () => {
    if (shiftStatus === 'active' && startTime) {
      return startTime; // Только время начала
    } else if (shiftStatus === 'finished' && shiftEndTime) {
      const endTime = new Date(shiftEndTime);
      return endTime.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return null;
  };

  return (
    <div className="flex flex-col w-full">
      {/* MAIN HEADER */}
      <header className="h-16 bg-[var(--surface-1)] border-b border-[var(--border-color)] flex items-center justify-between px-4 md:px-6">
        
        {/* LEFT: Logo */}
        <div className="flex items-center gap-3">
          <Logo 
            size={24} 
            showText={true}
            className="[&_span]:text-zinc-900 dark:[&_span]:text-white [&_span]:text-base"
          />
          {assignedLocation?.name && (
            <>
              <span className="text-zinc-400 dark:text-zinc-500">|</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {t('dashboard.dashboard_point') || "Точка"}: {assignedLocation.name}
              </span>
            </>
          )}
        </div>

        {/* CENTER: Shift Status (без времени и кнопок) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <span className="text-sm text-zinc-600 dark:text-white/70">
            {shiftStatus === 'active' 
              ? (t('dashboard.dashboard_shift_active') || "Смена идет")
              : shiftStatus === 'finished'
              ? (t('dashboard.dashboard_shift_finished') || "Смена завершена")
              : (t('dashboard.dashboard_shift_not_started') || "Смена не начата")}
          </span>
        </div>

        {/* RIGHT: Shift Info + Avatar + Actions */}
        <div className="flex items-center gap-3">
          {/* Информация о смене (время начала/окончания) */}
          {getShiftInfo() && (
            <span className="text-xs text-zinc-500 dark:text-white/45">
              {shiftStatus === 'active' 
                ? `Начало: ${getShiftInfo()}`
                : `Окончание: ${getShiftInfo()}`}
            </span>
          )}
          
          {/* Avatar with Menu */}
          <div>
            <button
              ref={profileButtonRef}
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-9 w-9 rounded-full bg-[var(--surface-2)] flex items-center justify-center border border-[var(--border-color)] relative">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon size={18} className="text-zinc-500 dark:text-zinc-400" />
                )}
                {/* Online Status Dot */}
                {currentUser?.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-black"></span>
                )}
              </div>
            </button>
          </div>

          {/* Power Button - Universal Start/End Shift (Text Button) */}
          <button
            onClick={handlePowerClick}
            disabled={shiftStatus === 'active' && (!currentShift || isClosingShift)}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-full transition-all",
              shiftStatus === 'active'
                ? 'border border-[var(--error)] bg-[var(--error)] text-white hover:bg-[var(--error)]/90'
                : 'bg-emerald-500 text-white hover:bg-emerald-600',
              (shiftStatus === 'active' && (!currentShift || isClosingShift)) && "opacity-60 cursor-not-allowed"
            )}
          >
            {shiftStatus === 'active'
              ? (isClosingShift ? (t('dashboard.closing_shift') || "Закрываем...") : (t('dashboard.close_shift') || "Закрыть смену"))
              : (t('dashboard.start_shift') || "Начать смену")}
          </button>
        </div>
      </header>


      {/* Start Shift Modal */}
      <StartShiftModal
        isOpen={showStartShiftModal}
        onClose={() => setShowStartShiftModal(false)}
        onConfirm={handleConfirmStartShift}
      />

      {/* Confirm End Shift Modal */}
      <ConfirmEndShiftModal
        isOpen={showConfirmEndShiftModal}
        onClose={() => setShowConfirmEndShiftModal(false)}
        onConfirm={handleConfirmEndShift}
      />

      {/* Profile Dropdown Menu - Portal */}
      {mounted && isProfileMenuOpen && createPortal(
        <div 
          className="fixed inset-0 pointer-events-none z-[9999]"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                duration: 0.15, 
                ease: "easeOut" 
              }}
              style={{
                position: 'absolute',
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
              }}
              className="pointer-events-auto w-[280px] rounded-xl border border-[var(--border-color)] bg-[var(--surface-2)] shadow-xl shadow-black/10 dark:shadow-black/30 py-2 px-2 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Block */}
              <div className="flex items-center gap-3 px-3 py-3 mb-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border-color)]">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {(() => {
                    const name = currentUser?.fullName || currentUser?.name || "Employee";
                    const parts = name.split(' ');
                    if (parts.length >= 2) {
                      return (parts[0][0] + parts[1][0]).toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {currentUser?.fullName || currentUser?.name || "Employee"}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] truncate">
                    {roleLabel}
                  </div>
                </div>
                {shiftStatus === 'active' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                {/* Profile */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push('/dashboard/employee/profile');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--surface-2)] text-sm text-[var(--text-primary)] transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span>{t('dashboard.profile') || 'Профиль'}</span>
                </button>

                {/* Order History */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    router.push('/dashboard/employee/orders-history');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--surface-2)] text-sm text-[var(--text-primary)] transition-colors"
                >
                  <ListChecks className="h-4 w-4 text-[var(--text-secondary)]" />
                  <span>{t('dashboard.shift_history') || 'История смен'}</span>
                </button>

                {/* Separator */}
                <div className="my-1 border-t border-[var(--border-color)]" />

                {/* Dark Mode Toggle */}
                <div 
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--surface-2)] text-sm text-[var(--text-primary)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThemeToggle();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Moon className="h-4 w-4 text-[var(--text-secondary)]" />
                    <span>{t("dashboard.menu_dark_mode") || "Тёмный режим"}</span>
                  </div>
                  {mounted ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleThemeToggle();
                      }}
                      className={cn(
                        "relative inline-flex h-5 w-10 items-center rounded-full border-2 transition-all duration-200 focus:outline-none shrink-0",
                        isDark 
                          ? "bg-emerald-500 border-emerald-500" 
                          : "bg-zinc-300 dark:bg-zinc-600 border-zinc-300 dark:border-zinc-600"
                      )}
                      aria-label={isDark ? "Переключить на светлую тему" : "Переключить на темную тему"}
                    >
                      <span
                        className={cn(
                          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-200",
                          isDark ? "translate-x-[18px]" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  ) : (
                    <div className="relative inline-flex h-5 w-10 items-center rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-zinc-300 dark:bg-zinc-600 shrink-0">
                      <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md translate-x-0.5" />
                    </div>
                  )}
                </div>

                {/* Language Selector */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLocaleOpen((prev) => !prev);
                  }}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--surface-2)] text-sm text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
                    <span>{t("dashboard.interface_language") || "Язык интерфейса"}</span>
                  </div>
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--surface-1)] text-xs font-semibold text-[var(--text-secondary)]">
                    {localeLabel}
                  </span>
                </div>

                <Collapse isOpen={isLocaleOpen} className="px-3 pb-1 pt-1">
                  <div onClick={(e) => e.stopPropagation()} className="space-y-1 pl-7">
                    {/* Русский */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (locale !== "ru") {
                          handleLocaleChange("ru");
                        }
                      }}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                        locale === "ru"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                      )}
                    >
                      {locale === "ru" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      <span>Русский</span>
                    </button>

                    {/* Українська */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (locale !== "uk") {
                          handleLocaleChange("uk");
                        }
                      }}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                        locale === "uk"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                      )}
                    >
                      {locale === "uk" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      <span>Українська</span>
                    </button>

                    {/* English */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (locale !== "en") {
                          handleLocaleChange("en");
                        }
                      }}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors flex items-center gap-2",
                        locale === "en"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                      )}
                    >
                      {locale === "en" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      <span>English</span>
                    </button>
                  </div>
                </Collapse>

                {/* Separator */}
                <div className="my-1 border-t border-[var(--border-color)]" />

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-red-500/10 text-sm text-red-500 transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('dashboard.btn_exit') || t('logout') || 'Выйти'}</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}

    </div>
  );
}
