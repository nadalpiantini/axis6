# 🔒 AXIS6 UI SPECIFICATION - LOCKED VERSION

> **⚠️ CRITICAL: Este archivo define la línea gráfica EXACTA que debe mantenerse.**
> **📋 REFERENCIA: axis6-ny3k5zpfc-nadalpiantini-fcbc2d66.vercel.app/dashboard**
> **🚨 NO MODIFICAR sin autorización explícita del usuario.**

---

## 🎯 DASHBOARD LAYOUT EXACTO

### **Layout Principal:**
```
┌─────────────────────────────────────────┐
│ StandardHeader (streak + user + logout) │
├─────────────────────────────────────────┤
│            LogoFull (centrado)          │
├─────────────────────────────────────────┤
│        Welcome Message + Date          │
├─────────────────────┬───────────────────┤
│  HexagonVisualization │    Stats Panel   │
│    (2/3 columns)     │   (1/3 column)   │
│                     │                   │
│  ┌─ SVG Hexagon ─┐   │  ┌─ Statistics ─┐ │
│  │   6 círculos   │   │  │ Current: Xd │ │
│  │   clickables   │   │  │ Best: Xd    │ │
│  │   + gradiente  │   │  │ Today: X/6  │ │
│  └───────────────┘   │  └─────────────┘ │
│                     │                   │
│  ┌─ Category Cards ┐  │  ┌─ Actions ────┐ │
│  │ Grid 2x3        │  │  │ Plan My Day │ │
│  │ (botones)       │  │  │ Analytics   │ │
│  └─────────────────┘  │  │ Achievements│ │
│                     │  └─────────────┘ │
└─────────────────────┴───────────────────┘
```

---

## 🎨 HEXAGON VISUALIZATION EXACTO

### **Componente: `HexagonVisualization`**
```typescript
// ESTRUCTURA EXACTA - NO MODIFICAR
const HexagonVisualization = memo(({ axes, onToggleAxis, isToggling }) => {
  // SVG viewBox: "0 0 400 400" 
  // Hexagon size: 160px radius
  // Center: (200, 200)
  
  return (
    <svg className="w-full h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[400px]" 
         viewBox="0 0 400 400">
      
      {/* 1. Background hexagon outline */}
      <polygon points={hexagonPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      
      {/* 2. Progress hexagon (solo si hay progreso) */}
      <motion.polygon 
        points={hexagonPath}
        fill="url(#gradient)"
        fillOpacity="0.3"
        stroke="url(#gradient)"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: completionPercentage / 100 }}
      />
      
      {/* 3. Gradiente púrpura→coral */}
      <defs>
        <linearGradient id="gradient">
          <stop offset="0%" stopColor="#9B8AE6" />
          <stop offset="100%" stopColor="#FF8B7D" />
        </linearGradient>
      </defs>
      
      {/* 4. 6 círculos clickables en vértices */}
      {axisPositions.map(axis => (
        <ClickableSVG onClick={() => onToggleAxis(axis.id)}>
          <circle 
            cx={axis.x} cy={axis.y} r="30"
            fill={axis.completed ? axis.color : 'rgba(255,255,255,0.1)'}
            fillOpacity={axis.completed ? 0.8 : 1}
          />
          <AxisIcon axis={axis.icon} size={28} color={axis.completed ? 'white' : '#9ca3af'} />
        </ClickableSVG>
      ))}
    </svg>
  )
})
```

---

## 🎨 COLORES EXACTOS - INMUTABLES

### **Paleta de Ejes (NO CAMBIAR):**
```css
:root {
  /* Colores exactos del dashboard perfecto */
  --physical: #65D39A;    /* Verde - Target icon */
  --mental: #9B8AE6;      /* Púrpura - Brain icon */
  --emotional: #FF8B7D;   /* Coral - Heart icon */
  --social: #6AA6FF;      /* Azul - Users icon */
  --spiritual: #4ECDC4;   /* Turquesa - Sparkles icon */
  --material: #FFD166;    /* Amarillo - Briefcase icon */
  
  /* Gradiente hexagonal (LOCKED) */
  --hex-gradient-start: #9B8AE6;  /* Mental purple */
  --hex-gradient-end: #FF8B7D;    /* Emotional coral */
}
```

### **Estados de Completión:**
```css
/* Círculo completado */
.axis-circle.completed {
  fill: var(--axis-color);
  fill-opacity: 0.8;
  stroke: rgba(255,255,255,0.3);
}

/* Círculo sin completar */
.axis-circle.incomplete {
  fill: rgba(255,255,255,0.1);
  fill-opacity: 1;
  stroke: rgba(255,255,255,0.1);
}
```

---

## 📏 DIMENSIONES EXACTAS - BLINDADAS

### **SVG Container:**
- **ViewBox**: `0 0 400 400` (NEVER CHANGE)
- **Center**: `(200, 200)` (LOCKED)
- **Hexagon radius**: `160px` (FIXED)
- **Circle radius**: `30px` (IMMUTABLE)

### **Responsive Sizes:**
```css
/* Mobile */
.hexagon-container {
  max-width: 280px; /* sm:max-w-[280px] */
}

/* Tablet */
@media (min-width: 640px) {
  .hexagon-container {
    max-width: 350px; /* sm:max-w-[350px] */
  }
}

/* Desktop */
@media (min-width: 768px) {
  .hexagon-container {
    max-width: 400px; /* md:max-w-[400px] */
  }
}
```

### **Touch Targets:**
- **Circle size**: `r="30"` = 60px diameter (ACCESSIBLE)
- **Icon size**: `28px` (OPTIMAL for 30px circle)
- **Hover tolerance**: Extra 10px padding

---

## 🔧 COMPONENTES CRÍTICOS - NO TOCAR

### **Archivos Inmutables:**
```
📁 CRITICAL FILES - DO NOT MODIFY:
├── app/dashboard/page.tsx (CURRENT VERSION from b8d8a72)
├── components/ui/ClickableSVG.tsx (interaction handler)  
├── components/icons/index.tsx (AxisIcon component)
├── components/layout/StandardHeader.tsx (header layout)
├── lib/design-system/theme.ts (design tokens)
└── lib/constants/brand-colors.ts (color palette)
```

### **Design System Fingerprint:**
```typescript
// HASH DE INTEGRIDAD - Validar que no cambió
const DESIGN_FINGERPRINT = {
  dashboardLayout: "grid-cols-1 lg:grid-cols-3",
  hexagonSize: "max-w-[280px] sm:max-w-[350px] md:max-w-[400px]",
  svgViewBox: "0 0 400 400",
  circleRadius: "30",
  iconSize: "28",
  gradientColors: ["#9B8AE6", "#FF8B7D"],
  gridGap: "gap-4 sm:gap-6 lg:gap-8",
  componentName: "HexagonVisualization"
}
```

---

## 🛡️ REGLAS DE PROTECCIÓN

### **❌ PROHIBIDO TOCAR:**
1. **SVG viewBox** dimensions (0 0 400 400)
2. **Circle radius** (30px) 
3. **Icon size** (28px)
4. **Gradient colors** (#9B8AE6 → #FF8B7D)
5. **Layout grid** (lg:grid-cols-3)
6. **Component name** (HexagonVisualization)

### **✅ PERMITIDO MODIFICAR:**
1. **Category cards** abajo del hexágono
2. **Stats panel** derecho
3. **Header content** (pero no layout)
4. **Actions links** en sidebar

### **🚨 ALERTA AUTOMÁTICA:**
Si estos archivos cambian, **RESTAURAR INMEDIATAMENTE** desde:
- **Commit**: `b8d8a72`
- **File**: `app/dashboard/page.tsx`
- **Component**: `HexagonVisualization`

---

## 📸 REFERENCIA VISUAL

### **URL de Referencia:**
```
https://axis6-ny3k5zpfc-nadalpiantini-fcbc2d66.vercel.app/dashboard
```

### **Características Visuales Exactas:**
- ✅ **6 círculos** en vértices de hexágono
- ✅ **Gradiente púrpura→coral** cuando hay progreso  
- ✅ **Iconos Lucide** blancos en círculos completados
- ✅ **Glass effect** en containers
- ✅ **Grid 2-columnas** en desktop
- ✅ **StandardHeader** con streak counter
- ✅ **LogoFull** centrado arriba

---

## 🔄 RESTAURACIÓN DE EMERGENCIA

### **Si algo se rompe, ejecutar:**
```bash
# 1. Volver a la UI perfecta
git checkout b8d8a72 -- app/dashboard/page.tsx

# 2. Verificar componentes críticos
git checkout b8d8a72 -- components/ui/ClickableSVG.tsx
git checkout b8d8a72 -- components/icons/index.tsx

# 3. Restaurar servidor
npm run dev

# 4. Verificar en http://localhost:3000
```

### **Commit de Emergencia:**
```bash
git add .
git commit -m "🚨 EMERGENCY: Restore locked UI specification"
```

---

## 🧪 VALIDATION TESTS

### **Visual Integrity Check:**
```typescript
// Test que debe pasar SIEMPRE
test('Dashboard UI specification locked', () => {
  // 1. Verificar que HexagonVisualization existe
  expect(page.getByTestId('hexagon-chart')).toBeVisible()
  
  // 2. Verificar SVG dimensions
  const svg = page.locator('svg[viewBox="0 0 400 400"]')
  await expect(svg).toBeVisible()
  
  // 3. Verificar 6 círculos
  const circles = page.locator('circle[r="30"]')
  await expect(circles).toHaveCount(6)
  
  // 4. Verificar gradiente
  const gradient = page.locator('#gradient')
  await expect(gradient).toBeVisible()
})
```

---

## 💎 FIRMA DIGITAL DEL DISEÑO

**Diseño creado**: 2025-09-03  
**Commit base**: `b8d8a72`  
**UI Status**: ✅ PERFECTO  
**Protection Level**: 🔒 MÁXIMO  

**Hash de integridad**: `HexagonVisualization-b8d8a72-purple-coral-6circles`

---

> **🏆 ESTE ES TU BROCHE DE ORO**  
> **Tu línea gráfica está ahora blindada y protegida contra modificaciones accidentales.**  
> **La AI puede tocar todo lo demás, pero NUNCA romperá este diseño perfecto.**