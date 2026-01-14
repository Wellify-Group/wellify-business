"use client";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { MessageComposer } from "@/components/dashboard/message-composer";
import { ConversationManager } from "@/components/dashboard/conversation-manager";
import { ToastContainer } from "@/components/ui/toast";
import useStore from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from "@/lib/constants";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed, currentUser } = useStore();
  const pathname = usePathname();
  const isEmployeeRoute = pathname?.startsWith('/dashboard/employee');
  
  // Load user from API if currentUser is null but token exists
  useEffect(() => {
    const loadUserIfNeeded = async () => {
      // Если currentUser уже есть, ничего не делаем
      if (currentUser?.id) {
        return;
      }
      
      // Проверяем наличие токена
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        // Нет токена - пользователь не авторизован
        return;
      }
      
      // Токен есть, но currentUser отсутствует - загружаем из API
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        if (!API_URL) return;
        
        const response = await fetch(`${API_URL}/api/auth/user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Сохраняем пользователя в store
            useStore.setState({ currentUser: data.user });
          }
        }
      } catch (error) {
        console.error('Failed to load user from API:', error);
      }
    };
    
    loadUserIfNeeded();
  }, [currentUser?.id]);

  // Employee route: Full-width terminal view (no sidebar, no header)
  // Employee layout обрабатывает свой собственный layout, просто передаём children
  if (isEmployeeRoute) {
    return <>{children}</>;
  }

  // Director/Manager route: Standard layout with sidebar and header
  const sidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div 
      className="app flex h-screen overflow-hidden bg-background text-foreground"
      style={{ 
        paddingLeft: `${sidebarWidth}px`
      }}
    >
      {/* SIDEBAR: Fixed position, dynamic width */}
      <AppSidebar />

      {/* CONTENT AREA: Full width, padding handled by parent */}
      <main 
        className="app-main flex flex-col flex-1 h-full min-w-0 transition-all duration-300 ease-in-out"
      >
        {/* HEADER: Fixed Height */}
        <DashboardHeader />

        {/* PAGES: Scrollable content area */}
        <div className="app-content flex-1 overflow-y-auto pt-4 px-6 pb-6 relative">
          {children}
        </div>
      </main>

      {/* Message Composer Modal - Global */}
      <MessageComposer />
      
      {/* Conversation Manager - Global */}
      <ConversationManager />
      
      {/* Toast Container - Global */}
      <ToastContainer />
    </div>
  );
}
