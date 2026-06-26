import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type LangCode = "en" | "hi" | "de" | "ru" | "fr";

export interface Language {
  code: LangCode;
  label: string;
  flag: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English",  flag: "🇺🇸", nativeName: "English"  },
  { code: "hi", label: "Hindi",    flag: "🇮🇳", nativeName: "हिन्दी"   },
  { code: "de", label: "German",   flag: "🇩🇪", nativeName: "Deutsch"  },
  { code: "ru", label: "Russian",  flag: "🇷🇺", nativeName: "Русский"  },
  { code: "fr", label: "French",   flag: "🇫🇷", nativeName: "Français" },
];

const T: Record<LangCode, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    rentNumber: "Rent Number",
    myRentals: "My Rentals",
    plansBilling: "Plans & Billing",
    referrals: "Referrals",
    apiDocs: "API & Docs",
    settings: "Settings",
    support: "Support",
    addFunds: "Top up balance",
    search: "Search",
    signOut: "Sign Out",
    online: "Online",
    admin: "Admin",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    rentNumber: "नंबर किराए पर",
    myRentals: "मेरे किराये",
    plansBilling: "योजनाएं और बिलिंग",
    referrals: "रेफरल",
    apiDocs: "API और डॉक्स",
    settings: "सेटिंग्स",
    support: "सहायता",
    addFunds: "बैलेंस टॉप अप",
    search: "खोजें",
    signOut: "साइन आउट",
    online: "ऑनलाइन",
    admin: "एडमिन",
  },
  de: {
    dashboard: "Dashboard",
    rentNumber: "Nummer mieten",
    myRentals: "Meine Mieten",
    plansBilling: "Pläne & Abrechnung",
    referrals: "Empfehlungen",
    apiDocs: "API & Docs",
    settings: "Einstellungen",
    support: "Support",
    addFunds: "Guthaben aufladen",
    search: "Suchen",
    signOut: "Abmelden",
    online: "Online",
    admin: "Admin",
  },
  ru: {
    dashboard: "Панель",
    rentNumber: "Арендовать номер",
    myRentals: "Мои аренды",
    plansBilling: "Тарифы и оплата",
    referrals: "Рефералы",
    apiDocs: "API и документы",
    settings: "Настройки",
    support: "Поддержка",
    addFunds: "Пополнить баланс",
    search: "Поиск",
    signOut: "Выйти",
    online: "Онлайн",
    admin: "Админ",
  },
  fr: {
    dashboard: "Tableau de bord",
    rentNumber: "Louer un numéro",
    myRentals: "Mes locations",
    plansBilling: "Plans et facturation",
    referrals: "Parrainages",
    apiDocs: "API et docs",
    settings: "Paramètres",
    support: "Assistance",
    addFunds: "Recharger le solde",
    search: "Rechercher",
    signOut: "Se déconnecter",
    online: "En ligne",
    admin: "Admin",
  },
};

interface LanguageContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: string) => string;
  current: Language;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  current: LANGUAGES[0],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    try { return (localStorage.getItem("skysms-lang") as LangCode) || "en"; } catch { return "en"; }
  });

  const setLang = (code: LangCode) => {
    setLangState(code);
    try { localStorage.setItem("skysms-lang", code); } catch {}
  };

  const t = (key: string): string => T[lang]?.[key] ?? T.en[key] ?? key;
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, current }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
