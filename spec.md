# Project Resaurant Finance Tracker

## Current State
- Koraci 1, 2, 3 i 4a su kompletirani
- Postoji AnalyticsPage.tsx s grafikonima kretanja prihoda i rashoda
- PlaceholderPage se koristi za /izvjestaji rutu
- useTransactions() hook dohvaća sve transakcije iz backenda
- DashboardPage ima period filter (week/month/year) logiku koja se može replicirati

## Requested Changes (Diff)

### Add
- Nova stranica ReportsPage.tsx na /izvjestaji ruti
- Tablični prikaz prihoda i rashoda grupiranih po kategorijama
- Period prekidač: Tjedan / Mjesec / Godina
- Suma prihoda i rashoda po svakoj kategoriji
- Ukupni saldo na dnu tablice
- Export gumbi: CSV, JSON, PDF (print)

### Modify
- App.tsx: zamijeniti PlaceholderPage za /izvjestaji s ReportsPage

### Remove
- Ništa

## Implementation Plan
1. Kreirati src/frontend/src/pages/ReportsPage.tsx
   - Period filter (Tjedan/Mjesec/Godina) koristeći ToggleGroup kao u DashboardPage
   - useTransactions() za dohvat svih transakcija
   - Filtrirati transakcije prema odabranom periodu (isti isInPeriod pattern)
   - Grupirati po kategorijama: za svaku kategoriju suma prihoda i rashoda
   - Tablica: Kategorija | Prihodi | Rashodi | Saldo
   - Footer row: Ukupno | suma prihoda | suma rashoda | neto saldo
   - Export u CSV, JSON, PDF (koristeći window.print ili jsPDF-free pristup)
2. Ažurirati App.tsx da koristi ReportsPage umjesto PlaceholderPage za /izvjestaji
