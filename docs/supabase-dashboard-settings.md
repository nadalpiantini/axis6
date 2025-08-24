# Configuración Supabase Dashboard para AXIS6

## 🎯 Configuraciones Críticas para Solucionar CSP Issues

### 1. Authentication Settings

**URL**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings

#### Site URL (CRÍTICO)
```
Development: http://localhost:6789
Production: https://axis6.app
```

#### Additional Redirect URLs (CRÍTICO)
Agregar estas URLs exactamente:

```
# Development
http://localhost:6789/**
http://localhost:6789/auth/callback
http://localhost:6789/auth/login
http://localhost:6789/auth/register

# Production  
https://axis6.app/**
https://axis6.app/auth/callback
https://axis6.app/auth/login
https://axis6.app/auth/register

# Optional (si usas otro dominio)
https://axis6.sujeto10.com/**
https://axis6.sujeto10.com/auth/callback
```

### 2. Email Auth Configuration

#### Enable Email Provider
✅ **Enable**: Email
✅ **Enable**: Email confirmations (**DESACTIVAR para development**)
✅ **Enable**: Email change confirmations  
✅ **Enable**: Secure email change

#### Rate Limiting (Opcional)
```
Email rate limit: 3 per hour (development)
Email rate limit: 1 per hour (production)
```

### 3. Database Configuration

#### Row Level Security (RLS)
Verificar que estas tablas tengan RLS habilitado:

```sql
-- En Supabase SQL Editor, verificar:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'axis6_%';

-- Debe mostrar TRUE para todas las tablas
```

#### Expected RLS Policies
```
axis6_profiles:
- Users can view their own profile
- Users can update their own profile  
- Users can insert their own profile

axis6_checkins:
- Users can view their own check-ins
- Users can create their own check-ins
- Users can update their own check-ins
- Users can delete their own check-ins

axis6_streaks:
- Users can view their own streaks
- Users can manage their own streaks

axis6_daily_stats:
- Users can view their own stats
- Users can manage their own stats
```

### 4. API Settings

**URL**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/settings/api

#### Verificar API Keys
✅ **anon/public key**: Usar en NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ **service_role key**: Usar SOLO en server-side (SUPABASE_SERVICE_ROLE_KEY)

⚠️ **NUNCA** expongas service_role key en el cliente

### 5. Custom SMTP (Opcional pero Recomendado)

Para emails de producción, configurar SMTP propio:
**URL**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/templates

```
SMTP Settings:
- Host: tu-smtp-provider.com
- Port: 587 (TLS) o 465 (SSL)
- Username: tu-email@axis6.com
- Password: tu-password-smtp

Email Templates:
- Customize para branding AXIS6
- Usar dominio axis6.app en enlaces
```

## 🔧 Verificación Paso a Paso

### Paso 1: Ejecutar Script de Verificación
```bash
npm run verify:supabase
```

### Paso 2: Verificar Configuración Manual

1. **Ir a Auth Settings**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings

2. **Verificar Site URL**:
   - Development: `http://localhost:6789`
   - Production: `https://axis6.app`

3. **Verificar Redirect URLs** (debe incluir todas las URLs listadas arriba)

4. **Verificar Providers**:
   - Email: ✅ Enabled
   - OAuth (opcional): Configurar si planeas usar Google/GitHub/etc

### Paso 3: Test de Login

1. **Reiniciar servidor**: `npm run dev`
2. **Limpiar cache del browser**: Cmd+Shift+R (Mac) o Ctrl+Shift+R (Windows)
3. **Ir a**: http://localhost:6789/auth/login
4. **Probar registro/login**: Debe funcionar sin errores CSP

## 🚨 Troubleshooting CSP Issues

### Error: "Refused to execute inline script"
**Causa**: CSP bloqueando scripts inline
**Solución**: ✅ Ya solucionado con nueva configuración CSP

### Error: "Refused to connect to supabase.co"
**Causa**: CSP bloqueando conexiones a Supabase
**Solución**: ✅ Ya solucionado - dominios Supabase están whitelisted

### Error: "Refused to apply inline style"  
**Causa**: CSP bloqueando estilos inline
**Solución**: ✅ Ya solucionado con `'unsafe-inline'` en development

### Error: "Invalid redirect URL"
**Causa**: URL de callback no está en lista de Supabase
**Solución**: Agregar todas las URLs listadas arriba

## 📊 Configuración de Producción vs Development

### Development (localhost:6789)
- CSP más permisivo (`'unsafe-inline'`, `'unsafe-eval'`)
- Email confirmations: **DISABLED**  
- Detailed error messages: **ENABLED**
- Rate limiting: **RELAXED**

### Production (axis6.app)
- CSP más restrictivo (pero funcional)
- Email confirmations: **ENABLED**
- Error messages: **MINIMAL**
- Rate limiting: **STRICT**
- HSTS: **ENABLED**

## ✅ Checklist Final

Antes de considerar el problema resuelto:

- [ ] Site URL configurado correctamente
- [ ] Todas las redirect URLs agregadas  
- [ ] Email provider habilitado
- [ ] RLS verificado en todas las tablas
- [ ] Script de verificación ejecutado sin errores
- [ ] Login/register funciona sin errores CSP
- [ ] Browser console limpio (sin errores rojos)
- [ ] Hot reload funciona en development

## 🔗 Enlaces Útiles

- **Supabase Project**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk
- **Auth Settings**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings  
- **API Settings**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/settings/api
- **Database**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/editor
- **Logs**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/logs

---

**Nota**: Después de hacer cambios en Supabase Dashboard, siempre reinicia tu servidor de development (`npm run dev`) para que los cambios se reflejen correctamente.