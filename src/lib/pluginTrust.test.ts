import { createPrivateKey, generateKeyPairSync, sign, verify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildPluginSignaturePayload, verifyPluginSignature } from './pluginTrust'
import { OFFICIAL_PLUGIN_PUBLIC_KEY_B64 } from './pluginTrustOfficialKey'
import sdkV2StatusPlugin from '../../examples/plugins/sdk-v2-status.plugin.json'

function signPayload(manifest: {
  id: string
  version: string
  permissions: string[]
  entry: string
  publisher?: string
}, privateKey: ReturnType<typeof createPrivateKey>) {
  const payload = buildPluginSignaturePayload(manifest)
  const sig = sign(null, Buffer.from(payload, 'utf8'), privateKey)
  return sig.toString('base64')
}

describe('pluginTrust', () => {
  it('builds stable canonical JSON for signing', () => {
    const a = buildPluginSignaturePayload({
      id: 'demo',
      version: '1.0.0',
      permissions: ['ui', 'ai'],
      entry: 'main.js',
      publisher: 'ai-ide',
    })
    const b = buildPluginSignaturePayload({
      id: 'demo',
      version: '1.0.0',
      permissions: ['ai', 'ui'],
      entry: 'main.js',
      publisher: 'ai-ide',
    })
    expect(a).toBe(b)
    expect(a).toContain('"permissions":["ai","ui"]')
  })

  it('verifies Ed25519 signatures via Web Crypto', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    const pj = publicKey.export({ format: 'jwk' })
    const sk = privateKey.export({ format: 'jwk' })
    const pubB64 = Buffer.from(pj.x!, 'base64url').toString('base64')
    const priv = createPrivateKey({
      key: { kty: 'OKP', crv: 'Ed25519', x: pj.x, d: sk.d },
      format: 'jwk',
    })

    const manifest = {
      id: 'signed-demo',
      version: '0.1.0',
      permissions: ['ui'],
      entry: 'index.js',
      publisher: 'test',
      signature: { keyId: 'test', value: '' },
    }
    manifest.signature.value = signPayload(manifest, priv)

    await expect(verifyPluginSignature(manifest, pubB64)).resolves.toBe(true)
    await expect(verifyPluginSignature({ ...manifest, version: '0.2.0' }, pubB64)).resolves.toBe(false)
  })

  it('validates committed sdk-v2-status official signature', async () => {
    const manifest = sdkV2StatusPlugin.manifest
    expect(manifest.signature?.value).toBeTruthy()
    await expect(
      verifyPluginSignature(
        {
          id: manifest.id,
          version: manifest.version,
          permissions: manifest.permissions,
          entry: manifest.entry,
          publisher: manifest.publisher,
          signature: manifest.signature,
        },
        OFFICIAL_PLUGIN_PUBLIC_KEY_B64,
      ),
    ).resolves.toBe(true)
  })

  it('matches node crypto verify for round-trip', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    const manifest = {
      id: 'round-trip',
      version: '1.0.0',
      permissions: ['ui'],
      entry: 'main.js',
    }
    const payload = buildPluginSignaturePayload(manifest)
    const sig = sign(null, Buffer.from(payload, 'utf8'), privateKey)
    const pj = publicKey.export({ format: 'jwk' })
    const raw = Buffer.from(pj.x!, 'base64url')
    expect(verify(null, Buffer.from(payload, 'utf8'), publicKey, sig)).toBe(true)
    expect(raw.length).toBe(32)
  })
})
