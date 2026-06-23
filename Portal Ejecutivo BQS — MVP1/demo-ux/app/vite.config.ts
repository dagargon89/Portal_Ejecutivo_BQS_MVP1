import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Vite 6 + React 19 + Tailwind 4 (plugin CSS-first, sin postcss.config).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Alias "@" -> ./src, espejo de `paths` en tsconfig (lo usa el bundler).
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173, open: true },
  preview: { port: 4173 },
});
