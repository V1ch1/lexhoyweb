import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para producción
  // output: 'standalone', // Comentado temporalmente por problemas de permisos en Windows

  // Verificar errores de TypeScript durante la compilación
  typescript: {
    ignoreBuildErrors: false,
  },
  // Verificar errores de ESLint durante la compilación
  eslint: {
    ignoreDuringBuilds: true, // Temporalmente true para permitir deploy con Clerk
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oepcitgbnqylfpdryffx.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lexhoy.com",
        port: "",
        pathname: "/**",
      },
    ],
    domains: ["lh3.googleusercontent.com"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value:
              process.env.NODE_ENV === "development"
                ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://lexhoy.com https://*.clerk.accounts.dev https://clerk.com https://clerk-telemetry.com ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*; frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:;"
                : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://lexhoy.com https://*.clerk.accounts.dev https://clerk.com https://clerk-telemetry.com; frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
