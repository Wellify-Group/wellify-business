
export interface ShiftEvent {
  id: string;
  company_id?: string;
  point_id?: string;
  shift_id: string;
  employee_id?: string;
  type: ShiftEventType;
  payload: any;
  created_at: string;
}

export enum ShiftEventType {
  SHIFT_STARTED = 'SHIFT_STARTED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_COMMENT_ADDED = 'ORDER_COMMENT_ADDED',
  CHECKLIST_TASK_COMPLETED = 'CHECKLIST_TASK_COMPLETED',
  PROBLEM_REPORTED = 'PROBLEM_REPORTED',
  TASK_UNCOMPLETED = 'TASK_UNCOMPLETED',
  SHIFT_CLOSED = 'SHIFT_CLOSED',
}

export interface ShiftStartedPayload {
  started_at: string;
}

export interface OrderCreatedPayload {
  order_id: string;
  total_amount: number;
  payment_method: string;
  items?: Array<{
    product_id: string;
    name: string;
    qty: number;
    unit_price: number;
    total: number;
  }>;
}

export interface OrderCommentAddedPayload {
  order_id: string;
  comment: string;
}

export interface ChecklistTaskCompletedPayload {
  task_id: string;
  task_name: string;
  completed_at?: string;
}

export interface ProblemReportedPayload {
  problem_id: string;
  description: string;
  category: string;
  category_label?: string;
  severity: string;
  reported_at?: string;
  ingredient_id?: string;
  product_id?: string;
}

export interface TaskUncompletedPayload {
  task_id: string;
  reason?: string;
  task_name: string;
  uncompleted_at?: string;
}

export interface ShiftClosedPayload {
  end_time?: string;
  closed_at?: string;
  tasks_total?: number;
  final_revenue?: number;
  final_cash?: number;
  final_card?: number;
  checks_count?: number;
  tasks_completed?: number;
}

export interface ShiftBasicMetrics {
  total_revenue: number;
  total_cash: number;
  total_card: number;
  checks_count: number;
  tasks_completed: number;
  tasks_total: number;
  tasks_completion_percent: number;
  problems_count: number;
  problems_by_category: Record<string, number>;
  problems_by_severity: Record<string, number>;
}

export interface ShiftOperationalMetrics {
  time_between_checks: number[];
  avg_time_between_orders: number;
  checks_per_hour: number;
  idle_periods: Array<{ start: string; end: string; duration_minutes: number }>;
  peak_hours: Array<{ hour: number; checks_count: number }>;
}

export interface ShiftFinancialMetrics {
  cash_share: number;
  card_share: number;
  avg_check_deviation: { absolute: number; percent: number };
}

export interface ShiftQualityMetrics {
  cancelled_checks_count: number;
  cancelled_checks_amount: number;
  cancelled_checks_share: number;
  problem_reaction_time?: number;
  checklist_violations: number;
}
