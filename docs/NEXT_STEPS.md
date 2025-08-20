# AXIS6 MVP - Siguientes Pasos

## ✅ Configuración Completada

Tu proyecto AXIS6 ya está configurado para trabajar con tu instancia Supabase multi-tenant (`nqzhxukuvmdlpewqytpv`).

## 🚀 Pasos Inmediatos

### 1. Configurar las API Keys

1. Ve a: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv/settings/api
2. Copia las siguientes claves:
   - **anon public key** 
   - **service_role key** (mantén esta privada)
3. Edita `.env.local` y reemplaza:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### 2. Ejecutar las Migraciones en Supabase

1. Ve al SQL Editor: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv/sql/new
2. Copia y ejecuta el contenido de estos archivos en orden:
   - `supabase/migrations/001_initial_schema.sql` (tablas y funciones con prefijo axis6_)
   - `supabase/migrations/002_auth_trigger.sql` (trigger para crear perfiles automáticamente)

### 3. Verificar las Tablas

En el Table Editor, verifica que se crearon:
- `axis6_profiles`
- `axis6_categories` (con 6 categorías pre-cargadas)
- `axis6_checkins`
- `axis6_streaks`
- `axis6_daily_stats`

### 4. Iniciar el Desarrollo

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

## 📝 Tareas Pendientes

### Alta Prioridad
- [ ] Implementar páginas de autenticación (login/registro)
- [ ] Crear componente HexagonChart interactivo
- [ ] Implementar dashboard principal con check-ins diarios
- [ ] Crear sistema de streaks visual

### Media Prioridad
- [ ] Implementar analytics y estadísticas
- [ ] Crear perfil de usuario editable
- [ ] Agregar notificaciones/recordatorios
- [ ] Implementar gamificación (badges, logros)

### Configuración de Producción
- [ ] Configurar dominio axis6.sujeto10.com en Vercel
- [ ] Actualizar las URLs de redirect en Supabase Auth
- [ ] Configurar variables de entorno en Vercel
- [ ] Implementar monitoreo y analytics

## 🔧 Comandos Útiles

```bash
# Generar tipos de TypeScript desde tu Supabase
npx supabase gen types typescript --linked > lib/supabase/database.types.ts

# Ver logs de Supabase
npx supabase db logs

# Ejecutar migraciones localmente
npx supabase db push

# Iniciar Supabase local (para desarrollo offline)
npx supabase start
```

## 📚 Recursos

- [Documentación del Proyecto](./CLAUDE.md)
- [Guía de Supabase](./SUPABASE_SETUP.md)
- [Design System](./DESIGN.md)
- [Product Requirements](./PRD.md)

## ⚠️ Notas Importantes

1. **Multi-Tenant**: Todas las tablas usan prefijo `axis6_` para no interferir con otros proyectos
2. **RLS**: Las políticas de seguridad ya están configuradas
3. **Auth**: Los usuarios se crean perfiles automáticamente al registrarse
4. **Timezone**: Por defecto usa 'America/Santo_Domingo', ajustable por usuario

## 🐛 Troubleshooting

Si encuentras errores:

1. **Verifica las API keys** en `.env.local`
2. **Revisa la consola del navegador** para errores de Supabase
3. **Verifica que las migraciones** se ejecutaron correctamente
4. **Comprueba los logs** en Supabase Dashboard

¿Necesitas ayuda? Revisa la documentación o contacta soporte.