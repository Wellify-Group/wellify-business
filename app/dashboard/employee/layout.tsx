"use client";

import { EmployeeHeader } from "@/components/dashboard/employee/employee-header";
import { ToastContainer } from "@/components/ui/toast";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShiftClosingForm } from "@/components/dashboard/employee/shift-closing-form";
import { ShiftCompletedModal } from "@/components/dashboard/employee/shift-completed-modal";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, syncWithServer, hasSeenTour, locations, savedLocationId, startShift, lastClosedShiftId, currentShift, resetCloseShiftError, hydrateFromServer } = useStore();
  const router = useRouter();
  const [showClosingForm, setShowClosingForm] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Get assigned location
  const assignedLocation = locations.find(loc => 
    loc.id === savedLocationId || loc.id === currentUser?.assignedPointId
  );

  const handleStartShift = () => {
    if (!currentUser?.id) return;
    // Используем assignedLocation.id или savedLocationId или assignedPointId
    const locationId = assignedLocation?.id || savedLocationId || currentUser.assignedPointId;
    if (!locationId) {
      console.error('Cannot start shift: no locationId available');
      return;
    }
    startShift(locationId, currentUser.id);
  };
  
  // Check authentication and redirect if needed
  useEffect(() => {
    // Проверяем аутентификацию сразу, без задержек
    // zustand persist загружается синхронно при первом обращении
    setIsChecking(false);
  }, []); // Run only once on mount

  // Handle redirects after checking is complete
  useEffect(() => {
    if (isChecking) return; // Wait for initial check to complete
    
    // If no user, redirect to login
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    // If user exists but not employee, redirect to director
    if (currentUser.role !== 'employee') {
      router.push('/dashboard/director');
      return;
    }
  }, [isChecking, currentUser, router]);

  // Auto-sync on mount if user is logged in (only once)
  // Делаем синхронизацию асинхронной и не блокирующей рендер
  useEffect(() => {
    if (currentUser && currentUser.role === 'employee' && !isChecking) {
      // Выполняем синхронизацию в фоне, не блокируя рендер
      Promise.all([
        syncWithServer().catch(err => console.error('Sync error:', err)),
        hydrateFromServer().catch(err => console.error('Hydrate error:', err))
      ]).catch(() => {
        // Игнорируем ошибки синхронизации, чтобы не блокировать рендер
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, isChecking]); // Only sync when user ID changes or checking completes

  const handleCloseShift = () => {
    // Не открываем модалку, если нет активной смены
    if (!currentShift) {
      console.warn('Cannot open close shift modal: no active shift');
      return;
    }
    setShowClosingForm(true);
  };

  const handleCloseSuccess = () => {
    setShowClosingForm(false);
    // Показываем модалку "Смена завершена" после успешного закрытия
    setShowCompletedModal(true);
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setShowClosingForm(false);
      // Очищаем ошибку при закрытии модалки
      resetCloseShiftError();
    } else {
      setShowClosingForm(true);
    }
  };

  // Show loading only while checking auth (не более 1 секунды)
  // Если проверка затягивается, показываем страницу с редиректом
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  // Если нет пользователя или не сотрудник - редирект уже обрабатывается в useEffect
  // Но показываем страницу, чтобы не было чёрного экрана
  if (!currentUser || currentUser.role !== 'employee') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-muted-foreground">Перенаправление...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* HEADER: Fixed Height */}
      <header className="flex-shrink-0 border-b border-[var(--border-color)] bg-[var(--surface-1)] backdrop-blur z-40">
        <EmployeeHeader 
          onCloseShift={handleCloseShift}
          onStartShift={handleStartShift}
          locationName={assignedLocation?.name}
        />
      </header>

      {/* PAGES: Allow scrolling */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>

      {/* Shift Closing Form */}
      <ShiftClosingForm
        isOpen={showClosingForm}
        onClose={() => handleCloseModal(false)}
        onSuccess={handleCloseSuccess}
      />

      {/* Shift Completed Modal */}
      <ShiftCompletedModal
        isOpen={showCompletedModal}
        onClose={() => setShowCompletedModal(false)}
        shiftId={lastClosedShiftId}
      />

      {/* Toast Container - Global */}
      <ToastContainer />
      
      {/* Onboarding Tour - Show if not seen */}
      {!hasSeenTour && <OnboardingTour />}
    </div>
  );
}
