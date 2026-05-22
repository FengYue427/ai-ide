import {
  hasAi,
  hasEditorRead,
  hasEditorWrite,
  hasFilesRead,
  hasFilesWrite,
  hasTerminalAny,
  hasUi,
  normalizePluginPermissions,
} from './pluginPermissions'
import { createTranslator, type Language } from '../i18n'
import { getApiLanguage } from '../lib/apiLanguage'
import type { PluginContext } from './pluginTypes'
import { pluginError } from './pluginErrors'
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

function createWorkerScript(locale: Language): string {
  const t = createTranslator(locale)
  const msg = {
    apiTimeoutTpl: t('plugin.sandbox.apiTimeout', { path: '{path}' }),
    apiFailed: t('plugin.sandbox.apiFailed'),
    activateRequired: t('plugin.sandbox.activateRequired'),
  }
  const msgJson = JSON.stringify(msg)
  return `
"use strict";
const buttonHandlers = new Map();
let requestId = "";

const MSGS = ${msgJson};

function post(msg) {
  self.postMessage(msg);
}

function formatTimeout(path) {
  const tpl = MSGS.apiTimeoutTpl;
  return tpl.indexOf("{path}") >= 0 ? tpl.replace("{path}", path) : tpl + path;
}

function apiCall(path, args) {
  const callId = requestId + ":" + Date.now() + ":" + Math.random().toString(36).slice(2);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      self.removeEventListener("message", onResult);
      reject(new Error(formatTimeout(path)));
    }, ${DEFAULT_API_TIMEOUT_MS});

    function onResult(event) {
      const msg = event.data;
      if (!msg || msg.type !== "apiResult" || msg.callId !== callId) return;
      clearTimeout(timer);
      self.removeEventListener("message", onResult);
      if (msg.ok) resolve(msg.result);
      else reject(new Error(msg.error || MSGS.apiFailed));
    }

    self.addEventListener("message", onResult);
    post({ type: "apiCall", callId, path, args });
  });
}

function createContext() {
  return {
    locale: "${locale}",
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
        'if (typeof activate !== "function") { throw new Error(MSGS.activateRequired); }\\n' +
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

function isApiPathAllowed(path: string, permissions: readonly string[]): boolean {
  const perms = new Set(normalizePluginPermissions(permissions))
  const [scope, method] = path.split('.')
  switch (scope) {
    case 'editor':
      if (method === 'getValue' || method === 'getSelectedText') return hasEditorRead(perms)
      if (method === 'setValue' || method === 'insertText') return hasEditorWrite(perms)
      return false
    case 'files':
      if (method === 'getAll' || method === 'getActive' || method === 'open') return hasFilesRead(perms)
      if (method === 'create') return hasFilesWrite(perms)
      return false
    case 'terminal':
      return hasTerminalAny(perms)
    case 'ai':
      return hasAi(perms)
    case 'ui':
      return hasUi(perms)
    default:
      return false
  }
}

function dispatchContextCall(
  context: PluginContext,
  path: string,
  args: unknown[],
  permissions: readonly string[],
): unknown {
  if (!isApiPathAllowed(path, permissions)) {
    throw new Error(pluginError('plugin.sandbox.denied', { path }))
  }
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
      throw new Error(pluginError('plugin.sandbox.unknownApi', { path }))
  }
}

export async function runPluginActivateInSandbox(
  pluginId: string,
  source: string,
  context: PluginContext,
  permissions: readonly string[],
  options?: {
    timeoutMs?: number
    onRegisterButton?: (button: { buttonId: string; icon: string; label: string; onClick: () => void }) => void
  },
): Promise<PluginSandboxHandle> {
  const validationError = validatePluginSource(source)
  if (validationError) throw new Error(validationError)

  if (typeof Worker === 'undefined') {
    throw new Error(pluginError('plugin.sandbox.workerUnsupported'))
  }

  const locale = context.locale ?? getApiLanguage()
  const timeoutMs = options?.timeoutMs ?? DEFAULT_ACTIVATE_TIMEOUT_MS
  const requestId = `${pluginId}-${Date.now()}`
  const blob = new Blob([createWorkerScript(locale)], { type: 'application/javascript' })
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
        reject(new Error(pluginError('plugin.sandbox.activateTimeout', { ms: timeoutMs }, locale)))
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
          reject(new Error(msg.message || pluginError('plugin.sandbox.activateFailed', undefined, locale)))
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
              const result = await dispatchContextCall(context, msg.path, msg.args, permissions)
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
        reject(new Error(event.message || pluginError('plugin.sandbox.workerError', undefined, locale)))
      }

      worker.postMessage({ type: 'activate', requestId, source } satisfies WorkerInbound)
    })

    return { worker, dispose }
  } catch (error) {
    dispose()
    throw error
  }
}
