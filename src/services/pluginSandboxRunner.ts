import type { PluginContext } from './pluginTypes'
import { validatePluginSource } from './pluginSandbox'

const DEFAULT_ACTIVATE_TIMEOUT_MS = 5_000
const DEFAULT_API_TIMEOUT_MS = 30_000

export interface PluginSandboxHandle {
  worker: Worker
  dispose: () => void
}

type WorkerOutbound =
  | { type: 'activated'; requestId: string }
  | { type: 'error'; requestId: string; message: string }
  | { type: 'registerButton'; requestId: string; buttonId: string; icon: string; label: string }
  | { type: 'apiCall'; callId: string; path: string; args: unknown[] }

type WorkerInbound =
  | { type: 'activate'; requestId: string; source: string }
  | { type: 'buttonClick'; buttonId: string }
  | { type: 'apiResult'; callId: string; ok: boolean; result?: unknown; error?: string }

function createWorkerScript(): string {
  return `
"use strict";
const buttonHandlers = new Map();
let requestId = "";

function post(msg) {
  self.postMessage(msg);
}

function apiCall(path, args) {
  const callId = requestId + ":" + Date.now() + ":" + Math.random().toString(36).slice(2);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      self.removeEventListener("message", onResult);
      reject(new Error("插件 API 调用超时: " + path));
    }, ${DEFAULT_API_TIMEOUT_MS});

    function onResult(event) {
      const msg = event.data;
      if (!msg || msg.type !== "apiResult" || msg.callId !== callId) return;
      clearTimeout(timer);
      self.removeEventListener("message", onResult);
      if (msg.ok) resolve(msg.result);
      else reject(new Error(msg.error || "插件 API 调用失败"));
    }

    self.addEventListener("message", onResult);
    post({ type: "apiCall", callId, path, args });
  });
}

function createContext() {
  return {
    editor: {
      getValue: () => apiCall("editor.getValue", []),
      setValue: (value) => apiCall("editor.setValue", [value]),
      getSelectedText: () => apiCall("editor.getSelectedText", []),
      insertText: (text, position) => apiCall("editor.insertText", [text, position]),
    },
    files: {
      getAll: () => apiCall("files.getAll", []),
      getActive: () => apiCall("files.getActive", []),
      create: (name, content) => apiCall("files.create", [name, content]),
      open: (name) => apiCall("files.open", [name]),
    },
    terminal: {
      execute: (command) => apiCall("terminal.execute", [command]),
      getHistory: () => apiCall("terminal.getHistory", []),
    },
    ai: {
      complete: (prompt) => apiCall("ai.complete", [prompt]),
    },
    ui: {
      showNotification: (message, type) => {
        post({ type: "apiCall", callId: requestId + ":notify:" + Date.now(), path: "ui.showNotification", args: [message, type] });
      },
      showModal: (title, content) => {
        post({ type: "apiCall", callId: requestId + ":modal:" + Date.now(), path: "ui.showModal", args: [title, content] });
      },
      addToolbarButton: (config) => {
        const buttonId = requestId + ":btn:" + Date.now() + ":" + Math.random().toString(36).slice(2);
        if (typeof config?.onClick === "function") {
          buttonHandlers.set(buttonId, config.onClick);
        }
        post({
          type: "registerButton",
          requestId,
          buttonId,
          icon: String(config?.icon || "puzzle"),
          label: String(config?.label || "Plugin"),
        });
      },
    },
  };
}

self.onmessage = async (event) => {
  const msg = event.data;
  if (!msg || typeof msg.type !== "string") return;

  if (msg.type === "activate") {
    requestId = msg.requestId;
    try {
      const context = createContext();
      const runner = new Function(
        "context",
        '"use strict";\\n' + msg.source + '\\n' +
        'if (typeof activate !== "function") { throw new Error("插件须定义 activate(context) 函数"); }\\n' +
        'return activate(context);'
      );
      const outcome = runner(context);
      if (outcome && typeof outcome.then === "function") {
        await outcome;
      }
      post({ type: "activated", requestId: msg.requestId });
    } catch (error) {
      post({
        type: "error",
        requestId: msg.requestId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (msg.type === "buttonClick") {
    const handler = buttonHandlers.get(msg.buttonId);
    if (handler) {
      try {
        const result = handler();
        if (result && typeof result.then === "function") {
          await result;
        }
      } catch (error) {
        post({
          type: "error",
          requestId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
};
`
}

function dispatchContextCall(context: PluginContext, path: string, args: unknown[]): unknown {
  const [scope, method] = path.split('.')
  switch (scope) {
    case 'editor': {
      const api = context.editor as Record<string, (...a: unknown[]) => unknown>
      return api[method]?.(...args)
    }
    case 'files': {
      const api = context.files as Record<string, (...a: unknown[]) => unknown>
      return api[method]?.(...args)
    }
    case 'terminal': {
      const api = context.terminal as Record<string, (...a: unknown[]) => unknown>
      return api[method]?.(...args)
    }
    case 'ai': {
      const api = context.ai as Record<string, (...a: unknown[]) => unknown>
      return api[method]?.(...args)
    }
    case 'ui': {
      const api = context.ui as Record<string, (...a: unknown[]) => unknown>
      return api[method]?.(...args)
    }
    default:
      throw new Error(`未知插件 API: ${path}`)
  }
}

export async function runPluginActivateInSandbox(
  pluginId: string,
  source: string,
  context: PluginContext,
  _permissions: readonly string[],
  options?: {
    timeoutMs?: number
    onRegisterButton?: (button: { buttonId: string; icon: string; label: string; onClick: () => void }) => void
  },
): Promise<PluginSandboxHandle> {
  const validationError = validatePluginSource(source)
  if (validationError) throw new Error(validationError)

  if (typeof Worker === 'undefined') {
    throw new Error('当前环境不支持 Web Worker 插件沙箱')
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_ACTIVATE_TIMEOUT_MS
  const requestId = `${pluginId}-${Date.now()}`
  const blob = new Blob([createWorkerScript()], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  const worker = new Worker(workerUrl)

  const dispose = () => {
    worker.terminate()
    URL.revokeObjectURL(workerUrl)
  }

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const timer = window.setTimeout(() => {
        if (settled) return
        settled = true
        dispose()
        reject(new Error(`插件激活超时（${timeoutMs}ms）`))
      }, timeoutMs)

      worker.onmessage = (event: MessageEvent<WorkerOutbound>) => {
        const msg = event.data
        if (!msg) return

        if (msg.type === 'activated' && msg.requestId === requestId) {
          if (settled) return
          settled = true
          window.clearTimeout(timer)
          resolve()
          return
        }

        if (msg.type === 'error' && msg.requestId === requestId) {
          if (settled) return
          settled = true
          window.clearTimeout(timer)
          reject(new Error(msg.message || '插件激活失败'))
          return
        }

        if (msg.type === 'registerButton' && msg.requestId === requestId) {
          options?.onRegisterButton?.({
            buttonId: msg.buttonId,
            icon: msg.icon,
            label: msg.label,
            onClick: () => {
              worker.postMessage({ type: 'buttonClick', buttonId: msg.buttonId } satisfies WorkerInbound)
            },
          })
          return
        }

        if (msg.type === 'apiCall') {
          void (async () => {
            try {
              const result = await dispatchContextCall(context, msg.path, msg.args)
              worker.postMessage({
                type: 'apiResult',
                callId: msg.callId,
                ok: true,
                result,
              } satisfies WorkerInbound)
            } catch (error) {
              worker.postMessage({
                type: 'apiResult',
                callId: msg.callId,
                ok: false,
                error: error instanceof Error ? error.message : String(error),
              } satisfies WorkerInbound)
            }
          })()
        }
      }

      worker.onerror = (event) => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        reject(new Error(event.message || '插件 Worker 运行错误'))
      }

      worker.postMessage({ type: 'activate', requestId, source } satisfies WorkerInbound)
    })

    return { worker, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
