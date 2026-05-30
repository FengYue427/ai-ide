import type { MonacoMarker } from './monacoSetup'

/** Matches `monaco.MarkerSeverity` without importing monaco in unit tests. */
const MARKER_SEVERITY_ERROR = 8
const MARKER_SEVERITY_WARNING = 4

export type MonacoDiagnosticSummary = {
  errors: number
  warnings: number
  total: number
}

export function summarizeMonacoMarkers(markers: MonacoMarker[]): MonacoDiagnosticSummary {
  let errors = 0
  let warnings = 0
  for (const marker of markers) {
    if (marker.severity === MARKER_SEVERITY_ERROR) errors++
    else if (marker.severity === MARKER_SEVERITY_WARNING) warnings++
  }
  return { errors, warnings, total: errors + warnings }
}
