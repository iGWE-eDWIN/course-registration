import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe6fe', 200: '#bfd3fe', 300: '#93b4fd', 400: '#6090fa',
          500: '#3b6cf6', 600: '#2550eb', 700: '#1d3fd8', 800: '#1e35af', 900: '#1e318a', 950: '#121d4f',
        },
      },
      boxShadow: { card: '0 1px 2px rgb(16 24 40 / 0.05), 0 1px 3px rgb(16 24 40 / 0.06)' },
    },
  },
  plugins: [],
};

export default config;
