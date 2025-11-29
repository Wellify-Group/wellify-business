import React, { useState, useEffect, useRef } from 'react';
import useStore from '@/lib/store';
import { useToast } from '@/components/ui/toast';
import { OrderConfirmationModal } from './order-confirmation-modal';

import { 

  CreditCard, Banknote, AlertTriangle, 

  Trash2, Plus, ShoppingBag, 

  XCircle, ChevronRight, Search

} from 'lucide-react';
import { Collapse } from "@/components/ui/collapse";

interface BasketItem {
  id: number | string;
  name: string;
  price: number;
  qty: number;
}



const EmployeeTerminal = () => {

  // --- STATE ---
  const { currentShift, currentUser, addOrder, savedLocationId } = useStore();
  const { success: toastSuccess, error: toastError } = useToast();

  const mockProducts = [

    { id: 1, name: 'Капучино', price: 60 },

    { id: 2, name: 'Капучино XL', price: 85 },

    { id: 3, name: 'Латте', price: 65 },

    { id: 4, name: 'Чизкейк', price: 120 },

    { id: 5, name: 'Кальян', price: 450 },

    { id: 6, name: 'Лимонад', price: 90 },

  ];



  const [shiftDuration, setShiftDuration] = useState(14520);

  const [currentBasket, setCurrentBasket] = useState<BasketItem[]>([]);

  const [formData, setFormData] = useState({ f1: '', f2: '', f3: 1 });

  const [metrics, setMetrics] = useState({ total: 12450, cash: 2250, card: 10200, orders: 42 });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('cash'); // Default to cash

  const [activeTab, setActiveTab] = useState('tasks');

  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string; price: number }>>([]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {

    const timer = setInterval(() => setShiftDuration(s => s + 1), 1000);

    return () => clearInterval(timer);

  }, []);



  useEffect(() => {

    function handleClickOutside(event: MouseEvent) {

      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {

        setShowSuggestions(false);

      }

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);



  const formatDuration = (s: number) => {

    const h = Math.floor(s / 3600).toString().padStart(2, '0');

    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');

    const s_rem = (s % 60).toString().padStart(2, '0');

    return `${h}:${m}:${s_rem}`;

  };



  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const value = e.target.value;

    setFormData({ ...formData, f1: value });

    if (value.length > 0) {

      const filtered = mockProducts.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));

      setSuggestions(filtered);

      setShowSuggestions(true);

    } else {

      setShowSuggestions(false);

    }

  };



  const selectProduct = (product: { id: number; name: string; price: number }) => {

    setFormData({ ...formData, f1: product.name, f2: product.price.toString() });

    setShowSuggestions(false);

  };



  const addToBasket = () => {

    if (!formData.f1 || formData.f2 === '') return;

    const newItem = {

      id: Date.now(),

      name: formData.f1,

      price: Number(formData.f2),

      qty: Number(formData.f3),

    };

    setCurrentBasket([...currentBasket, newItem]);

    setFormData({ f1: '', f2: '', f3: 1 }); 

  };



  const removeFromBasket = (id: number | string) => setCurrentBasket(currentBasket.filter(i => i.id !== id));

  const clearBasket = () => { if(window.confirm('Очистить корзину?')) setCurrentBasket([]); };

  const basketTotal = currentBasket.reduce((acc, item) => acc + (item.price * item.qty), 0);

  

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

      // Update local metrics
      setMetrics(prev => ({
        total: prev.total + basketTotal,
        orders: prev.orders + 1,
        cash: finalPaymentMethod === 'cash' ? prev.cash + basketTotal : prev.cash,
        card: finalPaymentMethod === 'card' ? prev.card + basketTotal : prev.card,
      }));

      // Clear basket
      setCurrentBasket([]);
      
      // Reset payment method to default
      setPaymentMethod('cash');

      // Close modal
      setShowConfirmationModal(false);

      // Show success toast
      toastSuccess(`Заказ на ${basketTotal.toLocaleString()} ₴ оформлен`);

      // Focus back on input field
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    } catch (error: any) {
      console.error('Error creating order:', error);
      toastError('Не удалось оформить заказ. Попробуйте еще раз.');
    } finally {
      setIsProcessingOrder(false);
    }
  };



  return (

    /* 

       Используем h-full вместо calc, так как компонент находится внутри flex-контейнера
       с flex-1, который уже занимает всю доступную высоту после header

    */

    <div className="flex h-full w-full bg-background text-foreground font-sans overflow-hidden items-stretch">

      

      {/* ================= ЛЕВАЯ КОЛОНКА ================= */}

      <aside className="w-[240px] flex-shrink-0 border-r border-border bg-card flex flex-col p-5">

        

        {/* Таймер */}

        <div className="mb-6 flex-shrink-0">

          <div className="flex items-center gap-2 mb-1">

            <span className="flex w-2.5 h-2.5 relative">

               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>

               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>

            </span>

            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">В работе</span>

          </div>

          <div className="text-3xl font-mono font-medium text-foreground tracking-tight">

            {formatDuration(shiftDuration)}

          </div>

        </div>



        {/* Метрики */}

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">

          <div className="p-4 bg-muted/50 rounded-xl border border-border/50 shrink-0">

            <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Выручка</label>

            <div className="text-2xl font-bold text-foreground mt-1 tracking-tight">

              {metrics.total.toLocaleString()} <span className="text-zinc-600 text-lg font-normal">₴</span>

            </div>

          </div>

          

          <div className="space-y-3 text-xs px-1">

            <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/50 pb-2">

              <span className="flex items-center gap-1.5"><CreditCard size={14}/> Карта</span>

              <span className="font-mono text-foreground">{metrics.card.toLocaleString()}</span>

            </div>

            <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/50 pb-2">

              <span className="flex items-center gap-1.5"><Banknote size={14}/> Наличные</span>

              <span className="font-mono text-foreground">{metrics.cash.toLocaleString()}</span>

            </div>

            <div className="flex justify-between items-center text-zinc-500 pt-1">

              <span>Чеков</span>

              <span>{metrics.orders}</span>

            </div>

          </div>

        </div>

      </aside>





      {/* ================= ЦЕНТР (POS) ================= */}

      <main className="flex-1 flex flex-col relative bg-background min-w-0">

        <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-3 gap-3 h-full">

          

          {/* Конструктор */}

          <div className="bg-card border border-border rounded-xl p-3 shadow-lg flex-shrink-0 relative">

            <div className="grid grid-cols-12 gap-2 items-start">

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

                    className="w-full bg-muted border border-input text-foreground rounded-lg pl-9 pr-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition placeholder:text-muted-foreground text-sm"

                  />

                  <Search size={16} className="absolute left-3 top-3 text-zinc-500" />

                </div>

                <div className="absolute top-full left-0 w-full z-50">
                  <Collapse isOpen={showSuggestions && suggestions.length > 0} className="bg-popover border border-border rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((product) => (
                      <div key={product.id} onClick={() => selectProduct(product)} className="p-2.5 hover:bg-indigo-600 cursor-pointer border-b border-zinc-700/50 flex justify-between">
                        <span className="text-sm">{product.name}</span>
                        <span className="text-xs font-mono opacity-70">{product.price} ₴</span>
                      </div>
                    ))}
                  </Collapse>
                </div>

              </div>

              <div className="col-span-3 relative">

                <input type="number" placeholder="Цена" value={formData.f2} onChange={e => setFormData({...formData, f2: e.target.value})} className="w-full bg-muted border border-input text-foreground rounded-lg pl-3 pr-6 py-2.5 focus:border-indigo-500 outline-none transition font-mono text-sm" />

                <span className="absolute right-3 top-3 text-zinc-500 text-xs">₴</span>

              </div>

              <div className="col-span-3 flex gap-2">

                 <input type="number" value={formData.f3} onChange={e => setFormData({...formData, f3: Number(e.target.value) || 1})} className="w-14 bg-muted border border-input text-foreground rounded-lg px-2 py-2.5 text-center text-sm" />

                <button onClick={addToBasket} disabled={!formData.f1 || formData.f2 === ''} className="flex-1 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-primary)] rounded-lg font-bold flex items-center justify-center transition disabled:opacity-50 text-sm">

                  <Plus size={18} /> <span className="ml-1 hidden xl:inline">Добавить</span>

                </button>

              </div>

            </div>


          </div>



          {/* Чек */}

          <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col min-h-0 z-0">

            <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center flex-shrink-0">

              <h3 className="font-medium text-sm text-foreground flex items-center gap-2"><ShoppingBag size={16} className="text-indigo-400" /> Текущий чек ({currentBasket.length})</h3>

              {currentBasket.length > 0 && <button onClick={clearBasket} className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1 transition px-2 py-1"><XCircle size={12} /> Очистить</button>}

            </div>



            <div className="flex-1 overflow-y-auto p-2 relative custom-scrollbar">

              {currentBasket.length === 0 ? (

                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground select-none"><ShoppingBag size={64} className="mb-3 opacity-10" /><p className="text-sm font-medium opacity-40">Чек пуст</p></div>

              ) : (

                <table className="w-full text-left border-collapse">

                  <thead className="text-[10px] text-muted-foreground uppercase border-b border-border/50 sticky top-0 bg-card"><tr><th className="p-2 pl-3">Товар</th><th className="p-2 text-center">Кол-во</th><th className="p-2 text-right">Сумма</th><th className="p-2 w-8"></th></tr></thead>

                  <tbody className="divide-y divide-border/30 text-sm">{currentBasket.map((item) => (<tr key={item.id} className="group hover:bg-muted/50"><td className="p-2 pl-3"><div className="text-foreground">{item.name}</div></td><td className="p-2 text-center text-muted-foreground font-mono text-xs">x{item.qty}</td><td className="p-2 text-right font-mono text-foreground">{(item.price * item.qty).toLocaleString()} ₴</td><td className="p-2 text-right"><button onClick={() => removeFromBasket(item.id)} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded"><Trash2 size={14} /></button></td></tr>))}</tbody>

                </table>

              )}

            </div>



            <div className="border-t border-border bg-muted p-4 flex-shrink-0">

              <div className="flex items-center justify-between mb-3">

                 <div className="flex gap-2"><button onClick={() => setPaymentMethod('card')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition ${paymentMethod === 'card' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-zinc-700 text-zinc-400'}`}><CreditCard size={14} /> Карта</button><button onClick={() => setPaymentMethod('cash')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition ${paymentMethod === 'cash' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-zinc-700 text-zinc-400'}`}><Banknote size={14} /> Наличные</button></div>

                 <div className="text-right"><span className="text-2xl font-bold text-foreground font-mono tracking-tight">{basketTotal.toLocaleString()} ₴</span></div>

              </div>

              <button 
                onClick={handleCheckout} 
                disabled={currentBasket.length === 0 || !currentShift || currentShift.status !== 'active'} 
                className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold text-base h-12 rounded-lg shadow-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title={!currentShift || currentShift.status !== 'active' ? 'Нельзя оформить заказ вне смены. Начните смену.' : ''}
              >
                <span>ОФОРМИТЬ ЗАКАЗ</span> 
                <ChevronRight size={18} />
              </button>

            </div>

          </div>

        </div>

      </main>





      {/* ================= ПРАВАЯ КОЛОНКА ================= */}

      <aside className="w-[280px] flex-shrink-0 border-l border-border bg-card flex flex-col">

        <div className="grid grid-cols-2 p-2 gap-1 border-b border-border flex-shrink-0">

           <button onClick={() => setActiveTab('tasks')} className={`py-2 text-xs font-medium rounded-md transition ${activeTab === 'tasks' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Задачи</button>

           <button onClick={() => setActiveTab('chat')} className={`py-2 text-xs font-medium rounded-md transition ${activeTab === 'chat' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Чат</button>

        </div>

        

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

          {activeTab === 'tasks' ? (

             <div className="space-y-2">

               <h4 className="text-[10px] uppercase text-muted-foreground font-bold mb-2">Обязательно</h4>

               <div className="flex gap-3 items-start p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-border">

                 <div className="mt-0.5 w-4 h-4 rounded border border-border"></div>

                 <div className="text-sm text-foreground">Протереть бар</div>

               </div>

               <div className="flex gap-3 items-start p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-border">

                 <div className="mt-0.5 w-4 h-4 rounded border border-border"></div>

                 <div className="text-sm text-foreground">Заполнить чек-лист</div>

               </div>

             </div>

          ) : (

            <div className="flex flex-col space-y-3">

               <div className="bg-muted p-2 rounded-lg rounded-tl-none max-w-[90%] self-start"><p className="text-xs text-foreground">Напоминаю про лед</p></div>

            </div>

          )}

        </div>

        

        <div className="p-3 border-t border-border bg-card flex-shrink-0">

           <button className="w-full bg-red-950/20 hover:bg-red-900/40 border border-red-900/40 text-red-500 text-xs py-3 rounded flex items-center justify-center gap-2"><AlertTriangle size={14} /> ПРОБЛЕМА</button>

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
        currency="₴"
        isLoading={isProcessingOrder}
      />

      {/* Стили */}

      <style>{`

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }

        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }

        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

      `}</style>

    </div>

  );

};



export default EmployeeTerminal;
