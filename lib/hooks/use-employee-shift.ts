import useStore from "@/lib/store";
import { useCallback } from "react";

export function useEmployeeShift() {
  const currentUser = useStore((state) => state.currentUser);
  const currentShift = useStore((state) => state.currentShift);
  const savedLocationId = useStore((state) => state.savedLocationId);
  
  // Безопасное получение функции из стора
  // Используем селектор, чтобы избежать лишних ререндеров при обновлении других частей стора
  const fetchShiftFromStore = useStore((state) => state.fetchCurrentShift);

  const fetchCurrentShift = useCallback(async () => {
    // 1. Пробуем вызвать функцию из стора
    if (typeof fetchShiftFromStore === 'function') {
      await fetchShiftFromStore();
      return;
    }

    // 2. Fallback реализация, если в сторе функции нет (защита от TypeError)
    console.warn('fetchCurrentShift not found in store, using fallback implementation');
    
    if (!currentUser?.id) return;
    
    const locationId = savedLocationId || currentUser.assignedPointId;
    
    try {
      const res = await fetch(`/api/employee/shifts/active?employeeId=${encodeURIComponent(currentUser.id)}${locationId ? `&locationId=${encodeURIComponent(locationId)}` : ''}`);
      
      if (!res.ok) return;
      
      const data = await res.json();
      
      if (data.success && data.shift) {
        // Обновляем стор напрямую через setState, так как функция недоступна
        useStore.setState((state) => ({
          currentShift: {
            id: data.shift.id,
            startTime: data.shift.startTime,
            locationId: data.shift.locationId,
            employeeId: data.shift.employeeId,
            status: data.shift.status === 'active' ? 'active' : 'closed',
            readableNumber: data.shift.readableNumber,
            totalRevenue: data.shift.totalRevenue,
            totalChecks: data.shift.totalChecks,
            totalGuests: data.shift.totalGuests,
          },
          shiftEndTime: null,
        }));
      }
    } catch (error) {
      console.error('Fallback fetchCurrentShift error:', error);
    }
  }, [fetchShiftFromStore, currentUser, savedLocationId]);

  return {
    currentShift,
    fetchCurrentShift,
  };
}



