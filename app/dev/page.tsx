"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useStore from "@/lib/store";

/**
 * Страница для быстрого доступа к дашбордам в режиме разработки
 * Устанавливает мок-пользователя и перенаправляет на нужный дашборд
 * 
 * Использование:
 * /dev?role=director - доступ к дашборду директора
 * /dev?role=manager - доступ к дашборду менеджера
 * /dev?role=employee - доступ к дашборду сотрудника
 */
export default function DevAccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Получаем роль из URL параметров
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'director'; // По умолчанию директор

    // Создаём мок-пользователя
    const mockUser = {
      id: `dev-${role}-${Date.now()}`,
      name: `Dev ${role}`,
      fullName: `Development ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      firstName: 'Dev',
      lastName: role.charAt(0).toUpperCase() + role.slice(1),
      role: role as 'director' | 'manager' | 'employee',
      email: `dev-${role}@example.com`,
      businessId: 'dev-business-123',
      companyCode: '1000-2000-3000-4000',
      status: 'active' as const,
      phone: '+380501234567',
      assignedPointId: role === 'employee' ? 'dev-location-1' : undefined,
    };

    // Устанавливаем мок-данные для работы дашборда
    if (role === 'director' || role === 'manager') {
      // Мок-локации для директора/менеджера
      useStore.setState({
        currentUser: mockUser,
        user: mockUser,
        locations: [
          {
            id: 'dev-location-1',
            name: 'Тестовая локация 1',
            address: 'ул. Тестовая, 1',
            businessId: 'dev-business-123',
            status: 'active',
            accessCode: '1111-2222-3333-4444',
          },
          {
            id: 'dev-location-2',
            name: 'Тестовая локация 2',
            address: 'ул. Тестовая, 2',
            businessId: 'dev-business-123',
            status: 'active',
            accessCode: '2222-3333-4444-5555',
          },
        ],
        employees: [
          {
            id: 'dev-employee-1',
            name: 'Иван Иванов',
            role: 'employee',
            businessId: 'dev-business-123',
            assignedPointId: 'dev-location-1',
            status: 'active',
          },
        ],
        shifts: [],
        businessName: 'Тестовый бизнес',
        currency: '₴',
      });
    } else if (role === 'employee') {
      // Мок-локация для сотрудника
      useStore.setState({
        currentUser: mockUser,
        user: mockUser,
        locations: [
          {
            id: 'dev-location-1',
            name: 'Моя локация',
            address: 'ул. Тестовая, 1',
            businessId: 'dev-business-123',
            status: 'active',
            accessCode: '1111-2222-3333-4444',
          },
        ],
        savedLocationId: 'dev-location-1',
        businessName: 'Тестовый бизнес',
        currency: '₴',
      });
    }

    // Перенаправляем на соответствующий дашборд
    const dashboardPath = role === 'employee' 
      ? '/dashboard/employee?dev=true'
      : role === 'manager'
      ? '/dashboard/manager?dev=true'
      : '/dashboard/director?dev=true';

    router.push(dashboardPath);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Режим разработки</h1>
        <p className="text-gray-600 mb-4">Перенаправление на дашборд...</p>
        <div className="text-sm text-gray-500">
          <p>Используй:</p>
          <p>/dev?role=director - для директора</p>
          <p>/dev?role=manager - для менеджера</p>
          <p>/dev?role=employee - для сотрудника</p>
        </div>
      </div>
    </div>
  );
}
