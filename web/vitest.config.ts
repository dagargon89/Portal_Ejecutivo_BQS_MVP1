import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Config dedicada de pruebas (no interfiere con el build de Vite). Las pruebas
// de UI corren en jsdom; nunca golpean el backend real (mock del módulo lib).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
