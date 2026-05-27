import type { TranslationKey } from '../i18n'

export interface McpOfficialPreset {
  id: string
  nameKey: TranslationKey
  descKey: TranslationKey
  /** URL template; may be empty for user-filled endpoints */
  defaultUrl: string
  docsUrl: string
}

/** Curated Streamable HTTP MCP templates (1.0.4 E1). */
export const MCP_OFFICIAL_PRESETS: McpOfficialPreset[] = [
  {
    id: 'local-dev',
    nameKey: 'mcp.catalog.local.name',
    descKey: 'mcp.catalog.local.desc',
    defaultUrl: 'http://127.0.0.1:3001/mcp',
    docsUrl: 'https://github.com/FengYue427/ai-ide/blob/main/docs/MCP_OFFICIAL_CATALOG.md#预置条目',
  },
  {
    id: 'self-hosted',
    nameKey: 'mcp.catalog.selfHosted.name',
    descKey: 'mcp.catalog.selfHosted.desc',
    defaultUrl: '',
    docsUrl: 'https://modelcontextprotocol.io/',
  },
  {
    id: 'community',
    nameKey: 'mcp.catalog.community.name',
    descKey: 'mcp.catalog.community.desc',
    defaultUrl: '',
    docsUrl: 'https://smithery.ai/',
  },
]
