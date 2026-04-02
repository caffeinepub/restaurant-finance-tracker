# Project Resaurant Finance Tracker

## Current State

Aplikacija ima 6 stranica: Dashboard, Transakcije, Analitika, Izvjestaji, Povijesni podaci i Postavke (placeholder). Postavke su trenutno PlaceholderPage bez sadrzaja. Aplikacija nema internacionalizaciju ni podrsku za vise tema.

## Requested Changes (Diff)

### Add
- SettingsContext.tsx -- React context za globalne postavke (jezik, valuta, tema, format datuma, naziv restorana)
- SettingsPage.tsx -- Stranica Postavke s 5 sekcija
- translations.ts -- Prijevodi za 6 jezika (HR, EN, DE, IT, ES, ZH)

### Modify
- App.tsx -- SettingsProvider wrapper, zamijeni placeholder s SettingsPage
- AppLayout.tsx -- primijeni dark/light temu
- AppSidebar.tsx -- naziv restorana iz postavki, prevedeni labeli
- Sve stranice -- koristiti useSettings hook za prijevode i formatiranje valuta/datuma

### Remove
- PlaceholderPage referenca za rutu /postavke

## Implementation Plan

1. Kreirati SettingsContext.tsx s tipovima i localStorage podrskom
2. Kreirati translations.ts za sve tekstove na 6 jezika
3. Kreirati SettingsPage.tsx s 5 sekcija
4. Spojiti sve komponente s postavkama
