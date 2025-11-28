"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { MonitoringPreferences } from "@/lib/user-settings";
import { Save } from "lucide-react";

interface MonitoringSettingsProps {
  userId: string;
  role: 'director' | 'manager';
}

export function MonitoringSettings({ userId, role }: MonitoringSettingsProps) {
  const { currentUser } = useStore();
  const [preferences, setPreferences] = useState<MonitoringPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/user-settings?userId=${userId}&role=${role}`);
      const data = await response.json();
      
      if (data.success && data.settings) {
        setPreferences(data.settings.monitoring_preferences || {});
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          monitoring_preferences: preferences,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Показываем уведомление об успехе
        alert('Настройки сохранены');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (path: string[], value: boolean) => {
    setPreferences(prev => {
      const newPrefs = { ...prev };
      let current: any = newPrefs;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newPrefs;
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Мониторинг смен
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Настройте, какие метрики отображать на дашборде
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {/* Операционная нагрузка */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Операционная нагрузка
        </h3>
        <div className="space-y-3">
          {[
            { key: 'timeBetweenChecks', label: 'Время между чеками' },
            { key: 'avgTimeBetweenOrders', label: 'Среднее время между заказами' },
            { key: 'checksPerHour', label: 'Количество чеков в час' },
            { key: 'idlePeriods', label: 'Пустые периоды (> 20 минут без чека)' },
            { key: 'peakHours', label: 'Пиковые часы продаж' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
              <input
                type="checkbox"
                checked={preferences.operationalMetrics?.[item.key as keyof typeof preferences.operationalMetrics] ?? false}
                onChange={(e) => updatePreference(['operationalMetrics', item.key], e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Финансовая структура */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Финансовая структура
        </h3>
        <div className="space-y-3">
          {[
            { key: 'cashShare', label: 'Доля налички' },
            { key: 'cardShare', label: 'Доля карты' },
            { key: 'avgCheckDeviation', label: 'Среднее отклонение чека от среднего по точке' },
            { key: 'planByHours', label: 'Выполнение плана по часам' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
              <input
                type="checkbox"
                checked={preferences.financialMetrics?.[item.key as keyof typeof preferences.financialMetrics] ?? false}
                onChange={(e) => updatePreference(['financialMetrics', item.key], e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Качество работы */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Качество работы
        </h3>
        <div className="space-y-3">
          {[
            { key: 'cancelledChecks', label: 'Количество и сумма отмененных чеков' },
            { key: 'cancelledChecksShare', label: 'Доля отмененных чеков' },
            { key: 'problemReactionTime', label: 'Время реакции на проблемы' },
            { key: 'checklistViolations', label: 'Нарушения чек-листа' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
              <input
                type="checkbox"
                checked={preferences.qualityMetrics?.[item.key as keyof typeof preferences.qualityMetrics] ?? false}
                onChange={(e) => updatePreference(['qualityMetrics', item.key], e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}









