/**
 * Read-only share progress view model (Intent snapshot + proof HTML + recap).
 */
import type { FileItem } from '../types/file'
import {
  buildIntentShareSnapshot,
  formatIntentShareSummary,
  type IntentShareSnapshot,
} from '../services/intentOs/intentShareSnapshotService'
import { PROOF_REPORT_PREFIX } from '../services/intentOs/proofOfDoneReportService'
import { buildWeeklyRecap, type WeeklyRecap } from './weeklyRecapService'

export interface ShareProgressViewModel {
  intentSnapshot: IntentShareSnapshot | null
  intentSummary: string
  proofHtmlFiles: FileItem[]
  weeklyRecap: WeeklyRecap
}

export function buildShareProgressViewModel(files: FileItem[]): ShareProgressViewModel {
  const snapshot = buildIntentShareSnapshot(files)
  const hasSpecs = snapshot.specs.length > 0
  return {
    intentSnapshot: hasSpecs ? snapshot : null,
    intentSummary: hasSpecs ? formatIntentShareSummary(snapshot) : '',
    proofHtmlFiles: files.filter(
      (f) => f.name.startsWith(PROOF_REPORT_PREFIX) && f.name.endsWith('.html'),
    ),
    weeklyRecap: buildWeeklyRecap(files),
  }
}
