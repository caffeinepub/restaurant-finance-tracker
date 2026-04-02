import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Download, FileJson, FileSpreadsheet, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useTransactions } from "../hooks/useQueries";

type Period = "week" | "month" | "year";

function isInPeriod(ts: bigint, period: Period, year: number): boolean {
  const date = new Date(Number(ts));
  const now = new Date();
  const currentYear = now.getFullYear();

  if (period === "week") {
    if (year === currentYear) {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      return date >= weekAgo;
    }
    // Last 7 days of the selected year (Dec 25 - Dec 31)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    const weekAgo = new Date(yearEnd);
    weekAgo.setDate(yearEnd.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    return date >= weekAgo && date <= yearEnd;
  }

  if (period === "month") {
    return date.getFullYear() === year && date.getMonth() === now.getMonth();
  }

  return date.getFullYear() === year;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface CategoryRow {
  category: string;
  prihodi: number;
  rashodi: number;
  saldo: number;
}

export function ReportsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { formatCurrency } = useSettings();
  const [period, setPeriod] = useState<Period>("month");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const availableYears = useMemo(() => {
    const years = new Set(
      transactions.map((tx) => new Date(Number(tx.date)).getFullYear()),
    );
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => isInPeriod(tx.date, period, selectedYear)),
    [transactions, period, selectedYear],
  );

  const tableData = useMemo(() => {
    const catMap: Record<string, { prihodi: number; rashodi: number }> = {};
    for (const tx of filtered) {
      const cat = tx.category || "Ostalo";
      if (!catMap[cat]) catMap[cat] = { prihodi: 0, rashodi: 0 };
      if (tx.transactionType.toLowerCase().includes("prihod")) {
        catMap[cat].prihodi += tx.amount;
      } else {
        catMap[cat].rashodi += tx.amount;
      }
    }
    return Object.entries(catMap).map(
      ([category, vals]): CategoryRow => ({
        category,
        prihodi: vals.prihodi,
        rashodi: vals.rashodi,
        saldo: vals.prihodi - vals.rashodi,
      }),
    );
  }, [filtered]);

  const totals = useMemo(() => {
    return tableData.reduce(
      (acc, row) => ({
        prihodi: acc.prihodi + row.prihodi,
        rashodi: acc.rashodi + row.rashodi,
        saldo: acc.saldo + row.saldo,
      }),
      { prihodi: 0, rashodi: 0, saldo: 0 },
    );
  }, [tableData]);

  const periodLabel =
    period === "week" ? "Tjedan" : period === "month" ? "Mjesec" : "Godina";

  function handleExportCSV() {
    const header = "Kategorija,Prihodi (EUR),Rashodi (EUR),Saldo (EUR)";
    const rows = tableData.map(
      (r) =>
        `"${r.category}",${r.prihodi.toFixed(2)},${r.rashodi.toFixed(2)},${r.saldo.toFixed(2)}`,
    );
    const footer = `"Ukupno",${totals.prihodi.toFixed(2)},${totals.rashodi.toFixed(2)},${totals.saldo.toFixed(2)}`;
    const csv = [header, ...rows, footer].join("\n");
    downloadFile(
      csv,
      `izvjestaj-${selectedYear}.csv`,
      "text/csv;charset=utf-8;",
    );
  }

  function handleExportJSON() {
    const payload = {
      period: periodLabel,
      year: selectedYear,
      generatedAt: new Date().toISOString(),
      rows: tableData,
      totals,
    };
    downloadFile(
      JSON.stringify(payload, null, 2),
      `izvjestaj-${selectedYear}.json`,
      "application/json",
    );
  }

  function handleExportPDF() {
    window.print();
  }

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: fixed; inset: 0; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-6 animate-fade-in" data-ocid="reports.page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Izvje\u0161taji
            </h1>
            <p className="text-muted-foreground mt-1">
              Prihodi i rashodi po kategorijama
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 no-print">
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger
                className="w-[100px] border-border bg-muted/50"
                data-ocid="reports.year.select"
              >
                <SelectValue placeholder="Godina" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(v) => v && setPeriod(v as Period)}
              className="border border-border rounded-lg p-0.5 bg-muted"
              data-ocid="reports.period.toggle"
            >
              <ToggleGroupItem
                value="week"
                className="text-sm px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm"
                data-ocid="reports.period.week.tab"
              >
                Tjedan
              </ToggleGroupItem>
              <ToggleGroupItem
                value="month"
                className="text-sm px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm"
                data-ocid="reports.period.month.tab"
              >
                Mjesec
              </ToggleGroupItem>
              <ToggleGroupItem
                value="year"
                className="text-sm px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm"
                data-ocid="reports.period.year.tab"
              >
                Godina
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2"
                data-ocid="reports.export.csv"
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="gap-2"
                data-ocid="reports.export.json"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2"
                data-ocid="reports.export.pdf"
              >
                <Printer className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        <Card
          className="shadow-card border-border/50 print-area"
          data-ocid="reports.table"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Pregled po kategorijama \u00b7 {periodLabel} \u00b7{" "}
                {selectedYear}
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground no-print" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3" data-ocid="reports.loading_state">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : tableData.length === 0 ? (
              <p
                className="text-sm text-muted-foreground text-center py-16"
                data-ocid="reports.empty_state"
              >
                Nema podataka za odabrani period
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground pl-6">
                      Kategorija
                    </TableHead>
                    <TableHead className="text-right font-semibold text-teal">
                      Prihodi
                    </TableHead>
                    <TableHead className="text-right font-semibold text-destructive">
                      Rashodi
                    </TableHead>
                    <TableHead className="text-right font-semibold text-foreground pr-6">
                      Saldo
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, i) => (
                    <TableRow
                      key={row.category}
                      className="border-border/30"
                      data-ocid={`reports.row.item.${i + 1}`}
                    >
                      <TableCell className="font-medium pl-6">
                        {row.category}
                      </TableCell>
                      <TableCell className="text-right text-teal">
                        {row.prihodi > 0
                          ? formatCurrency(row.prihodi)
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {row.rashodi > 0
                          ? formatCurrency(row.rashodi)
                          : "\u2014"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium pr-6 ${
                          row.saldo >= 0 ? "text-teal" : "text-destructive"
                        }`}
                      >
                        {formatCurrency(row.saldo)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-border/60 bg-muted/40 font-bold">
                    <TableCell className="font-bold text-foreground pl-6">
                      Ukupno
                    </TableCell>
                    <TableCell className="text-right font-bold text-teal">
                      {formatCurrency(totals.prihodi)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {formatCurrency(totals.rashodi)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold pr-6 ${
                        totals.saldo >= 0 ? "text-teal" : "text-destructive"
                      }`}
                    >
                      {formatCurrency(totals.saldo)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
