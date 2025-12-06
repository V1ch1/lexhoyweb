import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  // @ts-ignore - Rol is added in session callback
  const userRole = req.auth?.user?.rol;

  const isPublicRoute = 
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/sobre-nosotros") ||
    nextUrl.pathname.startsWith("/contacto") ||
    nextUrl.pathname.startsWith("/servicios") ||
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname.startsWith("/forgot-password") ||
    nextUrl.pathname.startsWith("/reset-password") ||
    nextUrl.pathname.startsWith("/verify-email") ||
    nextUrl.pathname.startsWith("/api/webhooks");

  const isAuthRoute = 
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  const isAdminRoute = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/dashboard/admin");

  // Si está en ruta de auth y ya está logueado, redirigir al dashboard
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Si no está logueado y no es ruta pública, redirigir a login
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // Protección de rutas de admin
  if (isAdminRoute && userRole !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
