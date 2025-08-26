# 🎭 AXIS6 Orchestration Instructions - 5 Sub-Agentes Paralelos

## 🚀 Ejecutar Auditoria Completa en Paralelo

### Comandos de Ejecución (5 Chats Separados)

Abrir **5 chats de Claude Code** simultáneamente y ejecutar uno de estos comandos en cada chat:

#### Chat 1: SUB-AGENTE 1 - Auth & Landing
```bash
cd /Users/nadalpiantini/Dev/axis6-mvp/axis6
PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-auth-landing.spec.ts --reporter=line --project=chromium
```

#### Chat 2: SUB-AGENTE 2 - Dashboard & Hexagon  
```bash
cd /Users/nadalpiantini/Dev/axis6-mvp/axis6
PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-dashboard-hexagon.spec.ts --reporter=line --project=chromium
```

#### Chat 3: SUB-AGENTE 3 - My Day & Time Blocks
```bash
cd /Users/nadalpiantini/Dev/axis6-mvp/axis6
PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-myday-timeblocks.spec.ts --reporter=line --project=chromium
```

#### Chat 4: SUB-AGENTE 4 - Profile & Settings
```bash
cd /Users/nadalpiantini/Dev/axis6-mvp/axis6
PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-profile-settings.spec.ts --reporter=line --project=chromium
```

#### Chat 5: SUB-AGENTE 5 - Analytics & Achievements
```bash
cd /Users/nadalpiantini/Dev/axis6-mvp/axis6
PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-analytics-achievements.spec.ts --reporter=line --project=chromium
```

---

## 📊 Coordinación de Resultados

### Cada Sub-Agente Reportará:

```json
{
  "agent": "auth-landing|dashboard-hexagon|myday-timeblocks|profile-settings|analytics-achievements",
  "status": "complete",
  "totalBugs": 0,
  "critical": 0,
  "high": 0,
  "medium": 0,
  "low": 0,
  "bugs": [...],
  "completedAt": "2025-01-XX..."
}
```

### Compilación Final (Chat Orquestador)

Una vez que los **5 sub-agentes terminen**, copiar todos los JSON reports al chat orquestador para:

1. **Compilar reporte consolidado**
2. **Priorizar bugs críticos**
3. **Coordinar las correcciones**
4. **Verificar fixes sistemáticamente**

---

## 🎯 Especialización de Cada Sub-Agente

### 📝 SUB-AGENTE 1: Auth & Landing
- **Páginas**: `/`, `/auth/login`, `/auth/register`, `/auth/forgot`
- **Funcionalidad**: Login real, formularios, navegación entre auth pages
- **Credenciales**: `nadalpiantini@gmail.com` / `Teclados#13`

### 🎲 SUB-AGENTE 2: Dashboard & Hexagon
- **Páginas**: `/dashboard`
- **Funcionalidad**: Hexagon visualization, 6 categorías check-in, progress tracking
- **Especial**: Physical, Mental, Emotional, Social, Spiritual, Material

### ⏰ SUB-AGENTE 3: My Day & Time Blocks
- **Páginas**: `/my-day`
- **Funcionalidad**: Time block creation/edit/delete, activity planning, timers
- **APIs**: `/api/time-blocks`, `/api/activity-timer`

### 👤 SUB-AGENTE 4: Profile & Settings
- **Páginas**: `/profile`, `/settings`
- **Funcionalidad**: User data updates, preferences, form submissions
- **APIs**: `/api/auth/user`, profile updates

### 📊 SUB-AGENTE 5: Analytics & Achievements
- **Páginas**: `/analytics`, `/achievements`
- **Funcionalidad**: Data visualization, charts, export, achievements/badges
- **APIs**: `/api/analytics`, `/api/stats`

---

## 🔧 Credenciales Centralizadas

**Todas las pruebas usan las mismas credenciales reales:**
- **Email**: `nadalpiantini@gmail.com`
- **Password**: `Teclados#13`
- **URL**: `https://axis6.app`

---

## 🎮 Workflow de Ejecución

### 1. Preparación
```bash
# Verificar Playwright instalado
npx playwright --version

# Verificar conexión
curl -I https://axis6.app
```

### 2. Ejecución Paralela
- Abrir **5 chats Claude Code** simultáneamente
- Ejecutar **1 comando por chat** 
- Monitorear progreso en tiempo real

### 3. Recopilación (Chat Orquestador)
- Copiar **JSON reports** de cada sub-agente
- Compilar reporte consolidado
- Priorizar bugs por severidad
- Planificar fixes sistemáticos

### 4. Corrección de Bugs
- **Critical bugs**: Fix inmediato
- **High bugs**: Fix en las próximas 2 horas  
- **Medium bugs**: Fix en las próximas 24 horas
- **Low bugs**: Fix cuando sea conveniente

---

## 🎯 Métricas de Éxito

### ✅ Ejecución Exitosa
- **5/5 sub-agentes completos**
- **0 bugs críticos** 
- **JSON reports** generados correctamente
- **Screenshots** capturadas para bugs encontrados

### 📈 Indicadores de Calidad
- **Tiempo total**: ~15-20 minutos (paralelo vs 60+ minutos secuencial)
- **Cobertura**: 100% de páginas y funcionalidades
- **Profundidad**: Cada botón, formulario, API endpoint testeado
- **Reproducibilidad**: Steps detallados para cada bug

---

## 🚨 Troubleshooting

### Si un Sub-Agente Falla
```bash
# Verificar credenciales
curl -X POST https://axis6.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nadalpiantini@gmail.com","password":"Teclados#13"}'

# Re-ejecutar solo ese sub-agente
PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-[NOMBRE].spec.ts --reporter=line --project=chromium --headed
```

### Si hay Problemas de Red
```bash
# Test de conectividad
ping axis6.app
curl -I https://axis6.app/dashboard
```

### Si Playwright da Problemas
```bash
# Reinstalar Playwright browsers
npx playwright install
npx playwright install-deps
```

---

## 🎉 Resultado Esperado

Al completar los **5 sub-agentes paralelos**, tendrás:

1. **Auditoria 100% completa** de axis6.app
2. **Reporte detallado** de todos los bugs encontrados
3. **Screenshots** de cada problema identificado  
4. **Pasos de reproducción** para cada bug
5. **Plan de corrección** priorizado por severidad
6. **5x velocidad** vs ejecución secuencial
7. **Memoria distribuida** evitando overflow de contexto

**¡Vamos a encontrar y arreglar todos los bugs de AXIS6! 🚀**