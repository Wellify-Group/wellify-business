"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import useStore, { getFormalName } from "@/lib/store";
import { useTheme } from "next-themes";
import { Language } from "@/lib/translations";
import { Menu, Bell, ChevronDown, LogOut, Settings, PenSquare, ChevronRight, ArrowLeft, User, Globe, Check, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WeatherWidget } from "./weather-widget";
import { NavbarClock } from "./navbar-clock";
import Link from "next/link";
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from "@/lib/constants";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, toggleSidebar, openMessageComposer, locations, isSidebarCollapsed } = useStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [languageMenuPosition, setLanguageMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const [languageMenuCoords, setLanguageMenuCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  // Breadcrumb mapping dictionary - using translations
  const breadcrumbMap: Record<string, string> = {
    'director': t("dashboard.nav_overview"),
    'locations': t("dashboard.nav_locations"),
    'staff': t("dashboard.nav_staff"),
    'shifts': t("dashboard.nav_shifts"),
    'analytics': t("dashboard.route_analytics"),
    'finance': t("dashboard.nav_finance"),
    'feed': t("dashboard.sec_feed"),
    'builder': t("dashboard.nav_builder"),
    'settings': t("dashboard.nav_settings"),
    'revenue': t("dashboard.dash_revenue"),
    'plan_percent': t("dashboard.dash_plan") + ' %',
    'check_count': t("dashboard.dash_checks"),
    'location': t("dashboard.route_location"),
  };

  // Build breadcrumbs from pathname
  const buildBreadcrumbs = () => {
    if (!pathname) return [];
    
    const segments = pathname.split('/').filter(Boolean);
    // Remove 'dashboard' segment
    const relevantSegments = segments.slice(1);
    
    const breadcrumbs: Array<{ label: string; href: string; isLast: boolean }> = [];
    let currentPath = '/dashboard';
    
    relevantSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === relevantSegments.length - 1;
      
      // Check if segment is a location ID (starts with 'loc-')
      let label: string;
      if (segment.startsWith('loc-')) {
        const location = locations.find(loc => loc.id === segment);
        label = location ? location.name : "Unknown Point";
      } else {
        label = breadcrumbMap[segment] || segment;
      }
      
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();
  const pathDepth = breadcrumbs.length;
  const [userName, setUserName] = useState(getFormalName(currentUser));
  const [userInitial, setUserInitial] = useState(userName[0]?.toUpperCase() || "U");

  // Load user name from Supabase profile if not available in currentUser
  useEffect(() => {
    async function loadUserName() {
      const name = getFormalName(currentUser);
      
      // If currentUser has a name, use it
      if (name && name !== "User") {
        setUserName(name);
        setUserInitial(name[0]?.toUpperCase() || "U");
        return;
      }

      // Otherwise, try to load from Supabase profiles
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('"ФИО", имя')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const profileName = profile['ФИО'] || profile.имя;
          if (profileName && profileName.trim() !== '') {
            setUserName(profileName.trim());
            setUserInitial(profileName.trim()[0]?.toUpperCase() || "U");
            
            // Update currentUser in store if it exists
            if (currentUser) {
              const updatedUser = {
                ...currentUser,
                fullName: profile['ФИО'] || currentUser.fullName,
                name: profile.имя || currentUser.name || profileName.trim().split(' ')[0],
              };
              // Note: We can't directly update store here, but the name will be displayed correctly
            }
          } else {
            setUserName("Пользователь");
            setUserInitial("П");
          }
        }
      } catch (error) {
        console.error('Error loading user name from profile:', error);
      }
    }

    loadUserName();
  }, [currentUser]);

  // Get role label
  const getRoleLabel = () => {
    if (currentUser?.role === 'director') return t("dashboard.director_overview") || "Директор";
    if (currentUser?.role === 'manager') return t("dashboard.manager_panel") || "Менеджер";
    return t("dashboard.dash_employee") || "Сотрудник";
  };

  const roleLabel = getRoleLabel();
  
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

  // Language options
  const languages: { code: Language; label: string; fullLabel: string }[] = [
    { code: "ru", label: "RU", fullLabel: t("dashboard.menu_lang_russian") },
    { code: "ua", label: "UA", fullLabel: t("dashboard.menu_lang_ukrainian") },
    { code: "en", label: "EN", fullLabel: t("dashboard.menu_lang_english") },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  // Handle language change
  const handleLanguageChange = (langCode: Language) => {
    if (language !== langCode) {
      setLanguage(langCode);
      router.refresh();
    }
    setIsLanguageMenuOpen(false);
  };

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate language menu position and coordinates
  const updateLanguageMenuPosition = () => {
    if (isLanguageMenuOpen && languageButtonRef.current) {
      const buttonRect = languageButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const menuHeight = 120; // Approximate height of language menu (3 items)
      
      // If not enough space below but enough above, open upward
      const openUpward = spaceBelow < menuHeight && spaceAbove > menuHeight;
      setLanguageMenuPosition(openUpward ? 'top' : 'bottom');
      
      // Calculate coordinates for fixed positioning
      const top = openUpward 
        ? buttonRect.top - menuHeight - 4 // 4px gap
        : buttonRect.bottom + 4; // 4px gap
      
      setLanguageMenuCoords({
        top,
        left: buttonRect.left,
        width: buttonRect.width
      });
    }
  };

  useEffect(() => {
    updateLanguageMenuPosition();
    
    if (isLanguageMenuOpen) {
      // Update position on scroll/resize
      window.addEventListener("scroll", updateLanguageMenuPosition, true);
      window.addEventListener("resize", updateLanguageMenuPosition);
      
      return () => {
        window.removeEventListener("scroll", updateLanguageMenuPosition, true);
        window.removeEventListener("resize", updateLanguageMenuPosition);
      };
    }
  }, [isLanguageMenuOpen]);

  // Handle theme toggle
  // Always toggle between 'light' and 'dark', never 'system'
  const handleThemeToggle = () => {
    if (!mounted) return; // Prevent toggle before hydration
    
    // Use resolvedTheme if available (handles 'system' theme), otherwise use theme
    const currentTheme = resolvedTheme || theme;
    
    // Determine new theme: if current is dark, switch to light, otherwise to dark
    // Default to 'dark' if we can't determine current theme
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    // Always set explicit theme (never 'system')
    setTheme(newTheme);
  };

  // Close profile menu on outside click
  useClickOutside(
    [profileButtonRef as React.RefObject<HTMLElement>, profileMenuRef],
    () => setIsProfileOpen(false),
    isProfileOpen
  );

  // Close language menu on outside click
  useClickOutside(
    [languageButtonRef as React.RefObject<HTMLElement>, languageMenuRef],
    () => setIsLanguageMenuOpen(false),
    isLanguageMenuOpen
  );

  return (
    <header 
      id="dashboard-header" 
      data-tour="header" 
      className="bg-[var(--surface-1)] border-b border-[var(--border-color)] h-14 flex-shrink-0"
    >
      <div 
        className="flex items-center justify-between h-full"
        style={{ 
          paddingLeft: '24px',
          paddingRight: '24px'
        }}
      >
        {/* Left Side: Menu Toggle + Breadcrumbs/Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Menu Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" style={{ width: '20px', height: '20px' }} />
          </button>

          {/* Back Button (for deep pages) */}
          {pathDepth > 2 && (
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors flex-shrink-0"
              aria-label={t("back_to_home")}
            >
              <ArrowLeft className="h-5 w-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" style={{ width: '20px', height: '20px' }} />
            </button>
          )}

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                )}
                {crumb.isLast ? (
                  <span className="font-bold text-[var(--text-primary)] truncate">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right Side: Clock + Weather | Message + Notifications + Theme + Profile */}
        <div className="navbar-right flex items-center gap-3">
          {/* Group 1: Clock + Weather */}
          <div className="hidden md:flex items-center gap-4">
            {/* Clock */}
            <NavbarClock />
            {/* Weather Widget */}
            <WeatherWidget />
          </div>

          {/* Vertical Separator */}
          <div className="hidden md:block h-5 w-[1px] bg-[var(--border-color)]" />

          {/* Group 2: Message + Notifications + Theme + Profile */}
          <div className="flex items-center gap-1">
            {/* New Message Button (Director only) */}
            {currentUser?.role === 'director' && (
              <button
                onClick={() => openMessageComposer()}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title={t("dashboard.msg_new_message")}
              >
                <PenSquare className="h-5 w-5" style={{ width: '20px', height: '20px' }} />
              </button>
            )}

            {/* Notification Bell */}
            <Link 
              href="/dashboard/director/notifications"
              className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Уведомления"
            >
              <Bell className="h-5 w-5" style={{ width: '20px', height: '20px' }} />
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                id="user-profile-trigger"
                onClick={() => {
                  setIsLanguageMenuOpen(false); // Close language menu if open
                  setIsProfileOpen(!isProfileOpen);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-bold text-sm">
                  {userInitial}
                </div>
                <ChevronDown className={`h-4 w-4 text-[var(--text-secondary)] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <motion.div
                      ref={profileMenuRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-[var(--surface-1)] backdrop-blur-sm border border-[var(--border-color)] rounded-xl shadow-xl z-[9999] overflow-visible"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User Block */}
                      <div className="p-4 border-b border-[var(--border-color)] rounded-t-xl overflow-hidden">
                        <p className="text-base font-semibold text-[var(--text-primary)]">{userName}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          {roleLabel}
                        </p>
                      </div>
                      
                      <div className="flex flex-col p-2 overflow-hidden">
                        {/* Profile */}
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            router.push("/dashboard/director/settings");
                          }}
                          className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors rounded-md cursor-pointer"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-8 flex justify-center">
                              <User className="h-4 w-4 text-[var(--text-secondary)]" style={{ width: '16px', height: '16px' }} />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left ml-3 text-[var(--text-primary)]">{t("dashboard.profile")}</span>
                          </div>
                        </button>

                        {/* Dark Mode Toggle */}
                        <div 
                          className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors rounded-md cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-8 flex justify-center">
                              <Moon className="h-4 w-4 text-[var(--text-secondary)]" style={{ width: '16px', height: '16px' }} />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left ml-3 text-[var(--text-primary)]">{t("dashboard.menu_dark_mode")}</span>
                          </div>
                          {mounted ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleThemeToggle();
                              }}
                              className={cn(
                                "relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 shrink-0",
                                isDark ? "bg-[var(--accent-primary)]" : "bg-[var(--surface-3)]"
                              )}
                              aria-label={isDark ? "Переключить на светлую тему" : "Переключить на темную тему"}
                            >
                              <span
                                className={cn(
                                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform",
                                  isDark ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          ) : (
                            <div className="relative w-11 h-6 rounded-full bg-[var(--surface-3)] shrink-0">
                              <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                            </div>
                          )}
                        </div>

                        {/* Language Selector */}
                        <button
                          ref={languageButtonRef}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileOpen(false); // Close profile menu if open
                            setIsLanguageMenuOpen(!isLanguageMenuOpen);
                          }}
                          className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition-colors rounded-md cursor-pointer"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-8 flex justify-center shrink-0">
                              <Globe className="h-4 w-4 text-[var(--text-secondary)]" style={{ width: '16px', height: '16px' }} />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left ml-3 text-[var(--text-primary)]">{t("dashboard.menu_interface_language")}</span>
                          </div>
                          <span className="text-xs font-medium text-[var(--text-tertiary)] shrink-0">{currentLanguage.label}</span>
                        </button>

                        {/* Separator */}
                        <div className="h-px bg-[var(--border-color)] my-1 mx-4" />

                        {/* Logout */}
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                            router.push("/login");
                          }}
                          className="flex items-center justify-between px-4 py-3 text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors rounded-md cursor-pointer"
                        >
                          <div className="flex items-center flex-1">
                            <div className="w-8 flex justify-center">
                              <LogOut className="h-4 w-4" style={{ width: '16px', height: '16px' }} />
                            </div>
                            <span className="text-sm font-medium flex-1 text-left ml-3">{t("logout")}</span>
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

      {/* Language Submenu Portal */}
      {mounted && isLanguageMenuOpen && createPortal(
        <div 
          className="fixed inset-0 pointer-events-none z-[10000]"
          onClick={() => setIsLanguageMenuOpen(false)}
        >
          <AnimatePresence>
            <motion.div
              ref={languageMenuRef}
              initial={{ opacity: 0, y: languageMenuPosition === 'top' ? 5 : -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: languageMenuPosition === 'top' ? 5 : -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: `${languageMenuCoords.top}px`,
                left: `${languageMenuCoords.left}px`,
                width: `${languageMenuCoords.width}px`,
                background:
                  resolvedTheme === "dark"
                    ? "rgba(15, 23, 42, 0.7)"
                    : "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border:
                  resolvedTheme === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow:
                  resolvedTheme === "dark"
                    ? "0 8px 32px 0 rgba(0, 0, 0, 0.3)"
                    : "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
              }}
              className="pointer-events-auto rounded-lg max-h-[200px] overflow-y-auto custom-scroll"
              onClick={(e) => e.stopPropagation()}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-all rounded-lg mx-1 my-0.5 ${
                    language === lang.code
                      ? resolvedTheme === "dark"
                        ? "bg-white/10 text-[var(--text-primary)] backdrop-blur-sm"
                        : "bg-white/60 text-[var(--text-primary)] backdrop-blur-sm"
                      : resolvedTheme === "dark"
                      ? "text-[var(--text-secondary)] hover:bg-white/5 backdrop-blur-sm"
                      : "text-[var(--text-secondary)] hover:bg-white/40 backdrop-blur-sm"
                  }`}
                >
                  <span className={language === lang.code ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
                    {lang.fullLabel}
                  </span>
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-[var(--accent-primary)]" />
                  )}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </header>
  );
}
