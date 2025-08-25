# 📋 AXIS6 - Instrucciones de Migración de Base de Datos

## 🚀 Paso 1: Ejecutar Migraciones en Supabase

### Opción A: Ejecución Completa (Recomendado)

1. **Abre el Editor SQL de Supabase:**
   ```
   https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
   ```

2. **Copia TODO el contenido del archivo:**
   ```
   scripts/deploy-migrations.sql
   ```

3. **Pega en el editor SQL y ejecuta:**
   - Click en el botón "Run" (o presiona Cmd+Enter)
   - El script es idempotente (seguro ejecutar múltiples veces)
   - Tardará aproximadamente 30-60 segundos

4. **Verifica el resultado:**
   - Deberías ver: "AXIS6 Production Database Setup Complete! 🎉"
   - Se mostrarán todas las tablas e índices creados

### Opción B: Ejecución por Partes (Si hay errores)

Si encuentras algún error, puedes ejecutar las migraciones por partes:

1. **Primero las tablas básicas** (líneas 14-138 del script)
2. **Luego los triggers** (líneas 140-238)
3. **Funciones de optimización** (líneas 240-366)
4. **Tablas adicionales** (líneas 368-494)
5. **Índices de performance** (líneas 496-636)

## 🔧 Paso 2: Configurar Resend para Emails

### Crear cuenta en Resend

1. **Ve a Resend:**
   ```
   https://resend.com/signup
   ```

2. **Crea una cuenta gratuita**

3. **Obtén tu API Key:**
   - Dashboard → API Keys → Create API Key
   - Copia la key que empieza con `re_`

### Configurar dominio (Opcional pero recomendado)

1. **En Resend Dashboard:**
   - Settings → Domains → Add Domain
   - Ingresa: `axis6.app`

2. **Configura los registros DNS en Cloudflare:**
   ```
   TXT  _resend.axis6.app  "resend-verification=xxxxx"
   TXT  axis6.app          "v=spf1 include:amazonses.com ~all"
   MX   send.axis6.app     feedback-smtp.us-east-1.amazonses.com (Priority: 10)
   ```

3. **Verifica el dominio en Resend**

## 🔐 Paso 3: Configurar Variables de Entorno en Vercel

1. **Abre el dashboard de Vercel:**
   ```
   https://vercel.com/nadalpiantinis-projects/axis6-mvp/settings/environment-variables
   ```

2. **Agrega la API Key de Resend:**
   - Variable Name: `RESEND_API_KEY`
   - Value: `re_[tu_api_key_aqui]`
   - Environment: Production, Preview, Development
   - Click "Save"

3. **Verifica las demás variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://nvpnhqhjttgwfwvkgmpk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[verificar que esté]
   SUPABASE_SERVICE_ROLE_KEY=[verificar que esté]
   NEXT_PUBLIC_APP_URL=https://axis6.app
   ```

4. **Redeploy para aplicar cambios:**
   - Settings → Deployments → Redeploy

## ✅ Paso 4: Verificación Final

### Verificar Base de Datos

1. **En Supabase SQL Editor, ejecuta:**
   ```sql
   -- Verificar tablas
   SELECT COUNT(*) as total_tables 
   FROM information_schema.tables 
   WHERE table_name LIKE 'axis6_%';
   -- Debe mostrar: 9 tablas

   -- Verificar índices
   SELECT COUNT(*) as total_indexes 
   FROM pg_indexes 
   WHERE tablename LIKE 'axis6_%';
   -- Debe mostrar: 25+ índices

   -- Verificar categorías
   SELECT * FROM axis6_categories ORDER BY order_index;
   -- Debe mostrar: 6 categorías
   ```

### Probar la Aplicación

1. **Abre la aplicación:**
   ```
   https://axis6.app
   ```

2. **Prueba el flujo de registro:**
   - Click en "Get Started" o "Sign Up"
   - Ingresa un email válido
   - Deberías recibir un email de confirmación

3. **Prueba el dashboard:**
   - Inicia sesión
   - Verifica que aparezcan las 6 categorías
   - Intenta hacer un check-in

### Comandos de Verificación Local

```bash
# Verificar configuración
npm run verify:supabase

# Verificar estado de servicios
npm run setup:check

# Ver logs en Vercel
vercel logs --prod
```

## 🚨 Troubleshooting

### Si las migraciones fallan:
- Verifica que estés en el proyecto correcto de Supabase
- Asegúrate de copiar TODO el script completo
- Revisa los logs en Supabase Dashboard → Logs → Database

### Si los emails no funcionan:
- Verifica que RESEND_API_KEY esté en Vercel
- Confirma que el dominio esté verificado en Resend
- Revisa Resend Dashboard → Logs para ver intentos de envío

### Si el login no funciona:
- Verifica en Supabase Auth Settings:
  - Site URL: `https://axis6.app`
  - Redirect URLs incluye: `https://axis6.app/**`
- Limpia cookies y caché del navegador

## 📊 Estado Actual

| Componente | Estado | Acción Requerida |
|------------|--------|------------------|
| Código | ✅ Desplegado | - |
| Base de Datos | ⏳ Pendiente | Ejecutar script de migración |
| Emails | ⏳ Pendiente | Configurar Resend |
| Dominio | ✅ Configurado | - |
| SSL | ✅ Activo | - |
| Variables de Entorno | ⚠️ Parcial | Agregar RESEND_API_KEY |

## ⏱️ Tiempo Estimado

- **Migraciones de BD**: 5-10 minutos
- **Configurar Resend**: 10-15 minutos
- **Variables de entorno**: 5 minutos
- **Verificación**: 10 minutos

**Total: ~30-40 minutos**

## 🎯 Siguiente Paso

**Empieza con el Paso 1**: Abre el editor SQL de Supabase y ejecuta el script de migración.

---
*Última actualización: 2025-08-25*