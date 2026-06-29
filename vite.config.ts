import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: served under https://<user>.github.io/timing-chart/
// Use '/' for local dev/preview convenience via the BASE_PATH env override.
const base = process.env.BASE_PATH ?? '/timing-chart/'

export default defineConfig({
  base,
  plugins: [react()],
  optimizeDeps: {
    // wavedrom ships CommonJS + skins as plain JS modules
    include: ['wavedrom', 'wavedrom/skins/default.js'],
  },
})
