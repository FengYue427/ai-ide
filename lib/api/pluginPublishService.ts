import { createHash, randomBytes } from 'node:crypto'
import type { ApiMessageKey } from '../i18n/apiMessages'
import { enqueuePluginPublishReview, type PluginPublishReviewRecord } from './pluginPublishQueue'

const MAX_SOURCE_BYTES = 32 * 1024
const MAX_MANIFEST_ID_LEN = 64
const PLUGIN_ID_RE = /^[a-z][a-z0-9-]*$/

export type PluginPublishPackage = {
  manifest: {
    id: string
    name: string
    version: string
    description?: string
    entry: string
    permissions: string[]
    publisher?: string
    signature?: { keyId?: string; value?: string }
  }
  source: string
}

export type PluginPublishValidation =
  | { ok: true; pkg: PluginPublishPackage }
  | { ok: false; errorKey: ApiMessageKey; params?: Record<string, string | number> }

export function validatePluginPublishBody(body: unknown): PluginPublishValidation {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKey: 'api.plugin.publishInvalidPackage' }
  }

  const record = body as Record<string, unknown>
  const pkg = record.package
  if (!pkg || typeof pkg !== 'object') {
    return { ok: false, errorKey: 'api.plugin.publishInvalidPackage' }
  }

  const packageRecord = pkg as Record<string, unknown>
  const manifest = packageRecord.manifest
  const source = packageRecord.source

  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, errorKey: 'api.plugin.publishInvalidPackage' }
  }
  if (typeof source !== 'string' || !source.trim()) {
    return { ok: false, errorKey: 'api.plugin.publishSourceRequired' }
  }

  const sourceBytes = Buffer.byteLength(source, 'utf8')
  if (sourceBytes > MAX_SOURCE_BYTES) {
    return { ok: false, errorKey: 'api.plugin.publishSourceTooLarge', params: { maxKb: 32 } }
  }

  const m = manifest as Record<string, unknown>
  const id = typeof m.id === 'string' ? m.id.trim() : ''
  const name = typeof m.name === 'string' ? m.name.trim() : ''
  const version = typeof m.version === 'string' ? m.version.trim() : ''
  const entry = typeof m.entry === 'string' ? m.entry.trim() : ''

  if (!id || id.length > MAX_MANIFEST_ID_LEN || !PLUGIN_ID_RE.test(id)) {
    return { ok: false, errorKey: 'api.plugin.publishInvalidId' }
  }
  if (!name) {
    return { ok: false, errorKey: 'api.plugin.publishNameRequired' }
  }
  if (!version) {
    return { ok: false, errorKey: 'api.plugin.publishVersionRequired' }
  }
  if (!entry) {
    return { ok: false, errorKey: 'api.plugin.publishEntryRequired' }
  }
  if (!Array.isArray(m.permissions) || m.permissions.length === 0) {
    return { ok: false, errorKey: 'api.plugin.publishPermissionsRequired' }
  }
  if (!m.permissions.every((p) => typeof p === 'string' && p.trim())) {
    return { ok: false, errorKey: 'api.plugin.publishPermissionsInvalid' }
  }

  const publisher =
    typeof m.publisher === 'string' && m.publisher.trim() ? m.publisher.trim() : undefined
  const signature =
    m.signature && typeof m.signature === 'object'
      ? {
          keyId:
            typeof (m.signature as Record<string, unknown>).keyId === 'string'
              ? String((m.signature as Record<string, unknown>).keyId)
              : undefined,
          value:
            typeof (m.signature as Record<string, unknown>).value === 'string'
              ? String((m.signature as Record<string, unknown>).value)
              : undefined,
        }
      : undefined

  const normalized: PluginPublishPackage = {
    manifest: {
      id,
      name,
      version,
      description: typeof m.description === 'string' ? m.description : undefined,
      entry,
      permissions: m.permissions.map((p) => String(p).trim()),
      publisher,
      signature: signature?.value ? { keyId: signature.keyId ?? '', value: signature.value } : undefined,
    },
    source,
  }

  return { ok: true, pkg: normalized }
}

export function createPluginPublishReview(pkg: PluginPublishPackage, submitterUserId: string) {
  const reviewId = `rev_${randomBytes(8).toString('hex')}`
  const manifestHash = createHash('sha256')
    .update(
      JSON.stringify({
        id: pkg.manifest.id,
        version: pkg.manifest.version,
        permissions: [...pkg.manifest.permissions].sort(),
        entry: pkg.manifest.entry,
      }),
    )
    .digest('hex')
    .slice(0, 16)

  const record: PluginPublishReviewRecord = {
    reviewId,
    status: 'pending',
    pluginId: pkg.manifest.id,
    version: pkg.manifest.version,
    manifestHash,
    submitterUserId,
    submittedAt: new Date().toISOString(),
  }

  enqueuePluginPublishReview(record)

  console.info('[PluginPublish] queued for manual review', {
    reviewId,
    pluginId: pkg.manifest.id,
    version: pkg.manifest.version,
    submitterUserId,
    manifestHash,
    hasSignature: Boolean(pkg.manifest.signature?.value),
  })

  return {
    reviewId: record.reviewId,
    status: record.status,
    pluginId: record.pluginId,
    version: record.version,
    manifestHash: record.manifestHash,
    submittedAt: record.submittedAt,
  }
}
