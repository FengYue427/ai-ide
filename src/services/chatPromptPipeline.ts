export interface BuildSharedPromptOptions {
  basePrompt: string
  query: string
  forceSlim: boolean
  applyProjectRules: (prompt: string) => string
  augmentWithSemanticContext: (prompt: string, query: string) => Promise<string>
  applyAgentContext: (prompt: string) => string
  buildMentionSection: (query: string) => string
}

/**
 * Build a final prompt with the shared append pipeline used by both
 * agent-mode and plain chat-mode branches.
 */
export async function buildPromptWithSharedContext(options: BuildSharedPromptOptions): Promise<string> {
  const {
    basePrompt,
    query,
    forceSlim,
    applyProjectRules,
    augmentWithSemanticContext,
    applyAgentContext,
    buildMentionSection,
  } = options

  let prompt = await augmentWithSemanticContext(applyProjectRules(basePrompt), query)
  prompt = applyAgentContext(prompt)

  if (forceSlim) return prompt

  const mentionSection = buildMentionSection(query)
  return mentionSection ? `${prompt}\n\n${mentionSection}` : prompt
}
