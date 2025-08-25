'use client'

import DailyMantra from '@/components/axis/DailyMantra'
import CategoryCard from '@/components/axis/CategoryCard'
import { AxisIconGrid } from '@/components/axis/AxisIcons'
import HexagonChart from '@/components/axis/HexagonChart'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Example data for the ritualized system
const categories = [
  {
    key: 'physical',
    label: 'Physical',
    ritualName: 'Living Movement',
    color: '#C85729',
    softColor: '#FED7AA',
    darkColor: '#7C2D12',
    icon: 'heart',
    mantra: 'Today I inhabit my body with tenderness',
    microActions: [
      'Walk 10 minutes listening to your breathing',
      'Stretch slowly when waking up',
      'Dance what you feel',
      'Take 5 deep breaths',
      'Conscious self-massage'
    ],
    movement: 'latido'
  },
  {
    key: 'mental',
    label: 'Mental',
    ritualName: 'Inner Clarity',
    color: '#6B7280',
    softColor: '#E5E7EB',
    darkColor: '#374151',
    icon: 'brain',
    mantra: 'Today I make space to think less',
    microActions: [
      'Read 1 nourishing page',
      'Turn off notifications for 30 minutes',
      'Breathe before responding',
      'Write down one idea',
      'Take a conscious pause'
    ],
    movement: 'fade'
  },
  {
    key: 'art',
    label: 'Art',
    ritualName: 'Creative Expression',
    color: '#A78BFA',
    softColor: '#EDE9FE',
    darkColor: '#6B21A8',
    icon: 'palette',
    mantra: 'Today I create not to show, but to liberate',
    microActions: [
      'Write without editing',
      'Paint or color',
      'Record a personal audio',
      'Improvise a melody',
      'Share something imperfect'
    ],
    movement: 'expand'
  },
  {
    key: 'social',
    label: 'Social',
    ritualName: 'Mirror Bond',
    color: '#10B981',
    softColor: '#D1FAE5',
    darkColor: '#047857',
    icon: 'users',
    mantra: 'Today I connect without disappearing',
    microActions: [
      'Send an authentic message',
      'Call someone just to listen',
      'Set a clear boundary',
      'Share something vulnerable',
      'Ask a sincere question'
    ],
    movement: 'wave'
  },
  {
    key: 'spiritual',
    label: 'Spiritual',
    ritualName: 'Elevated Presence',
    color: '#4C1D95',
    softColor: '#E9D5FF',
    darkColor: '#2E1065',
    icon: 'sun',
    mantra: 'Today I find myself beyond doing',
    microActions: [
      'Meditate for 3 minutes',
      'Read a sacred text',
      'Pray or give thanks',
      'Look at the sky',
      'Listen to silence'
    ],
    movement: 'pulse'
  },
  {
    key: 'material',
    label: 'Material',
    ritualName: 'Earthly Sustenance',
    color: '#B45309',
    softColor: '#FEF3C7',
    darkColor: '#78350F',
    icon: 'briefcase',
    mantra: 'Today I sustain myself, I do not prove myself',
    microActions: [
      'Complete a task with presence',
      'Review finances without fear',
      'Organize your space',
      'Decide not to produce more today',
      'Value invisible work'
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
                  AXIS6 Ritualized System
                </h1>
                <p className="text-sm text-textSecondary">
                  Six dimensions. One you. Don't break your Axis.
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
              Daily Mantras
            </h2>
            <p className="text-sm text-textSecondary">
              Automatic rotation every 10 seconds with unique animations per axis
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
              Category Cards
            </h2>
            <p className="text-sm text-textSecondary">
              Interactive cards with micro-actions and personalized animations
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
                  onToggle={() => {/* No-op for showcase */}}
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
              Hexagonal Chart
            </h2>
            <p className="text-sm text-textSecondary">
              Balance visualization with new colors and ritualized names
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
              Animated Icons
            </h2>
            <p className="text-sm text-textSecondary">
              Custom SVG icons with animations that reflect the essence of each axis
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
              Color Palette
            </h2>
            <p className="text-sm text-textSecondary">
              Ritualized colors that evoke the right emotions
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