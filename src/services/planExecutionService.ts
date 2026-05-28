export interface PlanStepItem {
  text: string
  line: number
}

export function listPlanSteps(planText: string): PlanStepItem[] {
  return planText
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineNo: index + 1 }))
    .filter((item) => /^\s*-\s*\[\s\]\s+.+\s*$/.test(item.line))
    .map((item) => ({
      text: item.line.replace(/^\s*-\s*\[\s\]\s+/, '').trim(),
      line: item.lineNo,
    }))
}

export function getFirstPlanStep(planText: string): string | null {
  const first = listPlanSteps(planText)[0]
  return first?.text ?? null
}

export function buildPlanExecutionPrompt(step: string): string {
  return `请执行这个计划步骤，并给出改动文件与验证结果：\n\n- [ ] ${step}`
}
