/**
 * Модель пользовательских настроек мониторинга
 */

export interface MonitoringPreferences {
  showOperationalLoad?: boolean;
  showFinancialStructure?: boolean;
  showQualityMetrics?: boolean;
  operationalMetrics?: {
    timeBetweenChecks?: boolean;
    avgTimeBetweenOrders?: boolean;
    checksPerHour?: boolean;
    idlePeriods?: boolean;
    peakHours?: boolean;
  };
  financialMetrics?: {
    cashShare?: boolean;
    cardShare?: boolean;
    avgCheckDeviation?: boolean;
    planByHours?: boolean;
  };
  qualityMetrics?: {
    cancelledChecks?: boolean;
    cancelledChecksShare?: boolean;
    problemReactionTime?: boolean;
    checklistViolations?: boolean;
  };
}

export interface UserSettings {
  id: string;
  user_id: string;
  role: 'director' | 'manager';
  monitoring_preferences: MonitoringPreferences;
  created_at: string;
  updated_at: string;
}

/**
 * Дефолтные настройки мониторинга
 */
export const DEFAULT_MONITORING_PREFERENCES: MonitoringPreferences = {
  showOperationalLoad: true,
  showFinancialStructure: true,
  showQualityMetrics: false,
  operationalMetrics: {
    timeBetweenChecks: true,
    avgTimeBetweenOrders: true,
    checksPerHour: true,
    idlePeriods: true,
    peakHours: true,
  },
  financialMetrics: {
    cashShare: true,
    cardShare: true,
    avgCheckDeviation: true,
    planByHours: false,
  },
  qualityMetrics: {
    cancelledChecks: false,
    cancelledChecksShare: false,
    problemReactionTime: false,
    checklistViolations: false,
  },
};









