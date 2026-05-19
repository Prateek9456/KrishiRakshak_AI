"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en, hi, Dictionary } from "@/lib/i18n/dictionaries";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("swc-language") as Language;
    if (saved && (saved === "en" || saved === "hi")) {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("swc-language", lang);
  };

  const currentDictionary = language === "en" ? en : hi;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: currentDictionary }}>
      {/* We return children immediately to avoid blocking SSR, but language changes will hydrate */}
      <div className={mounted ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
