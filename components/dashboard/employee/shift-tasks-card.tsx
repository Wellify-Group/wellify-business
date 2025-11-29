"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { CheckCircle2, Circle } from "lucide-react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function ShiftTasksCard() {
  const { t } = useLanguage();
  const { currentShift, currentUser, savedLocationId } = useStore();

  // TODO: Загружать реальные задачи из API/store
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Открыть смену", completed: true },
    { id: "2", text: "Протереть бар", completed: false },
    { id: "3", text: "Заполнить чек-лист", completed: false },
  ]);

  const toggleTask = async (taskId: string) => {
    if (!currentShift || !currentUser || !savedLocationId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Если задача уже выполнена, не создаем событие повторно
    if (task.completed) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: false } : t));
      return;
    }

    // Обновляем локальное состояние
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));

    // Создаем событие выполнения задачи
    try {
      const response = await fetch('/api/shift-events/checklist-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: currentUser.businessId,
          point_id: savedLocationId,
          shift_id: currentShift.id,
          employee_id: currentUser.id,
          task_id: taskId,
          task_name: task.text,
        }),
      });

      if (!response.ok) {
        console.error('Failed to create checklist task event');
        // Откатываем изменение при ошибке
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: false } : t));
      }
    } catch (error) {
      console.error('Error creating checklist task event:', error);
      // Откатываем изменение при ошибке
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: false } : t));
    }
  };

  const taskCount = tasks.length;

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <header className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-800">
          {t("dashboard.today_tasks") || "ЗАДАЧИ НА СЕГОДНЯ"}
        </h3>
      </header>

      <ul className="space-y-2 text-sm">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleTask(task.id)}
              className={`h-4 w-4 rounded-full border flex-shrink-0 transition-colors flex items-center justify-center ${
                task.completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-border hover:border-emerald-500'
              }`}
            >
              {task.completed && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
            </button>
            <span
              className={`text-sm text-neutral-800 flex-1 ${
                task.completed ? "line-through text-neutral-500" : ""
              }`}
            >
              {task.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

