import { create } from 'zustand';

import type { WelcomeLanguage } from '@/lib/i18n/welcome';

type InterfaceLanguageState = {
  lang: WelcomeLanguage;
  setLang: (lang: WelcomeLanguage) => void;
};

export const useInterfaceLanguageStore = create<InterfaceLanguageState>((set) => ({
  lang: 'uk',
  setLang: (lang) => set({ lang }),
}));

