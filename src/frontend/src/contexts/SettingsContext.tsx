import { createContext, useContext, useEffect, useState } from "react";
import type { Language } from "../i18n/translations";
import { translations } from "../i18n/translations";

export type Currency = "EUR" | "USD" | "CNY";
export type Theme = "light" | "dark";
export type DateFormat = "DD.MM.YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

interface Settings {
  language: Language;
  currency: Currency;
  theme: Theme;
  dateFormat: DateFormat;
  restaurantName: string;
}

interface SettingsContextValue extends Settings {
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: Theme) => void;
  setDateFormat: (format: DateFormat) => void;
  setRestaurantName: (name: string) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (dateStr: string | Date | bigint) => string;
}

const STORAGE_KEY = "rft_settings";

const DEFAULT_SETTINGS: Settings = {
  language: "hr",
  currency: "EUR",
  theme: "dark",
  dateFormat: "DD.MM.YYYY",
  restaurantName: "",
};

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      settings.theme === "dark",
    );
  }, [settings.theme]);

  function update(partial: Partial<Settings>) {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }

  function t(key: string): string {
    const lang = settings.language;
    return translations[lang]?.[key] ?? translations.hr[key] ?? key;
  }

  function formatCurrency(amount: number): string {
    const { currency } = settings;
    if (currency === "EUR") {
      return new Intl.NumberFormat("hr-HR", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    }
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    }
    if (currency === "CNY") {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(amount);
    }
    return amount.toString();
  }

  function formatDate(dateStr: string | Date | bigint): string {
    let date: Date;
    if (typeof dateStr === "bigint") {
      date = new Date(Number(dateStr));
    } else if (typeof dateStr === "string") {
      date = new Date(dateStr);
    } else {
      date = dateStr;
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    switch (settings.dateFormat) {
      case "DD.MM.YYYY":
        return `${day}.${month}.${year}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      default:
        return `${day}.${month}.${year}`;
    }
  }

  const value: SettingsContextValue = {
    ...settings,
    setLanguage: (lang) => update({ language: lang }),
    setCurrency: (currency) => update({ currency }),
    setTheme: (theme) => update({ theme }),
    setDateFormat: (format) => update({ dateFormat: format }),
    setRestaurantName: (name) => update({ restaurantName: name }),
    t,
    formatCurrency,
    formatDate,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
