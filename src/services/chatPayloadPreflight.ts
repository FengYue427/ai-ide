export interface PayloadWarningData {
  estimatedBytes: number
  budgetBytes: number
  text: string
  slimPlan: string[]
}

export function getPayloadWarningData(
  estimatedBytes: number,
  budgetBytes: number,
  text: string,
  slimPlan: string[],
): PayloadWarningData | null {
  if (estimatedBytes <= budgetBytes) return null
  return {
    estimatedBytes,
    budgetBytes,
    text,
    slimPlan,
  }
}
