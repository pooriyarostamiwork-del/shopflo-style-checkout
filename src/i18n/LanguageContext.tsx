import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './translations/en.json';
import fa from './translations/fa.json';

type Language = 'en' | 'fa';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Translations> = { en, fa };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider = ({ children, defaultLanguage = 'en' }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  
  const isRTL = language === 'fa';
  const dir = isRTL ? 'rtl' : 'ltr';
  const t = translations[language];

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
    document.body.classList.toggle('rtl', isRTL);
  }, [language, dir, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper to format numbers in Persian
export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

// Format currency based on language
export const formatCurrency = (amount: number, language: Language): string => {
  if (language === 'fa') {
    return `${toPersianNumber(amount.toLocaleString())} تومان`;
  }
  return `₹${amount.toFixed(2)}`;
};
