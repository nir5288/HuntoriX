import React, { createContext, useContext, useState, useEffect } from 'react';

type UserStatus = 'online' | 'away';
type Language = 'en' | 'he';

interface UserPreferences {
  status: UserStatus;
  language: Language;
  setStatus: (status: UserStatus) => void;
  setLanguage: (language: Language) => void;
}

const UserPreferencesContext = createContext<UserPreferences | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<UserStatus>(() => {
    const saved = localStorage.getItem('userStatus');
    return (saved as UserStatus) || 'online';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('userLanguage');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('userStatus', status);
  }, [status]);

  useEffect(() => {
    localStorage.setItem('userLanguage', language);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setStatus = (newStatus: UserStatus) => {
    setStatusState(newStatus);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  return (
    <UserPreferencesContext.Provider value={{ status, language, setStatus, setLanguage }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
