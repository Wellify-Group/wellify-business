# Цветовая палитра WELLIFY Business

## 📋 Общая информация

Проект использует систему дизайн-токенов с поддержкой светлой и темной темы. Все цвета определены через CSS переменные в `app/globals.css` и доступны через Tailwind классы.

---

## 🌞 СВЕТЛАЯ ТЕМА (Light Theme)

### Фоны и поверхности

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Основной фон страницы** | `--background` | `#F8FAFC` | `210 40% 98.4%` | `bg-background` |
| **Фон карточек/модалок** | `--card` | `#FFFFFF` | `0 0% 100%` | `bg-card` |
| **Фон навбара** | `--color-navbar` | `#FFFFFF` | - | `bg-white` |
| **Мягкая поверхность** | `--color-surface-soft` | `#F8FAFC` | - | `bg-surface-soft` |
| **Приподнятая поверхность** | `--color-surface-elevated` | `#FFFFFF` | - | `bg-surface-elevated` |
| **Popover фон** | `--popover` | `#FFFFFF` | `0 0% 100%` | `bg-popover` |
| **Muted фон** | `--muted` | `#F1F5F9` | `210 40% 96%` | `bg-muted` |
| **Secondary фон** | `--secondary` | `#F1F5F9` | `210 40% 96%` | `bg-secondary` |

### Текст

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Основной текст** | `--foreground` | `#0F172A` | `222 47% 11%` | `text-foreground` |
| **Текст карточек** | `--card-foreground` | `#0F172A` | `222 47% 11%` | `text-card-foreground` |
| **Muted текст** | `--muted-foreground` | `#64748B` | `215 16% 47%` | `text-muted-foreground` |
| **Основной текст (WELLIFY)** | `--color-text-main` | `#0f172a` | - | `text-main` |
| **Приглушенный текст** | `--color-text-muted` | `#6b7280` | - | `text-muted` |
| **Мягкий текст** | `--color-text-soft` | `#9ca3af` | - | `text-soft` |
| **Инверсный текст** | `--color-text-inverse` | `#f9fafb` | - | `text-inverse` |

### Границы

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Основная граница** | `--border` | `#E2E8F0` | `214 32% 91%` | `border-border` |
| **Граница инпутов** | `--input` | `#E2E8F0` | `214 32% 91%` | `border-input` |
| **Тонкая граница** | `--color-border-subtle` | `#e5e7eb` | - | `border-subtle` |
| **Яркая граница** | `--color-border-strong` | `#d1d5db` | - | `border-strong` |

### Брендовые цвета (Primary/Accent)

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Primary (основной)** | `--primary` | `#2563EB` | `222 84% 56%` | `bg-primary` / `text-primary` |
| **Primary foreground** | `--primary-foreground` | `#F8FAFC` | `210 40% 98%` | `text-primary-foreground` |
| **Accent (акцент)** | `--accent` | `#3B82F6` | `222 84% 60%` | `bg-accent` |
| **Accent foreground** | `--accent-foreground` | `#F8FAFC` | `210 40% 98%` | `text-accent-foreground` |
| **Ring (фокус)** | `--ring` | `#2563EB` | `222 84% 56%` | `ring-ring` |
| **Brand** | `--color-brand` | `#2563eb` | - | `bg-brand` |
| **Brand Soft** | `--color-brand-soft` | `#3b82f6` | - | `bg-brand-soft` |
| **Brand Strong** | `--color-brand-strong` | `#1d4ed8` | - | `bg-brand-strong` |

### Семантические цвета

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Success (успех)** | `--color-success` | `#22c55e` | - | `bg-success` / `text-success` |
| **Warning (предупреждение)** | `--color-warning` | `#f97316` | - | `bg-warning` / `text-warning` |
| **Danger (ошибка)** | `--color-danger` | `#ef4444` | - | `bg-danger` / `text-danger` |
| **Destructive** | `--destructive` | `#EF4444` | `0 84% 60%` | `bg-destructive` |
| **Destructive foreground** | `--destructive-foreground` | `#F8FAFC` | `210 40% 98%` | `text-destructive-foreground` |

### Оверлей

| Элемент | CSS Переменная | HEX/RGBA | Tailwind класс |
|---------|---------------|----------|----------------|
| **Overlay** | `--color-overlay` | `rgba(15, 23, 42, 0.55)` | - |

---

## 🌙 ТЕМНАЯ ТЕМА (Dark Theme)

### Фоны и поверхности

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Основной фон страницы** | `--background` | `#050B13` | `215 50% 4%` | `bg-background` |
| **Фон карточек/модалок** | `--card` | `#0B1320` | `215 50% 7%` | `bg-card` |
| **Фон навбара** | `--color-navbar` | `#0B1320` | - | `dark:bg-[#0B1320]` |
| **Мягкая поверхность** | `--color-surface-soft` | `#0B1320` | - | `dark:bg-surface-soft` |
| **Приподнятая поверхность** | `--color-surface-elevated` | `#0B1320` | - | `dark:bg-surface-elevated` |
| **Popover фон** | `--popover` | `#0F172A` | `222 47% 9%` | `bg-popover` |
| **Muted фон** | `--muted` | `#1E293B` | `217 33% 15%` | `bg-muted` |
| **Secondary фон** | `--secondary` | `#1E293B` | `217 33% 15%` | `bg-secondary` |

### Текст

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Основной текст** | `--foreground` | `#E2E8F0` | `213 31% 91%` | `text-foreground` |
| **Текст карточек** | `--card-foreground` | `#F8FAFC` | `210 40% 98%` | `text-card-foreground` |
| **Muted текст** | `--muted-foreground` | `#94A3B8` | `215 20% 65%` | `text-muted-foreground` |
| **Основной текст (WELLIFY)** | `--color-text-main` | `#e5e7eb` | - | `text-main` |
| **Приглушенный текст** | `--color-text-muted` | `#9ca3af` | - | `text-muted` |
| **Мягкий текст** | `--color-text-soft` | `#6b7280` | - | `text-soft` |
| **Инверсный текст** | `--color-text-inverse` | `#ffffff` | - | `text-inverse` |

### Границы

| Элемент | CSS Переменная | HEX/RGBA | HSL | Tailwind класс |
|---------|---------------|----------|-----|----------------|
| **Основная граница** | `--border` | `#1E293B` | `217 33% 17%` | `border-border` |
| **Граница инпутов** | `--input` | `#1E293B` | `217 33% 17%` | `border-input` |
| **Тонкая граница** | `--color-border-subtle` | `rgba(148, 163, 184, 0.24)` | - | `border-subtle` |
| **Яркая граница** | `--color-border-strong` | `rgba(148, 163, 184, 0.40)` | - | `border-strong` |

### Брендовые цвета (Primary/Accent)

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Primary (основной)** | `--primary` | `#3B82F6` | `222 84% 60%` | `bg-primary` / `text-primary` |
| **Primary foreground** | `--primary-foreground` | `#F8FAFC` | `210 40% 98%` | `text-primary-foreground` |
| **Accent (акцент)** | `--accent` | `#475569` | `217 33% 20%` | `bg-accent` |
| **Accent foreground** | `--accent-foreground` | `#F8FAFC` | `210 40% 98%` | `text-accent-foreground` |
| **Ring (фокус)** | `--ring` | `#3B82F6` | `222 84% 60%` | `ring-ring` |
| **Brand** | `--color-brand` | `#2563eb` | - | `bg-brand` |
| **Brand Soft** | `--color-brand-soft` | `#3b82f6` | - | `bg-brand-soft` |
| **Brand Strong** | `--color-brand-strong` | `#1d4ed8` | - | `bg-brand-strong` |

### Семантические цвета

| Элемент | CSS Переменная | HEX | HSL | Tailwind класс |
|---------|---------------|-----|-----|----------------|
| **Success (успех)** | `--color-success` | `#22c55e` | - | `bg-success` / `text-success` |
| **Warning (предупреждение)** | `--color-warning` | `#f97316` | - | `bg-warning` / `text-warning` |
| **Danger (ошибка)** | `--color-danger` | `#ef4444` | - | `bg-danger` / `text-danger` |
| **Destructive** | `--destructive` | `#DC2626` | `0 62% 55%` | `bg-destructive` |
| **Destructive foreground** | `--destructive-foreground` | `#F8FAFC` | `210 40% 98%` | `text-destructive-foreground` |

### Оверлей

| Элемент | CSS Переменная | HEX/RGBA | Tailwind класс |
|---------|---------------|----------|----------------|
| **Overlay** | `--color-overlay` | `rgba(15, 23, 42, 0.70)` | - |

---

## 🎨 Дополнительные цвета из theme.ts

### Темная тема (lib/ui/theme.ts)

| Элемент | HEX | Описание |
|---------|-----|----------|
| **Background Primary** | `#070A10` | Основной фон |
| **Background Card** | `#0A0F18` | Фон карточек |
| **Background Secondary** | `#0B111C` | Вторичный фон |
| **Border Default** | `#2A2A2A` | Основная граница |
| **Border Light** | `#3A3A3A` | Светлая граница |
| **Border Dark** | `#1A1A1A` | Темная граница |
| **Text Primary** | `#FFFFFF` | Основной текст |
| **Text Secondary** | `#B4B4B4` | Вторичный текст |
| **Text Tertiary** | `#808080` | Третичный текст |
| **Text Disabled** | `#4A4A4A` | Отключенный текст |
| **Success** | `#15C27C` | Успех |
| **Warning** | `#FEC84B` | Предупреждение |
| **Error** | `#F04438` | Ошибка |
| **Info** | `#3B82F6` | Информация |

### Светлая тема (lib/ui/theme.ts)

| Элемент | HEX | Описание |
|---------|-----|----------|
| **Background Primary** | `#F8FAFC` | Основной фон |
| **Background Card** | `#FFFFFF` | Фон карточек |
| **Background Secondary** | `#F8FAFC` | Вторичный фон |
| **Border Default** | `#E6E6E6` | Основная граница |
| **Border Light** | `#F0F0F0` | Светлая граница |
| **Border Dark** | `#D0D0D0` | Темная граница |
| **Text Primary** | `#1A1A1A` | Основной текст |
| **Text Secondary** | `#666666` | Вторичный текст |
| **Text Tertiary** | `#999999` | Третичный текст |
| **Text Disabled** | `#CCCCCC` | Отключенный текст |
| **Success** | `#15C27C` | Успех |
| **Warning** | `#FEC84B` | Предупреждение |
| **Error** | `#F04438` | Ошибка |
| **Info** | `#3B82F6` | Информация |

---

## 📐 Тени (Shadows)

### Светлая тема

| Элемент | CSS Переменная | Значение |
|---------|---------------|----------|
| **Soft** | `--shadow-soft` | `0 10px 30px rgba(15, 23, 42, 0.08)` |
| **Card** | `--shadow-card` | `0 18px 40px rgba(15, 23, 42, 0.10)` |
| **Navbar** | `--shadow-navbar` | `0 12px 40px rgba(15, 23, 42, 0.35)` |
| **Modal** | `--shadow-modal` | `0 24px 80px rgba(15, 23, 42, 0.45)` |
| **Floating** | `--shadow-floating` | `0 16px 50px rgba(15, 23, 42, 0.35)` |

### Темная тема

| Элемент | CSS Переменная | Значение |
|---------|---------------|----------|
| **Soft** | `--shadow-soft` | `0 18px 45px rgba(0, 0, 0, 0.45)` |
| **Card** | `--shadow-card` | `0 26px 60px rgba(0, 0, 0, 0.55)` |
| **Navbar** | `--shadow-navbar` | `0 18px 60px rgba(0, 0, 0, 0.75)` |
| **Modal** | `--shadow-modal` | `0 30px 95px rgba(0, 0, 0, 0.85)` |
| **Floating** | `--shadow-floating` | `0 22px 80px rgba(0, 0, 0, 0.75)` |

---

## 🎯 Использование в коде

### Tailwind классы

```tsx
// Фоны
<div className="bg-background dark:bg-background">
<div className="bg-card dark:bg-card">
<div className="bg-primary dark:bg-primary">

// Текст
<p className="text-foreground dark:text-foreground">
<p className="text-muted-foreground dark:text-muted-foreground">

// Границы
<div className="border border-border dark:border-border">

// Семантические цвета
<div className="bg-success text-white">
<div className="bg-danger text-white">
<div className="bg-warning text-white">
```

### CSS переменные

```css
.my-element {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}

.dark .my-element {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

---

## 📝 Примечания

1. **HSL формат**: Основные цвета определены в формате HSL без функции `hsl()`, чтобы можно было использовать с `hsl(var(--variable))` в Tailwind.

2. **Брендовые цвета**: Основной брендовый цвет - синий `#2563EB` (Primary), используется для кнопок, ссылок и акцентов.

3. **Семантические цвета**: Success, Warning, Danger остаются одинаковыми в обеих темах для консистентности.

4. **Адаптивность**: Все цвета автоматически переключаются при изменении темы через класс `dark:` в Tailwind.

5. **Legacy переменные**: В проекте есть legacy переменные для обратной совместимости, но рекомендуется использовать новые токены.

