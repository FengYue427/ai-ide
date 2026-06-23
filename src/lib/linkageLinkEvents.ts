import { emitAideLinkEvent, type AideLinkEvent } from './aideLinkBus'
import type { TranslationKey } from '../i18n'

export function emitLinkageGraphChanged(payload: {
  tasksPath?: string | null
  nodes: number
  edges: number
  openTasks: number
  source?: 'goal-drive' | 'workspace' | 'autopilot'
}): void {
  emitAideLinkEvent('linkage-graph-changed', payload)
}

export function emitLinkageAutopilot(payload: {
  action: 'start' | 'stop' | 'pause'
  channel: 'loop' | 'background' | 'goal-drive'
  tasksPath?: string | null
  mode?: string
  because?: string[]
}): void {
  emitAideLinkEvent('linkage-autopilot', payload)
}

const CHANNEL_LABEL_KEY: Record<string, TranslationKey> = {
  loop: 'linkage.autonomy.channel.loop',
  background: 'linkage.autonomy.channel.background',
  'goal-drive': 'linkage.autonomy.channel.goal',
}

/** Activity Line label for linkage bus events. */
export function linkageAideLinkActivityLabel(
  event: AideLinkEvent,
  t: (key: TranslationKey, params?: Record<string, string>) => string,
): string {
  if (event.type === 'linkage-autopilot') {
    const action = typeof event.payload?.action === 'string' ? event.payload.action : ''
    const channel = typeof event.payload?.channel === 'string' ? event.payload.channel : ''
    const channelLabel = CHANNEL_LABEL_KEY[channel] ? t(CHANNEL_LABEL_KEY[channel]) : channel
    if (action === 'start') {
      return t('activityLine.linkageAutopilotStart', { channel: channelLabel })
    }
    if (action === 'pause') {
      return t('activityLine.linkageAutopilotPause', { channel: channelLabel })
    }
    if (action === 'stop') {
      return t('activityLine.linkageAutopilotStop', { channel: channelLabel })
    }
    return t('activityLine.linkageAutopilotGeneric', { channel: channelLabel })
  }
  if (event.type === 'linkage-graph-changed') {
    return t('activityLine.linkageGraphChanged', {
      nodes: String(event.payload?.nodes ?? '—'),
      open: String(event.payload?.openTasks ?? '—'),
    })
  }
  return ''
}
