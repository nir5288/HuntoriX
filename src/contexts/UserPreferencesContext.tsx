import React, { createContext, useContext, useState, useEffect } from 'react';

type UserStatus = 'online' | 'away';
type Language = 'en' | 'he';

interface UserPreferences {
  status: UserStatus;
  language: Language;
  showStatus: boolean;
  setStatus: (status: UserStatus) => void;
  setLanguage: (language: Language) => void;
  setShowStatus: (show: boolean) => void;
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

  const [showStatus, setShowStatusState] = useState<boolean>(() => {
    const saved = localStorage.getItem('userShowStatus');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('userStatus', status);
  }, [status]);

  useEffect(() => {
    localStorage.setItem('userLanguage', language);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('userShowStatus', showStatus.toString());
  }, [showStatus]);

  const setStatus = (newStatus: UserStatus) => {
    setStatusState(newStatus);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const setShowStatus = (show: boolean) => {
    setShowStatusState(show);
  };

  return (
    <UserPreferencesContext.Provider value={{ status, language, showStatus, setStatus, setLanguage, setShowStatus }}>
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
