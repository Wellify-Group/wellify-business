"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import { useStore, getFormalName } from "@/lib/store"; // ИСПРАВЛЕНО: именованный useStore
import { useTheme } from "next-themes";
import { Language } from "@/lib/translations";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  PenSquare,
  ChevronRight,
  ArrowLeft,
  User,
  Globe,
  Check,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WeatherWidget } from "./weather-widget";
import { NavbarClock } from "./navbar-clock";
import Link from "next/link";
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from "@/lib/constants"; // пока можно оставить, даже если не используется
import { createPortal } from "react-dom";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const {
    currentUser,
    logout,
    toggleSidebar,
    openMessageComposer,
    locations,
    isSidebarCollapsed,
  } = useStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [languageMenuPosition, setLanguageMenuPosition] =
    useState<"bottom" | "top">("bottom");
  const [languageMenuCoords, setLanguageMenuCoords] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [mounted, setMounted] = useState(false);

  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  // Имя и инициалы - используем данные из профиля
  const userName = useMemo(() => {
    if (!currentUser) return "";
    
    // Приоритет: fullName > составленное из частей > name > email
    if (currentUser.fullName && currentUser.fullName.trim() && currentUser.fullName !== "User") {
      return currentUser.fullName;
    }
    
    const parts: string[] = [];
    if (currentUser.firstName && currentUser.firstName.trim()) parts.push(currentUser.firstName);
    if (currentUser.middleName && currentUser.middleName.trim()) parts.push(currentUser.middleName);
    if (currentUser.lastName && currentUser.lastName.trim()) parts.push(currentUser.lastName);
    
    if (parts.length > 0) {
      return parts.join(" ");
    }
    
    if (currentUser.name && currentUser.name.trim() && currentUser.name !== "User") {
      return currentUser.name;
    }
    
    // Если ничего не найдено, возвращаем пустую строку (не показываем "User")
    return "";
  }, [currentUser]);
  
  const userInitial = useMemo(() => {
    if (!userName || !userName.trim()) {
      // Если имени нет, пытаемся взять из email или используем первую букву роли
      if (currentUser?.email) {
        return currentUser.email[0]?.toUpperCase() || "Д";
      }
      return "Д"; // Д для Директор
    }
    // Берем первую букву имени
    return userName.trim()[0]?.toUpperCase() || "Д";
  }, [userName, currentUser]);

  // Флаг темы (для тумблера)
  const isDark = useMemo(
    () => (resolvedTheme || theme) === "dark",
    [resolvedTheme, theme]
  );

  // Карта для хлебных крошек
  const breadcrumbMap: Record<string, string> = {
    director: t("dashboard.nav_overview"),
    locations: t("dashboard.nav_locations"),
    staff: t("dashboard.nav_staff"),
    shifts: t("dashboard.nav_shifts"),
    analytics: t("dashboard.route_analytics"),
    finance: t("dashboard.nav_finance"),
    feed: t("dashboard.sec_feed"),
    builder: t("dashboard.nav_builder"),
    settings: t("dashboard.nav_settings"),
    revenue: t("dashboard.dash_revenue"),
    plan_percent: t("dashboard.dash_plan") + " %",
    check_count: t("dashboard.dash_checks"),
    location: t("dashboard.route_location"),
  };

  const buildBreadcrumbs = () => {
    if (!pathname) return [];

    const segments = pathname.split("/").filter(Boolean);
    // убираем "dashboard"
    const relevantSegments = segments.slice(1);

    const breadcrumbs: Array<{
      label: string;
      href: string;
      isLast: boolean;
    }> = [];
    let currentPath = "/dashboard";

    relevantSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === relevantSegments.length - 1;

      let label: string;
      if (segment.startsWith("loc-")) {
        const location = locations.find((loc) => loc.id === segment);
        // ИСПРАВЛЕНО: используем нормальное поле name
        label = location ? location.name : t("dashboard.unknown_point");
      } else {
        label = breadcrumbMap[segment] || segment;
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();
  const pathDepth = breadcrumbs.length;

  const getRoleLabel = () => {
    if (!currentUser?.role) return "Директор"; // По умолчанию директор для дашборда директора
    
    switch (currentUser.role) {
      case "director":
        return "Директор";
      case "manager":
        return "Менеджер";
      case "employee":
        return "Сотрудник";
      default:
        return "Директор"; // По умолчанию директор
    }
  };

  const roleLabel = getRoleLabel();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Языки
  const languages: { code: Language; label: string; fullLabel: string }[] = [
    { code: "ru", label: "RU", fullLabel: t("dashboard.menu_lang_russian") },
    { code: "ua", label: "UA", fullLabel: t("dashboard.menu_lang_ukrainian") },
    { code: "en", label: "EN", fullLabel: t("dashboard.menu_lang_english") },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === language) || languages[0];

  const handleLanguageChange = async (langCode: Language) => {
    if (language !== langCode) {
      await setLanguage(langCode);
      router.refresh();
    }
    setIsLanguageMenuOpen(false);
  };

  // Позиция подменю языков
  const updateLanguageMenuPosition = () => {
    if (languageButtonRef.current) {
      const buttonRect = languageButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const menuHeight = 120;

      const openUpward = spaceBelow < menuHeight && spaceAbove > menuHeight;
      setLanguageMenuPosition(openUpward ? "top" : "bottom");

      const top = openUpward
        ? buttonRect.top - menuHeight - 4
        : buttonRect.bottom + 4;

      setLanguageMenuCoords({
        top,
        left: buttonRect.left,
        width: buttonRect.width,
      });
    }
  };

  useEffect(() => {
    if (isLanguageMenuOpen) {
      // Небольшая задержка для гарантии, что кнопка отрендерена
      const timer = setTimeout(() => {
        updateLanguageMenuPosition();
      }, 10);
      
      window.addEventListener("scroll", updateLanguageMenuPosition, true);
      window.addEventListener("resize", updateLanguageMenuPosition);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", updateLanguageMenuPosition, true);
        window.removeEventListener("resize", updateLanguageMenuPosition);
      };
    }
  }, [isLanguageMenuOpen]);

  const handleThemeToggle = () => {
    if (!mounted) return;
    const currentTheme = resolvedTheme || theme;
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Закрытие меню профиля
  useClickOutside(
    [profileButtonRef as React.RefObject<HTMLElement>, profileMenuRef],
    () => setIsProfileOpen(false),
    isProfileOpen
  );

  // Закрытие меню языков
  useClickOutside(
    [languageButtonRef as React.RefObject<HTMLElement>, languageMenuRef],
    () => setIsLanguageMenuOpen(false),
    isLanguageMenuOpen
  );

  return (
    <header
      id="dashboard-header"
      data-tour="header"
      className="bg-card border-b border-border h-14 flex-shrink-0 shadow-[var(--shadow-navbar)]"
    >
      <div
        className="flex items-center justify-between h-full"
        style={{
          paddingLeft: "24px",
          paddingRight: "24px",
        }}
      >
        {/* Left side */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>

          {/* Back button */}
          {pathDepth > 2 && (
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
              aria-label={t("back_to_home")}
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            {breadcrumbs.map((crumb, index) => (
              <div
                key={crumb.href}
                className="flex items-center gap-1.5 min-w-0"
              >
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                {crumb.isLast ? (
                  <span className="font-bold text-foreground truncate">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="navbar-right flex items-center gap-3">
          {/* Clock + Weather */}
          <div className="hidden md:flex items-center gap-4">
            <NavbarClock />
            <WeatherWidget />
          </div>

          <div className="hidden md:block h-5 w-[1px] bg-border" />

          <div className="flex items-center gap-1">
            {/* New message (director only) */}
            {currentUser?.role === "director" && (
              <button
                onClick={() => openMessageComposer()}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={t("dashboard.msg_new_message")}
              >
                <PenSquare className="h-5 w-5" />
              </button>
            )}

            {/* Notifications */}
            <Link
              href="/dashboard/director/notifications"
              className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t("dashboard.notifications")}
            >
              <Bell className="h-5 w-5" />
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                id="user-profile-trigger"
                onClick={() => {
                  setIsLanguageMenuOpen(false);
                  setIsProfileOpen(!isProfileOpen);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="flex flex-col items-end">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {userInitial}
                  </div>
                  {userName && userName.trim() && (
                    <span className="text-xs text-muted-foreground mt-0.5 leading-tight max-w-[120px] truncate">
                      {userName}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <motion.div
                      ref={profileMenuRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-card backdrop-blur-sm border border-border rounded-xl shadow-[var(--shadow-floating)] z-[9999]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User block */}
                      <div className="p-4 border-b border-border rounded-t-xl">
                        <p className="text-base font-semibold text-foreground">
                          {userName || currentUser?.email || "Директор"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {roleLabel}
                        </p>
                      </div>

                      <div className="flex flex-col p-2">
                        {/* Profile */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push("/dashboard/director/settings");
                          }}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors rounded-md"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-8 flex justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left ml-3 text-foreground">
                              {t("dashboard.profile")}
                            </span>
                          </div>
                        </button>

                        {/* Dark mode toggle */}
                        <div
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors rounded-md cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-8 flex justify-center">
                              <Moon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left ml-3 text-foreground">
                              {t("dashboard.menu_dark_mode")}
                            </span>
                          </div>
                          {mounted ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleThemeToggle();
                              }}
                              className={cn(
                                "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shrink-0",
                                isDark
                                  ? "bg-primary"
                                  : "bg-muted"
                              )}
                              aria-label={
                                isDark
                                  ? t("dashboard.menu_dark_mode_on")
                                  : t("dashboard.menu_dark_mode_off")
                              }
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
                                  isDark ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          ) : (
                            <div className="relative w-11 h-6 rounded-full bg-muted shrink-0">
                              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                            </div>
                          )}
                        </div>

                        {/* Language selector */}
                        <div className="relative">
                          <button
                            ref={languageButtonRef}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsProfileOpen(false);
                              // Открываем меню, позиция обновится в useEffect
                              setIsLanguageMenuOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors rounded-md"
                          >
                            <div className="flex items-center flex-1">
                              <div className="w-8 flex justify-center shrink-0">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="text-sm font-medium flex-1 text-left ml-3 text-foreground">
                                {t("dashboard.menu_interface_language")}
                              </span>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        <div className="h-px bg-border my-1 mx-4" />

                        {/* Logout */}
                        <button
                          onClick={async () => {
                            setIsProfileOpen(false);
                            await logout();
                            router.push("/login");
                          }}
                          className="flex items-center justify-between px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors rounded-md"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-8 flex justify-center">
                              <LogOut className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left ml-3">
                              {t("logout")}
                            </span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Языковое подменю через портал */}
      {mounted &&
        isLanguageMenuOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000]"
            onClick={() => setIsLanguageMenuOpen(false)}
          >
            <AnimatePresence>
              <motion.div
                ref={languageMenuRef}
                initial={{
                  opacity: 0,
                  y: languageMenuPosition === "top" ? 10 : -10,
                  scale: 0.95,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: languageMenuPosition === "top" ? 10 : -10,
                  scale: 0.95,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: `${languageMenuCoords.top}px`,
                  left: `${languageMenuCoords.left}px`,
                  width: `${Math.max(languageMenuCoords.width, 200)}px`,
                }}
                className="pointer-events-auto bg-card backdrop-blur-sm border border-border rounded-xl shadow-[var(--shadow-floating)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-all rounded-lg ${
                        language === lang.code
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className={
                          language === lang.code
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {lang.fullLabel}
                      </span>
                      {language === lang.code && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body
        )}
    </header>
  );
}
