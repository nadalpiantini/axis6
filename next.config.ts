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
      allowedOrigins: ['axis6.dev:6789', 'localhost:6789'],
    },
  },
  
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
