# 🚀 Configuración de AXIS6 en Cloudflare Pages

## ✅ Paso 1: Conectar tu Repositorio GitHub

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. En el menú lateral, haz clic en **Workers & Pages**
3. Haz clic en **Create application** → **Pages** → **Connect to Git**
4. Autoriza Cloudflare para acceder a tu GitHub
5. Selecciona el repositorio: **nadalpiantini/axis6**
6. Haz clic en **Begin setup**

## ✅ Paso 2: Configuración del Build

En la pantalla de configuración, usa estos valores:

### Build Settings:
- **Project name**: `axis6-app`
- **Production branch**: `main`
- **Framework preset**: `Next.js`
- **Build command**: `npm run build:cloudflare`
- **Build output directory**: `.vercel/output/static`

### Environment Variables (IMPORTANTE):

Haz clic en **Add variable** y agrega estas 3 variables:

1. **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://nvpnhqhjttgwfwvkgmpk.supabase.co`

2. **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDkyNTYsImV4cCI6MjA3MTI4NTI1Nn0.yVgnHzflgpX_CMY4VB62ndZlsrfeH0Mlhl026HT06C0`

3. **Variable 3:** (⚠️ MARCA COMO "ENCRYPT")
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM`
   - **IMPORTANTE**: Haz clic en el botón **Encrypt** para esta variable

4. **Variables adicionales:**
   - Name: `NODE_ENV`
   - Value: `production`
   
   - Name: `NEXT_PUBLIC_APP_URL`
   - Value: `https://axis6.app`

### Haz clic en **Save and Deploy**

El primer deploy tomará unos 3-5 minutos.

## ✅ Paso 3: Configurar el Dominio Personalizado

Una vez que el deploy termine:

1. Ve a tu proyecto en Cloudflare Pages
2. Haz clic en **Custom domains**
3. Haz clic en **Set up a custom domain**
4. Escribe: `axis6.app`
5. Haz clic en **Continue**

### Si el dominio NO está en Cloudflare:
- Te mostrará los nameservers de Cloudflare
- Ve a tu registrador de dominios (donde compraste axis6.app)
- Cambia los nameservers a los de Cloudflare:
  - Usualmente son algo como:
    - `adam.ns.cloudflare.com`
    - `tina.ns.cloudflare.com`

### Si el dominio YA está en Cloudflare:
- Se configurará automáticamente
- El SSL se activará en unos minutos

## ✅ Paso 4: Configurar Supabase

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/settings/auth)
2. En el menú lateral: **Authentication** → **URL Configuration**
3. Actualiza estos campos:

### Site URL:
```
https://axis6.app
```

### Redirect URLs (agrega todas estas):
```
https://axis6.app/auth/callback
https://axis6.app/dashboard
https://axis6.app/login
http://localhost:6789/auth/callback
http://localhost:6789/dashboard
http://localhost:6789/login
```

4. Haz clic en **Save**

## ✅ Paso 5: Ejecutar las Migraciones en Supabase

1. Ve al [SQL Editor de Supabase](https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new)
2. Copia y pega el contenido del archivo `supabase/migrations/001_initial_schema.sql`
3. Haz clic en **Run**
4. Luego copia y pega el contenido de `supabase/migrations/002_auth_trigger.sql`
5. Haz clic en **Run**

## ✅ Paso 6: Verificación Final

### Test Local:
```bash
# En tu terminal (ya está corriendo):
# http://localhost:6789
```

### Test en Producción:
1. Espera que el DNS se propague (puede tomar hasta 24h, pero usualmente es inmediato con Cloudflare)
2. Visita: https://axis6.app
3. Prueba el registro y login

## 🎯 Checklist de Verificación

- [ ] Cloudflare Pages conectado a GitHub
- [ ] Variables de entorno configuradas
- [ ] Dominio axis6.app configurado
- [ ] Nameservers actualizados (si aplica)
- [ ] SSL activo (automático con Cloudflare)
- [ ] Supabase URLs actualizadas
- [ ] Migraciones ejecutadas
- [ ] Test local funcionando
- [ ] Test en producción funcionando

## 🆘 Troubleshooting

### Si el build falla:
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Cloudflare Pages

### Si el dominio no funciona:
- Verifica que los nameservers estén correctos
- Espera hasta 24h para la propagación DNS
- Usa https://dnschecker.org para verificar

### Si el login no funciona:
- Verifica las URLs en Supabase
- Asegúrate de que las migraciones se ejecutaron
- Revisa la consola del navegador para errores

## 📞 Soporte

Si necesitas ayuda con algún paso, aquí estoy para asistirte!