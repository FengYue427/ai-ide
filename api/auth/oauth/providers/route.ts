/**
 * Which OAuth providers are configured on the server (for UI toggles).
 */
import { jsonResponse } from '../../../../lib/api/http'
import { isGitHubOAuthConfigured, isGoogleOAuthConfigured } from '../../../../lib/auth/oauthConfig'

export async function GET() {
  const github = isGitHubOAuthConfigured()
  const google = isGoogleOAuthConfigured()

  return jsonResponse({
    github,
    google,
    any: github || google,
  })
}
