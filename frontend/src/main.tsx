import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { applyTheme, getStoredTheme } from "./lib/theme";
import "./styles.css";

applyTheme(getStoredTheme());

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<main className="grid min-h-screen place-items-center p-6 text-center text-zinc-100">Algo deu errado. Atualize a página para tentar novamente.</main>}>
      <App />
    </Sentry.ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{ className: "nexaflow-toast", duration: 3200 }}
    />
  </React.StrictMode>,
);
