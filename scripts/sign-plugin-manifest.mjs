#!/usr/bin/env node
/**
 * Sign a plugin package manifest (Ed25519, canonical JSON payload).
 * Private key: PLUGIN_SIGN_PRIVATE_KEY_JWK_D env, or scripts/.plugin-signing-key.json (gitignored).
 *
 * Usage:
 *   node scripts/sign-plugin-manifest.mjs examples/plugins/sdk-v2-status.plugin.json
 *   node scripts/sign-plugin-manifest.mjs --generate-key scripts/.plugin-signing-key.json
 */
import { createPrivateKey, generateKeyPairSync, sign } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KEY_ID = 'official-2026'

function buildPluginSignaturePayload(manifest) {
  const payload = {
    id: manifest.id,
    version: manifest.version,
    permissions: [...manifest.permissions].sort(),
    entry: manifest.entry,
    ...(manifest.publisher ? { publisher: manifest.publisher } : {}),
  }
  return JSON.stringify(payload)
}

function rawPublicKeyB64(publicKey) {
  const jwk = publicKey.export({ format: 'jwk' })
  return Buffer.from(jwk.x, 'base64url').toString('base64')
}

function loadPrivateKey() {
  const envD = process.env.PLUGIN_SIGN_PRIVATE_KEY_JWK_D?.trim()
  const keyPath = resolve(__dirname, '.plugin-signing-key.json')
  if (envD) {
    const keyFile = existsSync(keyPath) ? JSON.parse(readFileSync(keyPath, 'utf8')) : {}
    const x = keyFile.publicKeyJwkX
    if (!x) throw new Error('Set publicKeyJwkX in .plugin-signing-key.json when using env private key only')
    return createPrivateKey({ key: { kty: 'OKP', crv: 'Ed25519', x, d: envD }, format: 'jwk' })
  }
  if (!existsSync(keyPath)) {
    throw new Error(`Missing ${keyPath}. Run: node scripts/sign-plugin-manifest.mjs --generate-key`)
  }
  const stored = JSON.parse(readFileSync(keyPath, 'utf8'))
  return createPrivateKey({
    key: { kty: 'OKP', crv: 'Ed25519', x: stored.publicKeyJwkX, d: stored.privateKeyJwkD },
    format: 'jwk',
  })
}

function generateKey(outPath) {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519')
  const pj = publicKey.export({ format: 'jwk' })
  const sk = privateKey.export({ format: 'jwk' })
  const record = {
    keyId: KEY_ID,
    publicKeyB64: Buffer.from(pj.x, 'base64url').toString('base64'),
    publicKeyJwkX: pj.x,
    privateKeyJwkD: sk.d,
  }
  writeFileSync(outPath, `${JSON.stringify(record, null, 2)}\n`)
  console.log('Wrote', outPath)
  console.log('OFFICIAL_PLUGIN_PUBLIC_KEY_B64=', record.publicKeyB64)
  console.log('Update src/lib/pluginTrustOfficialKey.ts with the value above.')
}

function signPackageFile(packagePath) {
  const abs = resolve(process.cwd(), packagePath)
  const pkg = JSON.parse(readFileSync(abs, 'utf8'))
  const manifest = pkg.manifest
  if (!manifest?.id || !manifest.version || !manifest.entry || !Array.isArray(manifest.permissions)) {
    throw new Error('Invalid package: manifest.id, version, entry, permissions required')
  }
  manifest.publisher = manifest.publisher ?? 'ai-ide'
  const payload = buildPluginSignaturePayload(manifest)
  const privateKey = loadPrivateKey()
  const sig = sign(null, Buffer.from(payload, 'utf8'), privateKey)
  manifest.signature = { keyId: KEY_ID, value: sig.toString('base64') }
  writeFileSync(abs, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log('Signed', manifest.id, manifest.version, '→', abs)
}

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: node scripts/sign-plugin-manifest.mjs <package.json> | --generate-key [path]')
  process.exit(1)
}
if (arg === '--generate-key') {
  const out = process.argv[3] ?? resolve(__dirname, '.plugin-signing-key.json')
  generateKey(resolve(out))
} else {
  signPackageFile(arg)
}
