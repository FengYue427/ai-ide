import { memo, useMemo } from 'react'
import { useI18n } from '../i18n'
import { buildIntentGraph, mergeIntentGraphWithReplay, type IntentGraphNode } from '../services/intentOs/intentGraphService'
import { readPlanSpecLinks } from '../services/planSpecLinkService'
import { isIntentLinkageLocked, isPlanGatedTierCEnabled } from '../lib/planFeatureGate'
import { isTierCEnabled } from '../lib/intentOsTierC'
import {
  groupIntentGraphNodes,
  intentGraphNodeClassName,
  intentGraphNodeIcon,
} from '../lib/intentGraphPresentation'
import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'
import { IntentLinkageSummary } from './IntentLinkageSummary'
import { useIDEStore } from '../store/ideStore'
import type { LinkageOverlayNavigateTarget } from '../lib/linkageOverlayNavigation'

interface IntentGraphPanelProps {
  focusTasksPath?: string | null
  highlightTaskText?: string | null
  onOpenPath?: (path: string) => void
  variant?: 'settings' | 'shell'
  linkageOpenTaskCount?: number
  linkageGitModifiedCount?: number
  linkageQueueBusy?: boolean
  linkageQuotaBlocked?: boolean
  onLinkageNavigate?: (target: LinkageOverlayNavigateTarget) => void
}

function renderGraphNode(
  node: IntentGraphNode,
  opts: {
    graphV2: boolean
    highlightTaskText?: string | null
    onOpenPath?: (path: string) => void
    previewLocked?: boolean
  },
) {
  const Icon = intentGraphNodeIcon(node.kind)
  const className = intentGraphNodeClassName(node, opts)
  const disabled = !node.path || !opts.onOpenPath || opts.previewLocked
  return (
    <button
      key={node.id}
      type="button"
      className={className}
      data-testid={
        opts.graphV2 &&
        node.kind === 'spec-task' &&
        opts.highlightTaskText &&
        className.includes('intent-graph-node--next')
          ? 'intent-graph-node-next'
          : undefined
      }
      onClick={() => node.path && opts.onOpenPath?.(node.path)}
      disabled={disabled}
      title={node.path}
    >
      <Icon size={14} />
      <span>{node.label}</span>
    </button>
  )
}

export const IntentGraphPanel = memo(function IntentGraphPanel({
  focusTasksPath,
  highlightTaskText,
  onOpenPath,
  variant = 'settings',
  linkageOpenTaskCount = 0,
  linkageGitModifiedCount = 0,
  linkageQueueBusy = false,
  linkageQuotaBlocked = false,
  onLinkageNavigate,
}: IntentGraphPanelProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)
  const replayOverlay = useIDEStore((s) => s.intentReplayGraphOverlay)
  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)
  const currentUser = useIDEStore((s) => s.currentUser)
  const links = useMemo(() => readPlanSpecLinks(files), [files])
  const graph = useMemo(() => {
    const live = buildIntentGraph({ files, links, focusTasksPath })
    return mergeIntentGraphWithReplay(live, replayOverlay)
  }, [files, focusTasksPath, links, replayOverlay])
  const hasReplayOverlay = Boolean(replayOverlay && replayOverlay.nodes.length > 0)
  const shell = variant === 'shell'
  const linkageLocked = isIntentLinkageLocked()
  const graphV2Visual = isTierCEnabled('intentGraphV2')
  const graphV2Interactive = isPlanGatedTierCEnabled('intentGraphV2')
  const groupedNodes = useMemo(() => groupIntentGraphNodes(graph.nodes), [graph.nodes])
  const nodeRenderOpts = {
    graphV2: graphV2Visual,
    highlightTaskText,
    onOpenPath: graphV2Interactive ? onOpenPath : undefined,
    previewLocked: linkageLocked,
  }

  if (graph.nodes.length === 0) {
    return (
      <div className={shell ? 'intent-graph-shell-empty' : 'settings-card'} data-testid="intent-graph-empty">
        {!shell ? <div className="settings-row-title">{t('intent.graph.title')}</div> : null}
        <div className={shell ? 'intent-graph-shell-empty__text' : 'settings-row-desc'}>{t('intent.graph.empty')}</div>
      </div>
    )
  }

  return (
    <div
      className={shell ? 'intent-graph-shell' : 'settings-card intent-graph-panel'}
      data-testid={shell ? 'intent-graph-shell' : 'intent-graph-panel'}
    >
      {!shell ? (
        <>
          <div className="settings-row-title">{t('intent.graph.title')}</div>
          <div className="settings-row-desc">{t('intent.graph.desc')}</div>
        </>
      ) : hasReplayOverlay ? (
        <div className="intent-graph-shell__replay-badge" data-testid="intent-graph-replay-badge">
          {t('intent.replay.overlayBadge')}
        </div>
      ) : null}
      <div className="intent-graph-panel__groups">
        {groupedNodes.map((group) => (
          <section key={group.key} className="intent-graph-panel__group" data-testid={`intent-graph-group-${group.key}`}>
            <div className="intent-graph-panel__group-label">{t(group.labelKey)}</div>
            <div className="intent-graph-panel__nodes">
              {group.nodes.map((node) => renderGraphNode(node, nodeRenderOpts))}
            </div>
          </section>
        ))}
      </div>
      {graph.edges.length > 0 ? (
        <div className="intent-graph-panel__edges" aria-hidden>
          {graph.edges.slice(0, 12).map((edge, index) => (
            <span key={`${edge.from}-${edge.to}-${index}`} className="intent-graph-edge">
              {edge.label ?? '→'}
            </span>
          ))}
        </div>
      ) : null}
      {shell ? (
        <IntentLinkageSummary
          focusTasksPath={focusTasksPath}
          openTaskCount={linkageOpenTaskCount}
          gitModifiedCount={linkageGitModifiedCount}
          queueBusy={linkageQueueBusy}
          quotaBlocked={linkageQuotaBlocked}
          onLinkageNavigate={shell ? onLinkageNavigate : undefined}
        />
      ) : null}
      {shell && linkageLocked ? (
        <UpgradeEntitlementHint
          messageKey="entitlements.upgrade.intentLinkage"
          onUpgrade={currentUser ? () => setShowSubscriptionModal(true) : undefined}
          compact
        />
      ) : null}
    </div>
  )
})
