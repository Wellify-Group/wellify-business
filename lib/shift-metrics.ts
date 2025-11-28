/**
 * Сервис для расчета метрик смены на основе событий
 */

import { ShiftEvent, ShiftEventType, ShiftBasicMetrics, ShiftOperationalMetrics, ShiftFinancialMetrics, ShiftQualityMetrics } from './shift-events';
import { getShiftEvents } from './db-shift-events';

/**
 * Получает базовые метрики смены
 */
export async function getShiftBasicMetrics(shiftId: string): Promise<ShiftBasicMetrics> {
  const events = await getShiftEvents(shiftId);
  
  // Инициализация
  let total_revenue = 0;
  let total_cash = 0;
  let total_card = 0;
  let checks_count = 0;
  let tasks_completed = 0;
  let tasks_total = 0;
  let problems_count = 0;
  const problems_by_category: Record<string, number> = {};
  const problems_by_severity: Record<string, number> = {};
  
  // Обрабатываем события
  for (const event of events) {
    switch (event.type) {
      case ShiftEventType.ORDER_CREATED: {
        const payload = event.payload as any;
        total_revenue += payload.total_amount || 0;
        checks_count++;
        
        if (payload.payment_method === 'cash') {
          total_cash += payload.total_amount || 0;
        } else if (payload.payment_method === 'card' || payload.payment_method === 'online') {
          total_card += payload.total_amount || 0;
        }
        break;
      }
      
      case ShiftEventType.CHECKLIST_TASK_COMPLETED: {
        tasks_completed++;
        break;
      }
      
      case ShiftEventType.PROBLEM_REPORTED: {
        const payload = event.payload as any;
        problems_count++;
        
        const category = payload.category || 'unknown';
        const severity = payload.severity || 'unknown';
        
        problems_by_category[category] = (problems_by_category[category] || 0) + 1;
        problems_by_severity[severity] = (problems_by_severity[severity] || 0) + 1;
        break;
      }
      
      case ShiftEventType.SHIFT_CLOSED: {
        const payload = event.payload as any;
        // Используем данные из события закрытия, если они есть
        if (payload.tasks_total !== undefined) {
          tasks_total = payload.tasks_total;
        }
        break;
      }
    }
  }
  
  // Если tasks_total не был установлен из SHIFT_CLOSED, пытаемся определить из других источников
  // Для простоты, если есть завершенные задачи, предполагаем что общее количество >= завершенных
  if (tasks_total === 0 && tasks_completed > 0) {
    tasks_total = tasks_completed; // Минимум столько, сколько выполнено
  }
  
  const tasks_completion_percent = tasks_total > 0 
    ? (tasks_completed / tasks_total) * 100 
    : 0;
  
  return {
    total_revenue,
    total_cash,
    total_card,
    checks_count,
    tasks_completed,
    tasks_total,
    tasks_completion_percent,
    problems_count,
    problems_by_category,
    problems_by_severity,
  };
}

/**
 * Получает операционные метрики смены
 */
export async function getShiftOperationalMetrics(shiftId: string): Promise<ShiftOperationalMetrics> {
  const events = await getShiftEvents(shiftId);
  
  // Получаем все события ORDER_CREATED
  const orderEvents = events.filter(e => e.type === ShiftEventType.ORDER_CREATED);
  
  // Вычисляем время между чеками
  const time_between_checks: number[] = [];
  for (let i = 1; i < orderEvents.length; i++) {
    const prevTime = new Date(orderEvents[i - 1].created_at).getTime();
    const currTime = new Date(orderEvents[i].created_at).getTime();
    const diffSeconds = (currTime - prevTime) / 1000;
    time_between_checks.push(diffSeconds);
  }
  
  // Среднее время между заказами
  const avg_time_between_orders = time_between_checks.length > 0
    ? time_between_checks.reduce((a, b) => a + b, 0) / time_between_checks.length
    : 0;
  
  // Определяем время начала и конца смены
  const shiftStartEvent = events.find(e => e.type === ShiftEventType.SHIFT_STARTED);
  const shiftCloseEvent = events.find(e => e.type === ShiftEventType.SHIFT_CLOSED);
  
  const shiftStart = shiftStartEvent ? new Date(shiftStartEvent.created_at).getTime() : null;
  const shiftEnd = shiftCloseEvent ? new Date(shiftCloseEvent.created_at).getTime() : Date.now();
  
  // Количество чеков в час
  const shiftDurationHours = shiftStart 
    ? (shiftEnd - shiftStart) / (1000 * 60 * 60)
    : 1; // Если нет времени начала, предполагаем 1 час
  const checks_per_hour = shiftDurationHours > 0 
    ? orderEvents.length / shiftDurationHours 
    : 0;
  
  // Пустые периоды (> 20 минут без чека)
  const idle_periods: Array<{ start: string; end: string; duration_minutes: number }> = [];
  const IDLE_THRESHOLD_MS = 20 * 60 * 1000; // 20 минут в миллисекундах
  
  if (shiftStart) {
    let lastOrderTime = shiftStart;
    
    for (const orderEvent of orderEvents) {
      const orderTime = new Date(orderEvent.created_at).getTime();
      const gap = orderTime - lastOrderTime;
      
      if (gap > IDLE_THRESHOLD_MS) {
        idle_periods.push({
          start: new Date(lastOrderTime).toISOString(),
          end: new Date(orderTime).toISOString(),
          duration_minutes: gap / (1000 * 60),
        });
      }
      
      lastOrderTime = orderTime;
    }
    
    // Проверяем период после последнего чека до конца смены
    if (shiftEnd && lastOrderTime < shiftEnd) {
      const gap = shiftEnd - lastOrderTime;
      if (gap > IDLE_THRESHOLD_MS) {
        idle_periods.push({
          start: new Date(lastOrderTime).toISOString(),
          end: new Date(shiftEnd).toISOString(),
          duration_minutes: gap / (1000 * 60),
        });
      }
    }
  }
  
  // Пиковые часы продаж
  const hourCounts: Record<number, number> = {};
  for (const orderEvent of orderEvents) {
    const hour = new Date(orderEvent.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  
  const peak_hours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), checks_count: count }))
    .sort((a, b) => b.checks_count - a.checks_count)
    .slice(0, 3); // Топ-3 часа
  
  return {
    time_between_checks,
    avg_time_between_orders,
    checks_per_hour,
    idle_periods,
    peak_hours,
  };
}

/**
 * Получает финансовые метрики смены
 */
export async function getShiftFinancialMetrics(
  shiftId: string,
  pointAvgCheck?: number
): Promise<ShiftFinancialMetrics> {
  const basicMetrics = await getShiftBasicMetrics(shiftId);
  
  // Доли налички и карты
  const cash_share = basicMetrics.total_revenue > 0
    ? basicMetrics.total_cash / basicMetrics.total_revenue
    : 0;
  
  const card_share = basicMetrics.total_revenue > 0
    ? basicMetrics.total_card / basicMetrics.total_revenue
    : 0;
  
  // Среднее отклонение чека от среднего по точке
  const events = await getShiftEvents(shiftId);
  const orderEvents = events.filter(e => e.type === ShiftEventType.ORDER_CREATED);
  
  let avg_check_deviation = { absolute: 0, percent: 0 };
  
  if (orderEvents.length > 0 && pointAvgCheck !== undefined && pointAvgCheck > 0) {
    const shiftAvgCheck = basicMetrics.total_revenue / basicMetrics.checks_count;
    const absolute = Math.abs(shiftAvgCheck - pointAvgCheck);
    const percent = (absolute / pointAvgCheck) * 100;
    
    avg_check_deviation = { absolute, percent };
  }
  
  return {
    cash_share,
    card_share,
    avg_check_deviation,
  };
}

/**
 * Получает метрики качества смены
 */
export async function getShiftQualityMetrics(shiftId: string): Promise<ShiftQualityMetrics> {
  const events = await getShiftEvents(shiftId);
  
  // Получаем заказы для определения отмененных
  // TODO: Интегрировать с реальной системой заказов для получения статуса
  // Пока предполагаем, что отмененные заказы будут иметь специальный статус в ORDER_CREATED
  let cancelled_checks_count = 0;
  let cancelled_checks_amount = 0;
  
  // В будущем здесь будет проверка статуса заказов
  // const orders = await getOrdersForShift(shiftId);
  // cancelled_checks_count = orders.filter(o => o.status === 'cancelled').length;
  // cancelled_checks_amount = orders.filter(o => o.status === 'cancelled')
  //   .reduce((sum, o) => sum + o.amount, 0);
  
  const basicMetrics = await getShiftBasicMetrics(shiftId);
  const cancelled_checks_share = basicMetrics.checks_count > 0
    ? cancelled_checks_count / basicMetrics.checks_count
    : 0;
  
  // Время реакции на проблемы (пока заглушка)
  // В будущем будет рассчитываться от PROBLEM_REPORTED до PROBLEM_RESOLVED
  const problem_reaction_time = undefined;
  
  // Нарушения чек-листа (чек-лист выполнен не полностью)
  const checklist_violations = basicMetrics.tasks_completion_percent < 100 ? 1 : 0;
  
  return {
    cancelled_checks_count,
    cancelled_checks_amount,
    cancelled_checks_share,
    problem_reaction_time,
    checklist_violations,
  };
}

