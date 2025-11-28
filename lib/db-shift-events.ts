/**
 * Функции для работы с событиями смены в файловой системе
 * 
 * Файлы хранятся как: data/shift-events/{shiftId}/{eventId}.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ShiftEvent, ShiftEventType } from './shift-events';

const SHIFT_EVENTS_DIR = path.join(process.cwd(), 'data', 'shift-events');

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
 * Сохраняет событие смены в файловую систему
 * Path structure: data/shift-events/{shiftId}/{eventId}.json
 */
export async function saveShiftEvent(event: ShiftEvent): Promise<void> {
  const shiftDir = path.join(SHIFT_EVENTS_DIR, event.shift_id);
  await ensureDirectoryExists(shiftDir);
  
  const filename = `${event.id}.json`;
  const filePath = path.join(shiftDir, filename);
  
  const eventData = JSON.stringify(event, null, 2);
  await fs.writeFile(filePath, eventData, 'utf-8');
}

/**
 * Получает все события для конкретной смены
 * @param shiftId - ID смены
 * @returns Массив событий, отсортированный по времени создания
 */
export async function getShiftEvents(shiftId: string): Promise<ShiftEvent[]> {
  const shiftDir = path.join(SHIFT_EVENTS_DIR, shiftId);
  
  try {
    await fs.access(shiftDir);
  } catch {
    // Директория не существует, возвращаем пустой массив
    return [];
  }
  
  try {
    const files = await fs.readdir(shiftDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const events: ShiftEvent[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(shiftDir, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const event: ShiftEvent = JSON.parse(fileContent);
        events.push(event);
      } catch (error) {
        console.error(`Error reading shift event file ${filePath}:`, error);
        continue;
      }
    }
    
    // Сортируем по времени создания
    events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    return events;
  } catch (error) {
    console.error(`Error reading shift events directory ${shiftDir}:`, error);
    return [];
  }
}

/**
 * Получает события определенного типа для смены
 * @param shiftId - ID смены
 * @param eventType - Тип события
 * @returns Массив событий указанного типа
 */
export async function getShiftEventsByType(
  shiftId: string,
  eventType: ShiftEventType
): Promise<ShiftEvent[]> {
  const allEvents = await getShiftEvents(shiftId);
  return allEvents.filter(event => event.type === eventType);
}

/**
 * Получает все события для нескольких смен
 * @param shiftIds - Массив ID смен
 * @returns Объект с ключами shiftId и значениями массивами событий
 */
export async function getMultipleShiftEvents(
  shiftIds: string[]
): Promise<Record<string, ShiftEvent[]>> {
  const result: Record<string, ShiftEvent[]> = {};
  
  for (const shiftId of shiftIds) {
    result[shiftId] = await getShiftEvents(shiftId);
  }
  
  return result;
}

/**
 * Получает события для точки за период
 * @param pointId - ID точки
 * @param startDate - Начальная дата (ISO string)
 * @param endDate - Конечная дата (ISO string)
 * @returns Массив событий
 */
export async function getPointEventsByPeriod(
  pointId: string,
  startDate: string,
  endDate: string
): Promise<ShiftEvent[]> {
  try {
    await fs.access(SHIFT_EVENTS_DIR);
  } catch {
    return [];
  }
  
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  const allEvents: ShiftEvent[] = [];
  
  try {
    const shiftDirs = await fs.readdir(SHIFT_EVENTS_DIR);
    
    for (const shiftDir of shiftDirs) {
      const shiftDirPath = path.join(SHIFT_EVENTS_DIR, shiftDir);
      const stat = await fs.stat(shiftDirPath);
      
      if (!stat.isDirectory()) continue;
      
      const files = await fs.readdir(shiftDirPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(shiftDirPath, file);
        
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const event: ShiftEvent = JSON.parse(fileContent);
          
          // Фильтруем по pointId и дате
          if (event.point_id === pointId) {
            const eventTime = new Date(event.created_at).getTime();
            if (eventTime >= start && eventTime <= end) {
              allEvents.push(event);
            }
          }
        } catch (error) {
          console.error(`Error reading shift event file ${filePath}:`, error);
          continue;
        }
      }
    }
    
    // Сортируем по времени создания
    allEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    return allEvents;
  } catch (error) {
    console.error(`Error reading shift events directory:`, error);
    return [];
  }
}









