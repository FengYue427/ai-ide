/**
 * Platform AI gateway — chat stream + agent completions (v1.5 F0).
 */
import { forwardPlatformAgent, forwardPlatformChat } from '../../aiGateway/forwardPlatformChat'
import { resolvePlatformAiRoute } from '../../aiGateway/platformConfig'
import { getModelWeight, isPlatformModelAllowedForPlan } from '../../../billing/modelWeights'
import { AI_USAGE_PLATFORM_TYPE, consumeAiUsage, resolveUserPlanName } from '../../../billing/usageDb'
import { jsonResponse } from '../../http'
import { localizedErrorResponse } from '../../localizedError'
import { resolveRateLimitOptions } from '../../rateLimit'
import { checkRateLimitDistributed } from '../../rateLimitKv'
import { rateLimitErrorResponse } from '../../rateLimitResponse'
import { requireAuth } from '../../requireAuth'
import { trackServerEvent } from '../../logger'
import type { ChatMessage } from '../../aiGateway/forwardOpenAiChat'

type ChatBody = {
  provider?: string
  model?: string
  messages?: unknown[]
  stream?: boolean
  tools?: unknown[]
}

function isBasicChatMessage(message: unknown): message is ChatMessage {
  if (!message || typeof message !== 'object') return false
  const row = message as ChatMessage
  return (
    typeof row.role === 'string' &&
    typeof row.content === 'string' &&
    ['system', 'user', 'assistant'].includes(row.role)
  )
}

function hasValidMessages(messages: unknown[]): boolean {
  if (messages.length === 0) return false
  return messages.every((message) => {
    if (!message || typeof message !== 'object') return false
    const row = message as { role?: string }
    if (!row.role) return false
    if (isBasicChatMessage(message)) return true
    return ['assistant', 'tool'].includes(row.role)
  })
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req)
    if (!auth.ok) return auth.response

    const rate = await checkRateLimitDistributed(req, {
      ...resolveRateLimitOptions('ai:chat'),
      suffix: auth.user.id,
    })
    if (!rate.allowed) return rateLimitErrorResponse(req, rate)

    const routeResult = resolvePlatformAiRoute()
    if (!routeResult.ok) {
      return jsonResponse({ error: routeResult.reason, errorKey: 'api.ai.platformUnavailable' }, 503)
    }

    const body = (await req.json().catch(() => ({}))) as ChatBody
    const messages = Array.isArray(body.messages) ? body.messages : []
    if (!hasValidMessages(messages)) {
      return localizedErrorResponse(req, 'api.ai.messagesRequired', 400)
    }

    const resolved = resolvePlatformAiRoute({
      provider: body.provider,
      model: body.model,
    })
    if (!resolved.ok) {
      return jsonResponse({ error: resolved.reason }, 503)
    }

    const plan = await resolveUserPlanName(auth.user.id)
    if (!isPlatformModelAllowedForPlan(resolved.route.provider, resolved.route.model, plan)) {
      return jsonResponse(
        {
          errorKey: 'api.usage.modelTierRestricted',
          plan,
          model: resolved.route.model,
          provider: resolved.route.provider,
        },
        403,
      )
    }

    const weight = getModelWeight(resolved.route.provider, resolved.route.model)
    const usage = await consumeAiUsage(auth.user.id, weight, {
      usageType: AI_USAGE_PLATFORM_TYPE,
    })
    if (!usage.ok) {
      trackServerEvent(req, 'ai.chat.quota_exceeded', {
        userId: auth.user.id,
        plan: usage.quota.plan,
        weight,
      })
      return jsonResponse(
        {
          errorKey: 'api.usage.quotaExceeded',
          source: 'server',
          quota: usage.quota,
          weight,
        },
        429,
      )
    }

    const tools = Array.isArray(body.tools) ? body.tools : []
    if (tools.length > 0) {
      return forwardPlatformAgent(resolved.route, { messages, tools })
    }

    const chatMessages = messages.filter(isBasicChatMessage)
    return forwardPlatformChat(resolved.route, chatMessages, { stream: body.stream !== false })
  } catch (error) {
    console.error('[AI Chat] error:', error)
    return localizedErrorResponse(req, 'api.ai.chatFailed', 500)
  }
}
