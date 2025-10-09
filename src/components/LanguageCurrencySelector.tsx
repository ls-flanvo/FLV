'use client';

import { useState, useEffect } from 'react';
import { Globe, DollarSign } from 'lucide-react';

const LANGUAGES = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
];

export default function LanguageCurrencySelector() {
  const [language, setLanguage] = useState('it');
  const [currency, setCurrency] = useState('EUR');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCurrMenu, setShowCurrMenu] = useState(false);

  // Carica preferenze salvate
  useEffect(() => {
    const savedLang = localStorage.getItem('flanvo_language');
    const savedCurr = localStorage.getItem('flanvo_currency');
    
    if (savedLang) setLanguage(savedLang);
    if (savedCurr) setCurrency(savedCurr);
  }, []);

  // Salva lingua
  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    localStorage.setItem('flanvo_language', langCode);
    setShowLangMenu(false);
    
    // Qui puoi aggiungere logica per cambiare i testi dell'app
    console.log('Lingua cambiata in:', langCode);
  };

  // Salva valuta
  const handleCurrencyChange = (currCode: string) => {
    setCurrency(currCode);
    localStorage.setItem('flanvo_currency', currCode);
    setShowCurrMenu(false);
    
    // Qui puoi aggiungere logica per convertire i prezzi
    console.log('Valuta cambiata in:', currCode);
  };

  const currentLang = LANGUAGES.find(l => l.code === language);
  const currentCurr = CURRENCIES.find(c => c.code === currency);

  return (
    <div className="flex items-center space-x-3">
      {/* Selettore Lingua */}
      <div className="relative">
        <button
          onClick={() => {
            setShowLangMenu(!showLangMenu);
            setShowCurrMenu(false);
          }}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Globe className="w-4 h-4 text-gray-600" />
          <span className="text-lg">{currentLang?.flag}</span>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {currentLang?.code.toUpperCase()}
          </span>
        </button>

        {showLangMenu && (
          <>
            {/* Overlay per chiudere il menu */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowLangMenu(false)}
            />
            
            {/* Menu dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                    language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-primary-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300" />

      {/* Selettore Valuta */}
      <div className="relative">
        <button
          onClick={() => {
            setShowCurrMenu(!showCurrMenu);
            setShowLangMenu(false);
          }}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <DollarSign className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {currentCurr?.code}
          </span>
        </button>

        {showCurrMenu && (
          <>
            {/* Overlay per chiudere il menu */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowCurrMenu(false)}
            />
            
            {/* Menu dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleCurrencyChange(curr.code)}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors ${
                    currency === curr.code ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold">{curr.symbol}</span>
                    <span className="text-sm font-medium">{curr.code}</span>
                  </div>
                  {currency === curr.code && (
                    <span className="text-primary-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}