import type { Config } from 'tailwindcss'

// Theme tokens taken verbatim from
// 01-vision/08_identidad_visual_design_system.md §7.
// Canonical brand hex values are immutable; soft/hover/strong are derived.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B4F9E',
          hover: '#08407F',
          soft: '#EAF2FB',
          contrast: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#0E9F6E',
          strong: '#0A7D57',
          soft: '#E6F6EF',
        },
        success: { DEFAULT: '#0E9F6E', soft: '#E6F6EF' },
        warning: { DEFAULT: '#B45309', strong: '#92400E', soft: '#FBF1E5' },
        danger: { DEFAULT: '#B91C1C', soft: '#FBE9E9' },
        info: { DEFAULT: '#0B4F9E', soft: '#EAF2FB' },
        // Neutrals: native Tailwind slate scale (slate-50..900),
        // aligned with the base tokens (bg #F8FAFC = slate-50, etc.).
      },
      fontFamily: {
        // Self-hosted/system stack only — no CDN fonts (production CSP is
        // default-src 'self'). Inter is listed first in case it is ever
        // self-hosted; the system stack is the working fallback today.
        sans: ['"Inter"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        '4xl': ['2.25rem', { lineHeight: '1.1', fontWeight: '700' }],
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        md: '0 4px 6px -1px rgb(15 23 42 / 0.08)',
        lg: '0 10px 15px -3px rgb(15 23 42 / 0.10)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '240ms',
      },
    },
  },
  plugins: [],
} satisfies Config
