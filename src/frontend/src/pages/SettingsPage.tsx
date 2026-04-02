import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Palette, Store } from "lucide-react";
import type { Currency, DateFormat, Theme } from "../contexts/SettingsContext";
import { useSettings } from "../contexts/SettingsContext";
import type { Language } from "../i18n/translations";

const LANGUAGE_OPTIONS: { value: Language; flag: string; labelKey: string }[] =
  [
    { value: "hr", flag: "🇭🇷", labelKey: "settings.languageHr" },
    { value: "en", flag: "🇬🇧", labelKey: "settings.languageEn" },
    { value: "de", flag: "🇩🇪", labelKey: "settings.languageDe" },
    { value: "it", flag: "🇮🇹", labelKey: "settings.languageIt" },
    { value: "es", flag: "🇪🇸", labelKey: "settings.languageEs" },
    { value: "zh", flag: "🇨🇳", labelKey: "settings.languageZh" },
  ];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "CNY", label: "CNY (¥)" },
];

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export function SettingsPage() {
  const {
    language,
    currency,
    theme,
    dateFormat,
    restaurantName,
    setLanguage,
    setCurrency,
    setTheme,
    setDateFormat,
    setRestaurantName,
    t,
  } = useSettings();

  return (
    <div className="space-y-6 max-w-2xl" data-ocid="settings.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground mt-1">Konfiguracija aplikacije</p>
      </div>

      {/* Appearance */}
      <Card
        className="shadow-card border-border/50"
        data-ocid="settings.appearance.card"
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-teal" />
            {t("settings.appearanceSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">
                {t("settings.theme")}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {theme === "dark"
                  ? t("settings.darkTheme")
                  : t("settings.lightTheme")}
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : ("light" as Theme))
              }
              data-ocid="settings.theme.switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card
        className="shadow-card border-border/50"
        data-ocid="settings.localization.card"
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal" />
            {t("settings.localizationSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Language */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("settings.language")}
            </Label>
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as Language)}
            >
              <SelectTrigger data-ocid="settings.language.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span>{opt.flag}</span>
                      <span>{t(opt.labelKey)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("settings.currency")}
            </Label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as Currency)}
            >
              <SelectTrigger data-ocid="settings.currency.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("settings.dateFormat")}
            </Label>
            <Select
              value={dateFormat}
              onValueChange={(v) => setDateFormat(v as DateFormat)}
            >
              <SelectTrigger data-ocid="settings.dateformat.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* App */}
      <Card
        className="shadow-card border-border/50"
        data-ocid="settings.app.card"
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Store className="h-4 w-4 text-teal" />
            {t("settings.appSection")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Restaurant Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("settings.restaurantName")}
            </Label>
            <Input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder={t("settings.restaurantNamePlaceholder")}
              data-ocid="settings.restaurant_name.input"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
