import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const root = dirname(fileURLToPath(import.meta.url))
const appVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  // Workers must use ES format when the app build uses code-splitting (manualChunks).
  worker: {
    format: 'es',
  },
  build: {
    // electron 模式用独立目录，避免 Windows 上 dist/ 被占用 (EPERM)
    outDir: mode === 'electron' ? 'dist-electron-ui' : 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          editor: ['@monaco-editor/react', 'monaco-editor'],
          utils: ['jszip', 'idb', 'fuse.js']
        }
      }
    },
    chunkSizeWarningLimit: 2000
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
}))
