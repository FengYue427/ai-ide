import { useEffect } from 'react'
import { loadMcpServers } from '../services/mcpConfigService'

/** Warm MCP config cache on app start. */
export function useMcpBootstrap(): void {
  useEffect(() => {
    void loadMcpServers()
  }, [])
}
