import { memo, useMemo } from 'react'
import { useI18n } from '../../i18n'
import type { IntentGraph } from '../../services/intentOs/intentGraphService'
import {
  groupIntentGraphNodes,
  intentGraphNodeClassName,
  intentGraphNodeIcon,
} from '../../lib/intentGraphPresentation'

interface ShareIntentGraphProps {
  graph: IntentGraph
  maxNodes?: number
}

export const ShareIntentGraph = memo(function ShareIntentGraph({
  graph,
  maxNodes = 32,
}: ShareIntentGraphProps) {
  const { t } = useI18n()
  const groupedNodes = useMemo(() => {
    let count = 0
    return groupIntentGraphNodes(graph.nodes)
      .map((group) => ({
        ...group,
        nodes: group.nodes.filter(() => {
          if (count >= maxNodes) return false
          count += 1
          return true
        }),
      }))
      .filter((group) => group.nodes.length > 0)
  }, [graph.nodes, maxNodes])

  if (graph.nodes.length === 0) {
    return <p className="share-intent-graph__empty">{t('intent.graph.empty')}</p>
  }

  return (
    <div className="share-intent-graph" data-testid="share-intent-graph">
      <div className="share-intent-graph-panel">
        <div className="intent-graph-panel__groups">
        {groupedNodes.map((group) => {
          return (
            <section
              key={group.key}
              className="intent-graph-panel__group"
              data-testid={`share-intent-graph-group-${group.key}`}
            >
              <div className="intent-graph-panel__group-label">{t(group.labelKey)}</div>
              <div className="intent-graph-panel__nodes">
                {group.nodes.map((node) => {
                  const Icon = intentGraphNodeIcon(node.kind)
                  return (
                    <button
                      key={node.id}
                      type="button"
                      className={intentGraphNodeClassName(node, { graphV2: true })}
                      title={node.path ?? node.label}
                      data-testid={`share-intent-graph-node-${node.kind}`}
                      disabled
                    >
                      <Icon size={14} />
                      <span>{node.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
      {graph.edges.length > 0 ? (
        <div className="intent-graph-panel__edges share-intent-graph__edges" aria-hidden>
          {graph.edges.slice(0, 12).map((edge, index) => (
            <span key={`${edge.from}-${edge.to}-${index}`} className="intent-graph-edge">
              {edge.label ?? '→'}
            </span>
          ))}
        </div>
      ) : null}
      </div>
      {graph.nodes.length > maxNodes ? (
        <p className="share-intent-graph__more">
          {t('shareProgress.graphTruncated', {
            shown: String(maxNodes),
            total: String(graph.nodes.length),
          })}
        </p>
      ) : null}
    </div>
  )
})
