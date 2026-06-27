import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const root = dirname(fileURLToPath(import.meta.url))
const appVersion = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string

function icpVerifyInjectPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'icp-verify-inject',
    transformIndexHtml(html) {
      const code = env.VITE_ICP_VERIFY_CODE?.trim()
      if (!code) return html
      const meta = `<meta name="ICP-verify-code" content="${code}" />`
      return html.replace('</head>', `    ${meta}\n  </head>`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')
  return {
  plugins: [react(), icpVerifyInjectPlugin(env)],
  base: './',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    ...(mode === 'electron'
      ? { 'import.meta.env.VITE_DESKTOP_SHELL': JSON.stringify('true') }
      : {}),
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
}})
