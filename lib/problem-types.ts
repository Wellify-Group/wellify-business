// Единая модель проблемы
export type ProblemCategory = 'finance' | 'personnel' | 'operations';

export type ProblemSource =
  | 'EMPLOYEE_MISSED_REPORT'
  | 'LOW_ACTIVITY'
  | 'NO_MANAGER_ASSIGNED'
  | 'LOW_PLAN_PERFORMANCE'
  | 'CASH_DISCREPANCY'
  | 'SHIFT_ISSUE';

export type ProblemSeverity = 'info' | 'warning' | 'critical';

export type ProblemEntityType = 'employee' | 'location' | 'shift';

export type ProblemStatus = 'open' | 'in_progress' | 'resolved';

export interface Problem {
  id: string;
  title: string;
  description?: string;
  category: ProblemCategory;
  source: ProblemSource;
  severity: ProblemSeverity;
  entityType: ProblemEntityType;
  employeeId?: string;
  locationId?: string;
  shiftId?: string;
  status: ProblemStatus;
  isPinned?: boolean;
  assigneeId?: string;
  createdAt: string;
}

// Маппинг source → category, severity, title
export interface ProblemSourceConfig {
  category: ProblemCategory;
  severity: ProblemSeverity;
  title: string;
  description?: (payload: any) => string;
}

const PROBLEM_SOURCE_CONFIG: Record<ProblemSource, ProblemSourceConfig> = {
  EMPLOYEE_MISSED_REPORT: {
    category: 'personnel',
    severity: 'warning',
    title: 'Отсутствует отчёт у сотрудника',
    description: (payload: { employeeName: string }) => 
      `У сотрудника ${payload.employeeName} отсутствует отчёт за сегодня.`
  },
  LOW_ACTIVITY: {
    category: 'operations',
    severity: 'warning',
    title: 'Низкая операционная активность',
    description: (payload: { locationName: string; planPercent: number }) =>
      `Зафиксирована низкая операционная активность на точке ${payload.locationName} (${payload.planPercent}% от плана).`
  },
  NO_MANAGER_ASSIGNED: {
    category: 'operations',
    severity: 'critical',
    title: 'Не назначен менеджер',
    description: (payload: { locationName: string }) =>
      `На точке ${payload.locationName} отсутствует назначенный менеджер.`
  },
  LOW_PLAN_PERFORMANCE: {
    category: 'finance',
    severity: 'warning',
    title: 'Низкое выполнение плана',
    description: (payload: { locationName: string; planPercent: number }) =>
      `Низкое выполнение плана на точке ${payload.locationName} (${payload.planPercent}%).`
  },
  CASH_DISCREPANCY: {
    category: 'finance',
    severity: 'critical',
    title: 'Несоответствие кассы',
    description: (payload: { locationName: string }) =>
      `Обнаружено несоответствие кассы на точке ${payload.locationName}.`
  },
  SHIFT_ISSUE: {
    category: 'operations',
    severity: 'critical',
    title: 'Проблема со сменой',
    description: (payload: { locationName: string }) =>
      `Обнаружена проблема со сменой на точке ${payload.locationName}.`
  }
};

/**
 * Создаёт проблему из source с автоматическим определением категории и severity
 */
export function createProblemFromSource(
  source: ProblemSource,
  payload: {
    employeeId?: string;
    locationId?: string;
    shiftId?: string;
    employeeName?: string;
    locationName?: string;
    planPercent?: number;
    [key: string]: any;
  }
): Omit<Problem, 'id' | 'createdAt' | 'status'> {
  const config = PROBLEM_SOURCE_CONFIG[source];
  
  // Определяем entityType
  let entityType: ProblemEntityType = 'location';
  if (payload.employeeId) {
    entityType = 'employee';
  } else if (payload.shiftId) {
    entityType = 'shift';
  }

  return {
    title: config.title,
    description: config.description ? config.description(payload) : undefined,
    category: config.category,
    source,
    severity: config.severity,
    entityType,
    employeeId: payload.employeeId,
    locationId: payload.locationId,
    shiftId: payload.shiftId,
    isPinned: false,
  };
}

/**
 * Получает конфигурацию для source
 */
export function getProblemSourceConfig(source: ProblemSource): ProblemSourceConfig {
  return PROBLEM_SOURCE_CONFIG[source];
}














