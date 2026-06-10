import type { Language } from '../i18n'
import { SPECS_ROOT, type SpecTemplateFile } from '../services/specsService'

export type SpecStudioStack = 'node' | 'java' | 'cpp' | 'go' | 'rust' | 'python' | 'git' | 'ai' | 'general'

export type SpecStudioTemplateId =
  | 'blank'
  | 'node-api'
  | 'node-bugfix'
  | 'java-service'
  | 'cpp-module'
  | 'go-service'
  | 'rust-crate'
  | 'python-service'
  | 'git-release'
  | 'ai-agent-task'

export interface SpecStudioTemplateMeta {
  id: SpecStudioTemplateId
  stack: SpecStudioStack
  /** i18n key under specStudio.template.{id}.* */
  titleKey: `specStudio.template.${SpecStudioTemplateId}.title`
  descKey: `specStudio.template.${SpecStudioTemplateId}.desc`
  tags: string[]
}

export const SPEC_STUDIO_TEMPLATES: SpecStudioTemplateMeta[] = [
  {
    id: 'blank',
    stack: 'general',
    titleKey: 'specStudio.template.blank.title',
    descKey: 'specStudio.template.blank.desc',
    tags: ['general'],
  },
  {
    id: 'node-api',
    stack: 'node',
    titleKey: 'specStudio.template.node-api.title',
    descKey: 'specStudio.template.node-api.desc',
    tags: ['node', 'typescript', 'api'],
  },
  {
    id: 'node-bugfix',
    stack: 'node',
    titleKey: 'specStudio.template.node-bugfix.title',
    descKey: 'specStudio.template.node-bugfix.desc',
    tags: ['node', 'debug', 'test'],
  },
  {
    id: 'java-service',
    stack: 'java',
    titleKey: 'specStudio.template.java-service.title',
    descKey: 'specStudio.template.java-service.desc',
    tags: ['java', 'spring', 'maven'],
  },
  {
    id: 'cpp-module',
    stack: 'cpp',
    titleKey: 'specStudio.template.cpp-module.title',
    descKey: 'specStudio.template.cpp-module.desc',
    tags: ['cpp', 'cmake'],
  },
  {
    id: 'go-service',
    stack: 'go',
    titleKey: 'specStudio.template.go-service.title',
    descKey: 'specStudio.template.go-service.desc',
    tags: ['go', 'module'],
  },
  {
    id: 'rust-crate',
    stack: 'rust',
    titleKey: 'specStudio.template.rust-crate.title',
    descKey: 'specStudio.template.rust-crate.desc',
    tags: ['rust', 'cargo'],
  },
  {
    id: 'python-service',
    stack: 'python',
    titleKey: 'specStudio.template.python-service.title',
    descKey: 'specStudio.template.python-service.desc',
    tags: ['python', 'pytest'],
  },
  {
    id: 'git-release',
    stack: 'git',
    titleKey: 'specStudio.template.git-release.title',
    descKey: 'specStudio.template.git-release.desc',
    tags: ['git', 'release'],
  },
  {
    id: 'ai-agent-task',
    stack: 'ai',
    titleKey: 'specStudio.template.ai-agent-task.title',
    descKey: 'specStudio.template.ai-agent-task.desc',
    tags: ['agent', 'multi-file'],
  },
]

function normalizeSpecName(specName: string): string {
  return specName.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').toLowerCase() || 'new-spec'
}

function specBase(specName: string): string {
  return `${SPECS_ROOT}/${normalizeSpecName(specName)}`
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function zhEn(locale: Language, zh: string, en: string): string {
  return locale === 'en-US' ? en : zh
}

export function buildSpecStudioTemplateFiles(
  templateId: SpecStudioTemplateId,
  specName: string,
  locale: Language = 'zh-CN',
): SpecTemplateFile[] {
  const slug = normalizeSpecName(specName)
  const base = specBase(specName)
  const date = today()

  if (templateId === 'blank') {
    return buildBlankSpec(base, slug, date, locale)
  }
  if (templateId === 'node-api') {
    return buildNodeApiSpec(base, slug, date, locale)
  }
  if (templateId === 'node-bugfix') {
    return buildNodeBugfixSpec(base, slug, date, locale)
  }
  if (templateId === 'java-service') {
    return buildJavaServiceSpec(base, slug, date, locale)
  }
  if (templateId === 'cpp-module') {
    return buildCppModuleSpec(base, slug, date, locale)
  }
  if (templateId === 'go-service') {
    return buildGoServiceSpec(base, slug, date, locale)
  }
  if (templateId === 'rust-crate') {
    return buildRustCrateSpec(base, slug, date, locale)
  }
  if (templateId === 'python-service') {
    return buildPythonServiceSpec(base, slug, date, locale)
  }
  if (templateId === 'git-release') {
    return buildGitReleaseSpec(base, slug, date, locale)
  }
  return buildAiAgentTaskSpec(base, slug, date, locale)
}

function buildBlankSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements\n\n- Spec: ${slug}\n- Date: ${date}\n\n## Goals\n\n- \n\n## Non-goals\n\n- \n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Architecture\n\n- \n\n## Risks\n\n- \n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Define acceptance criteria\n- [ ] Implement\n- [ ] Add tests\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] Behavior matches requirements\n- [ ] Tests pass\n`,
    },
  ]
}

function buildNodeApiSpec(base: string, slug: string, date: string, locale: Language): SpecTemplateFile[] {
  const title = zhEn(locale, 'Node/TS API 功能', 'Node/TS API feature')
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · ${title}\n\n- Spec: ${slug}\n- Stack: Node.js / TypeScript\n- Date: ${date}\n\n## Goals\n\n- [ ] REST/JSON endpoint with validation\n- [ ] Error handling + typed responses\n- [ ] Unit/integration tests (vitest/jest)\n\n## Non-goals\n\n- [ ] Database migration in this spec (unless required)\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Modules\n\n- Route handler · service layer · types\n\n## API contract\n\n- Method / path:\n- Request body:\n- Response:\n\n## Test strategy\n\n- \`npm run test:local\` or \`npm test\`\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Scaffold route + types\n- [ ] Implement handler + service\n- [ ] Add tests under \`src/**\`\n- [ ] Update README/API docs\n- [ ] Run lint + test locally\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] Happy path + validation errors covered by tests\n- [ ] \`npm run test:local\` passes\n- [ ] No new lint errors on touched files\n`,
    },
  ]
}

function buildNodeBugfixSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · Bugfix\n\n- Spec: ${slug}\n- Date: ${date}\n\n## Symptom\n\n- \n\n## Expected\n\n- \n\n## Repro steps\n\n1. \n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Root cause hypothesis\n\n- \n\n## Fix approach\n\n- Minimal diff · add regression test\n\n## Files likely touched\n\n- \n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Reproduce with failing test\n- [ ] Apply minimal fix\n- [ ] Verify \`npm run test:local\`\n- [ ] Check related modules\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] Regression test added\n- [ ] Bug no longer reproduces\n- [ ] CI/local tests green\n`,
    },
  ]
}

function buildJavaServiceSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · Java Service\n\n- Spec: ${slug}\n- Stack: Java (Spring/Maven or Gradle)\n- Date: ${date}\n\n## Goals\n\n- [ ] Service method + DTO validation\n- [ ] Unit tests (JUnit)\n- [ ] Integration test or slice test\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Layers\n\n- Controller · Service · Repository (if needed)\n\n## Build\n\n- Maven: \`mvn test\`\n- Gradle: \`./gradlew test\` (incl. \`build.gradle.kts\`)\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Define API/DTO contracts\n- [ ] Implement service + tests\n- [ ] Run \`mvn test\` or \`./gradlew test\`\n- [ ] Update package docs\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] Unit tests pass\n- [ ] Checkstyle/spotbugs clean (if configured)\n- [ ] Public API documented\n`,
    },
  ]
}

function buildCppModuleSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · C++ Module\n\n- Spec: ${slug}\n- Date: ${date}\n\n## Goals\n\n- [ ] Header + implementation split\n- [ ] Unit tests (Catch2/GoogleTest)\n- [ ] CMake build target\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Layout\n\n- \`include/\` · \`src/\` · \`tests/\`\n\n## Build\n\n- \`cmake --build build\`\n- \`ctest --test-dir build\`\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Add module skeleton\n- [ ] Implement core logic\n- [ ] Add unit tests\n- [ ] Verify build + ctest\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] Tests pass locally\n- [ ] No compiler warnings on touched TU\n`,
    },
  ]
}

function buildGoServiceSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · Go Service\n\n- Spec: ${slug}\n- Stack: Go modules\n- Date: ${date}\n\n## Goals\n\n- [ ] Package/API with typed errors\n- [ ] Table-driven unit tests\n- [ ] \`go test ./...\` green\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Layout\n\n- \`cmd/\` · \`internal/\` · \`pkg/\` (if exported)\n\n## Build\n\n- \`go test ./...\`\n- \`go vet ./...\`\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Scaffold packages\n- [ ] Implement core logic + tests\n- [ ] Run \`go test ./...\`\n- [ ] Update module docs\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] Tests and vet pass\n- [ ] Public API documented\n`,
    },
  ]
}

function buildRustCrateSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · Rust Crate\n\n- Spec: ${slug}\n- Stack: Cargo\n- Date: ${date}\n\n## Goals\n\n- [ ] Library/binary crate layout\n- [ ] Unit + integration tests\n- [ ] \`cargo test\` green\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Layout\n\n- \`src/lib.rs\` or \`src/main.rs\` · \`tests/\`\n\n## Build\n\n- \`cargo test\`\n- \`cargo clippy\` (if configured)\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Add crate skeleton\n- [ ] Implement feature + tests\n- [ ] Run \`cargo test\`\n- [ ] Update crate docs\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] \`cargo test\` passes\n- [ ] No new clippy warnings on touched code\n`,
    },
  ]
}

function buildPythonServiceSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · Python Service\n\n- Spec: ${slug}\n- Stack: Python (pyproject / venv)\n- Date: ${date}\n\n## Goals\n\n- [ ] Module or API with typed interfaces\n- [ ] Unit tests (pytest)\n- [ ] Lint/format clean on touched files\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Layout\n\n- \`src/\` package or flat module layout\n\n## Build\n\n- \`pytest\` or \`python -m pytest\`\n- \`ruff check\` / \`black --check\` (if configured)\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Scaffold module + tests\n- [ ] Implement feature\n- [ ] Run \`pytest\`\n- [ ] Update docstrings/README\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] \`pytest\` passes\n- [ ] Public API documented\n`,
    },
  ]
}

function buildGitReleaseSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · Git Release\n\n- Spec: ${slug}\n- Date: ${date}\n\n## Release scope\n\n- Version:\n- Highlights:\n\n## Checklist source\n\n- Git log since last tag\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Branch strategy\n\n- main / release branch\n\n## Artifacts\n\n- CHANGELOG entry\n- Tag message\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Review \`git log\` since last tag\n- [ ] Update CHANGELOG\n- [ ] Bump version fields\n- [ ] Prepare tag message\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] Changelog accurate\n- [ ] Version bumped consistently\n- [ ] Tag ready (manual push)\n`,
    },
  ]
}

function buildAiAgentTaskSpec(base: string, slug: string, date: string, _locale: Language): SpecTemplateFile[] {
  return [
    {
      path: `${base}/requirements.md`,
      content: `# Requirements · AI Agent Task\n\n- Spec: ${slug}\n- Date: ${date}\n\n## Goal (one paragraph)\n\n- \n\n## Constraints\n\n- Max files to touch:\n- Must preserve tests:\n- No secrets in repo:\n`,
    },
    {
      path: `${base}/design.md`,
      content: `# Design\n\n## Agent plan\n\n1. Explore repo\n2. Edit with tests\n3. Summarize in acceptance\n\n## Hooks\n\n- Use agent hooks for lint/review after apply\n`,
    },
    {
      path: `${base}/tasks.md`,
      content: `# Tasks\n\n- [ ] Agent: explore + list target files\n- [ ] Agent: implement with tests\n- [ ] Human: review diff\n- [ ] Run verification hooks\n`,
    },
    {
      path: `${base}/acceptance.md`,
      content: `# Acceptance\n\n- [ ] All tasks checked\n- [ ] Agent summary matches diff\n- [ ] Hooks green or documented skips\n`,
    },
  ]
}

export function buildSpecStudioHooksYaml(
  templateId: SpecStudioTemplateId,
  specName: string,
  locale: Language = 'zh-CN',
): string | null {
  const slug = normalizeSpecName(specName)
  if (templateId === 'blank' || templateId === 'git-release') return null

  const testCmd =
    templateId === 'java-service'
      ? './gradlew test || mvn -q test'
      : templateId === 'cpp-module'
        ? 'cmake --build build && ctest --test-dir build --output-on-failure'
        : templateId === 'go-service'
          ? 'go test ./...'
          : templateId === 'rust-crate'
            ? 'cargo test'
            : templateId === 'python-service'
              ? 'pytest'
              : 'npm run test:local'

  const agentPrompt = zhEn(
    locale,
    '检查刚修改的文件：修复 lint/类型问题，并补充缺失测试。',
    'Review applied files: fix lint/type issues and add missing tests.',
  )

  if (templateId === 'ai-agent-task') {
    return `# .aide/specs/${slug}/hooks.yaml
version: 1
hooks:
  - id: agent-review
    on: apply.after
    run: agent
    prompt: "${agentPrompt}"
  - id: agent-summary
    on: queue.after
    run: agent
    prompt: "Summarize changes against acceptance.md checklist."
`
  }

  return `# .aide/specs/${slug}/hooks.yaml
version: 1
hooks:
  - id: pre-run-tests
    on: queue.before
    run: shell
    command: ${testCmd}
  - id: post-apply-lint
    on: apply.after
    run: agent
    prompt: "${agentPrompt}"
`
}
