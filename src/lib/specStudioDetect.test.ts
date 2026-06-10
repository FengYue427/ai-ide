import { describe, expect, it } from 'vitest'
import { detectRecommendedSpecTemplate, isJavaWorkspace, isPythonWorkspace } from './specStudioDetect'

describe('specStudioDetect', () => {
  it('detects Gradle Kotlin DSL', () => {
    expect(isJavaWorkspace(['build.gradle.kts'])).toBe(true)
    expect(detectRecommendedSpecTemplate(['settings.gradle.kts', 'build.gradle.kts'])).toBe('java-service')
  })

  it('detects Python from pyproject.toml', () => {
    expect(isPythonWorkspace(['pyproject.toml'])).toBe(true)
    expect(detectRecommendedSpecTemplate(['pyproject.toml', 'src/main.py'])).toBe('python-service')
  })

  it('prefers Java over Python when both markers exist', () => {
    expect(detectRecommendedSpecTemplate(['pom.xml', 'pyproject.toml'])).toBe('java-service')
  })
})
