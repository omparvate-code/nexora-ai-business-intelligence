"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { LanguageCode } from "./config";
import {
  getStoredLanguage,
  setStoredLanguage,
} from "./language";
import { getTranslations } from "./translations";

type LanguageContextType = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: ReturnType<typeof getTranslations>;
};

const LanguageContext =
  createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<LanguageCode>("en");

  useEffect(() => {
    const storedLanguage =
      getStoredLanguage();

    setLanguageState(storedLanguage);

    document.documentElement.lang =
      storedLanguage;

    const handleLanguageChange = () => {
      const currentLanguage =
        getStoredLanguage();

      setLanguageState(currentLanguage);

      document.documentElement.lang =
        currentLanguage;
    };

    window.addEventListener(
      "nexora-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "nexora-language-change",
        handleLanguageChange
      );
    };
  }, []);

  const changeLanguage = (
    nextLanguage: LanguageCode
  ) => {
    setStoredLanguage(nextLanguage);

    setLanguageState(nextLanguage);

    document.documentElement.lang =
      nextLanguage;
  };

  const translations = useMemo(
    () => getTranslations(language),
    [language]
  );

  const value = {
    language,
    setLanguage: changeLanguage,
    t: translations,
  };

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useNexoraLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useNexoraLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
