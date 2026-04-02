import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSettings } from "../contexts/SettingsContext";
import { useTransactions } from "../hooks/useQueries";

type Period = "week" | "month" | "year";

function isInPeriod(ts: bigint, period: Period): boolean {
  const date = new Date(Number(ts));
  const now = new Date();
  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    return date >= weekAgo;
  }
  if (period === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }
  return date.getFullYear() === now.getFullYear();
}

const HR_DAYS = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];
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

const DONUT_COLORS = [
  "oklch(0.63 0.11 195)",
  "oklch(0.55 0.14 160)",
  "oklch(0.65 0.15 250)",
  "oklch(0.75 0.18 85)",
  "oklch(0.65 0.22 30)",
  "oklch(0.60 0.18 310)",
  "oklch(0.70 0.16 60)",
];

export function DashboardPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const [period, setPeriod] = useState<Period>("month");
  const { formatCurrency } = useSettings();

  const filtered = useMemo(
    () => transactions.filter((tx) => isInPeriod(tx.date, period)),
    [transactions, period],
  );

  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.transactionType.toLowerCase().includes("prihod")) {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }
    return {
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense,
    };
  }, [filtered]);

  const barData = useMemo(() => {
    const now = new Date();
    if (period === "week") {
      const buckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return {
          label: HR_DAYS[d.getDay()],
          prihodi: 0,
          rashodi: 0,
          dateKey: d.toDateString(),
        };
      });
      for (const tx of filtered) {
        const d = new Date(Number(tx.date));
        const bucket = buckets.find((b) => b.dateKey === d.toDateString());
        if (!bucket) continue;
        if (tx.transactionType.toLowerCase().includes("prihod"))
          bucket.prihodi += tx.amount;
        else bucket.rashodi += tx.amount;
      }
      return buckets.map(({ label, prihodi, rashodi }) => ({
        label,
        prihodi,
        rashodi,
      }));
    }
    if (period === "month") {
      const buckets = [1, 2, 3, 4].map((w) => ({
        label: `Tj. ${w}`,
        prihodi: 0,
        rashodi: 0,
        week: w,
      }));
      for (const tx of filtered) {
        const d = new Date(Number(tx.date));
        const week = Math.min(Math.ceil(d.getDate() / 7), 4);
        const bucket = buckets.find((b) => b.week === week);
        if (!bucket) continue;
        if (tx.transactionType.toLowerCase().includes("prihod"))
          bucket.prihodi += tx.amount;
        else bucket.rashodi += tx.amount;
      }
      return buckets.map(({ label, prihodi, rashodi }) => ({
        label,
        prihodi,
        rashodi,
      }));
    }
    const buckets = HR_MONTHS.map((label, i) => ({
      label,
      prihodi: 0,
      rashodi: 0,
      month: i,
    }));
    for (const tx of filtered) {
      const d = new Date(Number(tx.date));
      const bucket = buckets[d.getMonth()];
      if (!bucket) continue;
      if (tx.transactionType.toLowerCase().includes("prihod"))
        bucket.prihodi += tx.amount;
      else bucket.rashodi += tx.amount;
    }
    return buckets.map(({ label, prihodi, rashodi }) => ({
      label,
      prihodi,
      rashodi,
    }));
  }, [filtered, period]);

  const donutData = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const tx of filtered) {
      if (!tx.transactionType.toLowerCase().includes("prihod")) {
        catMap[tx.category] = (catMap[tx.category] ?? 0) + tx.amount;
      }
    }
    const total = Object.values(catMap).reduce((s, v) => s + v, 0);
    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [filtered]);

  const kpiCards = [
    {
      title: "Ukupni prihodi",
      value: formatCurrency(totalIncome),
      trend: "up" as const,
      icon: TrendingUp,
    },
    {
      title: "Ukupni rashodi",
      value: formatCurrency(totalExpense),
      trend: "down" as const,
      icon: TrendingDown,
    },
    {
      title: "Neto saldo",
      value: formatCurrency(netBalance),
      trend: netBalance >= 0 ? ("up" as const) : ("down" as const),
      icon: DollarSign,
    },
  ];

  const periodLabel =
    period === "week" ? "tjedan" : period === "month" ? "mjesec" : "godinu";

  return (
    <div className="space-y-6 animate-fade-in" data-ocid="dashboard.page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Financijski pregled</p>
        </div>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => v && setPeriod(v as Period)}
          className="border border-border rounded-lg p-0.5 bg-muted"
          data-ocid="dashboard.period.toggle"
        >
          <ToggleGroupItem
            value="week"
            className="text-sm px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm"
            data-ocid="dashboard.period.week.tab"
          >
            Tjedan
          </ToggleGroupItem>
          <ToggleGroupItem
            value="month"
            className="text-sm px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm"
            data-ocid="dashboard.period.month.tab"
          >
            Mjesec
          </ToggleGroupItem>
          <ToggleGroupItem
            value="year"
            className="text-sm px-4 data-[state=on]:bg-card data-[state=on]:shadow-sm"
            data-ocid="dashboard.period.year.tab"
          >
            Godina
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* KPI Cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        data-ocid="dashboard.kpi.section"
      >
        {kpiCards.map((card, i) => (
          <Card
            key={card.title}
            className="shadow-card border-border/50"
            data-ocid={`dashboard.kpi.item.${i + 1}`}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.trend === "up" ? "bg-teal/10" : "bg-destructive/10"}`}
              >
                <card.icon
                  className={`h-4 w-4 ${card.trend === "up" ? "text-teal" : "text-destructive"}`}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton
                  className="h-8 w-32"
                  data-ocid="dashboard.kpi.loading_state"
                />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading
                  ? ""
                  : `Ovaj ${periodLabel} · ${filtered.length} transakcija`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="shadow-card border-border/50"
          data-ocid="dashboard.bar_chart.card"
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Prihodi vs. Rashodi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton
                className="h-48 w-full"
                data-ocid="dashboard.bar_chart.loading_state"
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={barData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
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
                    dataKey="prihodi"
                    name="Prihodi"
                    fill="oklch(0.63 0.11 195)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="rashodi"
                    name="Rashodi"
                    fill="oklch(0.577 0.245 27.325)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card
          className="shadow-card border-border/50"
          data-ocid="dashboard.donut_chart.card"
        >
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Raspodjela rashoda po kategorijama
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton
                className="h-48 w-full"
                data-ocid="dashboard.donut_chart.loading_state"
              />
            ) : donutData.length === 0 ? (
              <p
                className="text-sm text-muted-foreground text-center py-16"
                data-ocid="dashboard.donut_chart.empty_state"
              >
                Nema podataka
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {donutData.map((item, index) => (
                        <Cell
                          key={`cell-${item.name}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-1">
                  {donutData.map((entry, index) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            background:
                              DONUT_COLORS[index % DONUT_COLORS.length],
                          }}
                        />
                        <span className="text-foreground">{entry.name}</span>
                      </div>
                      <span className="text-muted-foreground font-medium">
                        {entry.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
