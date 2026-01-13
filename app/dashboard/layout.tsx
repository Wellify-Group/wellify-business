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
  const { isSidebarCollapsed, syncWithServer, currentUser } = useStore();
  const pathname = usePathname();
  const isEmployeeRoute = pathname?.startsWith('/dashboard/employee');
  
  // Auto-sync on mount if user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      syncWithServer();
    }
  }, [currentUser?.id, syncWithServer]);

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
