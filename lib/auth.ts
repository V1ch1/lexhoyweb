import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import Resend from "next-auth/providers/resend"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { authConfig } from "@/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Magic Links con Resend
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: "noreply@lexhoy.com",
    }),
    
    // Email + Password - Moved to API route to avoid Edge Runtime issues
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Call API route to verify credentials (avoids bcryptjs in Edge)
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/verify-credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            return null
          }

          const user = await response.json()
          return user
        } catch (error) {
          console.error('Error verifying credentials:', error)
          return null
        }
      }
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token) {
        // @ts-ignore
        session.user.id = token.sub
        // @ts-ignore
        session.user.rol = token.rol
        // @ts-ignore
        session.user.plan = token.plan
        // @ts-ignore
        session.user.activo = token.activo
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore
        token.rol = user.rol
        // @ts-ignore
        token.plan = user.plan
        // @ts-ignore
        token.activo = user.activo
      }
      return token
    },

    async signIn({ user, account }) {
      // Si es OAuth (Google), crear/actualizar usuario en Supabase
      if (account?.provider === 'google') {
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/sync-google-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user }),
          })

          if (!response.ok) {
            console.error('Error syncing Google user')
            return false
          }
        } catch (error) {
          console.error('Error in Google signIn callback:', error)
          return false
        }
      }

      return true
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
})
