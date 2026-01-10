"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import { DEFAULT_LANGUAGE, Language, TRANSLATIONS } from "@/lib/translations";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <T = string>(path: string) => T;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function getNestedTranslation<T = string>(path: string, lang: Language): T {
  const segments = path.split(".");
  let value: unknown = TRANSLATIONS[lang];

  for (const segment of segments) {
    if (value == null || typeof value !== "object") break;
    value = (value as Record<string, unknown>)[segment];
  }

  if (value === undefined) {
    // fallback to default language
    if (lang !== DEFAULT_LANGUAGE) {
      return getNestedTranslation<T>(path, DEFAULT_LANGUAGE);
    }
    // If still not found, log error and return empty string instead of the path
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn(`[i18n] Translation key not found: "${path}"`);
    }
    return "" as unknown as T;
  }

  return value as T;
}

const VALID_LANGUAGES: Language[] = ["en", "ua", "ru"];

function isValidLanguage(lang: string | null): lang is Language {
  return lang !== null && VALID_LANGUAGES.includes(lang as Language);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with DEFAULT_LANGUAGE to avoid hydration mismatch
  // Language will be updated from localStorage or DB in useEffect after mount
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Сначала проверяем localStorage
      let stored = window.localStorage.getItem("wellify_locale");
      if (!stored) {
        stored = window.localStorage.getItem("shiftflow-lang");
        // Migrate old key to new key if found
        if (stored && isValidLanguage(stored)) {
          window.localStorage.setItem("wellify_locale", stored);
          window.localStorage.removeItem("shiftflow-lang");
        }
      }
      
      // Затем пытаемся загрузить из БД (если пользователь авторизован)
      const loadLanguageFromDB = async () => {
        try {
          // Используем новый backend API
          const response = await fetch('/api/auth/load-profile', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user?.language) {
              // Проверяем, что язык из БД валиден
              if (isValidLanguage(data.user.language)) {
                setLanguageState(data.user.language);
                window.localStorage.setItem("wellify_locale", data.user.language);
                return;
              }
            }
          }
        } catch (error) {
          console.warn("[LanguageProvider] Failed to load language from DB:", error);
        }
        
        // Fallback to localStorage
        if (isValidLanguage(stored)) {
          setLanguageState(stored);
        }
      };
      
      loadLanguageFromDB();
    }
  }, []);

  const setLanguage = async (lang: Language) => {
    if (!isValidLanguage(lang)) {
      console.warn(`Invalid language: ${lang}, falling back to ${DEFAULT_LANGUAGE}`);
      setLanguageState(DEFAULT_LANGUAGE);
      return;
    }
    
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("wellify_locale", lang);
      
      // Сохраняем язык в БД через backend API
      try {
        const { api, getAuthToken } = await import("@/lib/api/client");
        const token = getAuthToken();
        
        if (token) {
          // Получаем текущий профиль через API
          const response = await fetch('/api/auth/load-profile', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              // Обновляем язык в профиле через API
              await api.updateProfile(data.user.id, { language: lang });
            }
          }
        }
      } catch (error) {
        console.warn("[LanguageProvider] Failed to save language to DB:", error);
      }
    }
  };

  const t = useMemo(
    () => <T = string>(path: string) => getNestedTranslation<T>(path, language),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

