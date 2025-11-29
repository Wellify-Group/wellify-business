"use client";

import { useState, useMemo } from "react";
import useStore from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { ArrowDown, ArrowUp, Filter, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  date: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  pointId: string;
  pointName: string;
  userId: string;
  userName: string;
}

export default function FinancePage() {
  const { t } = useLanguage();
  const { currency, locations, employees } = useStore();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterPoint, setFilterPoint] = useState<string>('all');

  // Mock transactions
  const transactions: Transaction[] = useMemo(() => {
    const mock: Transaction[] = [];
    const categories = {
      income: ['Продажи', 'Возврат', 'Бонус'],
      expense: ['Поставщик', 'Такси', 'Налоги', 'Аренда', 'Зарплата']
    };
    
    for (let i = 0; i < 20; i++) {
      const type = Math.random() > 0.3 ? 'income' : 'expense';
      const location = locations[Math.floor(Math.random() * locations.length)];
      const employee = employees[Math.floor(Math.random() * employees.length)];
      
      mock.push({
        id: `txn-${i}`,
        date: Date.now() - (i * 86400000),
        type,
        category: categories[type][Math.floor(Math.random() * categories[type].length)],
        amount: type === 'income' 
          ? Math.floor(Math.random() * 50000) + 10000
          : Math.floor(Math.random() * 20000) + 5000,
        pointId: location?.id || '',
        pointName: location?.name || 'Неизвестно',
        userId: employee?.id || '',
        userName: employee?.name || 'Неизвестно'
      });
    }
    
    return mock.sort((a, b) => b.date - a.date);
  }, [locations, employees]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      if (filterType !== 'all' && txn.type !== filterType) return false;
      if (filterPoint !== 'all' && txn.pointId !== filterPoint) return false;
      if (dateRange.start && txn.date < new Date(dateRange.start).getTime()) return false;
      if (dateRange.end && txn.date > new Date(dateRange.end).getTime()) return false;
      return true;
    });
  }, [transactions, filterType, filterPoint, dateRange]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Финансы
        </h1>
        <p className="text-sm text-muted-foreground">
          Банковская выписка и транзакции
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Доходы</p>
          <p className="text-2xl font-bold text-emerald-500">
            +{totalIncome.toLocaleString('ru-RU')} {currency}
          </p>
        </div>
        <div className="bg-card p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Расходы</p>
          <p className="text-2xl font-bold text-rose-500">
            -{totalExpense.toLocaleString('ru-RU')} {currency}
          </p>
        </div>
        <div className="bg-card p-4 border border-border rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Баланс</p>
          <p className={`text-2xl font-bold ${
            (totalIncome - totalExpense) >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {(totalIncome - totalExpense).toLocaleString('ru-RU')} {currency}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 border border-border rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Фильтры</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Тип</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              <option value="all">Все</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t('dashboard.location_label') || 'Точка'}</label>
            <select
              value={filterPoint}
              onChange={(e) => setFilterPoint(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            >
              <option value="all">Все точки</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Период</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Дата</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Тип</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Категория</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Сумма</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dashboard.location_label') || 'Точка'}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Пользователь</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map(txn => (
                <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-foreground">
                    {new Date(txn.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      txn.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {txn.type === 'income' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {txn.type === 'income' ? 'Доход' : 'Расход'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{txn.category}</td>
                  <td className={`px-4 py-3 text-sm font-semibold text-right ${
                    txn.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {txn.type === 'income' ? '+' : '-'}{txn.amount.toLocaleString('ru-RU')} {currency}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{txn.pointName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{txn.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
















