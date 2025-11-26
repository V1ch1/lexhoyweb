import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isOnAuth) {
        if (isLoggedIn) {
            return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      return true;
    },
    async session({ session, token }) {
        // Pass role from token to session if available (for JWT strategy)
        if (token && session.user) {
            // @ts-ignore
            session.user.rol = token.rol;
            // @ts-ignore
            session.user.id = token.sub;
        }
        return session;
    },
    async jwt({ token, user }) {
        if (user) {
            // @ts-ignore
            token.rol = user.rol;
        }
        return token;
    }
  },
  providers: [], // Configured in auth.ts
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig
