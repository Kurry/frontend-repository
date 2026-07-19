import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      background: 'var(--color-background)',
      surface: 'var(--color-surface)',
      'text-primary': 'var(--color-text-primary)',
      accent: 'var(--color-accent)',
      border: 'var(--color-border)',
    },
    fontFamily: {
      display: ['Cormorant Upright', 'Georgia', 'serif'],
      body: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
    },
    borderRadius: {
      DEFAULT: '12px',
      'sm': '6px',
      'md': '12px',
      'lg': '16px',
    },
  },
  shortcuts: {
    'btn-primary': 'px-4 py-2 rounded-md bg-accent text-white font-medium cursor-pointer hover:opacity-90 transition-all border-none shadow-none',
    'btn-secondary': 'px-4 py-2 rounded-md bg-white text-text-primary font-medium cursor-pointer hover:bg-gray-50 transition-all border border-border shadow-sm',
    'input-styled': 'px-3 py-2 rounded-md border border-border bg-white text-[var(--color-text-primary)] text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all',
  },
})
