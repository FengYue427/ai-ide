import { Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'
import { getIndexBuildTelemetry } from '../lib/indexBuildTelemetry'
import { PRODUCTION_TAB_DEBOUNCE_MS } from '../lib/inlineCompletionPrefs'
import { TAB_COMPLETION_P95_TARGET_MS } from '../lib/tabCompletionLatencyPercentile'
import { getV14FeatureStatus } from '../lib/v14Features'
import { MCP_OFFICIAL_PRESETS } from '../data/mcpOfficialCatalog'
import { getMaxIndexFiles, MAX_INDEX_FILES_DESKTOP } from '../services/indexLimits'
import { PLUGIN_CATALOG } from '../services/pluginCatalogService'
import { isDesktopApp } from '../services/desktopBridge'

export function SettingsV14FeaturesCard() {
  const { t } = useI18n()
  const status = getV14FeatureStatus()
  const indexTelemetry = getIndexBuildTelemetry()

  return (
    <div className="settings-card settings-card--grid" data-testid="settings-v14-features">
      <div className="settings-privacy-row">
        <Sparkles size={16} color="var(--accent-color)" />
        <strong>{t('settings.v14.title')}</strong>
      </div>
      <p className="settings-privacy-text">{t('settings.v14.desc')}</p>
      <ul
        className="settings-v12-status-list"
        style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', lineHeight: 1.7 }}
      >
        <li>
          {t('settings.v14.tabFimProduction')}:{' '}
          {status.tabFimProduction ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        {status.tabFimProduction ? (
          <>
            <li>{t('settings.v14.p95Target', { ms: TAB_COMPLETION_P95_TARGET_MS })}</li>
            <li>{t('settings.v14.productionDebounce', { ms: PRODUCTION_TAB_DEBOUNCE_MS })}</li>
          </>
        ) : null}
        <li>
          {t('settings.v14.index2kProduction')}:{' '}
          {status.index2kProduction ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        {status.index2kProduction ? (
          <li>
            {t('settings.v14.indexCap', {
              current: getMaxIndexFiles(),
              desktop: MAX_INDEX_FILES_DESKTOP,
            })}
          </li>
        ) : null}
        {indexTelemetry.lastMode ? (
          <li>
            {t('settings.v14.indexLastBuild', {
              mode: indexTelemetry.lastMode,
              ms: indexTelemetry.lastDurationMs ?? '—',
            })}
          </li>
        ) : null}
        <li>
          {t('settings.v14.gitHunkStage')}:{' '}
          {status.gitHunkStage ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v14.desktopShellProduction')}:{' '}
          {status.desktopShellProduction
            ? t('settings.v12.statusOn')
            : isDesktopApp()
              ? t('settings.v12.statusOff')
              : t('settings.v14.desktopOnly')}
        </li>
        <li>
          {t('settings.v14.backgroundAgentProduction')}:{' '}
          {status.backgroundAgentProduction ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        <li>
          {t('settings.v14.mcpPluginProduction')}:{' '}
          {status.mcpPluginProduction ? t('settings.v12.statusOn') : t('settings.v12.statusOff')}
        </li>
        {status.mcpPluginProduction ? (
          <li>
            {t('settings.v14.catalogCounts', {
              mcp: MCP_OFFICIAL_PRESETS.length,
              plugins: PLUGIN_CATALOG.length,
            })}
          </li>
        ) : null}
      </ul>
    </div>
  )
}
