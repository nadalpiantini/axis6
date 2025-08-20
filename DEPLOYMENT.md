# 🚀 AXIS6 MVP - Guía de Despliegue

## 📋 Estado Actual

✅ **Completado (90%)**:
- Estructura del proyecto con Next.js 15.4.7
- Sistema de autenticación con Supabase
- Dashboard con check-ins y visualización hexagonal
- Sistema de streaks (rachas)
- PWA configurada
- Tipos TypeScript sincronizados con schema

⏳ **Pendiente (10%)**:
- Ejecutar migraciones en Supabase
- Deploy en Vercel
- Configurar dominio axis6.sujeto10.com

## 🔧 Configuración de Supabase

### 1. Ejecutar Migraciones

1. Accede a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv)

2. Ve a **SQL Editor** en el menú lateral

3. Ejecuta las migraciones en orden:

```sql
-- Primero: 001_initial_schema.sql
-- Copia y pega todo el contenido del archivo
```

```sql
-- Segundo: 002_auth_triggers.sql
-- Copia y pega todo el contenido del archivo
```

### 2. Verificar Tablas

En **Table Editor**, verifica que se crearon:
- `axis6_profiles`
- `axis6_categories` (con 6 categorías insertadas)
- `axis6_checkins`
- `axis6_streaks`
- `axis6_daily_stats`

### 3. Configurar Email Templates (Opcional)

En **Authentication > Email Templates**, personaliza los emails de:
- Confirmación
- Recuperación de contraseña
- Invitación

## 🚢 Deploy en Vercel

### 1. Preparar el Repositorio

```bash
# Commit todos los cambios
git add .
git commit -m "🚀 AXIS6 MVP Complete - Ready for deployment"
git push origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **"New Project"**
3. Importa tu repositorio de GitHub
4. Selecciona `axis6-mvp` como root directory

### 3. Variables de Entorno

En Vercel, añade estas variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://nqzhxukuvmdlpewqytpv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemh4dWt1dm1kbHBld3F5dHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NTk0MDksImV4cCI6MjA2MjIzNTQwOX0.9raKtf_MAUoZ7lUOek4lazhWTfmxPvufW1-al82UHmk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemh4dWt1dm1kbHBld3F5dHB2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY1OTQwOSwiZXhwIjoyMDYyMjM1NDA5fQ.KUbJb8fCHADnITIhr-x8R49_BsmicsYAzW9qG2YlTFA
DEEPSEEK_API_KEY=sk-361a8f41990e4e9bb145646596ecd16b
```

### 4. Configuración de Build

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 5. Deploy

Click en **"Deploy"** y espera ~2-3 minutos.

## 🌐 Configurar Dominio Personalizado

### 1. En Vercel

1. Ve a **Settings > Domains**
2. Añade `axis6.sujeto10.com`
3. Vercel te dará registros DNS

### 2. En tu Proveedor DNS

Añade estos registros:

**Opción A - CNAME (Recomendado)**:
```
Type: CNAME
Name: axis6
Value: cname.vercel-dns.com
```

**Opción B - A Records**:
```
Type: A
Name: axis6
Value: 76.76.21.21
```

### 3. Verificar

- Espera 5-30 minutos para propagación DNS
- Verifica en: https://axis6.sujeto10.com

## ✅ Testing Post-Deploy

### 1. Funcionalidad Básica
- [ ] Landing page carga correctamente
- [ ] Registro de nuevo usuario funciona
- [ ] Login funciona
- [ ] Email de confirmación se envía

### 2. Dashboard
- [ ] Check-ins se guardan correctamente
- [ ] Hexágono se actualiza
- [ ] Streaks se calculan
- [ ] Responsive en móvil

### 3. PWA
- [ ] Se puede instalar en móvil
- [ ] Funciona offline (páginas visitadas)
- [ ] Íconos y splash screen correctos

## 🐛 Troubleshooting

### Error: "Database connection failed"
- Verifica las variables de entorno en Vercel
- Asegúrate de que las migraciones se ejecutaron

### Error: "Auth not working"
- Verifica que el trigger `on_auth_user_created` existe
- Revisa los logs en Supabase Dashboard

### Error: "Build failed"
```bash
# Localmente, verifica que funciona:
npm run build
npm run start
```

## 📊 Monitoreo

### Vercel Analytics
- Activa Analytics en Vercel Dashboard
- Monitorea Core Web Vitals

### Supabase Metrics
- Ve a **Reports** en Supabase
- Monitorea:
  - Usuarios activos
  - API requests
  - Database size

## 🎉 ¡Listo!

Tu app está ahora en producción en:
- **URL Principal**: https://axis6.sujeto10.com
- **URL Vercel**: https://axis6-mvp.vercel.app

## 📱 Próximos Pasos

1. **Analytics Dashboard**: Crear página `/dashboard/analytics`
2. **Notificaciones Push**: Implementar con Web Push API
3. **Social Features**: Compartir progreso
4. **Gamification**: Badges y achievements
5. **AI Insights**: Integrar Deepseek para recomendaciones

## 🔐 Seguridad

Recuerda:
- Rotar las API keys periódicamente
- Configurar CORS en Supabase
- Habilitar 2FA en cuentas admin
- Backup regular de la base de datos

---

**Soporte**: Si tienes problemas, revisa los logs en:
- Vercel: Functions > Logs
- Supabase: Logs > API/Database