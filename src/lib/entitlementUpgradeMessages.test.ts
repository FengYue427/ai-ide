import { describe, expect, it } from 'vitest'
import {
  ENTITLEMENT_UPGRADE_MESSAGE_KEYS,
  ENTITLEMENT_UPGRADE_SOURCES,
  getEntitlementUpgradeMessageKey,
  getEntitlementUpgradeSource,
} from './entitlementUpgradeMessages'

describe('entitlementUpgradeMessages', () => {
  it('maps every upgrade context to message key and source', () => {
    for (const context of Object.keys(ENTITLEMENT_UPGRADE_MESSAGE_KEYS) as Array<
      keyof typeof ENTITLEMENT_UPGRADE_MESSAGE_KEYS
    >) {
      expect(getEntitlementUpgradeMessageKey(context)).toBe(ENTITLEMENT_UPGRADE_MESSAGE_KEYS[context])
      expect(getEntitlementUpgradeSource(context)).toBe(ENTITLEMENT_UPGRADE_SOURCES[context])
    }
  })

  it('routes batch queue to plan-batch source', () => {
    expect(getEntitlementUpgradeSource('planBatch')).toBe('plan-batch')
    expect(getEntitlementUpgradeMessageKey('planBatch')).toBe('entitlements.upgrade.planBatch')
  })
})
