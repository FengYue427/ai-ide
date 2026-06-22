/**
 * Stack learning paths — template + suggested workspace mode.
 */
import type { SpecStudioTemplateId } from '../data/specStudioTemplates'
import type { WorkspaceMode } from './workspaceMode'

export interface LearningPath {
  id: string
  templateId: SpecStudioTemplateId
  specName: string
  suggestedMode: WorkspaceMode
  titleKey: 'learningPath.intentDemo.title' | 'learningPath.nodeApi.title' | 'learningPath.python.title' | 'learningPath.aiAgent.title'
  descKey: 'learningPath.intentDemo.desc' | 'learningPath.nodeApi.desc' | 'learningPath.python.desc' | 'learningPath.aiAgent.desc'
  durationMin: number
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'intent-demo',
    templateId: 'demo-onboarding',
    specName: 'intent-demo',
    suggestedMode: 'execute',
    titleKey: 'learningPath.intentDemo.title',
    descKey: 'learningPath.intentDemo.desc',
    durationMin: 60,
  },
  {
    id: 'node-api',
    templateId: 'node-api',
    specName: 'my-api',
    suggestedMode: 'plan',
    titleKey: 'learningPath.nodeApi.title',
    descKey: 'learningPath.nodeApi.desc',
    durationMin: 90,
  },
  {
    id: 'python-service',
    templateId: 'python-service',
    specName: 'my-service',
    suggestedMode: 'code',
    titleKey: 'learningPath.python.title',
    descKey: 'learningPath.python.desc',
    durationMin: 120,
  },
  {
    id: 'ai-agent',
    templateId: 'ai-agent-task',
    specName: 'agent-task',
    suggestedMode: 'execute',
    titleKey: 'learningPath.aiAgent.title',
    descKey: 'learningPath.aiAgent.desc',
    durationMin: 45,
  },
]
