import { memo, useCallback, useMemo } from 'react'
import type { TranslationKey } from '../i18n'
import { useI18n } from '../i18n'
import { useIDEStore } from '../store/ideStore'
import {
  buildLinkageGraphFromContext,
  collectLinkageAutonomyContext,
  evaluateLinkageAutonomy,
} from '../lib/linkageAutonomyContext'
import {
  isLinkageOverlayNavigable,
  resolveLinkageOverlayNavigate,
  type LinkageOverlayNavigateTarget,
} from '../lib/linkageOverlayNavigation'
import { summarizeIntentLinkageGraph, type LinkageNodeKind } from '../services/intentOs/intentLinkageGraphService'
import { resolveAutonomyModeKey } from '../lib/autonomyStrategyUi'
import { IntentLinkageGraphViz } from './IntentLinkageGraphViz'

interface IntentLinkageSummaryProps {
  focusTasksPath?: string | null
  openTaskCount?: number
  gitModifiedCount?: number
  queueBusy?: boolean
  quotaBlocked?: boolean
  onLinkageNavigate?: (target: LinkageOverlayNavigateTarget) => void
}

const OVERLAY_KIND_KEY: Record<LinkageNodeKind, TranslationKey> = {
  goal: 'linkage.node.goal',
  mode: 'linkage.node.mode',
  git: 'linkage.node.git',
  queue: 'linkage.node.queue',
  'bg-job': 'linkage.node.bgJob',
  autopilot: 'linkage.node.autopilot',
  share: 'linkage.node.share',
}

const EDGE_KIND_KEY: Record<string, TranslationKey> = {
  spawns: 'linkage.edge.spawns',
  maps: 'linkage.edge.maps',
  blocks: 'linkage.edge.blocks',
  enables: 'linkage.edge.enables',
  mirrors: 'linkage.edge.mirrors',
}

export const IntentLinkageSummary = memo(function IntentLinkageSummary({
  focusTasksPath,
  openTaskCount = 0,
  gitModifiedCount = 0,
  queueBusy = false,
  quotaBlocked = false,
  onLinkageNavigate,
}: IntentLinkageSummaryProps) {
  const { t } = useI18n()
  const files = useIDEStore((s) => s.files)

  const summary = useMemo(() => {
    const ctx = collectLinkageAutonomyContext({
      files,
      tasksPath: focusTasksPath ?? null,
      openTaskCount,
      gitModifiedCount,
      queueBusy,
      quotaBlocked,
    })
    const graph = buildLinkageGraphFromContext(ctx, files)
    const stats = summarizeIntentLinkageGraph(graph)
    const policy = evaluateLinkageAutonomy(ctx)
    return {
      stats,
      policy,
      nextTask: graph.nextTaskText,
      overlayNodes: graph.overlayNodes,
      overlayEdges: graph.overlayEdges,
    }
  }, [files, focusTasksPath, gitModifiedCount, openTaskCount, queueBusy, quotaBlocked])

  const modeKey = resolveAutonomyModeKey(summary.policy.mode)

  const handleNavigate = useCallback(
    (nodeId: string) => {
      if (!onLinkageNavigate) return
      const node = summary.overlayNodes.find((item) => item.id === nodeId)
      if (!node) return
      const target = resolveLinkageOverlayNavigate(node, focusTasksPath ?? null)
      if (target) onLinkageNavigate(target)
    },
    [focusTasksPath, onLinkageNavigate, summary.overlayNodes],
  )

  const handleEdgeClick = useCallback(() => {
    if (!onLinkageNavigate || !focusTasksPath) return
    onLinkageNavigate({ kind: 'tasks', path: focusTasksPath.replace(/\\/g, '/') })
  }, [focusTasksPath, onLinkageNavigate])

  return (
    <div className="intent-linkage-summary" data-testid="intent-linkage-summary">
      <div className="intent-linkage-summary__title">{t('linkage.summary.title')}</div>
      <div className="intent-linkage-summary__stats">
        {t('linkage.summary.stats', {
          nodes: String(summary.stats.baseNodes + summary.stats.overlayNodes),
          edges: String(summary.stats.baseEdges + summary.stats.overlayEdges),
          open: String(summary.stats.openTasks),
        })}
      </div>
      <div className="intent-linkage-summary__policy">
        {t('linkage.summary.policy', { mode: t(modeKey) })}
        {summary.nextTask ? (
          <span className="intent-linkage-summary__next" title={summary.nextTask}>
            {' · '}
            {t('linkage.summary.next', { task: summary.nextTask.slice(0, 40) })}
          </span>
        ) : null}
      </div>
      {summary.overlayNodes.length > 0 ? (
        <IntentLinkageGraphViz
          nodes={summary.overlayNodes}
          edges={summary.overlayEdges}
          focusTasksPath={focusTasksPath}
          onNavigate={onLinkageNavigate}
        />
      ) : null}
      {summary.overlayNodes.length > 0 ? (
        <div className="intent-linkage-summary__overlay" data-testid="intent-linkage-overlay">
          <span className="intent-linkage-summary__overlay-label">{t('linkage.summary.overlay')}</span>
          <div className="intent-linkage-summary__chips">
            {summary.overlayNodes.slice(0, 10).map((node) => {
              const navigable = Boolean(onLinkageNavigate) && isLinkageOverlayNavigable(node, focusTasksPath ?? null)
              const className = `intent-linkage-chip intent-linkage-chip--${node.kind} intent-linkage-chip--${node.status ?? 'idle'}${navigable ? ' intent-linkage-chip--clickable' : ''}`
              const label = `${t(OVERLAY_KIND_KEY[node.kind])}: ${node.label.slice(0, 28)}`
              if (navigable) {
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={className}
                    title={node.label}
                    data-testid={`intent-linkage-chip-${node.id}`}
                    onClick={() => handleNavigate(node.id)}
                  >
                    {label}
                  </button>
                )
              }
              return (
                <span key={node.id} className={className} title={node.label}>
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
      {summary.overlayEdges.length > 0 && onLinkageNavigate && focusTasksPath ? (
        <div className="intent-linkage-summary__edges" data-testid="intent-linkage-edges">
          {summary.overlayEdges.slice(0, 6).map((edge, index) => {
            const kindKey = EDGE_KIND_KEY[edge.kind]
            const edgeLabel = kindKey ? t(kindKey) : edge.kind
            return (
              <button
                key={`${edge.from}-${edge.to}-${index}`}
                type="button"
                className="intent-linkage-edge"
                data-testid={`intent-linkage-edge-${index}`}
                onClick={handleEdgeClick}
                title={focusTasksPath}
              >
                {edgeLabel}
                {edge.label ? ` · ${edge.label}` : ''}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
})
