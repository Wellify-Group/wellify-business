"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useStore from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { 
  LayoutDashboard, MapPin, Users, FileText, Settings, 
  Maximize, Minimize, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from "@/lib/constants";

export function AppSidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, currentUser } = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Determine menu items based on role
  const isManager = currentUser?.role === 'manager';
  const baseHref = isManager ? '/dashboard/manager' : '/dashboard/director';
  
  const allMenuItems: Array<{ name: string; href: string; icon: any; id: string; roles?: string[] }> = [
    { name: t("dashboard.nav_overview"), href: baseHref, icon: LayoutDashboard, id: "nav-overview" },
    ...(!isManager ? [
      { name: t("dashboard.nav_locations"), href: "/dashboard/director/locations", icon: MapPin, id: "nav-locations" },
      { name: t("dashboard.nav_staff"), href: "/dashboard/director/staff", icon: Users, id: "nav-staff" },
    ] : []),
    { name: t("dashboard.nav_shifts"), href: "/dashboard/director/shifts", icon: FileText, id: "nav-shifts" },
    { name: "Склад / Инвентарь", href: "/dashboard/manager/inventory", icon: Package, id: "nav-inventory", roles: ['director', 'manager'] },
    ...(!isManager ? [
      { name: t("dashboard.nav_builder"), href: "/dashboard/director/builder", icon: Settings, id: "nav-builder" },
    ] : []),
  ];
  
  const menuItems = allMenuItems.filter(item => !item.roles || (currentUser && item.roles.includes(currentUser.role)));

  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  return (
    <nav 
      id="app-sidebar" 
      data-tour="sidebar" 
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 h-full flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "sidebar sidebar--collapsed" : "sidebar sidebar--expanded"
      )}
      style={{
        width: isSidebarCollapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`,
      }}
    >
      {/* Logo Section */}
      <div 
        className={cn(
          "sidebar-logo flex items-center border-b flex-shrink-0",
          isSidebarCollapsed ? "h-14 justify-center px-0" : "h-14 px-3"
        )}
        style={{ borderColor: 'var(--border-color)' }}
      >
        {isSidebarCollapsed ? (
          <Link href="/dashboard/director" className="w-12 h-12 flex items-center justify-center">
            <Logo 
              size={28} 
              showText={false}
              className="select-none"
            />
          </Link>
        ) : (
          <Link href="/dashboard/director" className="flex items-center gap-2.5 w-full">
            <Logo 
              size={28} 
              showText={true}
              className="select-none"
            />
          </Link>
        )}
      </div>
      
      {/* Main Menu */}
      <div className="sidebar-nav flex-1 overflow-y-auto scrollbar-hide py-2">
        <div className={cn(
          "flex flex-col",
          isSidebarCollapsed ? "items-center gap-1 px-2" : "gap-1 px-3"
        )}
        style={isSidebarCollapsed ? { width: '100%' } : undefined}
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                id={item.id}
                href={item.href}
                className={cn(
                  "sidebar-item relative flex items-center transition-all duration-150",
                  isSidebarCollapsed 
                    ? "h-12 w-full justify-center rounded-lg" 
                    : "h-12 px-3 rounded-lg gap-3",
                  isActive && "sidebar-item-active"
                )}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={cn(
                  "flex-shrink-0",
                  "w-6 h-6"
                )} />
                {!isSidebarCollapsed && (
                  <span className="sidebar-item__label text-sm font-medium whitespace-nowrap overflow-hidden">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div 
        className="border-t flex-shrink-0"
        style={{ borderColor: 'var(--border-color)' }}
      />

      {/* Footer Actions */}
      <div className={cn(
        "sidebar-footer flex flex-col flex-shrink-0 py-2",
        isSidebarCollapsed ? "items-center gap-1 px-2" : "gap-1 px-3"
      )}
      style={isSidebarCollapsed ? { width: '100%' } : undefined}
      >
        <button 
          id="btn-fullscreen"
          onClick={handleFullscreen}
          className={cn(
            "sidebar-item flex items-center transition-all duration-150",
            isSidebarCollapsed 
              ? "h-12 w-full justify-center rounded-lg" 
              : "h-12 px-3 rounded-lg gap-3 w-full"
          )}
          title={isSidebarCollapsed ? (isFullscreen ? t("dashboard.btn_fullscreen_exit") : t("dashboard.btn_fullscreen")) : undefined}
        >
          {isFullscreen ? (
            <Minimize className="flex-shrink-0 w-6 h-6" />
          ) : (
            <Maximize className="flex-shrink-0 w-6 h-6" />
          )}
          {!isSidebarCollapsed && (
            <span className="sidebar-item__label text-sm font-medium whitespace-nowrap overflow-hidden">
              {t("dashboard.btn_fullscreen")}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
