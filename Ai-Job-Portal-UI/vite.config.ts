import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * `@animateicons/react` declares `sideEffects: false`, but ships all 509 icons
 * in a single module as bare `forwardRef(...)` calls, each followed by an
 * `Icon.displayName = "..."` write. Rollup must assume an un-annotated call
 * could do something, and a property write counts as a side effect, so one
 * imported icon keeps the whole set alive — roughly 900 kB for the 19 this app
 * actually uses.
 *
 * Marking the factory calls pure and dropping the displayName writes is what
 * lets the package's own `sideEffects: false` pay off. displayName only ever
 * feeds React DevTools, so losing it costs nothing at runtime.
 *
 * Scoped to that package by module id — nothing else in the graph is touched.
 */
function pureAnimateIcons(): Plugin {
  const PURE = /(?<!\/\* @__PURE__ \*\/ )forwardRef\(/g
  // The value must be a bare identifier — anything looser matches inside SVG
  // path data ("M20 13c0 5-3.5...") and corrupts the module. No `\b` either:
  // minified names can start with `$`, and a word boundary would skip it and
  // leave a dangling `$` behind.
  const DISPLAY_NAME = /[\w$]+\.displayName="[A-Za-z_$][\w$]*";/g

  return {
    name: 'pure-animateicons',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@animateicons') || !/\.(js|mjs)$/.test(id)) return null
      if (!code.includes('forwardRef(')) return null
      return {
        code: code.replace(PURE, '/* @__PURE__ */ forwardRef(').replace(DISPLAY_NAME, ''),
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [pureAnimateIcons(), react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      // an unused icon's `displayName` write would otherwise pin it in place
      treeshake: { preset: 'recommended', propertyWriteSideEffects: false },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('@radix-ui') || id.includes('cmdk')) return 'vendor-ui'
          if (id.includes('lucide-react')) return 'vendor-icons'
          // jsPDF is only reached through a dynamic import on the profile
          // page; its own tree (canvg, html2canvas, core-js) rides with it so
          // the eager vendor bundle never pays for a download nobody clicked
          if (/[\\/](jspdf|canvg|html2canvas|dompurify|core-js|rgbcolor|stackblur-canvas|raf|performance-now|atob|btoa|fflate|fast-png)[\\/]/.test(id)) {
            return 'vendor-pdf'
          }
          return 'vendor'
        },
      },
    },
  },
})
