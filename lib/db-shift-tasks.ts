/**
 * Функции для работы с задачами смены в файловой системе
 * 
 * Файлы хранятся как: data/shift-tasks/{shiftId}/{taskId}.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ShiftTask } from './shift-tasks';

const SHIFT_TASKS_DIR = path.join(process.cwd(), 'data', 'shift-tasks');

/**
 * Ensures a directory exists, creating it recursively if needed
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Сохраняет задачу смены в файловую систему
 * Path structure: data/shift-tasks/{shiftId}/{taskId}.json
 */
export async function saveShiftTask(task: ShiftTask): Promise<void> {
  const shiftDir = path.join(SHIFT_TASKS_DIR, task.shiftId);
  await ensureDirectoryExists(shiftDir);
  
  const filename = `${task.id}.json`;
  const filePath = path.join(shiftDir, filename);
  
  const taskData = JSON.stringify(task, null, 2);
  await fs.writeFile(filePath, taskData, 'utf-8');
}

/**
 * Получает все задачи для конкретной смены
 * @param shiftId - ID смены
 * @returns Массив задач
 */
export async function getShiftTasks(shiftId: string): Promise<ShiftTask[]> {
  const shiftDir = path.join(SHIFT_TASKS_DIR, shiftId);
  
  try {
    await fs.access(shiftDir);
  } catch {
    // Директория не существует, возвращаем пустой массив
    return [];
  }
  
  try {
    const files = await fs.readdir(shiftDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const tasks: ShiftTask[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(shiftDir, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const task: ShiftTask = JSON.parse(fileContent);
        tasks.push(task);
      } catch (error) {
        console.error(`Error reading shift task file ${filePath}:`, error);
        continue;
      }
    }
    
    return tasks;
  } catch (error) {
    console.error(`Error reading shift tasks directory ${shiftDir}:`, error);
    return [];
  }
}

/**
 * Получает задачу по ID
 * @param shiftId - ID смены
 * @param taskId - ID задачи
 * @returns Задача или null если не найдена
 */
export async function getShiftTaskById(shiftId: string, taskId: string): Promise<ShiftTask | null> {
  const shiftDir = path.join(SHIFT_TASKS_DIR, shiftId);
  const filePath = path.join(shiftDir, `${taskId}.json`);
  
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const task: ShiftTask = JSON.parse(fileContent);
    return task;
  } catch {
    return null;
  }
}

/**
 * Обновляет задачу
 * @param shiftId - ID смены
 * @param taskId - ID задачи
 * @param updates - Частичные данные для обновления
 * @returns Обновленная задача или null если не найдена
 */
export async function updateShiftTask(
  shiftId: string,
  taskId: string,
  updates: Partial<ShiftTask>
): Promise<ShiftTask | null> {
  const existingTask = await getShiftTaskById(shiftId, taskId);
  
  if (!existingTask) {
    return null;
  }
  
  const updatedTask: ShiftTask = {
    ...existingTask,
    ...updates,
  };
  
  await saveShiftTask(updatedTask);
  return updatedTask;
}

/**
 * Получает статистику выполнения задач для смены
 * @param shiftId - ID смены
 * @returns Статистика выполнения задач
 */
export async function getShiftTasksStats(shiftId: string): Promise<{
  total: number;
  completed: number;
  completionPercent: number;
}> {
  const tasks = await getShiftTasks(shiftId);
  
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const completionPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  return {
    total,
    completed,
    completionPercent,
  };
}

/**
 * Инициализирует задачи для смены (создает моковые задачи, если их еще нет)
 * @param shiftId - ID смены
 * @param employeeId - ID сотрудника
 * @param locationId - ID точки
 * @returns Массив созданных задач
 */
export async function initializeShiftTasks(
  shiftId: string,
  employeeId: string,
  locationId: string
): Promise<ShiftTask[]> {
  // Проверяем, есть ли уже задачи для этой смены
  const existingTasks = await getShiftTasks(shiftId);
  
  if (existingTasks.length > 0) {
    return existingTasks;
  }
  
  // Создаем моковые задачи (можно будет заменить на загрузку из шаблона точки)
  const mockTasks: Omit<ShiftTask, 'id'>[] = [
    {
      shiftId,
      employeeId,
      title: "Открыть смену",
      details: "Проверить оборудование и подготовить рабочее место",
      completed: false,
      completedAt: null,
    },
    {
      shiftId,
      employeeId,
      title: "Протереть бар",
      details: "Очистить все поверхности бара",
      completed: false,
      completedAt: null,
    },
    {
      shiftId,
      employeeId,
      title: "Заполнить чек-лист",
      details: "Проверить все пункты чек-листа открытия",
      completed: false,
      completedAt: null,
    },
    {
      shiftId,
      employeeId,
      title: "Проверить наличие ингредиентов",
      details: "Убедиться, что все необходимые ингредиенты в наличии",
      completed: false,
      completedAt: null,
    },
    {
      shiftId,
      employeeId,
      title: "Подготовить десерты",
      details: "Достать и подготовить десерты к продаже",
      completed: false,
      completedAt: null,
    },
    {
      shiftId,
      employeeId,
      title: "Проверить музыку",
      details: "Убедиться, что музыка играет на нужной громкости",
      completed: false,
      completedAt: null,
    },
  ];
  
  const tasks: ShiftTask[] = mockTasks.map((task, index) => ({
    ...task,
    id: `task-${shiftId}-${index + 1}`,
  }));
  
  // Сохраняем все задачи
  for (const task of tasks) {
    await saveShiftTask(task);
  }
  
  return tasks;
}







