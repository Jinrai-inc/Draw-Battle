import { create } from 'zustand';
import { t as translate, type Language, type TranslationKey } from '../i18n/translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'ja',
  setLanguage: (language) => set({ language }),
  t: (key) => translate(key, get().language),
}));
