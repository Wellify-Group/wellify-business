"use client";

import { useStore } from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { Save, Plus, Smartphone } from "lucide-react";

export default function FormBuilder() {
  const { t } = useLanguage();
  const { formConfig, updateFormConfig } = useStore();

  return (
    <div className="h-full p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* LEFT: SETTINGS */}
      <div className="space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('dashboard.report_builder') || 'Конструктор отчёта'}</h1>
          <p className="text-zinc-400">Настройте, что видит сотрудник при закрытии смены.</p>
        </div>
        <div className="bg-[#18181b]/50 border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-4">Поля ввода</h3>
          
          <ToggleItem 
            label="Наличная выручка" 
            desc="Обязательное поле для всех точек"
            checked={formConfig.showCash} 
            onChange={(v: boolean) => updateFormConfig({ showCash: v })} 
          />
          <ToggleItem 
            label="Терминал / Карта" 
            desc="Ввод суммы по эквайрингу"
            checked={formConfig.showCard} 
            onChange={(v: boolean) => updateFormConfig({ showCard: v })} 
          />
          <ToggleItem 
            label="Количество гостей (Чеки)" 
            desc="Счетчик количества клиентов за день"
            checked={formConfig.showGuests} 
            onChange={(v: boolean) => updateFormConfig({ showGuests: v })} 
          />
          <ToggleItem 
            label="Фото-отчет" 
            desc="Требовать фото чистого зала/оборудования"
            checked={formConfig.showPhoto} 
            onChange={(v: boolean) => updateFormConfig({ showPhoto: v })} 
          />
          <ToggleItem 
            label="Быстрые заметки" 
            desc="Поле для комментария о проблемах"
            checked={formConfig.showNotes} 
            onChange={(v: boolean) => updateFormConfig({ showNotes: v })} 
          />
        </div>
        <div className="bg-[#18181b]/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Пользовательские метрики</h3>
          <button className="w-full py-3 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 flex items-center justify-center gap-2 transition-colors">
            <Plus size={16} />
            {t('dashboard.add_metric') || 'Добавить метрику (напр. "Круассаны")'}
          </button>
        </div>
        <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all">
          <Save size={18} />
          Сохранить шаблон для всех точек
        </button>
      </div>

      {/* RIGHT: LIVE PREVIEW */}
      <div className="flex items-center justify-center bg-[#000] rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02]" /> {/* Grid Background */}
        
        {/* Phone Frame */}
        <div className="w-[320px] h-[600px] bg-black border-[8px] border-zinc-800 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
          {/* Phone Header */}
          <div className="h-8 bg-zinc-900 flex justify-center items-center">
             <div className="w-20 h-4 bg-black rounded-b-xl" />
          </div>
          
          {/* Phone Content (Simulated Employee App) */}
          <div className="flex-1 p-4 space-y-4 bg-zinc-950 text-white overflow-y-auto">
            <div className="text-center mt-4">
              <p className="text-xs text-zinc-500">Демо смены</p>
              <h2 className="text-xl font-bold">Ежедневный отчёт</h2>
            </div>
            <div className="space-y-3">
              {formConfig.showCash && <MockInput label="Готівка (UAH)" placeholder="0.00" />}
              {formConfig.showCard && <MockInput label="Карта / PayPass" placeholder="0.00" />}
              {formConfig.showGuests && <MockInput label="Кількість гостей" placeholder="0" />}
              
              {formConfig.showPhoto && (
                <div className="h-24 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
                   <Smartphone size={16} />
                   Додати фото
                </div>
              )}
              
              {formConfig.showNotes && (
                <textarea className="w-full bg-zinc-900 rounded-xl p-3 text-xs border border-zinc-800 resize-none h-20" placeholder="Коментар до зміни..." />
              )}
            </div>
            <button className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/50 mt-4">
              Закрити зміну
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ label, desc, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-xs text-zinc-500">{desc}</p>
      </div>
      {/* Simple Switch Mock if UI comp not available */}
      <div 
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-indigo-600' : 'bg-zinc-700'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function MockInput({ label, placeholder }: any) {
  return (
    <div>
      <label className="text-xs text-zinc-400 ml-1">{label}</label>
      <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-4 text-zinc-500">
        {placeholder}
      </div>
    </div>
  );
}

