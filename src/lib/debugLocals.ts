import type { DebugCdpClient } from '../services/debugCdpClient'
import type { DebugLocalVariable } from '../types/debugInspect'

const MAX_OBJECT_KEYS = 12

type CdpRemoteObject = {
  type?: string
  subtype?: string
  value?: unknown
  description?: string
  objectId?: string
  className?: string
}

type CdpPropertyDescriptor = {
  name: string
  value?: CdpRemoteObject
}

export function formatRemoteObjectPreview(object: CdpRemoteObject | undefined): string {
  if (!object) return 'undefined'
  if (object.value !== undefined) {
    if (typeof object.value === 'string') return JSON.stringify(object.value)
    return String(object.value)
  }
  if (object.description) return object.description
  if (object.type === 'undefined') return 'undefined'
  if (object.type === 'function') return object.className ? `[Function ${object.className}]` : '[Function]'
  if (object.type === 'object' && object.subtype === 'null') return 'null'
  if (object.objectId) return object.className ? `[Object ${object.className}]` : '[Object]'
  return object.type ?? 'unknown'
}

export async function fetchDebugLocals(
  client: DebugCdpClient,
  scopeObjectId: string,
): Promise<DebugLocalVariable[]> {
  const response = await client.send<{ result?: CdpPropertyDescriptor[] }>('Runtime.getProperties', {
    objectId: scopeObjectId,
    ownProperties: true,
  })

  const descriptors = Array.isArray(response.result) ? response.result : []
  const locals: DebugLocalVariable[] = []

  for (const descriptor of descriptors.slice(0, 40)) {
    const value = descriptor.value
    let preview = formatRemoteObjectPreview(value)

    if (value?.type === 'object' && value.objectId && value.subtype !== 'null') {
      preview = await formatObjectPreviewOneLevel(client, value.objectId)
    }

    locals.push({
      name: descriptor.name,
      valuePreview: preview,
      type: value?.type ?? 'unknown',
    })
  }

  return locals
}

async function formatObjectPreviewOneLevel(client: DebugCdpClient, objectId: string): Promise<string> {
  try {
    const response = await client.send<{ result?: CdpPropertyDescriptor[] }>('Runtime.getProperties', {
      objectId,
      ownProperties: true,
    })
    const props = Array.isArray(response.result) ? response.result : []
    const pairs = props.slice(0, MAX_OBJECT_KEYS).map((entry) => {
      return `${entry.name}: ${formatRemoteObjectPreview(entry.value)}`
    })
    const suffix = props.length > MAX_OBJECT_KEYS ? ', …' : ''
    return `{ ${pairs.join(', ')}${suffix} }`
  } catch {
    return '{…}'
  }
}
