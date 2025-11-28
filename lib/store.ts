import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from '@/components/ui/toast';

export type Role = 'director' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  fullName?: string; // Full name for formal addressing (e.g., "Ivanov Ivan Ivanovich")
  role: Role;
  email?: string;
  password?: string;
  pin?: string;
  businessId: string;
  companyCode?: string; // 16-digit company code for employee login (e.g., "1000-2000-3000-4000")
  status?: 'active' | 'inactive';
  rating?: number;
  phone?: string;
  dob?: string; // date of birth
  address?: string;
  assignedPointId?: string | null; // Link to Location
  jobTitle?: string; // Job title (e.g., "Barista", "Chef")
  avatar?: string; // Base64 URL for user avatar image
  isOnline?: boolean; // Online status for employees
  // HR Features
  hireDate?: string; // ISO date - to calculate Seniority
  vacationDays?: { used: number; total: number };
  sickDays?: { used: number; total: number };
  efficiency?: number; // 0-100%
  isEmployeeOfMonth?: boolean;
  rewards?: Array<{ id: string; title: string; date: string; icon: string }>;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  businessId: string; // Business ID this location belongs to
  status: 'active' | 'paused' | 'archived' | 'error' | 'green' | 'yellow' | 'red'; // Support both old and new statuses
  accessCode?: string; // 16-digit access code (e.g., "1111-2222-3333-4444")
  dailyPlan?: number;
  themeColor?: string; // Customization color (deprecated, use branding.color)
  coverImage?: string; // Customization image URL (deprecated, use branding.banner)
  
  // New ERP fields
  branding?: {
    logo: string | null;
    banner: string | null;
    color?: string;
  };
  contact?: {
    phone: string;
    email: string;
    address: string;
    geo: string;
  };
  schedule?: {
    mon?: { start: string; end: string; lunchStart: string; lunchEnd: string; active: boolean };
    tue?: { start: string; end: string; lunchStart: string; lunchEnd: string; active: boolean };
    wed?: { start: string; end: string; lunchStart: string; lunchEnd: string; active: boolean };
    thu?: { start: string; end: string; lunchStart: string; lunchEnd: string; active: boolean };
    fri?: { start: string; end: string; lunchStart: string; lunchEnd: string; active: boolean };
    sat?: { start: string; end: string; lunchStart: string; lunchEnd: string; active: boolean };
    sun?: { start: string; end: string; lunchStart: string; lunchEnd: string; active: boolean };
    // Legacy support
    monday?: { start: string; end: string; active: boolean };
    tuesday?: { start: string; end: string; active: boolean };
    wednesday?: { start: string; end: string; active: boolean };
    thursday?: { start: string; end: string; active: boolean };
    friday?: { start: string; end: string; active: boolean };
    saturday?: { start: string; end: string; active: boolean };
    sunday?: { start: string; end: string; active: boolean };
    workingHours?: string; // Simplified format "09:00 - 21:00"
  };
  settings?: {
    requirePhotoOpen: boolean;
    requirePhotoClose: boolean;
    geoFenceEnabled: boolean;
    strictCashControl: boolean;
  };
  managerId?: string | null;
  documents?: Array<{ id: string; name: string; type: string; date: string; url: string }>;
  history?: Array<{ action: string; user: string; date: string }>;
  lastShiftNumber?: number; // Last sequential shift number for this location (default: 0)
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: number;
  revenueCash: number;
  revenueCard: number;
  guestCount?: number;
  checkCount?: number;
  status: 'ok' | 'issue';
  anomalies: string[];
  notes?: Array<{ text: string; time: string }>;
  // Timing Features
  clockIn?: string; // ISO timestamp
  clockOut?: string; // ISO timestamp
  locationId?: string; // Link to Location
  readableNumber?: number; // Human-readable sequential shift number (e.g., 124)
}

export interface FormField {
  id: string;
  label: string;
  type: 'number' | 'text' | 'text_multiline' | 'checkbox';
  required: boolean;
  placeholder?: string;
}

export interface FormConfig {
  showCash: boolean;
  showCard: boolean;
  showGuests: boolean;
  showPhoto: boolean;
  showNotes: boolean;
  showTips?: boolean;
  shiftClosingFormSchema?: FormField[]; // Динамическая схема формы закрытия смены
  shiftPlanValue?: number; // План выручки на смену
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: number;
}

export interface Attachment {
  type: 'location' | 'employee' | 'shift';
  id: string;
  label: string;
}

export interface DirectMessage {
  id: string;
  fromId: string;
  toId: string; // Employee ID
  text: string;
  attachments: Attachment[];
  isRead: boolean;
  readAt: string | null; // ISO string when message was read, null if unread
  createdAt: string; // ISO string
}

export interface OrderItem {
  id: string | number;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  employeeId: string;
  locationId: string;
  shiftId: string; // ID активной смены
  createdAt: string; // ISO timestamp
  orderType: 'hall' | 'takeaway' | 'delivery';
  paymentType: 'cash' | 'card' | 'online';
  amount: number; // decimal
  guestsCount: number; // int, default 1
  comment?: string; // optional
  items?: OrderItem[]; // Позиции заказа
}

// ===== ИНГРЕДИЕНТЫ И УЧЁТ РАСХОДНИКОВ =====

export type IngredientUnit = 'g' | 'ml' | 'pcs' | 'kg' | 'l';

export interface Ingredient {
  id: string;
  company_id: string;
  name: string;
  unit: IngredientUnit;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductComponent {
  id: string;
  company_id: string;
  product_id: string | number; // ID товара (может быть строкой или числом)
  ingredient_id: string;
  amount_per_unit: number; // Сколько единиц расходника на 1 единицу товара
  created_at: string;
  updated_at: string;
}

export type StockMovementType = 'purchase' | 'sale' | 'writeoff' | 'adjustment';

export interface IngredientStockMovement {
  id: string;
  company_id: string;
  point_id: string;
  ingredient_id: string;
  type: StockMovementType;
  quantity: number; // Положительное число (для sale/writeoff при расчёте делаем минус)
  unit: IngredientUnit;
  related_order_id?: string | null;
  related_shift_id?: string | null;
  comment?: string | null;
  created_by_user_id: string;
  created_at: string;
}

export interface IngredientStockLevel {
  ingredient_id: string;
  ingredient_name: string;
  point_id: string;
  point_name?: string;
  unit: IngredientUnit;
  current_stock: number;
  days_left?: number | null; // null если нет расхода
  status: 'ok' | 'low' | 'critical';
  avg_daily_consumption?: number;
}

export interface AppState {
  currentUser: User | null;
  businessName: string | null;
  businessLogo: string | null; // URL for business logo image
  businessAddress: string; // Business address
  currency: string;
  companyCode: string; // 12-digit company code (e.g., "1000-2000-3000")
  savedCompanyId: string | null; // Saved company ID for device
  savedLocationId: string | null; // Saved location ID for employee
  users: User[];
  employees: User[];
  locations: Location[];
  shifts: Shift[];
  currentShift: { 
    id: string; 
    startTime: string; 
    locationId: string; 
    employeeId: string; 
    status: 'active' | 'closed' | 'closing'; 
    readableNumber?: number; 
    notes?: Array<{ text: string; time: string }>; 
    totalRevenue?: number;
    totalChecks?: number;
    totalGuests?: number;
  } | null;
  employeeNotifications: Array<{ id: string; from: string; text: string; time: string; isRead: boolean }>;
  orders: Order[]; // Заказы текущей смены
  ultraMode: boolean;
  isSidebarCollapsed: boolean;
  isSupportOpen: boolean;
  isMessageComposerOpen: boolean;
  messageComposerRecipientId: string | null;
  hasSeenTour: boolean;
  isLocationInfoOpen: boolean;
  formConfig: FormConfig;
  showBigTimer: boolean; // Флаг отображения большого таймера (DEPRECATED)
  isBigTimerVisible: boolean; // Флаг отображения большого таймера (DEPRECATED)
  isTimerVisible: boolean; // Флаг отображения таймера в левом баннере
  lastClosedShiftId: string | null; // ID последней завершённой смены для отчёта
  
  // Shift closing states
  isClosingShift: boolean; // идёт запрос на закрытие
  closeShiftError: string | null; // ошибка при закрытии (если была)
  
  // Единое состояние смены (синхронизируется с currentShift)
  shiftEndTime: string | null; // ISO timestamp окончания смены
  
  // Chat System
  chatHistory: ChatMessage[];
  lastReadTimestamp: number;
  
  // Direct Messages
  messages: DirectMessage[];
  
  // Conversation System (for notifications page)
  conversationDrafts: Record<string, string>; // conversationId -> draft text
  openConversations: string[]; // conversationId array
  minimizedConversations: string[]; // conversationId array
  conversationData: Record<string, {
    type: 'manager' | 'employee';
    recipientId: string;
    recipientName: string;
    context?: {
      notificationMessage?: string;
      locationName?: string;
    };
    profileLink?: string;
  }>; // conversationId -> conversation data
  
  // Weather
  weather: {
    temp: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snow';
    humidity: number;
  };
  
  // Actions
  registerDirector: (email: string, pass: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  login: (role: Role, creds: { email?: string; pass?: string; pin?: string; businessId?: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  verifyCompanyCode: (code: string) => Promise<boolean>;
  joinBusiness: (code: string) => boolean;
  forgetCompany: () => void;
  updateEmployeePin: (employeeId: string, newPin: string) => void;
  toggleUltraMode: () => void;
  toggleSidebar: () => void;
  toggleSupport: () => void;
  
  // Location Info Modal
  openLocationInfo: () => void;
  closeLocationInfo: () => void;
  
  // Form Config
  updateFormConfig: (config: Partial<FormConfig>) => void;
  
  // Employees
  addEmployee: (employee: Omit<User, 'id' | 'businessId'>) => Promise<void>;
  removeEmployee: (id: string) => void;
  deleteUser: (id: string, role: Role) => Promise<void>;
  
  // Shifts
  submitShift: (shift: Omit<Shift, 'id' | 'date'>) => Promise<void>;
  startShift: (locationId: string, employeeId: string) => void;
  closeShift: (closingData?: { cash?: number; card?: number; guests?: number; comment?: string; checklist?: string[]; closingFields?: Record<string, any> }) => Promise<void>; // закрытие смены через API
  endShift: (data: { cash: number; card: number; guests?: number; notes?: Array<{ text: string; time: string }>; checklist: string[] }) => Promise<Shift | null>; // DEPRECATED: используйте closeShift
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  setLastClosedShiftId: (id: string | null) => void;
  addNoteToShift: (text: string) => void;
  updateShiftStats: (stats: { totalRevenue?: number; totalChecks?: number; totalGuests?: number }) => Promise<void>;
  resetCloseShiftError: () => void; // очистка ошибки закрытия смены
  
  // Employee Notifications & Chat
  sendManagerMessage: (text: string) => void;
  
  // Locations
  fetchLocations: (businessId: string) => Promise<void>;
  addLocation: (location: Omit<Location, 'id' | 'businessId'>) => Promise<string>; // Returns location ID
  getCurrentLocation: () => Location | null;
  updateLocationSettings: (locationId: string, settings: { themeColor?: string; coverImage?: string }) => void;
  toggleLocationPause: (id: string) => void;
  deleteLocation: (id: string) => Promise<void>;
  archiveLocation: (id: string) => void;
  duplicateLocation: (id: string) => string; // Returns new location ID
  updateLocationProfile: (id: string, data: Partial<Location>) => Promise<void>;
  assignManager: (locationId: string, userId: string | null) => void;
  updateLocationBranding: (id: string, logo: string | null, banner: string | null) => Promise<void>;
  addLocationDocument: (id: string, doc: { name: string; type: string; url: string }) => void;
  removeLocationDocument: (id: string, docId: string) => void;
  updateLocationSchedule: (id: string, schedule: Location['schedule']) => void;
  moveStaffToLocation: (staffId: string, locationId: string, role: 'manager' | 'employee') => void;
  regenerateLocationCode: (locationId: string) => void;
  
  // Chat Actions
  sendUserMessage: (text: string) => void;
  receiveAgentMessage: (text: string) => void;
  markChatRead: () => void;
  unreadChatMessages: () => number;
  
  // Direct Messages Actions
  sendMessage: (toId: string, text: string, attachments?: Attachment[]) => void;
  markMessageRead: (id: string) => void;
  markMessageAsRead: (id: string) => void;
  
  // Message Composer Actions
  openMessageComposer: (recipientId?: string) => void;
  closeMessageComposer: () => void;
  
  // Conversation System
  openConversation: (conversationId: string, type: 'manager' | 'employee', recipientId: string, recipientName: string, context?: { notificationMessage?: string; locationName?: string }, profileLink?: string) => void;
  closeConversation: (conversationId: string) => void;
  minimizeConversation: (conversationId: string) => void;
  restoreConversation: (conversationId: string) => void;
  updateConversationDraft: (conversationId: string, text: string) => void;
  getConversationDraft: (conversationId: string) => string;
  sendConversationMessage: (conversationId: string, type: 'manager' | 'employee', recipientId: string) => Promise<void>;
  
  // Onboarding Tour
  completeTour: () => void;
  
  // Demo Data
  loadDemoData: () => void;
  
  // Synchronization
  syncWithServer: () => Promise<void>;
  
  // Timer visibility
  toggleShowBigTimer: () => void; // DEPRECATED
  toggleBigTimerVisibility: () => void; // DEPRECATED
  toggleTimerVisibility: () => void; // Переключает видимость таймера в левом баннере
  
  // Shift state management
  hydrateFromServer: () => Promise<void>; // Загружает состояние смены с сервера
  fetchCurrentShift: () => Promise<void>; // Загружает текущую смену сотрудника с сервера
  finishShift: () => Promise<void>; // Завершает текущую смену
  
  // Единый таймер смены (единственный источник истины)
  shiftElapsedTime: {
    hours: string;
    minutes: string;
    seconds: string;
    formatted: string;
  } | null;
  getShiftElapsedTime: () => {
    hours: string;
    minutes: string;
    seconds: string;
    formatted: string;
  } | null;
  
  // Orders
  addOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'employeeId' | 'locationId' | 'shiftId'>) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  getOrdersForShift: (shiftId: string) => Order[];
  getOrdersSummary: (shiftId: string) => {
    totalAmount: number;
    ordersCount: number;
    guestsSum: number;
    avgCheck: number;
    byPaymentType: {
      cash: number;
      card: number;
      online: number;
    };
  };
  
  // Settings (computed from currency)
  settings?: {
    currency: string;
  };
  
  // Aliases for compatibility
  user?: User | null;
}

// Helper function to generate mock test accounts
const generateMockUsers = (): { users: User[]; employees: User[] } => {
  const directors: User[] = Array.from({ length: 5 }, (_, i) => ({
    id: `test-dir-${i + 1}`,
    name: `Director ${i + 1}`,
    fullName: `Shevchenko Andrey Viktorovich`,
    role: 'director' as Role,
    email: `dir${i + 1}@test.com`,
    password: '123',
    businessId: `test-biz-${i + 1}`,
    companyCode: i === 0 ? '1000-2000-3000-4000' : undefined, // Default director has company code
    status: 'active' as const
  }));

  const managers: User[] = Array.from({ length: 5 }, (_, i) => ({
    id: `test-mgr-${i + 1}`,
    name: `Manager ${i + 1}`,
    fullName: `Petrov Sergey Dmitrievich`,
    role: 'manager' as Role,
    email: `man${i + 1}@test.com`,
    password: '123',
    businessId: `test-biz-${i + 1}`,
    status: 'active' as const
  }));

  const employees: User[] = Array.from({ length: 5 }, (_, i) => ({
    id: `test-emp-${i + 1}`,
    name: `Employee ${i + 1}`,
    role: 'employee' as Role,
    pin: String(i + 1).padStart(4, '0'), // 0001, 0002, etc.
    businessId: 'test-biz-1',
    status: 'active' as const,
    rating: 80 + (i % 5) * 4 // 80, 84, 88, 92, 96 - детерминированные значения для гидратации
  }));

  return {
    users: [...directors, ...managers, ...employees],
    employees: employees
  };
};

// Initialize mock users
const mockData = generateMockUsers();

// Создаём store для доступа к getState вне компонентов
let storeInstance: {
  get: () => AppState;
  set: (partial: AppState | Partial<AppState> | ((state: AppState) => AppState | Partial<AppState>), replace?: boolean) => void;
} | null = null;

// Глобальный интервал таймера смены
let shiftTimerInterval: NodeJS.Timeout | null = null;

// Функции для управления таймером смены
function startShiftTimer() {
  // Останавливаем предыдущий таймер, если он есть
  if (shiftTimerInterval) {
    clearInterval(shiftTimerInterval);
  }

  // Запускаем новый интервал обновления таймера каждую секунду
  shiftTimerInterval = setInterval(() => {
    if (!storeInstance) return;
    
    const state = storeInstance.get();
    const shift = state.currentShift;
    
    if (!shift || shift.status !== 'active' || !shift.startTime) {
      stopShiftTimer();
      return;
    }
    
    // Вычисляем прошедшее время
    const startTime = new Date(shift.startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    // Обновляем состояние таймера
    storeInstance.set({
      shiftElapsedTime: {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
        formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
    });
  }, 1000);
}

function stopShiftTimer() {
  if (shiftTimerInterval) {
    clearInterval(shiftTimerInterval);
    shiftTimerInterval = null;
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Сохраняем ссылку на store для использования в таймере
      if (!storeInstance) {
        storeInstance = { set, get } as any;
      }
      
      return {
      currentUser: null,
      businessName: null,
      businessLogo: null,
      businessAddress: "",
      currency: "₴",
      companyCode: "1000-2000-3000-4000", // Default company code for employees
      savedCompanyId: null,
      savedLocationId: null,
      users: mockData.users,
      employees: mockData.employees,
      locations: [],
      shifts: [],
      currentShift: null,
      orders: [], // Initialize orders as empty array
      employeeNotifications: [
        { id: 'notif-1', from: 'Director', text: 'Проверьте холодильник перед закрытием', time: new Date(Date.now() - 3600000).toISOString(), isRead: false },
        { id: 'notif-2', from: 'Manager', text: 'Отличная работа вчера!', time: new Date(Date.now() - 86400000).toISOString(), isRead: false },
        { id: 'notif-3', from: 'Director', text: 'Не забудьте проверить витрину', time: new Date(Date.now() - 7200000).toISOString(), isRead: true },
      ],
      ultraMode: false,
      isSidebarCollapsed: false,
      isSupportOpen: false,
      isMessageComposerOpen: false,
      messageComposerRecipientId: null,
      isLocationInfoOpen: false,
      hasSeenTour: false,
      showBigTimer: false, // DEPRECATED
      isBigTimerVisible: true, // DEPRECATED
      isTimerVisible: true, // По умолчанию таймер виден
      lastClosedShiftId: null,
      isClosingShift: false,
      closeShiftError: null,
      shiftEndTime: null, // Время окончания смены
      shiftElapsedTime: null, // Единое состояние таймера
      formConfig: {
        showCash: true,
        showCard: true,
        showGuests: true,
        showPhoto: false,
        showNotes: true,
        showTips: false,
        shiftPlanValue: 20000, // План по умолчанию
        shiftClosingFormSchema: [
          {
            id: "cash_actual",
            label: "Касса по факту",
            type: "number",
            required: true,
            placeholder: "0"
          },
          {
            id: "cashless_total",
            label: "Эквайринг",
            type: "number",
            required: false,
            placeholder: "0"
          },
          {
            id: "writeoffs",
            label: "Списания",
            type: "number",
            required: false,
            placeholder: "0"
          },
          {
            id: "cleaning_done",
            label: "Уборка выполнена",
            type: "checkbox",
            required: true
          },
          {
            id: "comment",
            label: "Комментарий",
            type: "text_multiline",
            required: false,
            placeholder: "Дополнительная информация..."
          }
        ]
      },
      chatHistory: [],
      lastReadTimestamp: Date.now(),
      weather: {
        temp: 20, // Детерминированное значение для гидратации
        condition: 'sunny' as 'sunny' | 'cloudy' | 'rainy',
        humidity: 65 // Детерминированное значение для гидратации
      },
      messages: [],
      conversationDrafts: {},
      openConversations: [],
      minimizedConversations: [],
      conversationData: {},

      registerDirector: async (email: string, pass: string, fullName: string) => {
        try {
          // Call API to register user
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password: pass,
              fullName: fullName.trim(),
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return {
              success: false,
              error: data.error || 'Registration failed',
            };
          }

          // Use company code from API response or user object
          const newUser = data.user;
          const companyCode = data.companyCode || newUser.companyCode;

          // Default form config (will be updated when industry is selected in Add Location)
          const defaultFormConfig: FormConfig = {
            showCash: true,
            showCard: true,
            showGuests: false,
            showPhoto: false,
            showNotes: true,
            showTips: false
          };

          set((state: AppState) => ({
            users: [...state.users, newUser],
            currentUser: newUser,
            user: newUser,
            businessName: "", // Empty string for fresh account
            businessLogo: null,
            businessAddress: "",
            currency: "₴", // Default currency
            companyCode: companyCode || "1000-2000-3000-4000",
            settings: { currency: "₴" },
            formConfig: defaultFormConfig,
            hasSeenTour: false, // Ensure tour appears for new users
            // Keep arrays empty - no demo data on registration
            employees: [],
            locations: [],
            shifts: [],
            messages: []
          }));

          return { success: true };
        } catch (error) {
          console.error('Registration error:', error);
          return {
            success: false,
            error: 'Failed to register. Please try again.',
          };
        }
      },
      
      loadDemoData: () => {
        set((state: AppState) => ({
          employees: [
            { id: 'demo-emp', name: 'Anna', role: 'employee', pin: '0000', businessId: state.currentUser?.businessId || 'demo', status: 'active', rating: 92, jobTitle: 'Senior Barista' },
            { id: 'emp-1', name: 'Dmitry', role: 'employee', pin: '1234', businessId: state.currentUser?.businessId || 'demo', status: 'active', rating: 88, jobTitle: 'Trainee' }
          ],
          locations: [
            { id: 'loc-1', name: 'Kyiv Point 1', address: 'Kyiv, Main St. 1', status: 'green', dailyPlan: 50000, businessId: state.currentUser?.businessId || 'demo' },
            { id: 'loc-2', name: 'Kyiv Point 2', address: 'Kyiv, Main St. 2', status: 'yellow', dailyPlan: 30000, businessId: state.currentUser?.businessId || 'demo' }
          ],
          shifts: [
            {
              id: 'shift-1',
              employeeId: 'demo-emp',
              employeeName: 'Anna',
              date: Date.now() - 86400000,
              revenueCash: 15000,
              revenueCard: 35000,
              guestCount: 120,
              checkCount: 120,
              status: 'ok',
              anomalies: []
            },
            {
              id: 'shift-2',
              employeeId: 'emp-1',
              employeeName: 'Dmitry',
              date: Date.now() - 172800000,
              revenueCash: 8000,
              revenueCard: 12000,
              guestCount: 80,
              checkCount: 80,
              status: 'issue',
              anomalies: ['Low revenue compared to plan']
            }
          ],
          messages: [
            {
              id: 'msg-1',
              fromId: state.currentUser?.id || 'demo-dir',
              toId: 'demo-emp',
              text: 'Пожалуйста, проверьте инвентарь в Центре',
              attachments: [
                { type: 'location', id: 'loc-1', label: 'Kyiv Point 1' }
              ],
              isRead: false,
              readAt: null,
              createdAt: new Date().toISOString()
            }
          ]
        }));
      },

      login: async (role: Role, creds: { email?: string; pass?: string; pin?: string; businessId?: string }) => {
        try {
          // Prepare request body based on role
          let requestBody: any;

          if (role === 'director' || role === 'manager') {
            // For office login: email + password
            requestBody = {
              role,
              identifier: creds.email,
              password: creds.pass,
            };
          } else if (role === 'employee') {
            // For employee login: support both Email/Password and PIN/Code
            if (creds.email && creds.pass) {
              requestBody = {
                role,
                identifier: creds.email,
                password: creds.pass,
              };
            } else {
              // For terminal login: PIN + company code
              requestBody = {
                role,
                identifier: creds.businessId || '', // Company code
                password: creds.pin, // PIN is the password for employees
                businessId: creds.businessId,
              };
            }
          } else {
            return false;
          }

          // Call API to login
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();

          if (!response.ok || !data.success || !data.user) {
            return false;
          }

          const user = data.user;
          
          // Set isOnline = true on login
          const userWithOnline = { ...user, isOnline: true };

          // For employee login, verify company code matches if provided
          if (role === 'employee' && creds.businessId) {
            const normalizedCode = creds.businessId.replace(/-/g, '');
            const currentCode = get().companyCode.replace(/-/g, '');
            
            // If company code doesn't match, fail login
            // Note: We might want to store companyCode per business/user
            // For now, we'll allow if the employee's businessId matches
            if (userWithOnline.businessId && !normalizedCode.includes(userWithOnline.businessId.replace(/-/g, '').slice(0, 8))) {
              // Company code verification can be handled here if needed
            }
          }

          // Set current user on successful login
          set({
            currentUser: userWithOnline,
            user: userWithOnline,
            businessName: get().businessName || null,
            currency: get().currency || "₴",
            settings: { currency: get().currency || "₴" }
          });

          // Load locations for this business
          if (userWithOnline.businessId) {
            await get().fetchLocations(userWithOnline.businessId);
          }

          // For employee login, set savedLocationId from assignedPointId
          if (role === 'employee' && userWithOnline.assignedPointId) {
            set({ savedLocationId: userWithOnline.assignedPointId });
            console.log('[Login] Set savedLocationId for employee:', userWithOnline.assignedPointId);
          }

          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      logout: () => {
        const currentUser = get().currentUser;
        
        // Set isOnline = false before clearing user
        if (currentUser) {
          const userOffline = { ...currentUser, isOnline: false };
          
          // Update employees list if user is an employee
          if (currentUser.role === 'employee') {
            set((state: AppState) => ({
              employees: state.employees.map((emp: User) => 
                emp.id === currentUser.id ? userOffline : emp
              ),
              users: state.users.map((u: User) => 
                u.id === currentUser.id ? userOffline : u
              )
            }));
          }
        }
        
        set({ 
          currentUser: null, 
          user: null,
          settings: { currency: "₴" }
        });
      },
      
      updateProfile: async (updates: Partial<User>) => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            return false;
          }

          // Call API to update user
          const response = await fetch('/api/user/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: currentUser.role,
              userId: currentUser.id,
              updates: updates,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success || !data.user) {
            return false;
          }

          const updatedUser = data.user;

          // Update currentUser in local state
          set({
            currentUser: updatedUser,
            user: updatedUser,
            // Update companyCode in store if it was updated in profile
            ...(updates.companyCode && { companyCode: updates.companyCode }),
            // Also update in users array if it exists there
            users: get().users.map((user: User) =>
              user.id === updatedUser.id ? updatedUser : user
            ),
            // Update in employees array if it exists there
            employees: get().employees.map((emp: User) =>
              emp.id === updatedUser.id ? updatedUser : emp
            ),
          });

          // Show toast notification
          try {
            const toastStore = useToastStore.getState();
            toastStore.addToast('Profile Updated', 'success');
          } catch (toastError) {
            // If toast fails, just log it (non-critical)
            console.log('Could not show toast notification:', toastError);
          }

          return true;
        } catch (error) {
          console.error('Update profile error:', error);
          return false;
        }
      },
      
      verifyCompanyCode: async (code: string) => {
        try {
          // Call API to search for code
          const response = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();

          if (!response.ok || !data.success || !data.entity) {
            return false;
          }

          const entity = data.entity;

          // Set savedCompanyId and savedLocationId based on entity type
          if (entity.type === 'business') {
            set({ savedCompanyId: entity.id });
            return true;
          } else if (entity.type === 'location') {
            set({ 
              savedCompanyId: entity.businessId || '',
              savedLocationId: entity.id 
            });
            return true;
          }

          return false;
        } catch (error) {
          console.error('Verify company code error:', error);
          return false;
        }
      },
      
      joinBusiness: (code: string) => {
        // Normalize input code (remove dashes)
        const normalizedCode = code.replace(/-/g, '');
        // Get current company code and normalize
        const currentCode = get().companyCode.replace(/-/g, '');
        
        // Compare normalized codes
        if (normalizedCode === currentCode && normalizedCode.length === 16) {
          // Success - manager can join this business
          return true;
        }
        return false;
      },
      
      forgetCompany: () => {
        set({ savedCompanyId: null });
      },
      
      updateEmployeePin: (employeeId: string, newPin: string) => {
        if (newPin.length !== 4) return;
        set((state: AppState) => ({
          employees: state.employees.map((emp: User) =>
            emp.id === employeeId ? { ...emp, pin: newPin } : emp
          ),
          users: state.users.map((user: User) =>
            user.id === employeeId ? { ...user, pin: newPin } : user
          )
        }));
      },
      
      toggleUltraMode: () => set((state: AppState) => ({ ultraMode: !state.ultraMode })),
      toggleSidebar: () => set((state: AppState) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      toggleSupport: () => set((state: AppState) => ({ isSupportOpen: !state.isSupportOpen })),
      
      // Location Info Modal Actions
      openLocationInfo: () => {
        set({ isLocationInfoOpen: true });
      },
      
      closeLocationInfo: () => {
        set({ isLocationInfoOpen: false });
      },
      
      updateFormConfig: (config: Partial<FormConfig>) => {
        set((state: AppState) => ({
          formConfig: { ...state.formConfig, ...config }
        }));
      },
      
      addEmployee: async (employeeData: Omit<User, 'id' | 'businessId'>) => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            console.error('Cannot add employee: no current user');
            return;
          }

          // Call API to create employee/manager
          const response = await fetch('/api/user/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: employeeData.name,
              fullName: employeeData.fullName,
              pin: employeeData.pin,
              email: employeeData.email,
              password: employeeData.password,
              role: employeeData.role || 'employee',
              businessId: currentUser.businessId,
              assignedPointId: employeeData.assignedPointId || null,
              jobTitle: employeeData.jobTitle,
              phone: employeeData.phone,
              dob: employeeData.dob,
              address: employeeData.address,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success || !data.user) {
            console.error('Failed to create employee:', data.error);
            return;
          }

          const newEmployee = data.user;

          // If this is a manager and has assignedPointId, update location's managerId
          if (newEmployee.role === 'manager' && newEmployee.assignedPointId) {
            try {
              await fetch('/api/locations/update', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  locationId: newEmployee.assignedPointId,
                  updates: {
                    managerId: newEmployee.id,
                  },
                }),
              });
            } catch (error) {
              console.error('Failed to update location managerId:', error);
            }
          }

          // Update local state
          set((state: AppState) => {
            const updatedLocations = state.locations.map((loc: Location) => {
              if (loc.id === newEmployee.assignedPointId && newEmployee.role === 'manager') {
                return {
                  ...loc,
                  managerId: newEmployee.id,
                  history: [
                    ...(loc.history || []),
                    {
                      action: 'manager_assigned',
                      user: currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                };
              }
              return loc;
            });

            return {
              employees: [...state.employees, newEmployee],
              users: [...state.users, newEmployee],
              locations: updatedLocations
            };
          });

          // Show toast notification
          try {
            const toastStore = useToastStore.getState();
            toastStore.addToast('Employee created', 'success');
          } catch (toastError) {
            console.log('Could not show toast notification:', toastError);
          }
        } catch (error) {
          console.error('Add employee error:', error);
        }
      },
      
      removeEmployee: (id: string) => {
        set((state: AppState) => ({
          employees: state.employees.filter((emp: User) => emp.id !== id),
          users: state.users.filter((user: User) => user.id !== id)
        }));
      },
      
      deleteUser: async (id: string, role: Role) => {
        // Store current state for rollback
        const currentState = get();
        const userToDelete = currentState.users.find((u: User) => u.id === id);
        
        if (!userToDelete) {
          console.error('Cannot delete user: user not found');
          return;
        }
        
        // Optimistic update: Remove user from state immediately
        set((state: AppState) => ({
          employees: state.employees.filter((emp: User) => emp.id !== id),
          users: state.users.filter((user: User) => user.id !== id)
        }));
        
        try {
          // Call API to delete user file
          const response = await fetch('/api/user/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, role }),
          });
          
          const data = await response.json();
          
          if (!response.ok || !data.success) {
            // Rollback on failure
            set((state: AppState) => ({
              employees: [...state.employees, userToDelete].filter(Boolean),
              users: [...state.users, userToDelete].filter(Boolean)
            }));
            
            console.error('Failed to delete user:', data.error);
            throw new Error(data.error || 'Failed to delete user');
          }
          
          // Show toast notification
          try {
            const toastStore = useToastStore.getState();
            toastStore.addToast('Employee removed', 'success');
          } catch (toastError) {
            console.log('Could not show toast notification:', toastError);
          }
        } catch (error) {
          // Rollback on error
          set((state: AppState) => ({
            employees: [...state.employees, userToDelete].filter(Boolean),
            users: [...state.users, userToDelete].filter(Boolean)
          }));
          
          console.error('Delete user error:', error);
          throw error;
        }
      },
      
      assignStaffToPoint: (staffId: string, pointId: string | null) => {
        set((state: AppState) => ({
          employees: state.employees.map((emp: User) => 
            emp.id === staffId ? { ...emp, assignedPointId: pointId } : emp
          ),
          users: state.users.map((user: User) => 
            user.id === staffId ? { ...user, assignedPointId: pointId } : user
          )
        }));
      },
      
      submitShift: async (shiftData: Omit<Shift, 'id' | 'date'>) => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            console.error('Cannot submit shift: no current user');
            return;
          }

          // Call API to save shift
          const response = await fetch('/api/shifts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...shiftData,
              employeeId: currentUser.id,
              employeeName: currentUser.name || currentUser.fullName,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success || !data.shift) {
            console.error('Failed to create shift:', data.error);
            return;
          }

          const newShift = data.shift;

          // Update local state
          set((state: AppState) => ({
            shifts: [...state.shifts, newShift]
          }));
        } catch (error) {
          console.error('Submit shift error:', error);
        }
      },

      startShift: async (locationId: string, employeeId: string) => {
        const state = get();
        const currentUser = state.currentUser;

        // Валидация входных данных
        if (!employeeId) {
          const error = new Error('Не найден сотрудник для старта смены');
          console.error(error);
          throw error;
        }

        if (!locationId) {
          const error = new Error('Не найдена точка для запуска смены');
          console.error(error);
          throw error;
        }

        // Find location and calculate readable shift number
        const location = state.locations.find((loc: Location) => loc.id === locationId);
        if (!location) {
          const error = new Error('Не найдена точка для запуска смены');
          console.error('Cannot start shift: location not found');
          throw error;
        }

        const employeeName = currentUser?.name || currentUser?.fullName || '';
        const currentShiftNumber = location.lastShiftNumber || 0;
        const newShiftNumber = currentShiftNumber + 1;

        // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: сразу обновляем UI
        const optimisticStartTime = new Date().toISOString();
        const optimisticShiftId = `shift-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        // Обновляем стор сразу (оптимистично)
        set({
          currentShift: {
            id: optimisticShiftId,
            startTime: optimisticStartTime,
            locationId: locationId,
            employeeId: employeeId,
            status: 'active',
            readableNumber: newShiftNumber,
          },
          shiftEndTime: null,
          shiftElapsedTime: null,
        });

        // Запускаем таймер сразу
        startShiftTimer();

        // Отправляем запрос на сервер в фоне (без await в начале)
        try {
          const res = await fetch('/api/employee/shifts/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              employeeId, 
              locationId,
              companyId: state.savedCompanyId || currentUser?.businessId,
              employeeName,
            }),
          });

          if (!res.ok) {
            if (res.status === 409) {
              // Сервер вернул 409 - есть активная смена
              // Вместо ошибки просто загружаем существующую смену
              console.log('Active shift already exists, fetching it...');
              await get().fetchCurrentShift();
              return; // Смена загружена, выходим без ошибки
            }

            // Откатываем оптимистичное обновление
            set({
              currentShift: null,
              shiftEndTime: null,
              shiftElapsedTime: null,
            });
            stopShiftTimer();
            const text = await res.text().catch(() => '');
            const error = new Error(`Не удалось начать смену: ${res.status} ${text}`);
            console.error(error);
            throw error;
          }

          const data = await res.json();

          if (!data.success || !data.shift) {
            // Откатываем оптимистичное обновление
            set({
              currentShift: null,
              shiftEndTime: null,
              shiftElapsedTime: null,
            });
            stopShiftTimer();
            const error = new Error('Не удалось начать смену: некорректный ответ сервера');
            console.error(error);
            throw error;
          }

          const newShift = data.shift;

          // Синхронизируем с серверными данными (если startTime отличается)
          set({
            currentShift: {
              id: newShift.id,
              startTime: newShift.startTime || optimisticStartTime,
              locationId: newShift.locationId,
              employeeId: newShift.employeeId,
              status: 'active',
              readableNumber: newShiftNumber,
            },
          });

          // Update location with new lastShiftNumber (save to DB) - в фоне
          try {
            const updatedLocation = {
              ...location,
              lastShiftNumber: newShiftNumber,
            };

            // Update in store
            set((state: AppState) => ({
              locations: state.locations.map((loc: Location) =>
                loc.id === locationId ? updatedLocation : loc
              ),
            }));

            // Save to DB via API (не ждём ответа)
            fetch('/api/locations/update', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                locationId,
                updates: {
                  lastShiftNumber: newShiftNumber,
                },
              }),
            }).catch(error => {
              console.error('Failed to update location lastShiftNumber:', error);
            });
          } catch (error) {
            console.error('Error updating location lastShiftNumber:', error);
          }
        } catch (error) {
          // Если ошибка не была обработана выше, откатываем
          const currentState = get();
          if (currentState.currentShift?.id === optimisticShiftId) {
            set({
              currentShift: null,
              shiftEndTime: null,
              shiftElapsedTime: null,
            });
            stopShiftTimer();
          }
          throw error;
        }
      },

      updateShift: (shiftId: string, updates: Partial<Shift>) => {
        set((state: AppState) => {
          // Фильтруем updates для currentShift, исключая несовместимые поля
          const { status, ...compatibleUpdates } = updates;
          
          return {
            currentShift: state.currentShift?.id === shiftId
              ? { ...state.currentShift, ...compatibleUpdates }
              : state.currentShift,
            shifts: state.shifts.map((shift: Shift) =>
              shift.id === shiftId ? { ...shift, ...updates } : shift
            ),
          };
        });
      },

      addNoteToShift: (text: string) => {
        const currentShift = get().currentShift;
        if (!currentShift || !text.trim()) return;

        const now = new Date();
        const time = now.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const newNote = { text: text.trim(), time };
        const existingNotes = currentShift.notes || [];
        const updatedNotes = [...existingNotes, newNote];

        set((state: AppState) => ({
          currentShift: state.currentShift
            ? { ...state.currentShift, notes: updatedNotes }
            : state.currentShift,
          shifts: state.shifts.map((shift: Shift) =>
            shift.id === currentShift.id 
              ? { ...shift, notes: updatedNotes }
              : shift
          ),
        }));
      },

      updateShiftStats: async (stats: { totalRevenue?: number; totalChecks?: number; totalGuests?: number }) => {
        const currentShift = get().currentShift;
        if (!currentShift || currentShift.status !== 'active') return;

        try {
          // Обновляем локально
          set((state: AppState) => ({
            currentShift: state.currentShift
              ? { 
                  ...state.currentShift, 
                  totalRevenue: stats.totalRevenue ?? state.currentShift.totalRevenue,
                  totalChecks: stats.totalChecks ?? state.currentShift.totalChecks,
                  totalGuests: stats.totalGuests ?? state.currentShift.totalGuests,
                }
              : state.currentShift,
          }));

          // Отправляем на сервер
          const response = await fetch(`/api/shift/${currentShift.id}/stats`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(stats),
          });

          if (!response.ok) {
            console.error('Failed to update shift stats');
          }
        } catch (error) {
          console.error('Error updating shift stats:', error);
        }
      },

      closeShift: async (closingData?: { cash?: number; card?: number; guests?: number; comment?: string; checklist?: string[]; closingFields?: Record<string, any> }) => {
        const state = get();
        const shift = state.currentShift;

        if (!shift) {
          // защита: не закрываем то, чего нет
          set({ closeShiftError: "Смена не активна." });
          return;
        }

        // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: сразу обновляем UI
        const optimisticEndTime = new Date().toISOString();
        const shiftId = shift.id;
        const shiftSnapshot = { ...shift };

        // Сохраняем текущее состояние для возможного отката
        const previousShift = shift;
        const previousShiftEndTime = state.shiftEndTime;
        const previousShiftElapsedTime = state.shiftElapsedTime;

        // Сразу обновляем стор (оптимистично)
        set({
          currentShift: null,
          isClosingShift: true,
          closeShiftError: null,
          lastClosedShiftId: shiftId,
          shiftEndTime: optimisticEndTime,
          shiftElapsedTime: null,
        });

        // Останавливаем таймер сразу
        stopShiftTimer();

        // Отправляем запрос на сервер в фоне
        try {
          // Если переданы данные формы, используем API с данными формы
          // Иначе используем простой API закрытия
          const apiUrl = closingData 
            ? `/api/shift/${shiftId}/close`
            : `/api/shifts/close`;
          
          const apiMethod = closingData ? 'PATCH' : 'POST';
          
          const requestBody = closingData
            ? {
                company_id: state.currentUser?.businessId || "",
                location_id: shift.locationId,
                employee_id: shift.employeeId,
                shift_id: shiftId,
                closingFields: closingData.closingFields || {},
                cash: closingData.cash || 0,
                card: closingData.card || 0,
                guests: closingData.guests,
                comment: closingData.comment,
                checklist: closingData.checklist || [],
              }
            : { shiftId: shiftId };

          const res = await fetch(apiUrl, {
            method: apiMethod,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error("Failed to close shift", res.status, text);
            // Откатываем оптимистичное обновление
            set({
              currentShift: previousShift,
              isClosingShift: false,
              closeShiftError: "Ошибка при закрытии смены. Попробуйте еще раз.",
              shiftEndTime: previousShiftEndTime,
              shiftElapsedTime: previousShiftElapsedTime,
              lastClosedShiftId: state.lastClosedShiftId,
            });
            // Перезапускаем таймер
            startShiftTimer();
            return;
          }

          const data_response = await res.json();

          if (!data_response.success || !data_response.shift) {
            console.error("Failed to close shift: invalid response", data_response);
            // Откатываем оптимистичное обновление
            set({
              currentShift: previousShift,
              isClosingShift: false,
              closeShiftError: "Ошибка при закрытии смены. Попробуйте еще раз.",
              shiftEndTime: previousShiftEndTime,
              shiftElapsedTime: previousShiftElapsedTime,
              lastClosedShiftId: state.lastClosedShiftId,
            });
            // Перезапускаем таймер
            startShiftTimer();
            return;
          }

          const closedShift = data_response.shift;
          
          // Получаем время окончания смены с сервера (синхронизируем)
          const serverEndTime = closedShift.clockOut || closedShift.endTime || optimisticEndTime;

          // Синхронизируем с серверными данными
          set({
            isClosingShift: false,
            closeShiftError: null,
            shiftEndTime: serverEndTime,
            // Обновляем список смен
            shifts: [...state.shifts, closedShift],
          });
        } catch (error) {
          console.error("Close shift exception", error);
          // Откатываем оптимистичное обновление
          set({
            currentShift: previousShift,
            isClosingShift: false,
            closeShiftError: "Ошибка сети при закрытии смены. Попробуйте еще раз.",
            shiftEndTime: previousShiftEndTime,
            shiftElapsedTime: previousShiftElapsedTime,
            lastClosedShiftId: state.lastClosedShiftId,
          });
          // Перезапускаем таймер
          startShiftTimer();
        }
      },

      resetCloseShiftError: () => {
        set({ closeShiftError: null });
      },

      endShift: async (data: { cash: number; card: number; guests?: number; notes?: Array<{ text: string; time: string }>; checklist: string[] }) => {
        const state = get();
        const currentShift = state.currentShift;

        if (!currentShift?.id) {
          const error = new Error('Нет активной смены для закрытия');
          console.error(error);
          throw error;
        }

        // Вызываем API для закрытия смены
        const res = await fetch('/api/shifts/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shiftId: currentShift.id }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          const error = new Error(`Не удалось закрыть смену: ${res.status} ${text}`);
          console.error(error);
          // ВАЖНО: НЕ очищать currentShift, если на сервере ошибка
          throw error;
        }

        const data_response = await res.json();

        if (!data_response.success || !data_response.shift) {
          const error = new Error('Не удалось закрыть смену: некорректный ответ сервера');
          console.error(error);
          // ВАЖНО: НЕ очищать currentShift, если на сервере ошибка
          throw error;
        }

        const closedShift = data_response.shift;

        // Только после успешного закрытия на сервере очищаем currentShift
        set({
          currentShift: null,
          lastClosedShiftId: currentShift.id,
          // По желанию - обновить список смен, статистику и т.д.
          shifts: [...state.shifts, closedShift],
        });

        // Здесь уже можно показывать модалку "Смена закрыта" / предложение скачать отчёт и т.п.
        return closedShift;
      },

      setLastClosedShiftId: (id: string | null) => {
        set({ lastClosedShiftId: id });
      },

      sendManagerMessage: (text: string) => {
        const currentUser = get().currentUser;
        const currentShift = get().currentShift;
        const savedLocationId = get().savedLocationId;
        const locations = get().locations;
        
        if (!currentUser) return;

        const location = locations.find((loc: Location) => loc.id === savedLocationId || loc.id === currentUser.assignedPointId);
        const managerId = location?.managerId;

        if (!managerId) {
          console.error('No manager found for location');
          return;
        }

        // Create message with shift context
        const newMessage: DirectMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          fromId: currentUser.id,
          toId: managerId,
          text,
          attachments: [],
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString(),
        };

        // Add to messages array
        set((state: AppState) => ({
          messages: [...state.messages, newMessage]
        }));

        // In real app, call API: POST /api/employee/messages
        // with: { employeeId, locationId, shiftId, text }
        console.log('Message sent to manager:', {
          employeeId: currentUser.id,
          locationId: location?.id,
          shiftId: currentShift?.id || 'no_shift',
          text,
        });
      },

      addOrder: async (orderData: Omit<Order, 'id' | 'createdAt' | 'employeeId' | 'locationId' | 'shiftId'>) => {
        const currentShift = get().currentShift;
        const currentUser = get().currentUser;
        const savedLocationId = get().savedLocationId;
        
        if (!currentShift || currentShift.status !== 'active') {
          console.error('Cannot add order: shift is not active');
          return;
        }

        if (!currentUser) {
          console.error('Cannot add order: no current user');
          return;
        }

        const locationId = savedLocationId || currentUser.assignedPointId;
        if (!locationId) {
          console.error('Cannot add order: no location ID');
          return;
        }

        const newOrder: Order = {
          id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          employeeId: currentUser.id,
          locationId,
          shiftId: currentShift.id,
          ...orderData,
          createdAt: new Date().toISOString(),
        };

        set((state: AppState) => ({
          orders: [...(state.orders || []), newOrder]
        }));

        // Call API to save order
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyId: currentUser.businessId,
              pointId: locationId,
              shiftId: currentShift.id,
              employeeId: currentUser.id,
              items: orderData.items || [],
              paymentMethod: orderData.paymentType,
              totalAmount: orderData.amount,
              comment: orderData.comment,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to save order to server:', errorData);
            // Order is still added to local state for UX
          }
        } catch (error) {
          console.error('Error calling order API:', error);
          // Order is still added to local state for UX
        }

        console.log('Order added:', newOrder);
      },

      updateOrder: (orderId: string, updates: Partial<Order>) => {
        const currentShift = get().currentShift;
        if (!currentShift || currentShift.status !== 'active') {
          console.error('Cannot update order: shift is not active');
          return;
        }

        set((state: AppState) => ({
          orders: (state.orders || []).map((order: Order) => 
            order.id === orderId ? { ...order, ...updates } : order
          )
        }));

        // In real app, call API: PUT /api/orders/{orderId}
      },

      deleteOrder: (orderId: string) => {
        const currentShift = get().currentShift;
        if (!currentShift || currentShift.status !== 'active') {
          console.error('Cannot delete order: shift is not active');
          return;
        }

        set((state: AppState) => ({
          orders: (state.orders || []).filter((order: Order) => order.id !== orderId)
        }));

        // In real app, call API: DELETE /api/orders/{orderId}
      },

      getOrdersForShift: (shiftId: string) => {
        const orders = get().orders || [];
        return orders.filter((order: Order) => order.shiftId === shiftId);
      },

      getOrdersSummary: (shiftId: string) => {
        const orders = (get().orders || []).filter((order: Order) => order.shiftId === shiftId);
        
        const totalAmount = orders.reduce((sum: number, order: Order) => sum + order.amount, 0);
        const ordersCount = orders.length;
        const guestsSum = orders.reduce((sum: number, order: Order) => sum + order.guestsCount, 0);
        const avgCheck = ordersCount > 0 ? totalAmount / ordersCount : 0;
        
        const byPaymentType = {
          cash: orders.filter((o: Order) => o.paymentType === 'cash').reduce((sum: number, o: Order) => sum + o.amount, 0),
          card: orders.filter((o: Order) => o.paymentType === 'card').reduce((sum: number, o: Order) => sum + o.amount, 0),
          online: orders.filter((o: Order) => o.paymentType === 'online').reduce((sum: number, o: Order) => sum + o.amount, 0),
        };

        return {
          totalAmount,
          ordersCount,
          guestsSum,
          avgCheck,
          byPaymentType,
        };
      },
      
      fetchLocations: async (businessId: string) => {
        try {
          const response = await fetch(`/api/locations/list?businessId=${encodeURIComponent(businessId)}`);
          const data = await response.json();
          
          if (response.ok && data.success && data.locations) {
            set({ locations: data.locations });
            
            // Если у текущего пользователя есть assignedPointId, но savedLocationId не установлен, устанавливаем его
            const currentUser = get().currentUser;
            if (currentUser?.role === 'employee' && currentUser.assignedPointId && !get().savedLocationId) {
              set({ savedLocationId: currentUser.assignedPointId });
              console.log('[fetchLocations] Set savedLocationId from assignedPointId:', currentUser.assignedPointId);
            }
          }
        } catch (error) {
          console.error('Fetch locations error:', error);
        }
      },
      
      addLocation: async (locationData: Omit<Location, 'id' | 'businessId'>) => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser || !currentUser.businessId) {
            console.error('Cannot add location: no current user or businessId');
            return '';
          }

          const response = await fetch('/api/locations/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...locationData,
              businessId: currentUser.businessId,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success || !data.location) {
            console.error('Failed to create location:', data.error);
            return '';
          }

          const newLocation = data.location;

          // Update local state
          set((state: AppState) => ({
            locations: [...state.locations, newLocation]
          }));

          return newLocation.id;
        } catch (error) {
          console.error('Add location error:', error);
          return '';
        }
      },
      
      getCurrentLocation: () => {
        const locations = get().locations;
        return locations.length > 0 ? locations[0] : null;
      },
      
      updateLocationSettings: (locationId: string, settings: { themeColor?: string; coverImage?: string }) => {
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === locationId
              ? { ...loc, ...settings }
              : loc
          )
        }));
      },
      
      toggleLocationPause: (id: string) => {
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === id
              ? { 
                  ...loc, 
                  status: loc.status === 'active' ? 'paused' : 'active',
                  history: [
                    ...(loc.history || []),
                    {
                      action: loc.status === 'active' ? 'paused' : 'resumed',
                      user: get().currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                }
              : loc
          )
        }));
      },
      
      deleteLocation: async (id: string) => {
        try {
          const response = await fetch(`/api/locations/delete?locationId=${encodeURIComponent(id)}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.error('Failed to delete location:', data.error);
            return;
          }

          // Update local state
          set((state: AppState) => ({
            locations: state.locations.filter(loc => loc.id !== id),
            employees: state.employees.map(emp =>
              emp.assignedPointId === id ? { ...emp, assignedPointId: null } : emp
            )
          }));
        } catch (error) {
          console.error('Delete location error:', error);
        }
      },
      
      archiveLocation: (id: string) => {
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === id
              ? { 
                  ...loc, 
                  status: 'archived',
                  history: [
                    ...(loc.history || []),
                    {
                      action: 'archived',
                      user: get().currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                }
              : loc
          )
        }));
      },
      
      duplicateLocation: (id: string) => {
        const location = get().locations.find(loc => loc.id === id);
        if (!location) return '';
        
        const newLocation: Location = {
          ...location,
          id: 'loc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          name: location.name + ' (Copy)',
          status: 'active',
          history: [
            {
              action: 'duplicated',
              user: get().currentUser?.name || 'System',
              date: new Date().toISOString()
            }
          ]
        };
        
        set((state: AppState) => ({
          locations: [...state.locations, newLocation]
        }));
        
        return newLocation.id;
      },
      
      updateLocationProfile: async (id: string, data: Partial<Location>) => {
        try {
          const currentUser = get().currentUser;
          
          const response = await fetch('/api/locations/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locationId: id,
              updates: {
                ...data,
                updatedBy: currentUser?.name || 'System',
              },
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success || !result.location) {
            console.error('Failed to update location:', result.error);
            return;
          }

          const updatedLocation = result.location;

          // Update local state
          set((state: AppState) => ({
            locations: state.locations.map((loc: Location) =>
              loc.id === id ? updatedLocation : loc
            )
          }));
        } catch (error) {
          console.error('Update location error:', error);
        }
      },
      
      assignManager: (locationId: string, userId: string | null) => {
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === locationId
              ? { 
                  ...loc, 
                  managerId: userId,
                  history: [
                    ...(loc.history || []),
                    {
                      action: userId ? 'manager_assigned' : 'manager_removed',
                      user: get().currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                }
              : loc
          )
        }));
      },
      
      updateLocationBranding: async (id: string, logo: string | null, banner: string | null) => {
        try {
          // Optimistic update
          const currentLocation = get().locations.find(loc => loc.id === id);
          if (!currentLocation) {
            console.error('Location not found:', id);
            return;
          }

          const updatedBranding = {
            ...currentLocation.branding,
            logo: logo ?? currentLocation.branding?.logo ?? null,
            banner: banner ?? currentLocation.branding?.banner ?? null,
            color: currentLocation.branding?.color ?? '#000000'
          };

          set((state: AppState) => ({
            locations: state.locations.map((loc: Location) =>
              loc.id === id
                ? {
                    ...loc,
                    branding: updatedBranding,
                    history: [
                      ...(loc.history || []),
                      {
                        action: 'branding_updated',
                        user: get().currentUser?.name || 'System',
                        date: new Date().toISOString()
                      }
                    ]
                  }
                : loc
            )
          }));

          // Call API to save to disk
          const response = await fetch('/api/locations/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              locationId: id,
              updates: {
                branding: updatedBranding
              }
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.error('Failed to update location branding:', data.error);
            // Revert optimistic update on failure
            set((state: AppState) => ({
              locations: state.locations.map((loc: Location) =>
                loc.id === id ? currentLocation : loc
              )
            }));
            throw new Error(data.error || 'Failed to update branding');
          }
        } catch (error) {
          console.error('Update location branding error:', error);
          throw error;
        }
      },
      
      addLocationDocument: (id: string, doc: { name: string; type: string; url: string }) => {
        const newDoc = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          name: doc.name,
          type: doc.type,
          date: new Date().toISOString(),
          url: doc.url
        };
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === id
              ? {
                  ...loc,
                  documents: [...(loc.documents || []), newDoc],
                  history: [
                    ...(loc.history || []),
                    {
                      action: 'document_added',
                      user: get().currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                }
              : loc
          )
        }));
      },
      
      removeLocationDocument: (id: string, docId: string) => {
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === id
              ? {
                  ...loc,
                  documents: (loc.documents || []).filter(doc => doc.id !== docId),
                  history: [
                    ...(loc.history || []),
                    {
                      action: 'document_removed',
                      user: get().currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                }
              : loc
          )
        }));
      },
      
      updateLocationSchedule: (id: string, schedule: Location['schedule']) => {
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === id
              ? {
                  ...loc,
                  schedule: schedule,
                  history: [
                    ...(loc.history || []),
                    {
                      action: 'schedule_updated',
                      user: get().currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                }
              : loc
          )
        }));
      },
      
      moveStaffToLocation: (staffId: string, locationId: string, role: 'manager' | 'employee') => {
        set((state: AppState) => {
          // Update employee assignment
          const updatedEmployees = state.employees.map((emp: User) =>
            emp.id === staffId
              ? { ...emp, assignedPointId: locationId, role: role }
              : emp
          );
          
          // If assigning as manager, update location managerId
          const updatedLocations = state.locations.map((loc: Location) => {
            if (loc.id === locationId && role === 'manager') {
              return {
                ...loc,
                managerId: staffId,
                history: [
                  ...(loc.history || []),
                  {
                    action: 'staff_assigned',
                    user: get().currentUser?.name || 'System',
                    date: new Date().toISOString()
                  }
                ]
              };
            }
            return loc;
          });
          
          return {
            employees: updatedEmployees,
            locations: updatedLocations
          };
        });
      },
      
      regenerateLocationCode: (locationId: string) => {
        // Helper function to generate 16-digit code
        const generate16DigitCode = () => {
          const part1 = Math.floor(1000 + Math.random() * 9000);
          const part2 = Math.floor(1000 + Math.random() * 9000);
          const part3 = Math.floor(1000 + Math.random() * 9000);
          const part4 = Math.floor(1000 + Math.random() * 9000);
          return `${part1}-${part2}-${part3}-${part4}`;
        };

        const newCode = generate16DigitCode();
        set((state: AppState) => ({
          locations: state.locations.map((loc: Location) =>
            loc.id === locationId
              ? {
                  ...loc,
                  accessCode: newCode,
                  history: [
                    ...(loc.history || []),
                    {
                      action: 'access_code_regenerated',
                      user: get().currentUser?.name || 'System',
                      date: new Date().toISOString()
                    }
                  ]
                }
              : loc
          )
        }));
      },
      
      sendUserMessage: (text: string) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          text: text.trim(),
          sender: 'user',
          timestamp: Date.now(),
        };
        set((state: AppState) => ({
          chatHistory: [...state.chatHistory, newMessage],
        }));
      },
      
      receiveAgentMessage: (text: string) => {
        const newMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          text: text.trim(),
          sender: 'agent',
          timestamp: Date.now(),
        };
        set((state: AppState) => ({
          chatHistory: [...state.chatHistory, newMessage],
        }));
      },
      
      markChatRead: () => {
        set({ lastReadTimestamp: Date.now() });
      },
      
      unreadChatMessages: () => {
        const { chatHistory, lastReadTimestamp } = get();
        return chatHistory.filter(
          (msg: ChatMessage) => msg.sender === 'agent' && msg.timestamp > lastReadTimestamp
        ).length;
      },
      
      sendMessage: (toId, text, attachments = []) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        
        const newMessage: DirectMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          fromId: currentUser.id,
          toId,
          text,
          attachments,
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString()
        };
        
        set((state: AppState) => ({
          messages: [...state.messages, newMessage]
        }));
      },
      
      markMessageRead: (id: string) => {
        set((state: AppState) => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, isRead: true } : msg
          )
        }));
      },

      markMessageAsRead: (id: string) => {
        set((state: AppState) => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, isRead: true } : msg
          )
        }));
      },
      
      closeMessageComposer: () => {
        set({
          isMessageComposerOpen: false,
          messageComposerRecipientId: null
        });
      },
      
      openMessageComposer: (recipientId?: string) => {
        set({
          isMessageComposerOpen: true,
          messageComposerRecipientId: recipientId || null
        });
      },
      
      // Conversation System
      openConversation: (
        conversationId: string, 
        type: 'manager' | 'employee', 
        recipientId: string, 
        recipientName: string, 
        context?: { notificationMessage?: string; locationName?: string }, 
        profileLink?: string
      ) => {
        set((state: AppState) => {
          const newOpen = state.openConversations.includes(conversationId) 
            ? state.openConversations 
            : [...state.openConversations, conversationId];
          const newMinimized = state.minimizedConversations.filter(id => id !== conversationId);
          return {
            openConversations: newOpen,
            minimizedConversations: newMinimized,
            conversationData: {
              ...state.conversationData,
              [conversationId]: {
                type,
                recipientId,
                recipientName,
                context,
                profileLink
              }
            }
          };
        });
      },
      
      closeConversation: (conversationId: string) => {
        set((state: AppState) => {
          const newOpen = state.openConversations.filter(id => id !== conversationId);
          const newMinimized = state.minimizedConversations.filter(id => id !== conversationId);
          // Очищаем черновик только если сообщение было отправлено (проверка будет в компоненте)
          return {
            openConversations: newOpen,
            minimizedConversations: newMinimized
          };
        });
      },
      
      minimizeConversation: (conversationId: string) => {
        set((state: AppState) => {
          const newOpen = state.openConversations.filter(id => id !== conversationId);
          const newMinimized = state.minimizedConversations.includes(conversationId)
            ? state.minimizedConversations
            : [...state.minimizedConversations, conversationId];
          return {
            openConversations: newOpen,
            minimizedConversations: newMinimized
          };
        });
      },
      
      restoreConversation: (conversationId: string) => {
        set((state: AppState) => {
          const newOpen = state.openConversations.includes(conversationId)
            ? state.openConversations
            : [...state.openConversations, conversationId];
          const newMinimized = state.minimizedConversations.filter(id => id !== conversationId);
          return {
            openConversations: newOpen,
            minimizedConversations: newMinimized
          };
        });
      },
      
      updateConversationDraft: (conversationId: string, text: string) => {
        set((state: AppState) => ({
          conversationDrafts: {
            ...state.conversationDrafts,
            [conversationId]: text
          }
        }));
      },
      
      getConversationDraft: (conversationId: string) => {
        return get().conversationDrafts[conversationId] || '';
      },
      
      sendConversationMessage: async (conversationId: string, type: 'manager' | 'employee', recipientId: string) => {
        const state = get();
        const draft = state.conversationDrafts[conversationId] || '';
        if (!draft.trim()) return;
        
        // Отправляем сообщение
        state.sendMessage(recipientId, draft, []);
        
        // Очищаем черновик после успешной отправки
        set((currentState: AppState) => {
          const newDrafts = { ...currentState.conversationDrafts };
          delete newDrafts[conversationId];
          return { conversationDrafts: newDrafts };
        });
      },
      
      completeTour: () => {
        set({ hasSeenTour: true });
      },
      
      toggleShowBigTimer: () => {
        set((state: AppState) => ({ 
          showBigTimer: !state.showBigTimer,
          isBigTimerVisible: !state.isBigTimerVisible // Синхронизируем с новым полем
        }));
      },
      
      toggleBigTimerVisibility: () => {
        set((state: AppState) => ({ 
          isBigTimerVisible: !state.isBigTimerVisible,
          showBigTimer: !state.isBigTimerVisible // Синхронизируем со старым полем для обратной совместимости
        }));
      },
      
      toggleTimerVisibility: () => {
        set((state: AppState) => ({ 
          isTimerVisible: !state.isTimerVisible
        }));
      },
      
      hydrateFromServer: async () => {
        const state = get();
        const currentUser = state.currentUser;
        
        if (!currentUser?.id) {
          // Если нет пользователя, сбросим состояние смены
          set({ 
            currentShift: null,
            shiftEndTime: null,
            shiftElapsedTime: null
          });
          return;
        }
        
        try {
          // TODO: Заменить на реальный API endpoint, когда он будет готов
          // Сейчас используем заглушку - проверяем currentShift из localStorage
          // В реальности здесь должен быть вызов API для получения активной смены
          
          // Если currentShift уже есть в store, оставляем как есть
          // В будущем здесь будет вызов API:
          // const response = await fetch(`/api/employee/${currentUser.id}/active-shift`);
          // const data = await response.json();
          // if (data.shift) { ... }
          
          // Пока просто проверяем, что currentShift синхронизирован
          if (state.currentShift) {
            // Если смена активна, убеждаемся, что shiftEndTime = null и запускаем таймер
            if (state.currentShift.status === 'active') {
              set({ shiftEndTime: null });
              // Запускаем единый интервал таймера, если его еще нет
              startShiftTimer();
            } else {
              // Если смена не активна, останавливаем таймер
              stopShiftTimer();
            }
          } else {
            // Если смены нет, сбрасываем shiftEndTime и останавливаем таймер
            set({ shiftEndTime: null, shiftElapsedTime: null });
            stopShiftTimer();
          }
        } catch (error) {
          console.error('Error hydrating shift state from server:', error);
          // При ошибке не меняем состояние, оставляем как есть
        }
      },
      
      getShiftElapsedTime: () => {
        const state = get();
        const shift = state.currentShift;
        
        if (!shift || shift.status !== 'active' || !shift.startTime) {
          return null;
        }
        
        const startTime = new Date(shift.startTime);
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        return {
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
          formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        };
      },
      
      fetchCurrentShift: async () => {
        const state = get();
        const currentUser = state.currentUser;
        
        if (!currentUser?.id) {
          set({ currentShift: null });
          return;
        }
        
        const locationId = state.savedLocationId || currentUser.assignedPointId;
        
        try {
          const res = await fetch(`/api/employee/shifts/active?employeeId=${encodeURIComponent(currentUser.id)}${locationId ? `&locationId=${encodeURIComponent(locationId)}` : ''}`);
          
          if (!res.ok) {
            set({ currentShift: null });
            return;
          }
          
          const data = await res.json();
          
          if (!data.success || !data.shift) {
            set({ currentShift: null, shiftEndTime: null, shiftElapsedTime: null });
            stopShiftTimer();
            return;
          }
          
          const serverShift = data.shift;
          
          set({
            currentShift: {
              id: serverShift.id,
              startTime: serverShift.startTime,
              locationId: serverShift.locationId,
              employeeId: serverShift.employeeId,
              status: serverShift.status === 'active' ? 'active' : 'closed',
              readableNumber: serverShift.readableNumber,
              totalRevenue: serverShift.totalRevenue,
              totalChecks: serverShift.totalChecks,
              totalGuests: serverShift.totalGuests,
            },
            shiftEndTime: null,
          });
          
          // Запускаем таймер, если смена активна
          if (serverShift.status === 'active') {
            startShiftTimer();
          } else {
            stopShiftTimer();
          }
        } catch (error) {
          console.error('Failed to fetch current shift:', error);
          // При ошибке сети не очищаем состояние смены, чтобы не терять данные
        }
      },
      
      finishShift: async () => {
        const state = get();
        const shift = state.currentShift;
        
        if (!shift?.id) {
          console.warn('finishShift called but no active shift');
          return;
        }
        
        // Оптимистичное обновление
        const optimisticEndTime = new Date().toISOString();
        const previousShift = { ...shift };
        
        set({
          currentShift: null,
          isClosingShift: true,
          closeShiftError: null,
          lastClosedShiftId: shift.id,
          shiftEndTime: optimisticEndTime,
          shiftElapsedTime: null,
        });
        
        stopShiftTimer();
        
        try {
          const res = await fetch('/api/shifts/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shiftId: shift.id }),
          });
          
          if (!res.ok) {
            // Откат
            set({
              currentShift: previousShift,
              isClosingShift: false,
              closeShiftError: 'Ошибка при завершении смены',
              shiftEndTime: null,
            });
            startShiftTimer();
            throw new Error('Не удалось завершить смену');
          }
          
          const data = await res.json();
          
          if (!data.success) {
            // Откат
            set({
              currentShift: previousShift,
              isClosingShift: false,
              closeShiftError: data.error || 'Ошибка при завершении смены',
              shiftEndTime: null,
            });
            startShiftTimer();
            throw new Error(data.error || 'Не удалось завершить смену');
          }
          
          const closedShift = data.shift;
          const serverEndTime = closedShift?.clockOut || closedShift?.endTime || optimisticEndTime;
          
          set({
            isClosingShift: false,
            closeShiftError: null,
            shiftEndTime: serverEndTime,
            shifts: [...state.shifts, closedShift].filter(Boolean),
          });
        } catch (error) {
          console.error('Failed to finish shift:', error);
          throw error;
        }
      },
      
      syncWithServer: async () => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) {
            return;
          }

          const response = await fetch(`/api/sync?userId=${encodeURIComponent(currentUser.id)}&role=${encodeURIComponent(currentUser.role)}`);
          const data = await response.json();

          if (response.ok && data.success && data.data) {
            // OVERWRITE local state with fresh data from server
            set({
              currentUser: data.data.user,
              user: data.data.user,
              locations: data.data.locations || [],
              employees: data.data.employees || [],
              shifts: data.data.shifts || [],
              // Update users array
              users: get().users.map(u => {
                const updated = data.data.employees?.find((e: User) => e.id === u.id);
                return updated || u;
              }),
            });

            // Для сотрудников: синхронизируем активную смену с сервером
            if (currentUser.role === 'employee') {
              const locationId = get().savedLocationId || currentUser.assignedPointId;
              if (locationId) {
                try {
                  const activeShiftResponse = await fetch(`/api/employee/shifts/active?employeeId=${encodeURIComponent(currentUser.id)}&locationId=${encodeURIComponent(locationId)}`);
                  const activeShiftData = await activeShiftResponse.json();
                  
                  if (activeShiftResponse.ok && activeShiftData.success) {
                    if (activeShiftData.shift) {
                      // На сервере есть активная смена - обновляем локальную
                      const serverShift = activeShiftData.shift;
                      set({
                        currentShift: {
                          id: serverShift.id,
                          startTime: serverShift.startTime,
                          locationId: serverShift.locationId,
                          employeeId: serverShift.employeeId,
                          status: serverShift.status,
                          readableNumber: serverShift.readableNumber,
                          totalRevenue: serverShift.totalRevenue,
                          totalChecks: serverShift.totalChecks,
                          totalGuests: serverShift.totalGuests,
                        },
                        shiftEndTime: null,
                        shiftElapsedTime: null,
                      });
                      // Запускаем единый интервал таймера, если смена активна
                      if (serverShift.status === 'active') {
                        startShiftTimer();
                      }
                      console.log('[Sync] Loaded active shift from server:', serverShift.id);
                    } else {
                      // На сервере нет активной смены - очищаем локальную, если она есть
                      const localActiveShift = get().currentShift;
                      if (localActiveShift && localActiveShift.status === 'active') {
                        console.log('[Sync] Clearing stale local active shift - no active shift on server');
                        set({ currentShift: null, shiftEndTime: null, shiftElapsedTime: null });
                        stopShiftTimer();
                      }
                    }
                  }
                } catch (error) {
                  console.error('[Sync] Error syncing active shift:', error);
                }
              }
            }
          }
        } catch (error) {
          console.error('Sync with server error:', error);
        }
      }
    }
  },
  { 
    name: 'shiftflow-storage',
    partialize: (state: AppState) => ({
        currentUser: state.currentUser,
        businessName: state.businessName,
        currency: state.currency,
        formConfig: state.formConfig,
        ultraMode: state.ultraMode,
        isSidebarCollapsed: state.isSidebarCollapsed,
        hasSeenTour: state.hasSeenTour,
        users: state.users,
        employees: state.employees,
        locations: state.locations,
        shifts: state.shifts
      }),
    merge: (persistedState: any, currentState: AppState) => {
        // Merge strategy: keep persisted users, but ensure mock users exist
        const persistedUsers = persistedState?.users || [];
        const persistedEmployees = persistedState?.employees || [];
        
        // Check if mock users already exist in persisted state
        const hasMockUsers = persistedUsers.some((u: User) => u.id?.startsWith('test-'));
        
        // If no mock users, add them (but don't duplicate)
        const users = hasMockUsers 
          ? persistedUsers 
          : [...mockData.users, ...persistedUsers.filter((u: User) => !u.id?.startsWith('test-'))];
        
        const hasMockEmployees = persistedEmployees.some((e: User) => e.id?.startsWith('test-'));
        const employees = hasMockEmployees
          ? persistedEmployees
          : [...mockData.employees, ...persistedEmployees.filter((e: User) => !e.id?.startsWith('test-'))];
        
        return {
          ...currentState,
          ...persistedState,
          users,
          employees
        };
      }
    }
  )
);

// Helper function to get formal name for addressing
export function getFormalName(user: User | null): string {
  if (!user || !user.fullName) {
    return user?.name || "User";
  }
  
  const parts = user.fullName.trim().split(/\s+/);
  
  // If 3 parts (Last First Middle): Return "First Middle"
  if (parts.length === 3) {
    return `${parts[1]} ${parts[2]}`;
  }
  
  // If 2 parts: Return "First"
  if (parts.length === 2) {
    return parts[1];
  }
  
  // Else: Return fullName
  return user.fullName;
}

// UI Store for locale/language
type Locale = 'ru' | 'uk' | 'en';

interface UIState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useUIStore = create<UIState>((set) => ({
  locale:
    (typeof window !== 'undefined'
      ? ((window.localStorage.getItem('wellify_locale') as Locale | null) ?? 'ru')
      : 'ru'),
  setLocale: (locale) =>
    set(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('wellify_locale', locale);
      }
      return { locale };
    }),
}));
