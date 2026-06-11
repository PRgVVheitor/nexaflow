import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { applyTheme, getStoredTheme } from "./lib/theme";
import "./styles.css";

applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{ className: "nexaflow-toast", duration: 3200 }}
    />
  </React.StrictMode>,
);
