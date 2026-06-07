/** v1.6 — GA feature flags. See docs/V1.6_ENV.md */

import { getV15FeatureStatus, type V15FeatureStatus } from './v15Features'

export const V16_GA_VERSION = '1.6.0'

export function isV16ProductionBuild(): boolean {
  return Boolean(import.meta.env.PROD) && import.meta.env.MODE !== 'test'
}

export type V16FeatureStatus = V15FeatureStatus & {
  v16GaBuild: boolean
}

export function getV16FeatureStatus(): V16FeatureStatus {
  return {
    ...getV15FeatureStatus(),
    v16GaBuild: isV16ProductionBuild(),
  }
}
