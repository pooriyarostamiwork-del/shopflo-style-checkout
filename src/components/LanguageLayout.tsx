import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LanguageProvider } from '@/i18n';

interface FarsiLayoutProps {
  children: ReactNode;
}

export const FarsiLayout = ({ children }: FarsiLayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    // Set RTL direction for the entire document
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'fa');
    document.body.classList.add('rtl');
    
    return () => {
      // Cleanup when navigating away from Farsi pages
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
      document.body.classList.remove('rtl');
    };
  }, []);

  return (
    <LanguageProvider defaultLanguage="fa">
      {children}
    </LanguageProvider>
  );
};

interface EnglishLayoutProps {
  children: ReactNode;
}

export const EnglishLayout = ({ children }: EnglishLayoutProps) => {
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
    document.body.classList.remove('rtl');
  }, []);

  return (
    <LanguageProvider defaultLanguage="en">
      {children}
    </LanguageProvider>
  );
};
