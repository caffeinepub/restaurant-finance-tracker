# Project Resaurant Finance Tracker

## Current State

DashboardPage (`src/frontend/src/pages/DashboardPage.tsx`) currently shows:
- 3 KPI cards: Ukupni prihodi, Ukupni rashodi, Neto dobit -- calculated from ALL transactions (no time filter)
- A list of 5 most recent transactions
- No charts, no period switcher

Transactions are loaded via `useTransactions()` hook which calls `getTransactions()` from backend. Each transaction has: `id`, `transactionType` (string), `date` (bigint timestamp ms), `amount` (number), `currency` (string), `category` (string), `description` (string).

Predefined transaction types: "Prihod" (income), "Rashod" (expense).

## Requested Changes (Diff)

### Add
- Period switcher: buttons **Tjedan / Mjesec / Godina** at the top of Dashboard
- KPI cards (Ukupni prihodi, Ukupni rashodi, Neto dobit) recalculate based on selected period
- Bar/line chart: **Prihodi vs. Rashodi** grouped by time within selected period (daily for Tjedan, weekly for Mjesec, monthly for Godina)
- Donut/pie chart: **Udjel kategorija troškova** -- only expense transactions, showing percentage per category (e.g. Hrana 45%, Plaće 30%...), for selected period

### Modify
- Replace the simple recent-transactions list section with the two charts
- KPI calculations must respect the active period filter

### Remove
- The 5 recent transactions list at the bottom of Dashboard (replaced by charts)

## Implementation Plan

1. Add period state: `'week' | 'month' | 'year'`, default `'month'`
2. Add period filter utility: given transactions and period, return only transactions within that period (based on `date` bigint ms timestamp vs. current date)
3. Period switcher UI: 3 toggle buttons at the top of dashboard
4. KPI cards: recalculate using filtered transactions (same income/expense detection logic -- check if `transactionType` is "Prihod" variant for income)
5. Bar chart (Recharts, already available via `chart.tsx` shadcn component): Prihodi vs. Rashodi over time buckets
   - Tjedan: 7 days (Mon-Sun), x-axis = day name
   - Mjesec: ~4-5 weeks, x-axis = week number or date range
   - Godina: 12 months, x-axis = month name (hr)
6. Donut chart (Recharts): category breakdown of expense transactions for selected period, showing percentage labels
7. Use `recharts` which is available via the shadcn chart component
