"use client";

import { useState, useCallback, useMemo } from "react";
import { ShiftTask } from "@/lib/shift-tasks";
import { useToast } from "@/components/ui/toast";

interface UseShiftTasksReturn {
  tasks: ShiftTask[];
  totalTasksCount: number;
  completedTasksCount: number;
  completionPercent: number;
  isLoading: boolean;
  error: string | null;
  loadTasksForShift: (shiftId: string) => Promise<void>;
  toggleTask: (taskId: string) => void;
  setTasks: (tasks: ShiftTask[]) => void;
}

export function useShiftTasks(): UseShiftTasksReturn {
  const [tasks, setTasks] = useState<ShiftTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: toastError } = useToast();

  // Вычисляемые значения
  const totalTasksCount = useMemo(() => {
    return tasks.length;
  }, [tasks]);

  const completedTasksCount = useMemo(() => {
    return tasks.filter(t => t.completed).length;
  }, [tasks]);

  const completionPercent = useMemo(() => {
    if (totalTasksCount === 0) return 100;
    return Math.round((completedTasksCount / totalTasksCount) * 100);
  }, [totalTasksCount, completedTasksCount]);

  // Загрузка задач для смены
  const loadTasksForShift = useCallback(async (shiftId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/shifts/${shiftId}/tasks`);
      
      if (!response.ok) {
        throw new Error("Не удалось загрузить задачи");
      }

      const data = await response.json();
      
      if (data.success && data.tasks) {
        setTasks(data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      console.error("Error loading tasks:", err);
      setError(err.message || "Не удалось загрузить задачи");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Переключение состояния задачи
  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const shiftId = task.shiftId;
    if (!shiftId) {
      console.error('Task does not have shiftId');
      return;
    }

    // Сохраняем предыдущее состояние для возможного отката
    const previousState = { ...task };
    const newCompleted = !task.completed;
    const newCompletedAt = newCompleted ? new Date().toISOString() : null;

    // Оптимистично обновляем состояние локально
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId
          ? { ...t, completed: newCompleted, completedAt: newCompletedAt }
          : t
      )
    );

    // Отправляем запрос на сервер
    try {
      const response = await fetch(`/api/shifts/${shiftId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: newCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось обновить задачу');
      }

      const data = await response.json();
      
      if (data.success && data.task) {
        // Обновляем задачу данными с сервера
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === taskId ? data.task : t
          )
        );
      }
    } catch (err: any) {
      console.error('Error updating task:', err);
      
      // Откатываем изменение при ошибке
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? previousState : t
        )
      );
      
      toastError('Не удалось обновить задачу. Попробуйте еще раз.');
    }
  }, [tasks, toastError]);

  return {
    tasks,
    totalTasksCount,
    completedTasksCount,
    completionPercent,
    isLoading,
    error,
    loadTasksForShift,
    toggleTask,
    setTasks,
  };
}

