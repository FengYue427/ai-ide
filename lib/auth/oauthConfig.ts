import type { AuthConfig } from '@auth/core'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Provider } from '@auth/core/providers'
import { prisma } from '../../src/lib/prisma'

export const OAUTH_BASE_PATH = '/api/auth/oauth'

function buildOAuthProviders(): Provider[] {
  const providers: Provider[] = []

  const githubId = process.env.AUTH_GITHUB_ID?.trim()
  const githubSecret = process.env.AUTH_GITHUB_SECRET?.trim()
  if (githubId && githubSecret) {
    providers.push(
      GitHub({
        clientId: githubId,
        clientSecret: githubSecret,
      }),
    )
  }

  const googleId = process.env.AUTH_GOOGLE_ID?.trim()
  const googleSecret = process.env.AUTH_GOOGLE_SECRET?.trim()
  if (googleId && googleSecret) {
    providers.push(
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
      }),
    )
  }

  return providers
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_GITHUB_ID?.trim() && process.env.AUTH_GITHUB_SECRET?.trim())
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim())
}

export function isAnyOAuthConfigured(): boolean {
  return isGitHubOAuthConfigured() || isGoogleOAuthConfigured()
}

export function getOAuthConfig(): AuthConfig {
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret) {
    throw new Error('AUTH_SECRET is required for OAuth')
  }

  const providers = buildOAuthProviders()
  if (providers.length === 0) {
    throw new Error('No OAuth providers configured (AUTH_GITHUB_* / AUTH_GOOGLE_*)')
  }

  return {
    adapter: PrismaAdapter(prisma),
    basePath: OAUTH_BASE_PATH,
    secret,
    trustHost: true,
    providers,
    session: {
      strategy: 'jwt',
      maxAge: 7 * 24 * 60 * 60,
    },
    pages: {
      signIn: '/',
      error: '/',
    },
    callbacks: {
      async redirect({ url, baseUrl }) {
        if (url.startsWith(baseUrl)) return url
        if (url.startsWith('/')) return `${baseUrl}${url}`
        return `${baseUrl}/?oauth_sync=1`
      },
      async jwt({ token, user }) {
        if (user?.id) token.id = user.id
        return token
      },
      async session({ session, token }) {
        if (session.user && token?.id) {
          ;(session.user as { id?: string }).id = token.id as string
        }
        return session
      },
    },
    events: {
      async signIn({ user, isNewUser }) {
        const userId = user.id
        if (!userId) return

        if (isNewUser) {
          const existing = await prisma.userWorkspace.findFirst({
            where: { userId, name: 'default' },
          })
          if (!existing) {
            await prisma.userWorkspace.create({
              data: {
                userId,
                name: 'default',
                files: '[]',
                settings: '{}',
                isDefault: true,
              },
            })
          }
        }
      },
    },
  }
}
