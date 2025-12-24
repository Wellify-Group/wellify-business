"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface BirthDateInputProps {
  value: string; // Формат: "YYYY-MM-DD" или пустая строка
  onChange: (value: string) => void;
  className?: string;
}

export function BirthDateInput({ value, onChange, className = "" }: BirthDateInputProps) {
  const { t } = useLanguage();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [focusedField, setFocusedField] = useState<"day" | "month" | "year" | null>(null);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Инициализация из value (формат YYYY-MM-DD)
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setYear(parts[0] || "");
        setMonth(parts[1] || "");
        setDay(parts[2] || "");
      }
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  // Валидация и обновление значения
  const updateValue = (newDay: string, newMonth: string, newYear: string) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    // Проверка на полную дату
    if (newDay.length === 2 && newMonth.length === 2 && newYear.length === 4) {
      const dayNum = parseInt(newDay, 10);
      const monthNum = parseInt(newMonth, 10);
      const yearNum = parseInt(newYear, 10);

      // Валидация диапазонов
      if (
        dayNum >= 1 &&
        dayNum <= 31 &&
        monthNum >= 1 &&
        monthNum <= 12 &&
        yearNum >= 1900 &&
        yearNum <= new Date().getFullYear()
      ) {
        // Проверка корректности даты (например, 31 февраля не существует)
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (
          date.getFullYear() === yearNum &&
          date.getMonth() === monthNum - 1 &&
          date.getDate() === dayNum
        ) {
          const formattedDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          onChange(formattedDate);
        }
      }
    } else if (!newDay && !newMonth && !newYear) {
      onChange("");
    }
  };

  // Обработка ввода дня
  const handleDayChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ""); // Только цифры
    if (input.length <= 2) {
      const num = input ? parseInt(input, 10) : 0;
      // Валидация: день от 1 до 31, но если введена только первая цифра, разрешаем если она 0-3
      if (!input || (input.length === 1 && num >= 0 && num <= 3) || (input.length === 2 && num >= 1 && num <= 31)) {
        updateValue(input, month, year);
        if (input.length === 2 && month.length < 2) {
          monthRef.current?.focus();
        }
      }
    }
  };

  // Обработка ввода месяца
  const handleMonthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ""); // Только цифры
    if (input.length <= 2) {
      const num = input ? parseInt(input, 10) : 0;
      // Валидация: месяц от 1 до 12, но если введена только первая цифра, разрешаем если она 0-1
      if (!input || (input.length === 1 && num >= 0 && num <= 1) || (input.length === 2 && num >= 1 && num <= 12)) {
        updateValue(day, input, year);
        if (input.length === 2 && year.length < 4) {
          yearRef.current?.focus();
        }
      }
    }
  };

  // Обработка ввода года
  const handleYearChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, ""); // Только цифры
    if (input.length <= 4) {
      const currentYear = new Date().getFullYear();
      const num = input ? parseInt(input, 10) : 0;
      // Валидация: год от 1900 до текущего года
      if (!input || (input.length <= 3) || (input.length === 4 && num >= 1900 && num <= currentYear)) {
        updateValue(day, month, input);
      }
    }
  };

  // Обработка клавиш для навигации
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    currentRef: React.RefObject<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement> | null,
    prevRef: React.RefObject<HTMLInputElement> | null
  ) => {
    if (e.key === "Backspace" && currentRef.current?.value === "" && prevRef) {
      prevRef.current?.focus();
    } else if (e.key === "ArrowRight" && nextRef) {
      nextRef.current?.focus();
    } else if (e.key === "ArrowLeft" && prevRef) {
      prevRef.current?.focus();
    }
  };

  const dayPlaceholder = t<string>("register_field_birth_date_placeholder").split(".")[0] || "DD";
  const monthPlaceholder = t<string>("register_field_birth_date_placeholder").split(".")[1] || "MM";
  const yearPlaceholder = t<string>("register_field_birth_date_placeholder").split(".")[2] || "YYYY";

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center z-10">
        <Calendar className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div
        className={`flex items-center gap-1.5 pl-9 pr-3 h-10 w-full rounded-2xl border transition-colors ${
          focusedField
            ? "border-primary/60 shadow-[0_0_0_3px_rgba(var(--color-primary-rgb,59,130,246),0.1)]"
            : "border-border"
        } bg-background`}
      >
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder={dayPlaceholder}
          value={day}
          onChange={handleDayChange}
          onFocus={() => setFocusedField("day")}
          onBlur={() => {
            // Небольшая задержка, чтобы проверить, не переходит ли фокус на другое поле
            setTimeout(() => {
              if (document.activeElement !== monthRef.current && document.activeElement !== yearRef.current) {
                setFocusedField(null);
              }
            }, 0);
          }}
          onKeyDown={(e) => handleKeyDown(e, dayRef, monthRef, null)}
          className="h-full w-10 flex-1 text-center text-sm text-foreground placeholder:text-muted-foreground/50 bg-transparent outline-none border-none focus:outline-none"
        />
        <span className="text-muted-foreground/50 text-sm">/</span>
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          maxLength={2}
          placeholder={monthPlaceholder}
          value={month}
          onChange={handleMonthChange}
          onFocus={() => setFocusedField("month")}
          onBlur={() => {
            setTimeout(() => {
              if (document.activeElement !== dayRef.current && document.activeElement !== yearRef.current) {
                setFocusedField(null);
              }
            }, 0);
          }}
          onKeyDown={(e) => handleKeyDown(e, monthRef, yearRef, dayRef)}
          className="h-full w-10 flex-1 text-center text-sm text-foreground placeholder:text-muted-foreground/50 bg-transparent outline-none border-none focus:outline-none"
        />
        <span className="text-muted-foreground/50 text-sm">/</span>
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder={yearPlaceholder}
          value={year}
          onChange={handleYearChange}
          onFocus={() => setFocusedField("year")}
          onBlur={() => {
            setTimeout(() => {
              if (document.activeElement !== dayRef.current && document.activeElement !== monthRef.current) {
                setFocusedField(null);
              }
            }, 0);
          }}
          onKeyDown={(e) => handleKeyDown(e, yearRef, null, monthRef)}
          className="h-full w-16 flex-1 text-center text-sm text-foreground placeholder:text-muted-foreground/50 bg-transparent outline-none border-none focus:outline-none"
        />
      </div>
    </div>
  );
}

