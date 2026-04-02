import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  Loader2,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Category, Transaction } from "../backend.d";
import { useCategories, useTransactions } from "../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────
const PREDEFINED_TYPES = ["Prihod", "Rashod"];

const PREDEFINED_CATEGORIES: Category[] = [
  { name: "Hrana", txType: "Rashod" },
  { name: "Piće", txType: "Rashod" },
  { name: "Plaće", txType: "Rashod" },
  { name: "Najam", txType: "Rashod" },
  { name: "Komunalije", txType: "Rashod" },
  { name: "Ostalo", txType: "Rashod" },
];

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  CNY: "¥",
};

const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleDateString("hr-HR");
}

function formatAmount(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  return `${symbol} ${amount.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mergeCategories(
  backend: Category[],
  predefined: Category[],
): Category[] {
  const all = [...predefined];
  for (const item of backend) {
    if (!all.some((a) => a.name === item.name)) all.push(item);
  }
  return all;
}

function getLocalStorageTypes(): string[] {
  try {
    const stored = localStorage.getItem("rft_custom_types");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ─── Filter State ─────────────────────────────────────────────────────────
interface Filters {
  dateFrom: string;
  dateTo: string;
  txType: string;
  category: string;
  amountMin: string;
  amountMax: string;
  description: string;
}

const DEFAULT_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  txType: "sve",
  category: "sve",
  amountMin: "",
  amountMax: "",
  description: "",
};

// ─── Main Page ─────────────────────────────────────────────────────────────
export function HistoricalDataPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: backendCategories = [] } = useCategories();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const customTypes = getLocalStorageTypes();
  const allTypes = [...PREDEFINED_TYPES, ...customTypes];
  const allCategories = mergeCategories(
    backendCategories,
    PREDEFINED_CATEGORIES,
  );

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.txType !== "sve" ||
    filters.category !== "sve" ||
    filters.amountMin ||
    filters.amountMax ||
    filters.description;

  // Sort newest first
  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) => {
        const diff = Number(b.date) - Number(a.date);
        if (diff !== 0) return diff;
        return Number(b.id) - Number(a.id);
      }),
    [transactions],
  );

  // Apply filters
  const filtered = useMemo(() => {
    return sorted.filter((tx) => {
      if (filters.dateFrom) {
        const fromMs = new Date(filters.dateFrom).getTime();
        if (Number(tx.date) < fromMs) return false;
      }
      if (filters.dateTo) {
        const toMs = new Date(filters.dateTo).getTime() + 86400000 - 1;
        if (Number(tx.date) > toMs) return false;
      }
      if (filters.txType !== "sve" && tx.transactionType !== filters.txType)
        return false;
      if (filters.category !== "sve" && tx.category !== filters.category)
        return false;
      if (filters.amountMin) {
        const min = Number.parseFloat(filters.amountMin.replace(",", "."));
        if (!Number.isNaN(min) && tx.amount < min) return false;
      }
      if (filters.amountMax) {
        const max = Number.parseFloat(filters.amountMax.replace(",", "."));
        if (!Number.isNaN(max) && tx.amount > max) return false;
      }
      if (filters.description) {
        const q = filters.description.toLowerCase();
        if (!tx.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sorted, filters]);

  // Summary
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.transactionType.toLowerCase().includes("prihod")) {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div
      className="space-y-6 animate-fade-in"
      data-ocid="povijesni_podaci.page"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Povijesni podaci</h1>
        <p className="text-muted-foreground mt-1">
          Arhiva svih financijskih transakcija s naprednim filterima
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="border-border/60 shadow-card"
          data-ocid="povijesni_podaci.income.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4 text-teal" />
              Ukupni prihodi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-teal">
              €{" "}
              {summary.income.toLocaleString("hr-HR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {
                filtered.filter((tx) =>
                  tx.transactionType.toLowerCase().includes("prihod"),
                ).length
              }{" "}
              transakcija
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-border/60 shadow-card"
          data-ocid="povijesni_podaci.expense.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownCircle className="h-4 w-4 text-destructive" />
              Ukupni rashodi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              €{" "}
              {summary.expense.toLocaleString("hr-HR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {
                filtered.filter(
                  (tx) => !tx.transactionType.toLowerCase().includes("prihod"),
                ).length
              }{" "}
              transakcija
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-border/60 shadow-card"
          data-ocid="povijesni_podaci.net.card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Neto saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                summary.net >= 0 ? "text-teal" : "text-destructive"
              }`}
            >
              €{" "}
              {summary.net.toLocaleString("hr-HR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filtered.length} transakcija ukupno
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Panel */}
      <div
        className="rounded-xl border border-border/60 bg-card shadow-card p-4"
        data-ocid="povijesni_podaci.filter.panel"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Filteri
            </span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Aktivni
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="povijesni_podaci.reset_filters.button"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Resetiraj filtere
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Date range */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Od datuma</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              data-ocid="povijesni_podaci.date_from.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Do datuma</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              data-ocid="povijesni_podaci.date_to.input"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Tip transakcije
            </Label>
            <Select
              value={filters.txType}
              onValueChange={(v) => setFilter("txType", v)}
            >
              <SelectTrigger data-ocid="povijesni_podaci.type.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sve">Svi tipovi</SelectItem>
                {allTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kategorija</Label>
            <Select
              value={filters.category}
              onValueChange={(v) => setFilter("category", v)}
            >
              <SelectTrigger data-ocid="povijesni_podaci.category.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sve">Sve kategorije</SelectItem>
                {allCategories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount range */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Min iznos</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.amountMin}
              onChange={(e) => setFilter("amountMin", e.target.value)}
              data-ocid="povijesni_podaci.amount_min.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Max iznos</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={filters.amountMax}
              onChange={(e) => setFilter("amountMax", e.target.value)}
              data-ocid="povijesni_podaci.amount_max.input"
            />
          </div>

          {/* Description search */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              Pretraži opis
            </Label>
            <Input
              placeholder="Pretraži opis..."
              value={filters.description}
              onChange={(e) => setFilter("description", e.target.value)}
              data-ocid="povijesni_podaci.description.search_input"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-border/60 bg-card shadow-card overflow-hidden">
        <Table data-ocid="povijesni_podaci.table">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Datum
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tip
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Kategorija
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Opis
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Iznos
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div
                    className="flex items-center justify-center gap-2 text-muted-foreground"
                    data-ocid="povijesni_podaci.loading_state"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Učitavanje...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <div
                    className="flex flex-col items-center gap-2"
                    data-ocid="povijesni_podaci.empty_state"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Filter className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      Nema transakcija za odabrane filtere.
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetFilters}
                        className="text-xs"
                      >
                        Resetiraj filtere
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              paginated.map((tx: Transaction, i: number) => (
                <TableRow
                  key={String(tx.id)}
                  className="hover:bg-muted/30 transition-colors"
                  data-ocid={`povijesni_podaci.item.${(currentPage - 1) * PAGE_SIZE + i + 1}`}
                >
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs border-0 ${
                        tx.transactionType.toLowerCase().includes("prihod")
                          ? "bg-teal/10 text-teal"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {tx.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.category || "-"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground max-w-[200px] truncate">
                    {tx.description}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-right whitespace-nowrap">
                    {formatAmount(tx.amount, tx.currency)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Stranica {currentPage} od {totalPages} ({filtered.length}{" "}
            transakcija)
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-disabled={currentPage === 1}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  data-ocid="povijesni_podaci.pagination_prev"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  aria-disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  data-ocid="povijesni_podaci.pagination_next"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
