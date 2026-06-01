import type { PluginManifest, PluginManifestSignature } from '../services/pluginTypes'

export type PluginTrustTier = 'official' | 'verified' | 'community' | 'unsigned'

export type { PluginManifestSignature }

export type PluginSignaturePayload = Pick<PluginManifest, 'id' | 'version' | 'permissions' | 'entry'> & {
  publisher?: string
}

/** Canonical JSON for Ed25519 signing (stable key order). */
export function buildPluginSignaturePayload(manifest: PluginSignaturePayload): string {
  const payload = {
    id: manifest.id,
    version: manifest.version,
    permissions: [...manifest.permissions].sort(),
    entry: manifest.entry,
    ...(manifest.publisher ? { publisher: manifest.publisher } : {}),
  }
  return JSON.stringify(payload)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

export async function verifyPluginSignature(
  manifest: PluginSignaturePayload & { signature?: PluginManifestSignature },
  publicKeyBase64: string,
): Promise<boolean> {
  const signature = manifest.signature
  if (!signature?.value?.trim()) return false

  const subtle = globalThis.crypto?.subtle
  if (!subtle) return false

  try {
    const keyBytes = new Uint8Array(base64ToBytes(publicKeyBase64))
    const publicKey = await subtle.importKey(
      'raw',
      keyBytes,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify'],
    )
    const data = new TextEncoder().encode(buildPluginSignaturePayload(manifest))
    const sigBytes = new Uint8Array(base64ToBytes(signature.value))
    return subtle.verify({ name: 'Ed25519' }, publicKey, sigBytes, data)
  } catch {
    return false
  }
}

export function inferTrustTierFromManifest(
  manifest: PluginSignaturePayload & { signature?: PluginManifestSignature },
  catalogTier?: PluginTrustTier,
): PluginTrustTier {
  if (catalogTier) return catalogTier
  if (manifest.signature?.value) return 'verified'
  return 'unsigned'
}

export { bytesToBase64, base64ToBytes }
