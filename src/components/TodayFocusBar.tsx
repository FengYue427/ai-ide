import { memo, useMemo, useState } from 'react'

import { FileCheck2, Play, Share2, Sparkles } from 'lucide-react'

import { useI18n } from '../i18n'

import {

  dismissSessionResumeBar,

  isSessionResumeStale,

  type SessionResumeSnapshot,

} from '../lib/sessionResume'

import { getSessionResumeMaxAgeMs } from '../lib/clientPlanEntitlements'

import { buildSpecAcceptanceLinkage } from '../lib/specAcceptanceLinkage'

import { canUseEntitlement } from '../lib/planFeatureGate'

import {
  clearCapstoneFunnel,
  readCapstoneFunnel,
  resolveCapstoneFunnelStep,
} from '../lib/capstoneFunnel'

import { trackCapstoneFunnelStep } from '../lib/conversionTracking'

import { useIDEStore } from '../store/ideStore'

import { CapstoneFunnelHint } from './CapstoneFunnelHint'

import { UpgradeEntitlementHint } from './UpgradeEntitlementHint'

import type { WorkspaceMode } from '../lib/workspaceMode'



const MODE_LABEL_KEYS: Record<

  WorkspaceMode,

  'workspaceMode.code' | 'workspaceMode.plan' | 'workspaceMode.execute' | 'workspaceMode.review'

> = {

  code: 'workspaceMode.code',

  plan: 'workspaceMode.plan',

  execute: 'workspaceMode.execute',

  review: 'workspaceMode.review',

}



interface TodayFocusBarProps {

  workspaceMode: WorkspaceMode

  specSlug: string | null

  openTaskCount: number

  sessionSnapshot: SessionResumeSnapshot | null

  showResume: boolean

  suggestedMode: WorkspaceMode | null

  onContinueSession?: () => void

  onDismissResume?: () => void

  onApplySuggestedMode?: (mode: WorkspaceMode) => void

  onSaveProof?: () => void

  onOpenShare?: () => void

  onCapstoneOpenTasks?: (specSlug: string) => void

  onCapstoneRunNext?: () => void

  onCapstoneOpenAcceptance?: (specSlug: string) => void

}



export const TodayFocusBar = memo(function TodayFocusBar({

  workspaceMode,

  specSlug,

  openTaskCount,

  sessionSnapshot,

  showResume,

  suggestedMode,

  onContinueSession,

  onDismissResume,

  onApplySuggestedMode,

  onSaveProof,

  onOpenShare,

  onCapstoneOpenTasks,

  onCapstoneRunNext,

  onCapstoneOpenAcceptance,

}: TodayFocusBarProps) {

  const { t } = useI18n()

  const currentPlan = useIDEStore((s) => s.currentPlan)

  const currentUser = useIDEStore((s) => s.currentUser)

  const files = useIDEStore((s) => s.files)

  const setShowSubscriptionModal = useIDEStore((s) => s.setShowSubscriptionModal)

  const proofLinkage = useMemo(() => buildSpecAcceptanceLinkage(files), [files])

  const proofHtml = canUseEntitlement('proofHtmlExport')

  const proofReady = proofLinkage.readyForProof

  const [capstoneRev, setCapstoneRev] = useState(0)

  const capstoneFunnel = useMemo(() => {
    void capstoneRev
    return readCapstoneFunnel()
  }, [capstoneRev, files])

  const capstoneStep = useMemo(
    () => resolveCapstoneFunnelStep(capstoneFunnel, proofLinkage, specSlug),
    [capstoneFunnel, proofLinkage, specSlug],
  )



  const resumeReady = useMemo(

    () =>

      showResume &&

      sessionSnapshot &&

      !isSessionResumeStale(sessionSnapshot, getSessionResumeMaxAgeMs(currentPlan ?? 'free')),

    [currentPlan, sessionSnapshot, showResume],

  )



  const parts = [

    t('todayFocus.mode', { mode: t(MODE_LABEL_KEYS[workspaceMode]) }),

    (proofReady ? proofLinkage.activeSpecSlug : specSlug)

      ? t('todayFocus.spec', {

          slug: (proofReady ? proofLinkage.activeSpecSlug : specSlug) ?? 'spec',

        })

      : null,

    openTaskCount > 0 && !proofReady ? t('todayFocus.openTasks', { count: openTaskCount }) : null,

    proofReady

      ? t('todayFocus.proofReadyHint', { slug: proofLinkage.activeSpecSlug ?? 'spec' })

      : null,

  ].filter(Boolean)



  return (

    <div

      className={`today-focus-bar${proofReady ? ' today-focus-bar--proof-ready' : ''}`}

      data-testid={proofReady ? 'spec-proof-linkage-banner' : 'today-focus-bar'}

    >

      <div className="today-focus-bar__main">

        <span className="today-focus-bar__title">{t('todayFocus.title')}</span>

        <span className="today-focus-bar__detail">{parts.join(' · ')}</span>

      </div>



      {!proofReady && capstoneStep && capstoneFunnel ? (
        <CapstoneFunnelHint
          step={capstoneStep}
          specSlug={capstoneFunnel.specSlug}
          onPrimaryAction={() => {
            trackCapstoneFunnelStep(capstoneStep, { specSlug: capstoneFunnel.specSlug })
            if (capstoneStep === 'run-tasks') {
              onCapstoneRunNext?.()
              return
            }
            if (capstoneStep === 'check-acceptance') {
              onCapstoneOpenAcceptance?.(capstoneFunnel.specSlug)
              return
            }
            onCapstoneOpenTasks?.(capstoneFunnel.specSlug)
          }}
          onDismiss={() => {
            clearCapstoneFunnel()
            setCapstoneRev((value) => value + 1)
          }}
        />
      ) : null}



      {proofReady && onSaveProof ? (

        <button

          type="button"

          className="btn btn-primary today-focus-bar__proof"

          data-testid="today-focus-save-proof"

          onClick={onSaveProof}

        >

          <FileCheck2 size={14} />

          {t('intent.shell.saveProof')}

        </button>

      ) : null}



      {proofReady && onOpenShare ? (

        <button

          type="button"

          className="btn btn-secondary today-focus-bar__share"

          data-testid="today-focus-share-progress"

          onClick={onOpenShare}

        >

          <Share2 size={14} />

          {t('linkage.shareProgress')}

        </button>

      ) : null}



      {proofReady && !proofHtml ? (

        <UpgradeEntitlementHint

          messageKey="entitlements.upgrade.proofHtml"

          onUpgrade={currentUser ? () => setShowSubscriptionModal(true) : undefined}

          compact

        />

      ) : null}



      {!proofReady && suggestedMode && suggestedMode !== workspaceMode && onApplySuggestedMode ? (

        <button

          type="button"

          className="btn btn-secondary today-focus-bar__suggest"

          data-testid="today-focus-mode-suggest"

          onClick={() => onApplySuggestedMode(suggestedMode)}

        >

          <Sparkles size={14} />

          {t('todayFocus.applyMode', { mode: t(MODE_LABEL_KEYS[suggestedMode]) })}

        </button>

      ) : null}



      {!proofReady && resumeReady && onContinueSession ? (

        <button type="button" className="btn btn-primary today-focus-bar__continue" onClick={onContinueSession}>

          <Play size={14} />

          {t('sessionResume.continue')}

        </button>

      ) : null}



      {!proofReady && resumeReady && onDismissResume ? (

        <button

          type="button"

          className="panel-close-btn today-focus-bar__dismiss"

          aria-label={t('common.close')}

          onClick={() => {

            dismissSessionResumeBar()

            onDismissResume()

          }}

        >

          ×

        </button>

      ) : null}

    </div>

  )

})


