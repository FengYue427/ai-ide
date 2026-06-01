/**
 * Ed25519 public key for AI IDE official plugin signatures (keyId: official-2026).
 * Private key: maintain locally — run `node scripts/sign-plugin-manifest.mjs`.
 */
export const OFFICIAL_PLUGIN_KEY_ID = 'official-2026'

/** Base64 raw 32-byte Ed25519 public key (committed; pair generated at v1.2 F3). */
export const OFFICIAL_PLUGIN_PUBLIC_KEY_B64 =
  '0b/3O2Xi1DnGOcc907JnK3OCxfpzRjk7WYP24XOggKI='

export function getOfficialPluginPublicKey(): string | null {
  const fromEnv = import.meta.env.VITE_PLUGIN_OFFICIAL_PUBLIC_KEY?.trim()
  if (fromEnv) return fromEnv
  return OFFICIAL_PLUGIN_PUBLIC_KEY_B64 || null
}
