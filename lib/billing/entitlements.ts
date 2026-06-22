/**
 * Single source of truth for plan entitlements (Phase S1).
 * Server gates read this; client mirrors via subscriptionService + getEntitlements().
 */
import { effectivePlanName } from './publicWelfare'

export type PlanName = 'free' | 'pro' | 'enterprise'

export type EntitlementFeature =
  | 'allModelTiers'
  | 'autopilotUnlimited'
  | 'intentFullLinkage'
  | 'proofHtmlExport'
  | 'weeklyRecapExport'
  | 'intentShareImport'
  | 'collabHost'
  | 'shareProgressComments'
  | 'shareProgressWatch'
  | 'fullSessionResume'
  | 'fullLinkageCommands'

export interface PlanEntitlements {
  planName: PlanName
  aiRequestsPerDay: number
  workspaces: number
  storageGB: number
  backgroundJobsPerDay: number
  backgroundJobsMaxActive: number
  backgroundJobsBatchMax: number
  autopilotRunsPerDay: number
  maxShares: number
  shareTtlDays: number
  collabMaxParticipants: number
  features: Record<EntitlementFeature, boolean>
}

const FREE_ENTITLEMENTS: PlanEntitlements = {
  planName: 'free',
  aiRequestsPerDay: 200,
  workspaces: 3,
  storageGB: 5,
  backgroundJobsPerDay: 2,
  backgroundJobsMaxActive: 1,
  backgroundJobsBatchMax: 0,
  autopilotRunsPerDay: 3,
  maxShares: 5,
  shareTtlDays: 7,
  collabMaxParticipants: 0,
  features: {
    allModelTiers: false,
    autopilotUnlimited: false,
    intentFullLinkage: false,
    proofHtmlExport: false,
    weeklyRecapExport: false,
    intentShareImport: false,
    collabHost: false,
    shareProgressComments: false,
    shareProgressWatch: false,
    fullSessionResume: false,
    fullLinkageCommands: false,
  },
}

const PRO_ENTITLEMENTS: PlanEntitlements = {
  planName: 'pro',
  aiRequestsPerDay: 2000,
  workspaces: 20,
  storageGB: 30,
  backgroundJobsPerDay: 100,
  backgroundJobsMaxActive: 5,
  backgroundJobsBatchMax: 5,
  autopilotRunsPerDay: -1,
  maxShares: 30,
  shareTtlDays: 90,
  collabMaxParticipants: 4,
  features: {
    allModelTiers: true,
    autopilotUnlimited: true,
    intentFullLinkage: true,
    proofHtmlExport: true,
    weeklyRecapExport: true,
    intentShareImport: true,
    collabHost: true,
    shareProgressComments: true,
    shareProgressWatch: false,
    fullSessionResume: true,
    fullLinkageCommands: true,
  },
}

const ENTERPRISE_ENTITLEMENTS: PlanEntitlements = {
  planName: 'enterprise',
  aiRequestsPerDay: -1,
  workspaces: -1,
  storageGB: 100,
  backgroundJobsPerDay: 300,
  backgroundJobsMaxActive: 10,
  backgroundJobsBatchMax: 20,
  autopilotRunsPerDay: -1,
  maxShares: 100,
  shareTtlDays: 365,
  collabMaxParticipants: 10,
  features: {
    allModelTiers: true,
    autopilotUnlimited: true,
    intentFullLinkage: true,
    proofHtmlExport: true,
    weeklyRecapExport: true,
    intentShareImport: true,
    collabHost: true,
    shareProgressComments: true,
    shareProgressWatch: true,
    fullSessionResume: true,
    fullLinkageCommands: true,
  },
}

const ENTITLEMENTS_BY_PLAN: Record<PlanName, PlanEntitlements> = {
  free: FREE_ENTITLEMENTS,
  pro: PRO_ENTITLEMENTS,
  enterprise: ENTERPRISE_ENTITLEMENTS,
}

const FEATURE_MINIMUM_PLAN: Record<EntitlementFeature, 'pro' | 'enterprise'> = {
  allModelTiers: 'pro',
  autopilotUnlimited: 'pro',
  intentFullLinkage: 'pro',
  proofHtmlExport: 'pro',
  weeklyRecapExport: 'pro',
  intentShareImport: 'pro',
  collabHost: 'pro',
  shareProgressComments: 'pro',
  shareProgressWatch: 'enterprise',
  fullSessionResume: 'pro',
  fullLinkageCommands: 'pro',
}

export function normalizePlanName(planName: string): PlanName {
  const normalized = planName.trim().toLowerCase()
  if (normalized === 'pro' || normalized === 'enterprise') return normalized
  return 'free'
}

export function getEntitlements(planName: string): PlanEntitlements {
  return ENTITLEMENTS_BY_PLAN[normalizePlanName(planName)]
}

export function getEffectiveEntitlements(actualPlanName: string): PlanEntitlements {
  return getEntitlements(effectivePlanName(actualPlanName))
}

export function isEntitlementEnabled(planName: string, feature: EntitlementFeature): boolean {
  return getEffectiveEntitlements(planName).features[feature]
}

export function getShareTtlMs(planName: string): number {
  const days = getEffectiveEntitlements(planName).shareTtlDays
  return days * 24 * 60 * 60 * 1000
}

export function getMaxSharesForPlan(planName: string): number {
  return getEffectiveEntitlements(planName).maxShares
}

export function getWorkspaceEntitlementLimit(planName: string): number {
  return getEffectiveEntitlements(planName).workspaces
}

export function getStorageEntitlementLimitGb(planName: string): number {
  return getEffectiveEntitlements(planName).storageGB
}

export function getBackgroundJobLimits(planName: string): {
  dailyLimit: number
  maxActive: number
  batchMax: number
} {
  const e = getEffectiveEntitlements(planName)
  return {
    dailyLimit: e.backgroundJobsPerDay,
    maxActive: e.backgroundJobsMaxActive,
    batchMax: e.backgroundJobsBatchMax,
  }
}

export function assertEntitlementFeature(
  planName: string,
  feature: EntitlementFeature,
): { ok: true } | { ok: false; requiredPlan: 'pro' | 'enterprise'; feature: EntitlementFeature } {
  if (isEntitlementEnabled(planName, feature)) return { ok: true }
  return { ok: false, requiredPlan: FEATURE_MINIMUM_PLAN[feature], feature }
}

export type EntitlementHighlightId =
  | 'aiQuota'
  | 'workspaces'
  | 'storage'
  | 'autopilot'
  | 'backgroundJobs'
  | 'intentLinkage'
  | 'proofExport'
  | 'shares'
  | 'collab'

export const ENTITLEMENT_HIGHLIGHT_IDS: readonly EntitlementHighlightId[] = [
  'aiQuota',
  'workspaces',
  'storage',
  'autopilot',
  'backgroundJobs',
  'intentLinkage',
  'proofExport',
  'shares',
  'collab',
] as const

/** Marketing bullets synced with BILLING_PLANS.features (zh). */
export function getPlanMarketingFeatures(planName: string): string[] {
  const e = getEntitlements(planName)
  if (e.planName === 'free') {
    return [
      '平台 AI · 经济模型（Flash / Lite）',
      '3 个云工作区 · 5 条 Share（7 天）',
      'Plan / Spec / Git 基础闭环',
      '每日 200 加权 AI 配额',
      '后台 Agent 2 次/日',
      'Autopilot 3 次/日 · 证明包 Markdown',
    ]
  }
  if (e.planName === 'pro') {
    return [
      '全档平台 AI + 2000 配额/日',
      'Autopilot 不限 · Intent 全联动',
      '证明包 MD+HTML · 周回顾导出',
      '20 工作区 · Share 90 天',
      '后台 Agent 100 次/日 · 并发 5',
      '协作主持 · intent-share 导入',
    ]
  }
  return [
    'AI 配额不限',
    '专业版全部闭环能力',
    '100 条 Share · 365 天有效',
    '后台 Agent 300 次/日 · 批量 20',
    '协作房间最多 10 人',
    'Share 进度关注 · 本地更新提醒',
    '100GB 云存储 · 优先支持',
  ]
}

export function getPlanLimitsFromEntitlements(planName: string): {
  aiRequestsPerDay: number
  workspaces: number
  storageGB: number
} {
  const e = getEntitlements(planName)
  return {
    aiRequestsPerDay: e.aiRequestsPerDay,
    workspaces: e.workspaces,
    storageGB: e.storageGB,
  }
}
