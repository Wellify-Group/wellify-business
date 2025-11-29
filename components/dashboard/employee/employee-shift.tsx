"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore, { Order } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import { OrderConfirmationModal } from "./order-confirmation-modal";
import { ShiftClosingForm } from "./shift-closing-form";
import { ShiftMessagesCard } from "./shift-messages-card";
import { useShiftTasks } from "@/hooks/use-shift-tasks";
import { 
  CreditCard, 
  Banknote, 
  AlertTriangle, 
  Trash2, 
  Plus,
  ShoppingBag,
  XCircle,
  ChevronRight,
  Search,
  Clock,
  Power,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Info,
  Check
} from 'lucide-react';
import { Collapse } from "@/components/ui/collapse";
import { cn } from "@/lib/utils";

interface EmployeeShiftProps {
  location: any;
}

interface BasketItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface FormData {
  f1: string;
  f2: string;
  f3: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

export function EmployeeShift({ location }: EmployeeShiftProps) {
  const { t } = useLanguage();
  const { 
    currentShift, 
    currentUser, 
    savedLocationId, 
    addOrder, 
    orders,
    currency,
    locations,
    messages,
    isTimerVisible,
    shiftElapsedTime,
    toggleTimerVisibility,
    closeShift
  } = useStore();
  
  // Mock products для автодополнения
  const mockProducts: Product[] = [
    { id: 1, name: 'Капучино', price: 60 },
    { id: 2, name: 'Капучино XL', price: 85 },
    { id: 3, name: 'Латте', price: 65 },
    { id: 4, name: 'Чизкейк', price: 120 },
    { id: 5, name: 'Кальян', price: 450 },
    { id: 6, name: 'Лимонад', price: 90 },
    { id: 7, name: 'Чайник чая', price: 110 },
  ];
  
  const [showClosingForm, setShowClosingForm] = useState(false);
  const [currentBasket, setCurrentBasket] = useState<BasketItem[]>([]);
  const [formData, setFormData] = useState<FormData>({ f1: '', f2: '', f3: 1 });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  
  // Хук для управления задачами
  const {
    tasks,
    totalTasksCount,
    completedTasksCount,
    completionPercent,
    isLoading: tasksLoading,
    error: tasksError,
    loadTasksForShift,
    toggleTask,
  } = useShiftTasks();
  
  // Определяем статус смены
  const shiftStatus = currentShift?.status === 'active' 
    ? 'active' 
    : currentShift?.status === 'closed' 
    ? 'finished' 
    : 'not_started';

  // Получаем назначенную локацию
  const assignedLocation = useMemo(() => {
    return locations.find(loc => loc.id === (savedLocationId || currentUser?.assignedPointId));
  }, [locations, savedLocationId, currentUser]);

  // Получаем метрики смены
  const metrics = useMemo(() => {
    if (!currentShift || currentShift.status !== 'active') {
      return { total: 0, cash: 0, card: 0, orders: 0 };
    }
    const shiftOrders = orders.filter(order => order.shiftId === currentShift.id);
    const total = shiftOrders.reduce((sum, order) => sum + order.amount, 0);
    const cash = shiftOrders.filter(o => o.paymentType === 'cash').reduce((sum, order) => sum + order.amount, 0);
    const card = shiftOrders.filter(o => o.paymentType === 'card').reduce((sum, order) => sum + order.amount, 0);
    return {
      total,
      cash,
      card,
      orders: shiftOrders.length
    };
  }, [currentShift, orders]);

  // Таймер смены - используем единое состояние из store (без локальных интервалов)

  // Клик вне поиска
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Обработчик завершения смены
  const handleEndShift = () => {
    if (shiftStatus === 'active') {
      setShowClosingForm(true);
    }
  };

  // Логика поиска
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, f1: value });
    if (value.length > 0) {
      const filtered = mockProducts.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectProduct = (product: Product) => {
    setFormData({ ...formData, f1: product.name, f2: product.price.toString() });
    setShowSuggestions(false);
  };

  // Добавление позиции в чек
  const addToBasket = () => {
    if (!formData.f1 || formData.f2 === '') return;

    const newItem: BasketItem = {
      id: Date.now(),
      name: formData.f1,
      price: Number(formData.f2),
      qty: Number(formData.f3),
    };

    setCurrentBasket([...currentBasket, newItem]);
    setFormData({ f1: '', f2: '', f3: 1 });
  };

  // Удаление позиции
  const removeFromBasket = (id: number) => {
    setCurrentBasket(currentBasket.filter(item => item.id !== id));
  };

  // Очистка корзины
  const clearBasket = () => {
    if (window.confirm('Очистить корзину?')) {
      setCurrentBasket([]);
    }
  };

  // Финальная оплата (Закрытие чека)
  const handleCheckout = () => {
    // Check if basket is empty
    if (currentBasket.length === 0) {
      toastError('Нельзя оформить пустой чек');
      return;
    }

    // Check if shift is active
    if (!currentShift || currentShift.status !== 'active') {
      toastError('Нельзя оформить заказ вне смены. Начните смену.');
      return;
    }

    // Open confirmation modal
    setShowConfirmationModal(true);
  };

  const handleConfirmOrder = async (finalPaymentMethod: 'card' | 'cash', comment?: string) => {
    if (currentBasket.length === 0) return;

    setIsProcessingOrder(true);

    try {
      const basketTotal = currentBasket.reduce((acc, item) => acc + (item.price * item.qty), 0);

      // Prepare order items
      const orderItems = currentBasket.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
      }));

      // Prepare order data
      const orderData = {
        orderType: 'hall' as const,
        paymentType: finalPaymentMethod,
        amount: basketTotal,
        guestsCount: 1,
        comment: comment,
        items: orderItems,
      };

      // Add order to store (this will also call API in real app)
      await addOrder(orderData);

      // Clear basket
      setCurrentBasket([]);

      // Reset payment method to default
      setPaymentMethod('cash');

      // Close modal
      setShowConfirmationModal(false);

      // Show success toast
      toastSuccess(`Заказ на ${basketTotal.toLocaleString()} ${currency} оформлен`);

      // Focus back on input field (используем requestAnimationFrame для мгновенного фокуса)
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

    } catch (error: any) {
      console.error('Error creating order:', error);
      toastError('Не удалось оформить заказ. Попробуйте еще раз.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Подсчет итого текущей корзины
  const basketTotal = currentBasket.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  // Загрузка задач при старте смены
  useEffect(() => {
    if (shiftStatus === 'active' && currentShift?.id) {
      loadTasksForShift(currentShift.id);
    }
  }, [shiftStatus, currentShift?.id, loadTasksForShift]);

  // Обработчик переключения задачи
  const handleToggleTask = (taskId: string) => {
    toggleTask(taskId);
  };

  const handleCloseSuccess = () => {
    setShowClosingForm(false);
  };

  // Если смена не активна, показываем сообщение или состояние завершенной смены
  if (shiftStatus === 'not_started') {
    return (
      <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">Смена не начата</p>
          <p className="text-sm text-muted-foreground">Начните смену, чтобы использовать терминал</p>
        </div>
      </div>
    );
  }
  
  if (shiftStatus === 'finished') {
    return (
      <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-2xl font-semibold text-foreground mb-2">Смена завершена</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    /* 
       ГЛАВНЫЙ КОНТЕЙНЕР
       h-[calc(100vh-64px)] -> Гарантирует, что страница НЕ БУДЕТ скроллиться (вычитаем высоту навбара ~64px).
    */
    <div className="flex h-[calc(100vh-64px)] w-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
      
      {/* ================= ЛЕВАЯ КОЛОНКА ================= */}
      <aside className="w-[240px] flex-shrink-0 border-r border-[var(--border-color)] bg-[var(--surface-1)] flex flex-col h-full">
        
        <div className="flex flex-col h-full p-5 gap-5">
          {/* БЛОК 1: ТАЙМЕР СМЕНЫ */}
          <div className="flex-shrink-0 bg-[var(--surface-2)] border border-[var(--border-color)] rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex w-2.5 h-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--success)]">В работе</span>
              </div>
              
              {/* Иконка-глаз для переключения видимости таймера */}
              <button
                onClick={toggleTimerVisibility}
                className="p-1 hover:bg-[var(--surface-2)] rounded transition-colors"
                title={isTimerVisible ? "Скрыть таймер" : "Показать таймер"}
              >
                {isTimerVisible ? (
                  <Eye className="h-4 w-4 text-[var(--text-secondary)]" />
                ) : (
                  <EyeOff className="h-4 w-4 text-[var(--text-secondary)]" />
                )}
              </button>
            </div>
            
            {/* Таймер или звездочки */}
            <div className="text-3xl font-mono font-medium text-[var(--text-primary)] tracking-tight leading-none h-9 flex items-center">
              {isTimerVisible ? (
                <span>{shiftElapsedTime?.formatted || '00:00:00'}</span>
              ) : (
                <span className="text-[var(--text-secondary)]">**:**:**</span>
              )}
            </div>
            
            {/* Дата и день недели */}
            <div className="text-xs text-[var(--text-secondary)] mt-2">
              {(() => {
                const now = new Date();
                const dateStr = now.toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }).replace(/\//g, '.');
                const weekday = now.toLocaleDateString('ru-RU', {
                  weekday: 'long'
                });
                const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                return `${dateStr} • ${weekdayCapitalized}`;
              })()}
            </div>
          </div>

          {/* БЛОК 2: МЕТРИКИ */}
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border-color)]">
              <label className="text-[10px] uppercase text-[var(--text-secondary)] font-bold tracking-wider">Выручка</label>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-1 tracking-tight">
                {metrics.total.toLocaleString()} <span className="text-[var(--text-secondary)] text-lg font-normal">{currency}</span>
              </div>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2">
                <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-[var(--text-secondary)]"/> Карта</span>
                <span className="font-mono text-[var(--text-primary)]">{metrics.card.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-2">
                <span className="flex items-center gap-1.5"><Banknote size={14} className="text-[var(--text-secondary)]"/> Наличные</span>
                <span className="font-mono text-[var(--text-primary)]">{metrics.cash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[var(--text-secondary)] pt-1">
                <span>Чеков</span>
                <span className="text-[var(--text-primary)]">{metrics.orders}</span>
              </div>
            </div>
          </div>
          
          {/* КНОПКА ПОЛНОЭКРАННОГО РЕЖИМА */}
          <button
            onClick={async () => {
              try {
                if (!document.fullscreenElement) {
                  await document.documentElement.requestFullscreen();
                } else {
                  await document.exitFullscreen();
                }
              } catch (error) {
                console.error("Fullscreen error:", error);
              }
            }}
            className="w-full rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-primary)]/70 rounded-full text-xs hover:bg-[var(--surface-2)] transition-colors px-3 py-2"
          >
            Полноэкранный режим
          </button>
        </div>
      </aside>

      {/* ================= ЦЕНТР (POS ТЕРМИНАЛ) ================= */}
      {/* min-h-0 важно для скролла внутри flex */}
      <main className="flex-1 flex flex-col relative bg-[var(--surface-1)] min-w-0 min-h-0">
        <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-6 py-4 gap-4 h-full">
          
          {/* 1. КОНСТРУКТОР (Верх) */}
          <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm flex-shrink-0 z-50">
            <div className="grid grid-cols-12 gap-3 items-start">
              
              {/* Поле поиска */}
              <div className="col-span-6 relative" ref={wrapperRef}>
                 <div className="relative">
                   <input 
                    ref={inputRef}
                    type="text" 
                    autoFocus
                    placeholder="Начни вводить (напр. Латте)..."
                    value={formData.f1}
                    onChange={handleNameChange}
                    onFocus={() => { if(formData.f1) setShowSuggestions(true); }}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-9 pr-3 py-3 focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition placeholder:text-[var(--text-tertiary)]"
                  />
                  <Search size={16} className="absolute left-3 top-3.5 text-[var(--text-secondary)]" />
                </div>
                {/* Выпадашка */}
                <div className="absolute top-full left-0 w-full z-50">
                  <Collapse isOpen={showSuggestions && suggestions.length > 0} className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-lg mt-1 shadow-lg max-h-56 overflow-y-auto custom-scrollbar">
                    {suggestions.map((product) => (
                      <div key={product.id} onClick={() => selectProduct(product)} className="p-3 hover:bg-[var(--surface-3)] cursor-pointer border-b border-[var(--border-color)] flex justify-between">
                        <span className="text-sm text-[var(--text-primary)]">{product.name}</span>
                        <span className="text-xs font-mono opacity-70 text-[var(--text-secondary)]">{product.price} {currency}</span>
                      </div>
                    ))}
                  </Collapse>
                </div>
              </div>

              {/* Цена */}
              <div className="col-span-3 relative">
                <input type="number" placeholder="Цена" value={formData.f2} onChange={e => setFormData({...formData, f2: e.target.value})} className="w-full bg-[var(--surface-2)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl pl-3 pr-6 py-3 focus:border-[var(--accent-primary)] outline-none transition font-mono placeholder:text-[var(--text-tertiary)]" />
                <span className="absolute right-3 top-3.5 text-[var(--text-secondary)] text-xs">{currency}</span>
              </div>

              {/* Кол-во и Кнопка */}
              <div className="col-span-3 flex gap-2">
                 <input type="number" value={formData.f3} onChange={e => setFormData({...formData, f3: Number(e.target.value) || 1})} className="w-16 bg-[var(--surface-2)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-2 py-3 text-center" />
                <button onClick={addToBasket} disabled={!formData.f1 || formData.f2 === ''} className="flex-1 bg-[var(--surface-2)] border border-[var(--border-color)] hover:bg-[var(--surface-3)] text-[var(--text-primary)] rounded-xl font-bold flex items-center justify-center transition disabled:opacity-50">
                  <Plus size={20} /> <span className="ml-2 text-sm hidden xl:inline">Добавить</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. ЧЕК (Низ) - Скроллится только список внутри */}
          <div className="flex-1 bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col min-h-0 z-0 shadow-sm">
            <div className="p-3 border-b border-[var(--border-color)] bg-[var(--surface-2)] flex justify-between items-center flex-shrink-0">
              <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2"><ShoppingBag size={16} className="text-indigo-400 text-[var(--accent-primary)]" /> Чек ({currentBasket.length})</h3>
              {currentBasket.length > 0 && <button onClick={clearBasket} className="text-xs text-[var(--text-secondary)] hover:text-red-400 dark:hover:text-red-400 flex items-center gap-1 transition px-2 py-1"><XCircle size={12} /> Очистить</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-2 relative custom-scrollbar bg-[var(--surface-2)]">
              {currentBasket.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-tertiary)] select-none"><ShoppingBag size={64} className="mb-3 opacity-10" /><p className="text-lg text-[var(--text-tertiary)]">Чек пуст</p></div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="text-[10px] text-[var(--text-secondary)] uppercase border-b border-[var(--border-color)] sticky top-0 bg-[var(--surface-2)]"><tr><th className="p-2 pl-3">Товар</th><th className="p-2 text-center">Кол-во</th><th className="p-2 text-right">Сумма</th><th className="p-2 w-8"></th></tr></thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-sm">{currentBasket.map((item) => (<tr key={item.id} className="group hover:bg-[var(--surface-2)]"><td className="p-2 pl-3"><div className="text-[var(--text-primary)]">{item.name}</div></td><td className="p-2 text-center text-[var(--text-secondary)] font-mono text-xs">x{item.qty}</td><td className="p-2 text-right font-mono text-[var(--text-primary)]">{(item.price * item.qty).toLocaleString()} {currency}</td><td className="p-2 text-right"><button onClick={() => removeFromBasket(item.id)} className="text-[var(--text-secondary)] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 p-1.5 rounded"><Trash2 size={14} /></button></td></tr>))}</tbody>
                </table>
              )}
            </div>

            <div className="border-t border-[var(--border-color)] bg-[var(--surface-1)] border border-[var(--border-color)] rounded-2xl p-4 dark:px-4 dark:py-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex gap-2"><button onClick={() => setPaymentMethod('card')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs border transition ${paymentMethod === 'card' ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}><CreditCard size={14} /> Карта</button><button onClick={() => setPaymentMethod('cash')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs border transition ${paymentMethod === 'cash' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}><Banknote size={14} /> Наличные</button></div>
                 <div className="text-right"><span className="text-2xl font-bold text-[var(--text-primary)] font-mono tracking-tight">{basketTotal.toLocaleString()} {currency}</span></div>
              </div>
              <button 
                onClick={handleCheckout} 
                disabled={currentBasket.length === 0 || !currentShift || currentShift.status !== 'active'} 
                className="w-full flex items-center justify-center rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold tracking-wide py-3 shadow-sm dark:shadow-[0_12px_30px_rgba(75,70,255,0.45)] transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed min-h-[44px]"
                title={!currentShift || currentShift.status !== 'active' ? 'Нельзя оформить заказ вне смены. Начните смену.' : ''}
              >
                ОФОРМИТЬ ЗАКАЗ
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ================= ПРАВАЯ КОЛОНКА ================= */}
      <aside className="w-[280px] flex-shrink-0 border-l border-[var(--border-color)] bg-[var(--surface-1)] flex flex-col">
        <div className="flex border-b border-[var(--border-color)] flex-shrink-0">
           <button 
             type="button"
             onClick={() => setActiveTab('tasks')} 
             className={cn(
               "flex-1 px-3 py-1.5 text-sm transition",
               activeTab === 'tasks'
                 ? "font-semibold text-[var(--text-primary)] border-b-2 border-[var(--accent-primary)]"
                 : "text-[var(--text-secondary)] border-b border-transparent hover:text-[var(--text-primary)]"
             )}
           >
             Задачи
           </button>
           <button 
             type="button"
             onClick={() => {
               setActiveTab('chat');
               setHasUnreadChat(false);
             }} 
             className={cn(
               "flex-1 px-3 py-1.5 text-sm transition relative",
               activeTab === 'chat'
                 ? "font-semibold text-[var(--text-primary)] border-b-2 border-[var(--accent-primary)]"
                 : "text-[var(--text-secondary)] border-b border-transparent hover:text-[var(--text-primary)]"
             )}
           >
             <span className="flex items-center justify-center">
               Чат
               {hasUnreadChat && (
                 <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-red-500" />
               )}
             </span>
           </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'tasks' ? (
            <div className="p-4 space-y-3">
              {/* Прогресс выполнения */}
              {shiftStatus === 'active' && totalTasksCount > 0 && (
                <div className="mb-2 pb-3 border-b border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-secondary)]">
                    Выполнено: {completedTasksCount} из {totalTasksCount} ({completionPercent}%)
                  </div>
                </div>
              )}

              {/* Состояние загрузки */}
              {tasksLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--text-secondary)]">
                  <Loader2 className="h-6 w-6 animate-spin mb-2 text-[var(--text-secondary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Задачи загружаются…</p>
                </div>
              )}

              {/* Состояние ошибки */}
              {!tasksLoading && tasksError && (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--text-secondary)]">
                  <AlertTriangle className="h-6 w-6 mb-2 text-red-500" />
                  <p className="text-sm text-center px-4 text-[var(--text-secondary)]">Не удалось загрузить задачи, попробуйте обновить страницу</p>
                </div>
              )}

              {/* Заглушка, если смена не начата */}
              {!tasksLoading && !tasksError && shiftStatus !== 'active' && (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--text-secondary)]">
                  <Clock className="h-6 w-6 mb-2 opacity-50 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-center px-4 text-[var(--text-secondary)]">Задачи появятся после начала смены</p>
                </div>
              )}

              {/* Пустое состояние */}
              {!tasksLoading && !tasksError && shiftStatus === 'active' && tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--text-secondary)]">
                  <CheckCircle2 className="h-6 w-6 mb-2 opacity-50 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-center px-4 text-[var(--text-secondary)]">На эту смену задачи не назначены</p>
                </div>
              )}

              {/* Список задач */}
              {!tasksLoading && !tasksError && shiftStatus === 'active' && tasks.length > 0 && (() => {
                // Сортировка: невыполненные сверху, выполненные снизу
                const sortedTasks = [
                  ...tasks.filter(t => !t.completed),
                  ...tasks.filter(t => t.completed),
                ];

                return (
                  <div className="space-y-2">
                    {sortedTasks.map((task) => {
                      const hasDetails = task.details && task.details.trim().length > 0;
                      
                      // Форматируем время выполнения
                      const completedTime = task.completedAt 
                        ? new Date(task.completedAt).toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : null;
                      
                      return (
                        <div
                          key={task.id}
                          className="group relative flex flex-col gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-2 text-sm hover:bg-[var(--surface-3)] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Левая часть: чекбокс и текст */}
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {/* Чекбокс - контролируемый */}
                              <div className="flex-shrink-0 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className={cn(
                                    "h-5 w-5 rounded-[6px] border flex items-center justify-center transition-colors cursor-pointer outline-none focus:outline-none",
                                    task.completed
                                      ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-500 text-white"
                                      : "border-[var(--border-strong)] bg-transparent hover:border-[var(--text-tertiary)] text-transparent"
                                  )}
                                >
                                  {task.completed && <Check className="h-3 w-3" />}
                                </button>
                              </div>
                              
                              {/* Текст задачи */}
                              <div className="flex-1 min-w-0">
                                <div className={cn(
                                  "text-sm transition-colors",
                                  task.completed ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]"
                                )}>
                                  {task.title}
                                </div>
                              </div>
                            </div>

                            {/* Правая часть: иконка доп.информации (только если есть details) */}
                            {hasDetails && (
                              <div className="flex-shrink-0 pointer-events-none mt-0.5">
                                <Info className={cn(
                                  "w-4 h-4",
                                  task.completed ? "text-[var(--text-tertiary)]" : "text-[var(--text-secondary)]"
                                )} />
                              </div>
                            )}
                          </div>
                          
                          {/* Время выполнения (только для выполненных задач) */}
                          {task.completed && completedTime && (
                            <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                              Выполнено в {completedTime}
                            </div>
                          )}

                          {/* Tooltip с дополнительной информацией */}
                          {hasDetails && (
                            <div className="absolute left-0 top-full mt-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                              <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-lg shadow-md p-3 max-w-xs text-sm">
                                <div className="text-[var(--text-primary)]">{task.details}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="p-4 flex flex-col space-y-3 h-full">
               {currentShift?.id && (
                 <div className="flex-1 min-h-0 flex flex-col">
                   <ShiftMessagesCard 
                     shiftId={currentShift.id} 
                     onNewMessage={() => {
                       if (activeTab !== 'chat') {
                         setHasUnreadChat(true);
                       }
                     }} 
                   />
                 </div>
               )}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--surface-1)] flex-shrink-0 mt-auto">
           <button className="w-full bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-500 text-white text-xs py-3 rounded-xl border border-red-500 dark:border-red-500/60 shadow-sm dark:shadow-[0_10px_25px_rgba(220,53,69,0.45)] flex items-center justify-center gap-2"><AlertTriangle size={14} /> ПРОБЛЕМА</button>
        </div>
      </aside>

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmOrder}
        items={currentBasket}
        totalAmount={basketTotal}
        currentPaymentMethod={paymentMethod}
        currency={currency}
        isLoading={isProcessingOrder}
      />

      {/* Modals */}
      <ShiftClosingForm
        isOpen={showClosingForm}
        onClose={() => setShowClosingForm(false)}
        onSuccess={handleCloseSuccess}
      />

      {/* Стили для скролла и анимаций */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        @keyframes taskCheckIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        .task-check-animate {
          animation: taskCheckIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

