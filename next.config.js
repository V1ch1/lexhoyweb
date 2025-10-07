/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // Asegurarse de que las variables de entorno estén disponibles en el cliente
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  images: {
    domains: ['oepcitgbnqylfpdryffx.supabase.co'],
  },
  // Configuración para el manejo de rutas de API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_BASE_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
