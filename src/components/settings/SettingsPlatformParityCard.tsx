import { Monitor, Globe } from 'lucide-react'
import { useI18n } from '../../i18n'
import {
  getPlatformSurface,
  PLATFORM_CAPABILITY_MATRIX,
  resolveRuntimeStatusKind,
  type PlatformCapabilityRow,
} from '../../lib/platformParity'
import { SettingsFeatureCardShell } from './SettingsFeatureCardShell'

type SettingsPlatformParityCardProps = {
  webContainerReady: boolean
}

/** Settings → Features — desktop vs browser capability matrix. */
export function SettingsPlatformParityCard({ webContainerReady }: SettingsPlatformParityCardProps) {
  const { t } = useI18n()
  const surface = getPlatformSurface()
  const runtimeKind = resolveRuntimeStatusKind(webContainerReady)

  const runtimeLabel =
    runtimeKind === 'desktopReady'
      ? t('platform.runtime.desktopReady')
      : runtimeKind === 'webReady'
        ? t('platform.runtime.webReady')
        : runtimeKind === 'desktopIdle'
          ? t('platform.runtime.desktopIdle')
          : t('platform.runtime.loading')

  return (
    <SettingsFeatureCardShell
      testId="settings-platform-parity"
      icon={
        surface === 'desktop' ? (
          <Monitor size={16} color="var(--accent-color)" />
        ) : (
          <Globe size={16} color="var(--accent-color)" />
        )
      }
      title={t('platform.parity.title')}
      badge={
        <span className="settings-badge settings-badge--enabled" style={{ marginLeft: 8 }}>
          {surface === 'desktop' ? t('platform.surface.desktop') : t('platform.surface.browser')}
        </span>
      }
      description={t('platform.parity.desc')}
    >
      <li>
        {t('platform.runtime.label')}: {runtimeLabel}
      </li>
      {PLATFORM_CAPABILITY_MATRIX.map((row: PlatformCapabilityRow) => {
        const value = surface === 'desktop' ? row.desktop : row.browser
        const on =
          value === true
            ? t('settings.v12.statusOn')
            : value === 'partial'
              ? t('platform.capability.partial')
              : t('settings.v12.statusOff')
        return (
          <li key={row.id}>
            {t(`platform.capability.${row.id}`)}: {on}
          </li>
        )
      })}
    </SettingsFeatureCardShell>
  )
}
