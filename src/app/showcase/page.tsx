'use client'

import DailyMantra from '@/components/axis/DailyMantra'
import CategoryCard from '@/components/axis/CategoryCard'
import { AxisIconGrid } from '@/components/axis/AxisIcons'
import HexagonChart from '@/components/axis/HexagonChart'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Datos de ejemplo para el sistema ritualizado
const categories = [
  {
    key: 'physical',
    label: 'Físico',
    ritualName: 'Movimiento Vivo',
    color: '#C85729',
    softColor: '#FED7AA',
    darkColor: '#7C2D12',
    icon: 'heart',
    mantra: 'Hoy habito mi cuerpo con ternura',
    microActions: [
      'Caminar 10 minutos escuchando tu respiración',
      'Estirarte lentamente al despertar',
      'Bailar lo que sientes',
      'Hacer 5 respiraciones profundas',
      'Automasaje consciente'
    ],
    movement: 'latido'
  },
  {
    key: 'mental',
    label: 'Mental',
    ritualName: 'Claridad Interna',
    color: '#6B7280',
    softColor: '#E5E7EB',
    darkColor: '#374151',
    icon: 'brain',
    mantra: 'Hoy hago espacio para pensar menos',
    microActions: [
      'Leer 1 página nutritiva',
      'Apagar notificaciones por 30 minutos',
      'Respirar antes de responder',
      'Anotar una idea',
      'Hacer una pausa consciente'
    ],
    movement: 'fade'
  },
  {
    key: 'art',
    label: 'Arte',
    ritualName: 'Expresión Creadora',
    color: '#A78BFA',
    softColor: '#EDE9FE',
    darkColor: '#6B21A8',
    icon: 'palette',
    mantra: 'Hoy no creo para mostrar, creo para liberar',
    microActions: [
      'Escribir sin editar',
      'Pintar o colorear',
      'Grabar un audio personal',
      'Improvisar una melodía',
      'Compartir algo imperfecto'
    ],
    movement: 'expand'
  },
  {
    key: 'social',
    label: 'Social',
    ritualName: 'Vínculo Espejo',
    color: '#10B981',
    softColor: '#D1FAE5',
    darkColor: '#047857',
    icon: 'users',
    mantra: 'Hoy me vinculo sin desaparecer',
    microActions: [
      'Enviar mensaje auténtico',
      'Llamar a alguien solo para escuchar',
      'Poner un límite claro',
      'Compartir algo vulnerable',
      'Hacer una pregunta sincera'
    ],
    movement: 'wave'
  },
  {
    key: 'spiritual',
    label: 'Espiritual',
    ritualName: 'Presencia Elevada',
    color: '#4C1D95',
    softColor: '#E9D5FF',
    darkColor: '#2E1065',
    icon: 'sun',
    mantra: 'Hoy me encuentro más allá del hacer',
    microActions: [
      'Meditar 3 minutos',
      'Leer un texto sagrado',
      'Orar o agradecer',
      'Mirar el cielo',
      'Escuchar silencio'
    ],
    movement: 'pulse'
  },
  {
    key: 'material',
    label: 'Material',
    ritualName: 'Sustento Terrenal',
    color: '#B45309',
    softColor: '#FEF3C7',
    darkColor: '#78350F',
    icon: 'briefcase',
    mantra: 'Hoy me sostengo, no me demuestro',
    microActions: [
      'Completar una tarea con presencia',
      'Revisar finanzas sin miedo',
      'Organizar tu espacio',
      'Decidir no producir más hoy',
      'Dar valor al trabajo invisible'
    ],
    movement: 'vibrate'
  }
]

const hexagonData = {
  physical: 75,
  mental: 60,
  emotional: 85,
  social: 70,
  spiritual: 65,
  material: 80
}

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bgPrimary via-marfil to-arena">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-arena/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 rounded-lg hover:bg-arena/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-textPrimary" />
              </Link>
              <div>
                <h1 className="text-2xl font-serif font-bold text-textPrimary">
                  Sistema AXIS6 Ritualizado
                </h1>
                <p className="text-sm text-textSecondary">
                  Seis dimensiones. Un solo tú. No rompas tu Axis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Section: Daily Mantra */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-textPrimary mb-2">
              Mantras Diarios
            </h2>
            <p className="text-sm text-textSecondary">
              Rotación automática cada 10 segundos con animaciones únicas por eje
            </p>
          </div>
          <DailyMantra />
        </motion.section>

        {/* Section: Category Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-textPrimary mb-2">
              Tarjetas de Categoría
            </h2>
            <p className="text-sm text-textSecondary">
              Tarjetas interactivas con microacciones y animaciones personalizadas
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              >
                <CategoryCard
                  category={category}
                  isCompleted={index % 2 === 0}
                  streakCount={index * 2 + 1}
                  onToggle={() => console.log(`Toggle ${category.key}`)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section: Hexagon Chart */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-textPrimary mb-2">
              Gráfico Hexagonal
            </h2>
            <p className="text-sm text-textSecondary">
              Visualización del balance con los nuevos colores y nombres ritualizados
            </p>
          </div>
          <div className="flex justify-center bg-white/80 backdrop-blur-sm rounded-2xl p-8">
            <HexagonChart data={hexagonData} size={400} />
          </div>
        </motion.section>

        {/* Section: Icon Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pb-12"
        >
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-textPrimary mb-2">
              Iconos Animados
            </h2>
            <p className="text-sm text-textSecondary">
              Iconos SVG personalizados con animaciones que reflejan la esencia de cada eje
            </p>
          </div>
          <AxisIconGrid />
        </motion.section>

        {/* Section: Color Palette */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pb-12"
        >
          <div className="mb-6">
            <h2 className="text-xl font-serif font-bold text-textPrimary mb-2">
              Paleta de Colores
            </h2>
            <p className="text-sm text-textSecondary">
              Colores ritualizados que evocan las emociones correctas
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div key={cat.key} className="space-y-2">
                <div className="text-sm font-medium text-textPrimary">{cat.ritualName}</div>
                <div className="space-y-1">
                  <div 
                    className="h-16 rounded-lg shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div 
                    className="h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: cat.softColor }}
                  />
                  <div 
                    className="h-8 rounded-lg shadow-sm"
                    style={{ backgroundColor: cat.darkColor }}
                  />
                </div>
                <div className="text-xs text-textSecondary space-y-1">
                  <div>{cat.color}</div>
                  <div>{cat.softColor}</div>
                  <div>{cat.darkColor}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

      </main>
    </div>
  )
}