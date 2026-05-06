import { PrismaAdapter } from "@auth/prisma-adapter"
import { AuthConfig } from "@auth/core"
import Credentials from "@auth/core/providers/credentials"
import GitHub from "@auth/core/providers/github"
import Google from "@auth/core/providers/google"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { sendVerificationRequest } from "./email"

const prisma = new PrismaClient()

export const authConfig: AuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        
        if (!user || !user.password) return null
        
        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        }
      }
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!
    })
  ],
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string
      }
      return session
    }
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.id) {
        // 为新用户创建默认工作区
        await prisma.userWorkspace.create({
          data: {
            userId: user.id as string,
            name: "default",
            files: JSON.stringify([]),
            isDefault: true
          }
        })
      }
    }
  }
}
