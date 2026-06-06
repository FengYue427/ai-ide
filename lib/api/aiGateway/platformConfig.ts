/** @deprecated Import from platformCatalog — kept for backward-compatible imports. */
export type {
  PlatformAiRoute,
  PlatformProviderId,
  ResolvePlatformAiResult,
} from './platformCatalog'

export {
  isPlatformProviderConfigured,
  listConfiguredPlatformProviders,
  parsePlatformProviderId,
  resolvePlatformCatalogRoute,
} from './platformCatalog'

import {
  listConfiguredPlatformProviders,
  resolvePlatformCatalogRoute,
  type ResolvePlatformAiResult,
} from './platformCatalog'

/** Server-side platform LLM route (keys never sent to browser). */
export function resolvePlatformAiRoute(requested?: {
  provider?: string
  model?: string
}): ResolvePlatformAiResult {
  return resolvePlatformCatalogRoute(requested)
}

export function isPlatformAiConfigured(): boolean {
  return listConfiguredPlatformProviders().length > 0
}
