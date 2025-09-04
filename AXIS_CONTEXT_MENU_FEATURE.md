# AXIS Context Menu Feature

## Overview
Se ha implementado un menú contextual para los botones de axis en el dashboard que permite crear timeblocks rápidamente con opciones tipo tags.

## Funcionalidad

### 1. Menú Contextual
- **Acceso**: Hover sobre cualquier botón de axis y aparece un botón de tres puntos en la esquina superior derecha
- **Click**: Al hacer click en el botón de tres puntos se abre un menú contextual
- **Posicionamiento**: El menú aparece en la posición del click

### 2. Opciones del Menú
- **Create Time Block**: Abre el creador rápido de timeblocks
- **View Time Blocks**: Muestra los timeblocks existentes para ese axis hoy
- **Go to My Day**: Navega a la página completa de planificación

### 3. Quick Time Block Creator
- **Selección de Axis**: Grid de 6 botones para elegir el axis
- **Actividades Sugeridas**: Tags predefinidos por axis (12 opciones por axis)
- **Actividad Personalizada**: Opción para escribir una actividad personalizada
- **Duración**: Opciones de 15min, 30min, 45min, 1h, 1.5h, 2h
- **Creación Rápida**: Un solo click para crear el timeblock

## Componentes Creados

### 1. `AxisContextMenu.tsx`
- Menú contextual que aparece al hacer click en el botón de tres puntos
- Maneja la navegación entre diferentes opciones
- Muestra timeblocks existentes para el axis seleccionado

### 2. `QuickTimeBlockCreator.tsx`
- Modal para crear timeblocks rápidamente
- Sugerencias de actividades por axis
- Interfaz optimizada para clicks rápidos

## Sugerencias de Actividades por Axis

### Physical
- Running, Yoga, Swimming, Cycling, Gym workout
- Tennis, Padel, Basketball, Soccer, Walking
- Hiking, Dancing, Boxing, Pilates, CrossFit
- Rock climbing, Martial arts, Stretching, Jump rope, Rowing

### Mental
- Reading, Meditation, Journaling, Learning new skill, Puzzle solving
- Study session, Online course, Documentary, Podcast, Chess
- Coding, Writing, Research, Language learning, Memory exercises
- Brain training, Creative writing, Mind mapping, Planning, Reviewing notes

### Emotional
- Deep breathing, Gratitude practice, Self-reflection, Music therapy, Art therapy
- Emotional check-in, Mindfulness, Positive affirmations, Therapy session, Support group
- Stress relief, Mood tracking, Self-care ritual, Relaxation, Expressing feelings
- Boundary setting, Self-compassion, Emotional release, Visualization, Progressive relaxation

### Social
- Coffee with friend, Family dinner, Team meeting, Networking event, Volunteering
- Group workout, Book club, Dinner party, Phone call, Video chat
- Social media break, Community event, Support group, Mentoring, Collaboration
- Team building, Social learning, Cultural event, Group meditation, Shared meal

### Spiritual
- Meditation, Prayer, Nature walk, Journaling, Reading spiritual texts
- Yoga, Breathing exercises, Gratitude practice, Mindfulness, Reflection time
- Sacred music, Ritual practice, Energy work, Chanting, Silent contemplation
- Spiritual community, Sacred space creation, Intention setting, Divine connection, Soul work

### Material
- Budget review, Investment research, Career planning, Skill development, Networking
- Financial planning, Goal setting, Market research, Business planning, Professional development
- Asset management, Income optimization, Expense tracking, Financial education, Career advancement
- Business networking, Professional certification, Market analysis, Financial literacy, Wealth building

## Uso

1. **Navegar al Dashboard**: Ir a `/dashboard`
2. **Hover sobre un Axis**: Aparece el botón de tres puntos
3. **Click en el botón**: Se abre el menú contextual
4. **Seleccionar "Create Time Block"**: Se abre el creador rápido
5. **Elegir Axis**: Click en el axis deseado
6. **Seleccionar Actividad**: Click en una sugerencia o escribir personalizada
7. **Elegir Duración**: Click en la duración deseada
8. **Crear**: Click en "Create Time Block"

## Beneficios

- **Velocidad**: Creación de timeblocks en segundos
- **Simplicidad**: No requiere escritura con teclado
- **Sugerencias Inteligentes**: Actividades relevantes por axis
- **UX Optimizada**: Interfaz intuitiva y responsive
- **Accesibilidad**: Funciona en móvil y desktop

## Implementación Técnica

### Hooks Utilizados
- `useCreateTimeBlock`: Para crear timeblocks
- `useMyDayTimeBlocks`: Para obtener timeblocks existentes
- `useUser`: Para autenticación

### Estado
- `contextMenu`: Maneja el estado del menú contextual
- `showQuickCreator`: Controla la visibilidad del creador
- `showTimeBlocks`: Controla la visibilidad de la lista

### Animaciones
- Framer Motion para transiciones suaves
- AnimatePresence para entrada/salida
- Hover effects para feedback visual

## Próximos Pasos

1. **Integración con Base de Datos**: Mapear axis slugs a category IDs reales
2. **Personalización**: Permitir al usuario agregar sus propias sugerencias
3. **Analytics**: Trackear uso de sugerencias para mejorar
4. **Machine Learning**: Sugerencias basadas en historial del usuario



