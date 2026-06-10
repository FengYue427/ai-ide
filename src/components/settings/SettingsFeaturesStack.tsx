import type { PlatformAiHealthState } from '../../hooks/usePlatformAiHealth'
import { SettingsV13FeaturesCard } from '../SettingsV13FeaturesCard'
import { SettingsV14FeaturesCard } from '../SettingsV14FeaturesCard'
import { SettingsV15FeaturesCard } from '../SettingsV15FeaturesCard'
import { SettingsV16FeaturesCard } from '../SettingsV16FeaturesCard'
import { SettingsBackgroundAgentCard } from '../SettingsBackgroundAgentCard'
import { SettingsAideRuntimeStubCard } from '../SettingsAideRuntimeStubCard'
import { SettingsTabCompletionCard } from '../SettingsTabCompletionCard'
import { SettingsPluginOpsCard } from '../SettingsPluginOpsCard'

type SettingsFeaturesStackProps = {
  platformAiHealth: PlatformAiHealthState
}

/** Features tab — version status cards and ops surfaces (keeps legacy data-testid per card). */
export function SettingsFeaturesStack({ platformAiHealth }: SettingsFeaturesStackProps) {
  return (
    <>
      <SettingsV13FeaturesCard />
      <SettingsV14FeaturesCard />
      <SettingsV16FeaturesCard />
      <SettingsV15FeaturesCard />
      <SettingsTabCompletionCard />
      <SettingsAideRuntimeStubCard />
      <SettingsBackgroundAgentCard />
      <SettingsPluginOpsCard
        plugins={
          platformAiHealth.status === 'ready'
            ? platformAiHealth.plugins
            : platformAiHealth.status === 'unreachable'
              ? platformAiHealth.plugins
              : { publishEnabled: false, officialKeyConfigured: false }
        }
        healthStatus={
          platformAiHealth.status === 'loading'
            ? 'loading'
            : platformAiHealth.status === 'unreachable'
              ? 'unreachable'
              : 'ready'
        }
        showReviews
      />
    </>
  )
}
