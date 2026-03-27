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
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const mainNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/transakcije", label: "Transakcije", icon: ArrowLeftRight },
  { to: "/analitika", label: "Analitika", icon: BarChart2 },
  { to: "/izvjestaji", label: "Izvje\u0161taji", icon: FileText },
  { to: "/povijesni-podaci", label: "Povijesni podaci", icon: History },
];

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

function NavItem({ to, label, icon: Icon, exact }: NavItemProps) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  const ocid = `nav.${label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}.link`;

  return (
    <Link to={to} data-ocid={ocid}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-navy-700 text-white shadow-sm"
            : "text-white/60 hover:text-white/90 hover:bg-white/5",
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

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[260px] flex flex-col z-30"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.18 0.04 240) 0%, oklch(0.22 0.06 240) 100%)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center shrink-0">
          <Utensils className="h-5 w-5 text-white" />
        </div>
        <span className="text-white font-bold text-[17px] tracking-tight">
          RestoFinance
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
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link to="/postavke" data-ocid="nav.postavke.link">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-150">
            <Settings className="h-[18px] w-[18px] shrink-0" />
            <span>Postavke</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={clear}
          data-ocid="nav.logout.button"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-150"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Odjava</span>
        </button>
      </div>
    </aside>
  );
}
