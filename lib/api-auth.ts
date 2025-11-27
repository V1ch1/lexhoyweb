/**
 * Helper utilities for API routes with NextAuth authentication
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user from NextAuth session
 * Returns the user object or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Require authentication for an API route
 * Returns the user if authenticated, or an error response if not
 */
export async function requireAuth(): Promise<
  | { user: { id: string; email: string; [key: string]: any }; error: null }
  | { user: null; error: NextResponse }
> {
  const session = await auth();
  
  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      ),
    };
  }

  return {
    // @ts-ignore - NextAuth user has id from our custom session callback
    user: session.user as { id: string; email: string; [key: string]: any },
    error: null,
  };
}

/**
 * Require super admin role for an API route
 * Returns the user if authenticated and is super_admin, or an error response if not
 */
export async function requireSuperAdmin(): Promise<
  | { user: { id: string; email: string; rol: string; [key: string]: any }; error: null }
  | { user: null; error: NextResponse }
> {
  const session = await auth();
  
  if (!session?.user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      ),
    };
  }

  // @ts-ignore - rol is added in session callback
  const userRole = session.user.rol;
  
  if (userRole !== "super_admin") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "No autorizado. Se requiere rol de super admin" },
        { status: 403 }
      ),
    };
  }

  return {
    // @ts-ignore
    user: session.user as { id: string; email: string; rol: string; [key: string]: any },
    error: null,
  };
}
