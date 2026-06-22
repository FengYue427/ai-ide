import type { LastGroundingBlock } from '../../store/ideStore'
import type { TranslateFn } from '../../i18n'

const V2_PREFIX = /^Grounding v2: missing symbols \((\d+)\)/

export function isGroundingV2Block(reason: string): boolean {
  return V2_PREFIX.test(reason.trim())
}

export function formatGroundingBlockReason(block: LastGroundingBlock, t: TranslateFn): string {
  const match = block.reason.trim().match(V2_PREFIX)
  if (match) {
    return t('intent.grounding.v2.detail', { count: Number(match[1] ?? 0) })
  }
  if (block.reason.includes('referenced path not in workspace')) {
    const pathMatch = block.reason.match(/referenced path not in workspace: (.+)$/)
    if (pathMatch?.[1]) {
      return t('intent.grounding.missingPath', { path: pathMatch[1] })
    }
  }
  return block.reason
}
