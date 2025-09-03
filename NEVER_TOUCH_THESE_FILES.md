# 🚨 NEVER TOUCH THESE FILES - UI PROTECTION SYSTEM

> **⚠️ CRITICAL WARNING: Estos archivos están BLINDADOS**  
> **📋 Modificar cualquiera de estos archivos puede romper la línea gráfica perfecta**

---

## 🔒 ARCHIVOS CRÍTICOS - INMUTABLES

### **Dashboard Core (NUNCA tocar):**
```
📁 app/dashboard/
├── page.tsx                    🚨 CRITICAL - Dashboard principal
```

### **Componentes UI Críticos (PROTEGIDOS):**
```
📁 components/ui/
├── ClickableSVG.tsx           🔒 Hexagon interactions
├── Logo.tsx                   🔒 LogoFull component
```

### **Iconos (BLINDADOS):**
```
📁 components/icons/
├── index.tsx                  🔒 AxisIcon component
```

### **Layout (NO MODIFICAR):**
```
📁 components/layout/
├── StandardHeader.tsx         🔒 Header con streak counter
```

### **Design System (INMUTABLE):**
```
📁 lib/design-system/
├── theme.ts                   🔒 Design tokens
├── design-tokens-locked.json  🔒 JSON inmutable

📁 lib/constants/
├── brand-colors.ts           🔒 Paleta de colores
```

---

## ⚡ QUÉ HACER SI ALGO SE ROMPE

### **Restauración de Emergencia:**
```bash
# 1. Restaurar dashboard principal
git checkout b8d8a72 -- app/dashboard/page.tsx

# 2. O usar backup
cp components/ui-locked/DashboardPageLocked.tsx app/dashboard/page.tsx

# 3. Verificar componentes críticos
git checkout b8d8a72 -- components/ui/ClickableSVG.tsx
git checkout b8d8a72 -- components/icons/index.tsx

# 4. Arrancar servidor
npm run dev

# 5. Verificar en http://localhost:3000
```

### **Test de Integridad:**
```bash
# Ejecutar tests de protección
npx playwright test tests/e2e/ui-integrity-lock.spec.ts

# Si fallan → ALGO SE ROMPIÓ
# Restaurar inmediatamente con comandos de arriba
```

---

## ⚖️ QUÉ SÍ PUEDES MODIFICAR (Lista Verde)

### **✅ SEGURO DE TOCAR:**
```
📁 Safe to modify:
├── app/api/                   ✅ APIs y backend
├── app/settings/              ✅ Páginas de configuración  
├── app/auth/                  ✅ Autenticación
├── app/analytics/             ✅ Analytics y stats
├── app/my-day/                ✅ My Day features
├── lib/hooks/                 ✅ Custom hooks
├── lib/supabase/              ✅ Database queries
├── lib/utils/                 ✅ Utilidades
├── middleware.ts              ✅ Auth middleware
├── next.config.js             ✅ Config de Next.js
└── cualquier .md file         ✅ Documentación
```

### **✅ COMPONENTES SEGUROS:**
- Todo en `components/forms/`
- Todo en `components/charts/`  
- Todo en `components/chat/`
- Todo en `components/settings/`
- Todo en `components/auth/`

---

## 🧪 VALIDATION COMMANDS

### **Antes de cualquier commit:**
```bash
# 1. Ejecutar tests de integridad
npm run test:ui-lock

# 2. Verificar dashboard visualmente
open http://localhost:3000/dashboard

# 3. Confirmar estructura exacta
npx playwright test ui-integrity-lock.spec.ts
```

### **Si detectas problemas:**
```bash
# EMERGENCY RESET
git stash
git checkout b8d8a72 -- app/dashboard/page.tsx
npm run dev
```

---

## 📋 REGISTRO DE PROTECCIÓN

### **Sistema Blindado Creado:**
- **Fecha**: 2025-09-03
- **Commit base**: `b8d8a72` 
- **UI Reference**: `axis6-ny3k5zpfc.vercel.app/dashboard`
- **Componente core**: `HexagonVisualization`
- **Status**: 🔒 **BLINDADO**

### **Archivos de Protección:**
- ✅ `UI_SPECIFICATION_LOCKED.md` - Spec inmutable
- ✅ `components/ui-locked/DashboardPageLocked.tsx` - Backup
- ✅ `tests/e2e/ui-integrity-lock.spec.ts` - Tests de protección  
- ✅ `design-tokens-locked.json` - Tokens inmutables
- ✅ `NEVER_TOUCH_THESE_FILES.md` - Lista de protección

---

> **🏆 TU LÍNEA GRÁFICA ESTÁ AHORA BLINDADA**  
> **La AI puede tocar todo lo demás, pero NUNCA romperá este diseño perfecto.**  
> **Este es tu BROCHE DE ORO - protección máxima para tu UI.**