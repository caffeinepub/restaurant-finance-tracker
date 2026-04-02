# Project Resaurant Finance Tracker

## Current State
- Stranica `/povijesni-podaci` prikazuje PlaceholderPage
- Backend nudi `getTransactions()` koji vraća sve transakcije
- TransactionsPage koristi paginaciju (10/stranici), sortiranje po datumu+ID, kategorije iz backenda+localStorage
- Postoje preddefinirani tipovi (Prihod, Rashod) i kategorije u PREDEFINED_CATEGORIES konstanti

## Requested Changes (Diff)

### Add
- Nova stranica `HistoricalDataPage.tsx` koja zamjenjuje PlaceholderPage za rutu `/povijesni-podaci`
- Filteri: raspon datuma (od-do), tip transakcije, kategorija, iznos (min/max), slobodni unos teksta po opisu
- Paginiran popis svih transakcija (10 po stranici) sortiran najnovije prvo
- Sažetak: ukupni prihodi, rashodi i saldo za filtrirani skup

### Modify
- App.tsx: importati i koristiti HistoricalDataPage umjesto PlaceholderPage za `/povijesni-podaci`

### Remove
- Ništa

## Implementation Plan
1. Kreirati `src/frontend/src/pages/HistoricalDataPage.tsx`
   - Učitati sve transakcije via `useTransactions()` hook
   - Učitati kategorije via `useCategories()` + PREDEFINED + localStorage tipovi
   - Filteri: date range (from/to), type select, category select, amount min/max, description search
   - Filtrirana lista: primijeni sve aktivne filtere na transakcije
   - Paginacija: 10 po stranici, ista logika kao TransactionsPage
   - Sažetak kartica: ukupni prihodi, rashodi, neto saldo za filtrirani skup
   - Gumb za reset filtera
2. Ažurirati App.tsx da importira i koristi HistoricalDataPage
