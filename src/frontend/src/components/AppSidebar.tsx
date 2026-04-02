import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  BarChart2,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Utensils,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  ocid: string;
}

function NavItem({ to, label, icon: Icon, exact, ocid }: NavItemProps) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <Link to={to} data-ocid={ocid}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-[oklch(var(--sidebar-accent))] text-[oklch(var(--sidebar-accent-foreground))] shadow-sm"
            : "text-[oklch(var(--sidebar-foreground)/0.6)] hover:text-[oklch(var(--sidebar-foreground)/0.9)] hover:bg-[oklch(var(--sidebar-accent)/0.5)]",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span>{label}</span>
      </div>
    </Link>
  );
}

export function AppSidebar() {
  const { clear } = useInternetIdentity();
  const { t, restaurantName } = useSettings();

  const mainNavItems = [
    {
      to: "/",
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
      exact: true,
      ocid: "nav.dashboard.link",
    },
    {
      to: "/transakcije",
      label: t("nav.transactions"),
      icon: ArrowLeftRight,
      ocid: "nav.transactions.link",
    },
    {
      to: "/analitika",
      label: t("nav.analytics"),
      icon: BarChart2,
      ocid: "nav.analytics.link",
    },
    {
      to: "/izvjestaji",
      label: t("nav.reports"),
      icon: FileText,
      ocid: "nav.reports.link",
    },
    {
      to: "/povijesni-podaci",
      label: t("nav.history"),
      icon: History,
      ocid: "nav.history.link",
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] flex flex-col z-30 bg-[oklch(var(--sidebar))]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[oklch(var(--sidebar-border))]">
        <div className="w-9 h-9 rounded-lg bg-[oklch(var(--sidebar-primary))] flex items-center justify-center shrink-0">
          <Utensils className="h-5 w-5 text-[oklch(var(--sidebar-primary-foreground))]" />
        </div>
        <span className="text-[oklch(var(--sidebar-foreground))] font-bold text-[17px] tracking-tight truncate">
          {restaurantName || "RestoFinance"}
        </span>
      </div>

      {/* Main Nav */}
      <nav
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
        aria-label="Glavna navigacija"
      >
        {mainNavItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-4 border-t border-[oklch(var(--sidebar-border))] space-y-1">
        <Link to="/postavke" data-ocid="nav.settings.link">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[oklch(var(--sidebar-foreground)/0.6)] hover:text-[oklch(var(--sidebar-foreground)/0.9)] hover:bg-[oklch(var(--sidebar-accent)/0.5)] transition-all duration-150">
            <Settings className="h-[18px] w-[18px] shrink-0" />
            <span>{t("nav.settings")}</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={clear}
          data-ocid="nav.logout.button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[oklch(var(--sidebar-foreground)/0.6)] hover:text-[oklch(var(--sidebar-foreground)/0.9)] hover:bg-[oklch(var(--sidebar-accent)/0.5)] transition-all duration-150"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </aside>
  );
}
