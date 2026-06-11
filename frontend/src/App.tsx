import { motion } from "framer-motion";
import { ClipboardList, DollarSign, LogOut } from "lucide-react";
import { Suspense, lazy, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { BrandMark } from "./components/BrandMark";
import { ThemeToggle } from "./components/ThemeToggle";
import { LoadingLabel } from "./components/skeletons";
import { Badge, Button } from "./components/ui";
import { api, tokenKey } from "./lib/api";
import { createQueryClient } from "./lib/query";
import type { ApiUser, AuthResponse } from "./lib/types";
import { AuthScreen } from "./pages/AuthScreen";
import { LandingPage } from "./pages/LandingPage";
import { demoModeKey, demoToken } from "./demo";

const FinanceDashboard = lazy(() =>
  import("./pages/FinanceDashboard").then((module) => ({ default: module.FinanceDashboard })),
);
const TasksApp = lazy(() =>
  import("./pages/TasksApp").then((module) => ({ default: module.TasksApp })),
);

const tabs = [
  { id: "finance", label: "Finanças", icon: DollarSign, path: "/financas" },
  { id: "tasks", label: "Taskly", icon: ClipboardList, path: "/taskly" },
];

function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDemoMode = localStorage.getItem(demoModeKey) === "true";

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) {
      setAuthLoading(false);
      return;
    }

    api<{ user: ApiUser }>("/api/auth/me")
      .then((response) => setUser(response.user))
      .catch(() => localStorage.removeItem(tokenKey))
      .finally(() => setAuthLoading(false));
  }, []);

  function authenticate(response: AuthResponse) {
    queryClient.clear();
    if (response.token !== demoToken) localStorage.removeItem(demoModeKey);
    localStorage.setItem(tokenKey, response.token);
    setUser(response.user);
    navigate("/financas");
  }

  function logout() {
    queryClient.clear();
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(demoModeKey);
    setUser(null);
    navigate("/");
    toast.success("Sessão encerrada.");
  }

  if (authLoading) {
    return <FullPageLoading />;
  }

  return (
    <Routes>
      <Route
        element={user ? <Navigate replace to="/financas" /> : <LandingPage />}
        path="/"
      />
      <Route
        element={
          user ? (
            <Navigate replace to="/financas" />
          ) : (
            <AuthScreen onAuthenticated={authenticate} />
          )
        }
        path="/login"
      />
      <Route
        element={
          user ? (
            <AppLayout isDemoMode={isDemoMode} user={user} onLogout={logout} />
          ) : (
            <Navigate replace to="/login" />
          )
        }
      >
        <Route element={<FinanceDashboard />} path="/financas" />
        <Route element={<TasksApp />} path="/taskly" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

interface AppLayoutProps {
  isDemoMode: boolean;
  onLogout: () => void;
  user: ApiUser;
}

function AppLayout({ isDemoMode, onLogout, user }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname === "/taskly" ? "tasks" : "finance";

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <header className="mb-6 flex flex-col gap-5 border-b border-zinc-800 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <p className="text-lg font-bold text-zinc-50">NexaFlow</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav
            aria-label="Navegação principal"
            className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-1"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  className="relative min-w-0 px-3"
                  key={tab.id}
                  title={tab.label}
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(tab.path)}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      className="absolute inset-0 rounded-md bg-zinc-700/80"
                      layoutId="active-tab"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <Icon className="relative" size={17} />
                  <span className="relative hidden sm:inline">{tab.label}</span>
                </Button>
              );
            })}
          </nav>

          <div className="flex items-center justify-between gap-3 border-l-0 border-zinc-800 sm:border-l sm:pl-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-zinc-100">{user.name}</p>
                {isDemoMode && <Badge variant="warning">Demo local</Badge>}
              </div>
              <p className="truncate text-xs text-zinc-400">{user.email}</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button aria-label="Sair" size="icon" title="Sair" type="button" variant="ghost" onClick={onLogout}>
                <LogOut size={17} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={<LoadingLabel />}>
        <Outlet />
      </Suspense>
    </main>
  );
}

function FullPageLoading() {
  return (
    <main className="grid min-h-screen place-items-center">
      <LoadingLabel />
    </main>
  );
}

export default App;
