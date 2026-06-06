import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          dates: ["date-fns", "react-day-picker"],
          feedback: ["react-hot-toast"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          motion: ["framer-motion"],
          navigation: ["react-router-dom"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
