import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración del servidor de desarrollo
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Configuración para permitir el hostname personalizado
  experimental: {
    // Permite hostnames personalizados en desarrollo
    serverActions: {
      allowedOrigins: ['axis6.dev:6789', 'localhost:6789', 'axis6.app'],
    },
  },
  
  // Configuración para Cloudflare Pages
  ...(process.env.CF_PAGES && {
    output: 'standalone',
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
      unoptimized: true, // Cloudflare Pages no soporta optimización de imágenes de Next.js
    },
  }),
  
  // Headers de seguridad y CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
