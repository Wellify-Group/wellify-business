import { Problem, ProblemSource } from './problem-types';
import { Location, Shift, User } from './store';

/**
 * Получает менеджера для проблемы по правилам:
 * 1. Если есть employeeId: ищем смену сотрудника за сегодня; если у смены есть managerId - берём его; иначе берём location.managerId
 * 2. Если employeeId нет, но есть locationId: берём location.managerId
 * 3. Если ни смены, ни менеджера - возвращаем null
 */
export function getManagerForProblem(
  problem: Problem,
  shifts: Shift[],
  locations: Location[],
  employees: User[]
): User | null {
  // Если есть employeeId
  if (problem.employeeId) {
    // Ищем смену сотрудника за сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = new Date(today).setHours(23, 59, 59, 999);

    const employeeShift = shifts.find(s => 
      s.employeeId === problem.employeeId &&
      s.date >= todayStart &&
      s.date <= todayEnd
    );

    // Если у смены есть managerId (через locationId)
    if (employeeShift?.locationId) {
      const location = locations.find(l => l.id === employeeShift.locationId);
      if (location?.managerId) {
        const manager = employees.find(e => e.id === location.managerId);
        if (manager) return manager;
      }
    }

    // Иначе берём location.managerId по problem.locationId
    if (problem.locationId) {
      const location = locations.find(l => l.id === problem.locationId);
      if (location?.managerId) {
        const manager = employees.find(e => e.id === location.managerId);
        if (manager) return manager;
      }
    }
  }

  // Если employeeId нет, но есть locationId
  if (!problem.employeeId && problem.locationId) {
    const location = locations.find(l => l.id === problem.locationId);
    if (location?.managerId) {
      const manager = employees.find(e => e.id === location.managerId);
      if (manager) return manager;
    }
  }

  return null;
}














