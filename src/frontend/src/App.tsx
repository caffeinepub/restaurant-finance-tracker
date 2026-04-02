import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "./components/AppLayout";
import { SettingsProvider } from "./contexts/SettingsContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoricalDataPage } from "./pages/HistoricalDataPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TransactionsPage } from "./pages/TransactionsPage";

// Root route
const rootRoute = createRootRoute();

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Protected layout route
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !identity) {
      void navigate({ to: "/login" });
    }
  }, [identity, isInitializing, navigate]);

  if (isInitializing || !identity) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.18 0.04 240)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal/20 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full bg-teal" />
          </div>
          <p className="text-white/60 text-sm">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return <AppLayout />;
}

// Child routes under layout
const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: DashboardPage,
});

const transacijeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/transakcije",
  component: TransactionsPage,
});

const analitikaRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/analitika",
  component: AnalyticsPage,
});

const izvjestajiRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/izvjestaji",
  component: ReportsPage,
});

const povijesniPodaciRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/povijesni-podaci",
  component: HistoricalDataPage,
});

const postavkeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/postavke",
  component: SettingsPage,
});

const router = createRouter({
  routeTree: rootRoute.addChildren([
    loginRoute,
    layoutRoute.addChildren([
      dashboardRoute,
      transacijeRoute,
      analitikaRoute,
      izvjestajiRoute,
      povijesniPodaciRoute,
      postavkeRoute,
    ]),
  ]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <SettingsProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </SettingsProvider>
  );
}
