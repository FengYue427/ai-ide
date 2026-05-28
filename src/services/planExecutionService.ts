export function getFirstPlanStep(planText: string): string | null {
  const matches = planText.matchAll(/^\s*-\s*\[\s\]\s+(.+)\s*$/gm)
  const first = matches.next()
  return first.done ? null : first.value[1].trim()
}

export function buildPlanExecutionPrompt(step: string): string {
  return `请执行这个计划步骤，并给出改动文件与验证结果：\n\n- [ ] ${step}`
}
