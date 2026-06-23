import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite 6 + React 19 + Tailwind 4 (plugin CSS-first, sin postcss.config).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
  preview: { port: 4173 },
});
