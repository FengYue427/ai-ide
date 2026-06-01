/** v1.2 F4 — plugin publish API feature flags (server-side). */

export function isPluginPublishEnabled(): boolean {
  return process.env.PLUGIN_PUBLISH_ENABLED === 'true'
}

export function getPluginOfficialPublicKey(): string | null {
  const fromEnv = process.env.PLUGIN_OFFICIAL_PUBLIC_KEY?.trim()
  if (fromEnv) return fromEnv
  return null
}

export function isPluginOfficialPublicKeyConfigured(): boolean {
  return Boolean(getPluginOfficialPublicKey())
}
