# 🚀 AXIS6 MVP - Guía de Deployment

## 📋 Resumen de Configuración

Este proyecto está configurado para deployment dual:

1. **Cloudflare Pages**: `axis6.app` (Producción)
2. **Vercel**: `axis6.sujeto10.com` (Staging/Backup)

## 🌐 Cloudflare Pages Setup

### Prerrequisitos

1. Cuenta de Cloudflare activa
2. Dominio `axis6.app` configurado en Cloudflare
3. Node.js 18+ instalado localmente

### Variables de Entorno Requeridas

En Cloudflare Pages Dashboard, configurar:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ⚠️ SENSITIVE: Configure como encrypted
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://axis6.app
NODE_ENV=production

# Optional API Keys
DEEPSEEK_API_KEY=sk-your-api-key-here

# Rate Limiting (optional)
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Deployment Manual

```bash
# 1. Build y test local
npm run build
npm run build:cloudflare

# 2. Preview local con Wrangler
npm run preview:cloudflare

# 3. Deploy a Cloudflare Pages
npm run deploy:cloudflare
```

### Configuración Automática (GitHub Actions)

El proyecto incluye GitHub Action en `.github/workflows/cloudflare-deploy.yml` que se ejecuta automáticamente en:

- Push a `main` branch
- Pull requests (preview deploy)
- Workflow manual dispatch

#### Secrets requeridos en GitHub:

```bash
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## ⚡ Vercel Setup (Staging)

### Variables de Entorno

En Vercel Dashboard, configurar las mismas variables que Cloudflare pero con:

```bash
NEXT_PUBLIC_APP_URL=https://axis6.sujeto10.com
NODE_ENV=production
```

### Deployment

```bash
# Automatic deployment en push a main
# Manual deployment:
vercel --prod
```

## 🔧 Build Scripts Disponibles

```bash
# Development
npm run dev              # Puerto 6789 (localhost)
npm run dev:custom       # axis6.dev:6789 (hostname custom)

# Production Builds
npm run build            # Next.js standard build
npm run build:cloudflare # Cloudflare Pages optimized build
npm run preview:cloudflare # Preview local con Wrangler

# Deployment
npm run deploy:cloudflare # Full deploy a Cloudflare Pages
```

## 📁 Estructura de Archivos de Deployment

```
axis6-mvp/
├── wrangler.toml                    # Cloudflare Pages config
├── vercel.json                      # Vercel config
├── next.config.ts                   # Next.js config con CF compatibility
├── public/_headers                  # Cloudflare headers config
├── .github/
│   └── workflows/
│       └── cloudflare-deploy.yml    # GitHub Actions CI/CD
├── .env.example                     # Template de variables
└── .env.local                       # Variables locales (git ignored)
```

## 🔒 Configuración de Seguridad

### Headers de Seguridad

Configurados en:
- `public/_headers` (Cloudflare)
- `vercel.json` (Vercel)

Incluye:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options
- Permissions Policy

### Variables Sensibles

⚠️ **NUNCA commitear**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEEPSEEK_API_KEY`
- Cualquier API key o token

✅ **Público (OK para commitear)**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## 🚨 Edge Runtime Considerations

Las API routes están configuradas con `export const runtime = 'edge'` para compatibilidad con Cloudflare Pages.

### Limitaciones de Edge Runtime:

1. **No todas las APIs de Node.js están disponibles**
2. **Supabase SSR funciona pero con algunas limitaciones**
3. **Timeouts más estrictos**
4. **Bundle size limits**

### API Routes Configuradas:

- `/api/auth/login` - Edge Runtime ✅
- `/api/auth/register` - Edge Runtime ✅
- `/api/mantras` - Edge Runtime ✅

## 📊 Monitoreo y Performance

### Cloudflare Analytics

- Web Analytics automático
- Core Web Vitals tracking
- Security insights

### Vercel Analytics

- Función de monitoring integrada
- Performance metrics
- Error tracking

## 🐛 Troubleshooting

### Build Errors

```bash
# Error: Edge Runtime incompatible
# Solución: Verificar que todas las API routes exporten runtime = 'edge'

# Error: Environment variables not found
# Solución: Verificar configuración en dashboard del provider

# Error: Supabase connection
# Solución: Verificar URLs y keys de Supabase
```

### Development Issues

```bash
# Puerto 6789 ocupado
npm run dev:safe

# Cache issues
rm -rf .next && npm run build

# Dependencies issues
rm -rf node_modules package-lock.json && npm install
```

## 🔄 Proceso de Release

1. **Desarrollo**: Feature branches → PR to main
2. **Testing**: Preview deploys automáticos en PRs
3. **Staging**: Auto-deploy a Vercel en merge a main
4. **Production**: Auto-deploy a Cloudflare Pages en merge a main

## 📞 Soporte

Para issues de deployment:
1. Check build logs en GitHub Actions
2. Verificar variables de entorno
3. Review Cloudflare/Vercel dashboards
4. Check este archivo de documentación

---

**Última actualización**: Configuración dual Cloudflare Pages + Vercel con CI/CD automático