import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const vendorChunks: Array<[string, string[]]> = [
  ["charts", ["recharts", "d3-"]],
  ["dates", ["date-fns", "react-day-picker"]],
  ["feedback", ["react-hot-toast", "goober"]],
  ["forms", ["react-hook-form", "@hookform", "zod"]],
  ["motion", ["framer-motion"]],
  ["navigation", ["react-router"]],
  ["react", ["react", "scheduler"]],
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          for (const [chunk, packages] of vendorChunks) {
            if (packages.some((name) => id.includes(`node_modules/${name}`))) {
              return chunk;
            }
          }
          return undefined;
        },
      },
    },
  },
});
