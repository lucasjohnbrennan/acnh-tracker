import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repo at /acnh-tracker/, not /. Only applies to
  // the production build — the dev server still runs at the root.
  base: command === 'build' ? '/acnh-tracker/' : '/',
  plugins: [vue(), tailwindcss()],
}))
