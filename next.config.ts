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
    domains: [
      'oepcitgbnqylfpdryffx.supabase.co', // Supabase storage
      'lexhoy.com', // WordPress images
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://lexhoy.com https://vercel.live https://*.google-analytics.com https://analytics.google.com; frame-src https://vercel.live;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
