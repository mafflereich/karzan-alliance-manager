import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function Footer() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <footer className="py-6 px-4 text-center text-[10px] text-stone-400 leading-relaxed">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="space-y-1">
          <p>{t('footer.copyright')}</p>
          <p>
            {t('footer.disclaimer')}
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-stone-200/50 w-fit mx-auto px-4">
          <div className="flex items-center gap-1 text-stone-300">
            <Globe className="w-3 h-3" />
            <span>{t('footer.language')}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => changeLanguage('zh-TW')}
              className={`hover:text-stone-600 transition-colors ${i18n.language === 'zh-TW' ? 'font-bold text-stone-600' : ''}`}
            >
              繁體中文
            </button>
            <span className="text-stone-300">|</span>
            <button 
              onClick={() => changeLanguage('en')}
              className={`hover:text-stone-600 transition-colors ${i18n.language === 'en' ? 'font-bold text-stone-600' : ''}`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
