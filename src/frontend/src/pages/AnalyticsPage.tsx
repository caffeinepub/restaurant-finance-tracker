import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSettings } from "../contexts/SettingsContext";
import { useTransactions } from "../hooks/useQueries";

const HR_MONTHS = [
  "Sij",
  "Velj",
  "Ožu",
  "Tra",
  "Svi",
  "Lip",
  "Srp",
  "Kol",
  "Ruj",
  "Lis",
  "Stu",
  "Pro",
];

const CATEGORY_COLORS = [
  "oklch(0.63 0.11 195)",
  "oklch(0.55 0.14 160)",
  "oklch(0.65 0.15 250)",
  "oklch(0.75 0.18 85)",
  "oklch(0.65 0.22 30)",
  "oklch(0.60 0.18 310)",
  "oklch(0.70 0.16 60)",
  "oklch(0.58 0.20 45)",
];

const INCOME_COLOR_1 = "oklch(0.63 0.11 195)";
const INCOME_COLOR_2 = "oklch(0.75 0.18 85)";

export function AnalyticsPage() {
  const { formatCurrency } = useSettings();
  const { data: transactions = [], isLoading } = useTransactions();
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    for (const tx of transactions) {
      years.add(new Date(Number(tx.date)).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const [year1, setYear1] = useState<string>(String(currentYear));
  const [year2, setYear2] = useState<string>("none");

  const selectedYear1 = Number(year1);
  const selectedYear2 = year2 !== "none" ? Number(year2) : null;

  const incomeTrendData = useMemo(() => {
    const income1 = Array(12).fill(0) as number[];
    const income2 = Array(12).fill(0) as number[];
    for (const tx of transactions) {
      const d = new Date(Number(tx.date));
      const yr = d.getFullYear();
      const mo = d.getMonth();
      if (!tx.transactionType.toLowerCase().includes("prihod")) continue;
      if (yr === selectedYear1) income1[mo] += tx.amount;
      if (selectedYear2 !== null && yr === selectedYear2)
        income2[mo] += tx.amount;
    }
    return HR_MONTHS.map((label, i) => {
      const row: Record<string, number | string> = { label };
      row[`prihodi_${selectedYear1}`] = income1[i];
      if (selectedYear2 !== null) row[`prihodi_${selectedYear2}`] = income2[i];
      return row;
    });
  }, [transactions, selectedYear1, selectedYear2]);

  const { categoryExpenseData, expenseCategories } = useMemo(() => {
    const catMap: Record<string, number[]> = {};
    for (const tx of transactions) {
      const d = new Date(Number(tx.date));
      if (
        d.getFullYear() === selectedYear1 &&
        !tx.transactionType.toLowerCase().includes("prihod")
      ) {
        if (!catMap[tx.category]) catMap[tx.category] = Array(12).fill(0);
        catMap[tx.category][d.getMonth()] += tx.amount;
      }
    }
    const cats = Object.keys(catMap);
    const data = HR_MONTHS.map((label, i) => {
      const row: Record<string, number | string> = { label };
      for (const cat of cats) {
        row[cat] = catMap[cat][i];
      }
      return row;
    });
    return { categoryExpenseData: data, expenseCategories: cats };
  }, [transactions, selectedYear1]);

  const hasExpenseData = expenseCategories.length > 0;
  const hasIncomeData = transactions.some((tx) =>
    tx.transactionType.toLowerCase().includes("prihod"),
  );

  return (
    <div className="space-y-6 animate-fade-in" data-ocid="analytics.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analitika</h1>
          <p className="text-muted-foreground mt-1">
            Trendovi i usporedbe po godinama
          </p>
        </div>

        {/* Year selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Primarna godina
            </span>
            <Select
              value={year1}
              onValueChange={(v) => {
                setYear1(v);
                if (v === year2) setYear2("none");
              }}
            >
              <SelectTrigger className="w-32" data-ocid="analytics.year.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Usporedna godina
            </span>
            <Select value={year2} onValueChange={setYear2}>
              <SelectTrigger
                className="w-36"
                data-ocid="analytics.year2.select"
              >
                <SelectValue placeholder="Odaberi godinu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez usporedbe</SelectItem>
                {availableYears
                  .filter((y) => String(y) !== year1)
                  .map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chart 1: Income trend */}
      <Card
        className="shadow-card border-border/50"
        data-ocid="analytics.income_trend.card"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Kretanje prihoda po godini
            {selectedYear2 && (
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                ({selectedYear1} vs {selectedYear2})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton
              className="h-56 w-full"
              data-ocid="analytics.income_trend.loading_state"
            />
          ) : !hasIncomeData ? (
            <p
              className="text-sm text-muted-foreground text-center py-16"
              data-ocid="analytics.income_trend.empty_state"
            >
              Nema podataka o prihodima za odabranu godinu
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={incomeTrendData}
                margin={{ top: 4, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.35 0.02 240)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey={`prihodi_${selectedYear1}`}
                  name={String(selectedYear1)}
                  stroke={INCOME_COLOR_1}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                {selectedYear2 && (
                  <Line
                    type="monotone"
                    dataKey={`prihodi_${selectedYear2}`}
                    name={String(selectedYear2)}
                    stroke={INCOME_COLOR_2}
                    strokeWidth={2.5}
                    strokeDasharray="5 3"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Income comparison (only when two years selected) */}
      {selectedYear2 && (
        <Card
          className="shadow-card border-border/50"
          data-ocid="analytics.income_comparison.card"
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Usporedba prihoda između godina
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                ({selectedYear1} vs {selectedYear2})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton
                className="h-56 w-full"
                data-ocid="analytics.income_comparison.loading_state"
              />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={incomeTrendData}
                  margin={{ top: 4, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.35 0.02 240)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey={`prihodi_${selectedYear1}`}
                    name={String(selectedYear1)}
                    fill={INCOME_COLOR_1}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey={`prihodi_${selectedYear2}`}
                    name={String(selectedYear2)}
                    fill={INCOME_COLOR_2}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chart 3: Expense trends by category */}
      <Card
        className="shadow-card border-border/50"
        data-ocid="analytics.category_expenses.card"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Rashodi po kategorijama kroz godinu
            <span className="text-muted-foreground font-normal ml-2 text-sm">
              ({selectedYear1})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton
              className="h-56 w-full"
              data-ocid="analytics.category_expenses.loading_state"
            />
          ) : !hasExpenseData ? (
            <p
              className="text-sm text-muted-foreground text-center py-16"
              data-ocid="analytics.category_expenses.empty_state"
            >
              Nema podataka o rashodima za odabranu godinu
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={categoryExpenseData}
                margin={{ top: 4, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.35 0.02 240)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {expenseCategories.map((cat, i) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    name={cat}
                    stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
