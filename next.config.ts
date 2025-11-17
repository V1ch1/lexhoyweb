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
    ignoreDuringBuilds: false,
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
                ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://lexhoy.com ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*;"
                : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://lexhoy.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
