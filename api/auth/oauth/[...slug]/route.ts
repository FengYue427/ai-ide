/**
 * Auth.js OAuth — GitHub / Google sign-in & callback.
 * Base path: /api/auth/oauth (see lib/auth/oauthConfig.ts)
 */
import { handleOAuthRequest } from '../../../../lib/auth/handleOAuthRequest'

export async function GET(request: Request) {
  return handleOAuthRequest(request)
}

export async function POST(request: Request) {
  return handleOAuthRequest(request)
}
