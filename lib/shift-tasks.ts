/**
 * Типы и интерфейсы для задач смены
 */

export interface ShiftTask {
  id: string;
  shiftId: string;      // ID смены
  employeeId: string;   // ID сотрудника
  title: string;        // краткое название (например "Открыть смену")
  details?: string | null;     // дополнительная информация (например "Проверить оборудование и подготовить рабочее место")
  completed: boolean;
  completedAt?: string | null; // ISO
}

