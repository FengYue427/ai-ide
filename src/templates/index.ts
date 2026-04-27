export interface Template {
  id: string
  name: string
  description: string
  icon: string
  files: Record<string, string>
  dependencies?: Record<string, string>
}

export const templates: Template[] = [
  {
    id: 'vanilla',
    name: 'Vanilla JS',
    description: '纯 JavaScript 项目，从零开始',
    icon: '📦',
    files: {
      'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vanilla JS App</title>
</head>
<body>
  <h1>Hello Vanilla JS!</h1>
  <script src="index.js"></script>
</body>
</html>`,
      'index.js': `console.log('Hello from Vanilla JS!');

// 你的代码在这里
document.querySelector('h1').style.color = '#58a6ff';`
    }
  },
  {
    id: 'react',
    name: 'React',
    description: 'React 18 + Vite 现代开发环境',
    icon: '⚛️',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`,
      'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.jsx': `import React, { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Click me
      </button>
    </div>
  )
}

export default App`,
      'package.json': JSON.stringify({
        name: 'react-app',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          vite: '^5.0.0',
          '@vitejs/plugin-react': '^4.2.0'
        }
      }, null, 2)
    },
    dependencies: { npm: 'install' }
  },
  {
    id: 'vue',
    name: 'Vue',
    description: 'Vue 3 组合式 API 项目',
    icon: '🟢',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vue App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`,
      'src/main.js': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
      'src/App.vue': `<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div style="padding: 20px; font-family: sans-serif;">
    <h1>Hello Vue!</h1>
    <p>Count: {{ count }}</p>
    <button @click="count++">Click me</button>
  </div>
</template>`,
      'package.json': JSON.stringify({
        name: 'vue-app',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          vue: '^3.3.0'
        },
        devDependencies: {
          vite: '^5.0.0',
          '@vitejs/plugin-vue': '^4.5.0'
        }
      }, null, 2)
    },
    dependencies: { npm: 'install' }
  },
  {
    id: 'node',
    name: 'Node.js',
    description: 'Node.js 后端项目',
    icon: '🟩',
    files: {
      'index.js': `// Node.js 后端示例
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Hello from Node.js!',
    url: req.url,
    time: new Date().toISOString()
  }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT + '/');
});`,
      'package.json': JSON.stringify({
        name: 'node-app',
        version: '1.0.0',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'node index.js'
        }
      }, null, 2)
    }
  }
]

export function applyTemplate(template: Template): { name: string; content: string; language: string }[] {
  return Object.entries(template.files).map(([path, content]) => {
    const ext = path.split('.').pop() || ''
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      vue: 'html',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown'
    }
    return {
      name: path,
      content,
      language: langMap[ext] || 'plaintext'
    }
  })
}
