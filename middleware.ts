import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  "/",
  "/sobre-nosotros",
  "/contacto",
  "/servicios",
  "/servicios/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
]);

// Rutas solo para admin
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Rutas solo para dashboard
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // Si es ruta pública, permitir acceso
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Si no está autenticado y no es ruta pública, redirigir a login
  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Verificar permisos de admin
  if (isAdminRoute(request)) {
    // Consultar rol desde Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: user } = await supabase
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (user?.rol !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Permitir acceso a dashboard para usuarios autenticados
  if (isDashboardRoute(request)) {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
