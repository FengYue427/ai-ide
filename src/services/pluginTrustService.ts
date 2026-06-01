import type { TranslationKey } from '../i18n'
import { isPluginTrustMarketEnabled } from '../lib/v12Features'
import type { PluginTrustTier } from '../lib/pluginTrust'
import { verifyPluginSignature } from '../lib/pluginTrust'
import { getOfficialPluginPublicKey, OFFICIAL_PLUGIN_KEY_ID } from '../lib/pluginTrustOfficialKey'
import { workspaceError } from './workspaceErrors'
import type { PluginCatalogEntry } from './pluginCatalogService'
import type { PluginManifest } from './pluginTypes'

export type PluginInstallTrustAssessment =
  | { allowed: true }
  | { allowed: false; error: string; requiresCommunityConfirm?: boolean }

function manifestForSignature(manifest: PluginManifest) {
  return {
    id: manifest.id,
    version: manifest.version,
    permissions: manifest.permissions,
    entry: manifest.entry,
    publisher: manifest.publisher,
    signature: manifest.signature,
  }
}

export async function assessPluginCatalogInstall(
  entry: Pick<PluginCatalogEntry, 'trustTier' | 'package'>,
  options?: { userConfirmedCommunity?: boolean },
): Promise<PluginInstallTrustAssessment> {
  if (!isPluginTrustMarketEnabled()) {
    return { allowed: true }
  }

  const tier: PluginTrustTier = entry.trustTier ?? 'official'
  const manifest = entry.package.manifest

  if (tier === 'official') {
    return { allowed: true }
  }

  if (tier === 'unsigned') {
    return { allowed: false, error: workspaceError('plugin.trust.unsignedRejected') }
  }

  if (tier === 'community') {
    if (options?.userConfirmedCommunity) return { allowed: true }
    return {
      allowed: false,
      error: workspaceError('plugin.trust.communityConfirmRequired'),
      requiresCommunityConfirm: true,
    }
  }

  if (tier === 'verified') {
    const publicKey = getOfficialPluginPublicKey()
    if (!publicKey) {
      return { allowed: false, error: workspaceError('plugin.trust.noOfficialKey') }
    }
    const sig = manifest.signature
    if (!sig?.value?.trim()) {
      return { allowed: false, error: workspaceError('plugin.trust.signatureMissing') }
    }
    if (sig.keyId && sig.keyId !== OFFICIAL_PLUGIN_KEY_ID) {
      return { allowed: false, error: workspaceError('plugin.trust.keyIdMismatch', { keyId: sig.keyId }) }
    }
    const valid = await verifyPluginSignature(manifestForSignature(manifest), publicKey)
    if (!valid) {
      return { allowed: false, error: workspaceError('plugin.trust.signatureInvalid') }
    }
    return { allowed: true }
  }

  return { allowed: false, error: workspaceError('plugin.trust.unsignedRejected') }
}

export function trustTierLabelKey(tier: PluginTrustTier): TranslationKey {
  switch (tier) {
    case 'official':
      return 'plugin.trust.tier.official'
    case 'verified':
      return 'plugin.trust.tier.verified'
    case 'community':
      return 'plugin.trust.tier.community'
    default:
      return 'plugin.trust.tier.unsigned'
  }
}
