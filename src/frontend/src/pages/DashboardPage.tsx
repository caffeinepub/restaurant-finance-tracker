import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useTransactions } from "../hooks/useQueries";

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  CNY: "¥",
};

function formatCurrency(amount: number, currency = "EUR") {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  return `${symbol} ${amount.toLocaleString("hr-HR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(ts: bigint) {
  return new Date(Number(ts)).toLocaleDateString("hr-HR");
}

export function DashboardPage() {
  const { data: transactions = [], isLoading } = useTransactions();

  const { totalIncome, totalExpense, netProfit } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.transactionType.toLowerCase().includes("prihod")) {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }
    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
    };
  }, [transactions]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => Number(b.date) - Number(a.date))
        .slice(0, 5),
    [transactions],
  );

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
      title: "Neto dobit",
      value: formatCurrency(netProfit),
      trend: netProfit >= 0 ? ("up" as const) : ("down" as const),
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-ocid="dashboard.page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Financijski pregled</p>
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
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  card.trend === "up" ? "bg-teal/10" : "bg-destructive/10"
                }`}
              >
                <card.icon
                  className={`h-4 w-4 ${
                    card.trend === "up" ? "text-teal" : "text-destructive"
                  }`}
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
                {isLoading ? "" : `${transactions.length} transakcija ukupno`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent transactions */}
      <Card
        className="shadow-card border-border/50"
        data-ocid="dashboard.transactions.card"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Nedavne transakcije
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div
              className="space-y-3"
              data-ocid="dashboard.transactions.loading_state"
            >
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && recentTransactions.length === 0 && (
            <p
              className="text-sm text-muted-foreground text-center py-6"
              data-ocid="dashboard.transactions.empty_state"
            >
              Nema transakcija. Dodajte prvu transakciju u modulu Transakcije.
            </p>
          )}
          {!isLoading && recentTransactions.length > 0 && (
            <div className="space-y-3">
              {recentTransactions.map((tx, i) => {
                const isIncome = tx.transactionType
                  .toLowerCase()
                  .includes("prihod");
                const symbol = CURRENCY_SYMBOL[tx.currency] ?? tx.currency;
                return (
                  <div
                    key={String(tx.id)}
                    className="flex items-center justify-between"
                    data-ocid={`dashboard.transactions.item.${i + 1}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)} · {tx.category}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isIncome ? "text-teal" : "text-destructive"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {symbol}{" "}
                      {tx.amount.toLocaleString("hr-HR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
