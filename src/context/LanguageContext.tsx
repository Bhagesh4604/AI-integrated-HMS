import React, { createContext, useState, useContext, useEffect } from 'react';
import apiUrl from '../config/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');
    const [translations, setTranslations] = useState({});

    // Helper to translate a specific text using Azure Service or fallback
    const translate = async (text) => {
        if (language === 'en') return text;
        // Check cache
        const key = `${text}_${language}`;
        if (translations[key]) return translations[key];

        try {
            const response = await fetch(apiUrl('/api/translate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLanguage: language })
            });
            const data = await response.json();
            if (data.success) {
                setTranslations(prev => ({ ...prev, [key]: data.translation }));
                return data.translation;
            }
        } catch (e) {
            console.error("Translation failed", e);
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, translate }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
